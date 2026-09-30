import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/store";
import {
  fetchAnnouncementStatuses,
  upsertAnnouncementStatus,
  type AnnouncementStatusMap,
} from "@/lib/services/announcementStatuses";
import { useRoadmap } from "./store";
import {
  buildAnnouncements,
  type AnnouncementStatus,
  type SprintAnnouncement,
} from "./announcements";

/**
 * Announcements are derived live from the roadmap. Review status is persisted in Supabase.
 */
export function useAnnouncements() {
  const { items } = useRoadmap();
  const { isAuthenticated } = useAuth();
  const [statuses, setStatuses] = useState<AnnouncementStatusMap>({});
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatuses({});
      return;
    }
    let cancelled = false;
    setStatusLoading(true);
    fetchAnnouncementStatuses()
      .then((map) => {
        if (!cancelled) setStatuses(map);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Could not load announcement statuses");
        }
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const setStatus = useCallback((key: string, status: AnnouncementStatus) => {
    setStatuses((prev) => ({ ...prev, [key]: status }));
    void upsertAnnouncementStatus(key, status).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Could not save announcement status");
    });
  }, []);

  const announcements: SprintAnnouncement[] = useMemo(
    () => buildAnnouncements(items, statuses),
    [items, statuses],
  );

  return { announcements, setStatus, statusLoading };
}

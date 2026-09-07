import { useCallback, useEffect, useMemo, useState } from "react";
import { useRoadmap } from "./store";
import {
  buildAnnouncements,
  type AnnouncementStatus,
  type SprintAnnouncement,
} from "./announcements";

const STORAGE_KEY = "dcaa-announcement-status-v1";

type StatusMap = Record<string, AnnouncementStatus>;

/**
 * Announcements are derived live from the roadmap, so a feature moving to
 * Production/Completed is picked up automatically. Only the review status is
 * persisted — new sprints therefore always appear as Draft.
 */
export function useAnnouncements() {
  const { items } = useRoadmap();
  const [statuses, setStatuses] = useState<StatusMap>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStatuses(JSON.parse(raw) as StatusMap);
    } catch {
      /* ignore */
    }
  }, []);

  const setStatus = useCallback((key: string, status: AnnouncementStatus) => {
    setStatuses((prev) => {
      const next = { ...prev, [key]: status };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const announcements: SprintAnnouncement[] = useMemo(
    () => buildAnnouncements(items, statuses),
    [items, statuses],
  );

  return { announcements, setStatus };
}

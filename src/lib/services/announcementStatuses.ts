import type { AnnouncementStatus } from "@/lib/roadmap/announcements";
import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";

export type AnnouncementStatusMap = Record<string, AnnouncementStatus>;

export async function fetchAnnouncementStatuses(): Promise<AnnouncementStatusMap> {
  const { data, error } = await supabase.from("announcement_statuses").select("sprint_key, status");

  if (error) throw new Error(supabaseErrorMessage(error));

  const map: AnnouncementStatusMap = {};
  for (const row of data ?? []) {
    map[row.sprint_key] = row.status as AnnouncementStatus;
  }
  return map;
}

export async function upsertAnnouncementStatus(
  sprintKey: string,
  status: AnnouncementStatus,
): Promise<void> {
  const { error } = await supabase.from("announcement_statuses").upsert(
    { sprint_key: sprintKey, status },
    { onConflict: "sprint_key" },
  );

  if (error) throw new Error(supabaseErrorMessage(error));
}

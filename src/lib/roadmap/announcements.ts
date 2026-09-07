import type { RoadmapItem } from "./types";
import { SPRINT_SCHEDULE, sprintByName, type SprintSchedule } from "./sprints";
import { formatDate } from "./calculations";

export const ANNOUNCEMENT_STATUSES = ["Draft", "Published", "Archived"] as const;
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

/** A feature qualifies for an announcement once it reaches Production or Completed. */
export const isAnnounceable = (i: RoadmapItem) =>
  i.deliveryStatus === "Production" ||
  i.deliveryStatus === "Completed" ||
  i.businessStatus === "Completed";

export interface AnnouncementModuleGroup {
  module: string;
  features: RoadmapItem[];
}

export interface SprintAnnouncement {
  key: string; // sprint name — one announcement per sprint
  sprint: SprintSchedule;
  modules: AnnouncementModuleGroup[];
  items: RoadmapItem[];
  status: AnnouncementStatus;
}

/**
 * Builds one announcement per sprint that has completed/production features.
 * Grouping: Sprint → Module → Feature. Items are matched by sprint name, so a
 * feature can never appear twice for the same Sprint + Module + Feature.
 */
export function buildAnnouncements(
  items: RoadmapItem[],
  statuses: Record<string, AnnouncementStatus>,
): SprintAnnouncement[] {
  const done = items.filter(isAnnounceable);
  const out: SprintAnnouncement[] = [];

  for (const sprint of SPRINT_SCHEDULE) {
    const sprintItems = done.filter((i) => i.sprint === sprint.name);
    if (!sprintItems.length) continue;

    const byModule = new Map<string, RoadmapItem[]>();
    for (const i of sprintItems) {
      const list = byModule.get(i.module) ?? [];
      if (!list.some((x) => x.feature === i.feature)) list.push(i);
      byModule.set(i.module, list);
    }

    out.push({
      key: sprint.name,
      sprint,
      items: sprintItems,
      modules: Array.from(byModule, ([module, features]) => ({ module, features })).sort((a, b) =>
        a.module.localeCompare(b.module),
      ),
      // Newly detected sprints always start as Draft.
      status: statuses[sprint.name] ?? "Draft",
    });
  }

  return out;
}

export const uatDateFor = (sprintName: string) => sprintByName(sprintName)?.uat ?? null;

export function announcementSubject(a: SprintAnnouncement) {
  return `DCAA Project Update — ${a.sprint.name} Delivery Announcement`;
}

export function announcementEmail(a: SprintAnnouncement) {
  const lines: string[] = [];
  lines.push(`Dear Team,`);
  lines.push("");
  lines.push(
    `We are pleased to announce the completed deliveries for ${a.sprint.name} (${formatDate(
      a.sprint.start,
    )} – ${formatDate(a.sprint.end)}).`,
  );
  lines.push("");
  lines.push(`Sprint: ${a.sprint.name}`);
  lines.push(`Sprint Start Date: ${formatDate(a.sprint.start)}`);
  lines.push(`Sprint End Date: ${formatDate(a.sprint.end)}`);
  lines.push(`UAT Date: ${formatDate(a.sprint.uat)}`);
  lines.push("");
  lines.push(`Completed Modules (${a.modules.length}):`);
  for (const m of a.modules) lines.push(`  • ${m.module}`);
  lines.push("");
  lines.push(`Completed Features (${a.items.length}):`);
  for (const m of a.modules) {
    lines.push(`  ${m.module}`);
    for (const f of m.features) {
      const status = f.deliveryStatus || (f.businessStatus === "Completed" ? "Completed" : "Production");
      lines.push(`    - ${f.feature} — ${status} · UAT ${formatDate(a.sprint.uat)}`);
    }
  }
  lines.push("");
  lines.push(`All listed features are available for UAT starting ${formatDate(a.sprint.uat)}.`);
  lines.push("");
  lines.push("Best regards,");
  lines.push("DCAA Delivery Team");
  return lines.join("\n");
}

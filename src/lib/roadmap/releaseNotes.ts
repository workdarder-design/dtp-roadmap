import type { RoadmapItem } from "./types";
import { SPRINT_SCHEDULE, type SprintSchedule } from "./sprints";
import { formatDate } from "./calculations";
import { isAnnounceable } from "./announcements";

export interface ReleaseNoteModule {
  module: string;
  features: RoadmapItem[];
}

export interface ReleaseNote {
  sprint: SprintSchedule;
  delivered: RoadmapItem[];
  pending: RoadmapItem[];
  modules: ReleaseNoteModule[];
  version: string;
}

const groupByModule = (items: RoadmapItem[]): ReleaseNoteModule[] => {
  const map = new Map<string, RoadmapItem[]>();
  for (const i of items) {
    const list = map.get(i.module) ?? [];
    if (!list.some((x) => x.feature === i.feature)) list.push(i);
    map.set(i.module, list);
  }
  return Array.from(map, ([module, features]) => ({ module, features })).sort((a, b) =>
    a.module.localeCompare(b.module),
  );
};

/** Sprints whose end date is in the past, newest first. */
export function pastSprints(today = new Date()): SprintSchedule[] {
  const iso = today.toISOString().slice(0, 10);
  return SPRINT_SCHEDULE.filter((s) => s.end < iso);
}

export function buildReleaseNotes(items: RoadmapItem[], today = new Date()): ReleaseNote[] {
  return pastSprints(today)
    .map((sprint) => {
      const sprintItems = items.filter((i) => i.sprint === sprint.name);
      const delivered = sprintItems.filter(isAnnounceable);
      const pending = sprintItems.filter((i) => !isAnnounceable(i));
      return {
        sprint,
        delivered,
        pending,
        modules: groupByModule(delivered),
        version: `v${sprint.number}.0`,
      };
    })
    .reverse();
}

export function releaseNoteMarkdown(note: ReleaseNote) {
  const l: string[] = [];
  l.push(`# Release Notes — ${note.sprint.name} (${note.version})`);
  l.push("");
  l.push(`**Sprint window:** ${formatDate(note.sprint.start)} – ${formatDate(note.sprint.end)}`);
  l.push(`**UAT date:** ${formatDate(note.sprint.uat)}`);
  l.push(`**Delivered features:** ${note.delivered.length} across ${note.modules.length} module(s)`);
  l.push("");
  if (note.modules.length) {
    l.push("## What's new");
    for (const m of note.modules) {
      l.push("");
      l.push(`### ${m.module}`);
      for (const f of m.features) {
        const status = f.deliveryStatus || f.businessStatus;
        l.push(`- ${f.feature} — ${status}`);
      }
    }
  } else {
    l.push("_No features reached Production or Completed in this sprint._");
  }
  if (note.pending.length) {
    l.push("");
    l.push("## Carried over");
    for (const p of note.pending) l.push(`- ${p.module} · ${p.feature} — ${p.deliveryStatus || p.businessStatus}`);
  }
  return l.join("\n");
}

export const allReleaseNotesMarkdown = (notes: ReleaseNote[]) =>
  notes.map(releaseNoteMarkdown).join("\n\n---\n\n");

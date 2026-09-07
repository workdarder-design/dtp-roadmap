/**
 * Sprint schedule is fully calculated — no manual dates.
 * Anchor: Sprint 10 runs 2026-06-21 → 2026-07-02.
 * Every following sprint starts the day after the previous one ends and lasts 2 weeks.
 * UAT date for a sprint = start date of the next sprint.
 */

export const FIRST_SPRINT_NUMBER = 10;
export const LAST_SPRINT_NUMBER = 20;
const ANCHOR_START = "2026-06-21";
const ANCHOR_END = "2026-07-02";

const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface SprintSchedule {
  number: number;
  name: string;
  start: string;
  end: string;
  uat: string;
}

function buildSchedule(): SprintSchedule[] {
  const rows: { number: number; start: string; end: string }[] = [];
  let start = ANCHOR_START;
  let end = ANCHOR_END;
  for (let n = FIRST_SPRINT_NUMBER; n <= LAST_SPRINT_NUMBER + 1; n++) {
    if (n > FIRST_SPRINT_NUMBER) {
      start = addDays(end, 1);
      end = addDays(start, 13);
    }
    rows.push({ number: n, start, end });
  }
  return rows.slice(0, LAST_SPRINT_NUMBER - FIRST_SPRINT_NUMBER + 1).map((r, idx) => ({
    number: r.number,
    name: `Sprint ${r.number}`,
    start: r.start,
    end: r.end,
    uat: rows[idx + 1]!.start,
  }));
}

export const SPRINT_SCHEDULE: SprintSchedule[] = buildSchedule();

export const SPRINT_NAMES = SPRINT_SCHEDULE.map((s) => s.name);

export const sprintByName = (name: string): SprintSchedule | undefined =>
  SPRINT_SCHEDULE.find((s) => s.name === name);

export const sprintOrder = (name: string) => {
  const idx = SPRINT_SCHEDULE.findIndex((s) => s.name === name);
  return idx === -1 ? 999 : idx;
};

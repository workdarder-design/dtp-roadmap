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
  return `DTP Project Update — ${a.sprint.name} Delivery Announcement`;
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
  lines.push("DTP Delivery Team");
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Professional HTML email (table based, inline CSS — email-client safe) */
/* ------------------------------------------------------------------ */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BRAND = "#763291";
const BRAND_DARK = "#4A205A";
const INK = "#1f2937";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const SOFT = "#f6f8fa";

function factCell(label: string, value: string) {
  return `
    <td style="padding:6px;" valign="top" width="25%">
      <div style="border:1px solid ${LINE};border-radius:10px;background:${SOFT};padding:12px 14px;">
        <div style="font:600 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};">${esc(
          label,
        )}</div>
        <div style="font:700 14px/1.5 Arial,Helvetica,sans-serif;color:${INK};margin-top:4px;">${esc(value)}</div>
      </div>
    </td>`;
}

export function announcementEmailHtml(a: SprintAnnouncement) {
  const uat = formatDate(a.sprint.uat);

  const moduleBlocks = a.modules
    .map(
      (m) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-radius:12px;background:#ffffff;margin:0 0 14px 0;">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${LINE};background:${SOFT};border-radius:12px 12px 0 0;">
            <table role="presentation" width="100%"><tr>
              <td style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${INK};">${esc(m.module)}</td>
              <td align="right" style="font:400 12px/1.4 Arial,Helvetica,sans-serif;color:${MUTED};">${
                m.features.length
              } feature${m.features.length === 1 ? "" : "s"}</td>
            </tr></table>
          </td>
        </tr>
        ${m.features
          .map((f, i) => {
            const st = f.deliveryStatus || (f.businessStatus === "Completed" ? "Completed" : "Production");
            return `
        <tr>
          <td style="padding:12px 16px;${i ? `border-top:1px solid ${LINE};` : ""}">
            <table role="presentation" width="100%"><tr>
              <td style="font:400 14px/1.5 Arial,Helvetica,sans-serif;color:${INK};">${esc(f.feature)}</td>
              <td align="right" style="white-space:nowrap;">
                <span style="display:inline-block;font:700 11px/1 Arial,Helvetica,sans-serif;color:#0f7b46;background:#e7f6ee;border:1px solid #bfe6d1;border-radius:999px;padding:6px 10px;">${esc(
                  st,
                )}</span>
                <span style="display:inline-block;font:400 11px/1 Arial,Helvetica,sans-serif;color:${MUTED};padding:6px 0 6px 8px;">UAT ${esc(
                  uat,
                )}</span>
              </td>
            </tr></table>
          </td>
        </tr>`;
          })
          .join("")}
      </table>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(announcementSubject(a))}</title></head>
<body style="margin:0;padding:0;background:#eef2f5;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(a.sprint.name)} delivery announcement — ${
    a.items.length
  } features available for UAT on ${esc(uat)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
        <tr>
          <td style="background:${BRAND};background-image:linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%);padding:26px 28px;">
            <div style="font:700 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#f3e4f8;">DTP— Roadmap</div>
            <div style="font:700 24px/1.35 Arial,Helvetica,sans-serif;color:#ffffff;margin-top:6px;">${esc(
              a.sprint.name,
            )} Delivery Announcement</div>
            <div style="font:400 13px/1.5 Arial,Helvetica,sans-serif;color:#ead6f2;margin-top:6px;">${esc(
              formatDate(a.sprint.start),
            )} &ndash; ${esc(formatDate(a.sprint.end))}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 22px 6px 22px;">
            <p style="font:400 14px/1.7 Arial,Helvetica,sans-serif;color:${INK};margin:0 0 12px 0;">Dear Team,</p>
            <p style="font:400 14px/1.7 Arial,Helvetica,sans-serif;color:${INK};margin:0;">We are pleased to announce the completed deliveries for <strong>${esc(
              a.sprint.name,
            )}</strong>. All listed features are available for UAT starting <strong>${esc(uat)}</strong>.</p>
          </td>
        </tr>
        <tr><td style="padding:14px 16px 4px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            ${factCell("Sprint", a.sprint.name)}
            ${factCell("Start date", formatDate(a.sprint.start))}
            ${factCell("End date", formatDate(a.sprint.end))}
            ${factCell("UAT date", uat)}
          </tr></table>
        </td></tr>
        <tr><td style="padding:10px 22px 0 22px;">
          <table role="presentation" width="100%"><tr>
            <td style="font:700 15px/1.5 Arial,Helvetica,sans-serif;color:${INK};padding-bottom:10px;">Completed deliveries</td>
            <td align="right" style="font:400 12px/1.5 Arial,Helvetica,sans-serif;color:${MUTED};padding-bottom:10px;">${
              a.modules.length
            } modules &middot; ${a.items.length} features</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 22px 8px 22px;">${moduleBlocks}</td></tr>
        <tr><td style="padding:4px 22px 24px 22px;">
          <table role="presentation" width="100%" style="border:1px solid #bfe6d1;background:#e7f6ee;border-radius:12px;">
            <tr><td style="padding:14px 16px;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#14532d;">
              <strong>UAT window opens ${esc(uat)}.</strong> Please review the delivered features and share feedback with the delivery team.
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top:1px solid ${LINE};padding:18px 22px;background:${SOFT};">
          <div style="font:600 13px/1.6 Arial,Helvetica,sans-serif;color:${INK};">Best regards,</div>
          <div style="font:400 13px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};">DTP Delivery Team</div>
        </td></tr>
      </table>
      <div style="font:400 11px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};padding:14px 0 0 0;">This is an automated project update from the DTP— Roadmap.</div>
    </td></tr>
  </table>
</body></html>`;
}

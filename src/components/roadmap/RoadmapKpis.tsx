import {
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Layers,
  Loader,
  OctagonAlert,
  Rocket,
  Timer,
} from "lucide-react";
import { computeKpis, daysUntil, formatDate, nextDelivery } from "@/lib/roadmap/calculations";
import type { RoadmapItem } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface CardSpec {
  title: string;
  icon: React.ElementType;
  iconTone: string;
  value: string;
  sub: string;
  progress?: number;
  badge?: { text: string; tone: string };
}

export function RoadmapKpis({ items }: { items: RoadmapItem[] }) {
  const k = computeKpis(items);
  const next = nextDelivery(items);
  const nextEta = next ? (next.etaProduction ?? next.etaStaging)! : null;
  const days = nextEta ? daysUntil(nextEta) : null;

  const cards: CardSpec[] = [
    {
      title: "Total Items",
      icon: Layers,
      iconTone: "bg-muted text-foreground",
      value: String(k.total),
      sub: "In current scope",
    },
    {
      title: "Completed",
      icon: CheckCircle2,
      iconTone: "bg-status-done/10 text-status-done",
      value: `${k.completed} / ${k.total}`,
      sub: `${k.completionPct}% completion`,
      progress: k.completionPct,
    },
    {
      title: "In Progress",
      icon: Loader,
      iconTone: "bg-status-progress/10 text-status-progress",
      value: String(k.inProgress),
      sub: k.total ? `${Math.round((k.inProgress / k.total) * 100)}% of scope` : "—",
      progress: k.total ? (k.inProgress / k.total) * 100 : 0,
    },
    {
      title: "Blocked",
      icon: OctagonAlert,
      iconTone: "bg-status-blocked/10 text-status-blocked",
      value: String(k.blocked),
      sub: k.blocked ? `${k.blocked} item${k.blocked > 1 ? "s" : ""} need attention` : "Nothing blocked",
      badge: k.blocked
        ? { text: "At risk", tone: "bg-status-blocked/10 text-status-blocked" }
        : { text: "Clear", tone: "bg-status-done/10 text-status-done" },
    },
    {
      title: "Delayed",
      icon: Timer,
      iconTone: "bg-status-delayed/10 text-status-delayed",
      value: String(k.delayed),
      sub: k.delayed ? "Past ETA, not completed" : "On schedule",
      badge: k.delayed
        ? { text: "Overdue", tone: "bg-status-delayed/10 text-status-delayed" }
        : { text: "On track", tone: "bg-status-done/10 text-status-done" },
    },
    {
      title: "Next Delivery",
      icon: CalendarClock,
      iconTone: "bg-brand/10 text-brand",
      value: next ? formatDate(nextEta) : "—",
      sub: next ? next.feature : "No upcoming delivery",
      badge:
        days !== null
          ? days >= 0
            ? { text: days === 0 ? "Today" : `in ${days} day${days > 1 ? "s" : ""}`, tone: "bg-highlight/40 text-foreground" }
            : { text: `${Math.abs(days)}d overdue`, tone: "bg-status-delayed/10 text-status-delayed" }
          : undefined,
    },
    {
      title: "Staging Ready",
      icon: CircleDashed,
      iconTone: "bg-muted text-foreground",
      value: String(k.stagingReady),
      sub: "Done with staging ETA",
    },
    {
      title: "Production Ready",
      icon: Rocket,
      iconTone: "bg-brand/10 text-brand",
      value: String(k.productionReady),
      sub: k.total ? `${Math.round((k.productionReady / k.total) * 100)}% of scope` : "—",
      progress: k.total ? (k.productionReady / k.total) * 100 : 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="group flex flex-col gap-2.5 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", c.iconTone)}>
                <c.icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">{c.title}</span>
            </div>
            {c.badge && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                  c.badge.tone,
                )}
              >
                {c.badge.text}
              </span>
            )}
          </div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight">{c.value}</div>
          <div className="min-w-0 truncate text-[11px] text-muted-foreground" title={c.sub}>
            {c.sub}
          </div>
          {c.progress !== undefined && <Progress value={c.progress} className="h-1.5" />}
        </div>
      ))}
    </div>
  );
}

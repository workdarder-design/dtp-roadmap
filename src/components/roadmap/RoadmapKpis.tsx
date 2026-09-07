import { computeKpis } from "@/lib/roadmap/calculations";
import type { RoadmapItem } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

export function RoadmapKpis({ items }: { items: RoadmapItem[] }) {
  const k = computeKpis(items);
  const cards = [
    { label: "Total Items", value: k.total, tone: "text-foreground" },
    { label: "Completed", value: k.completed, tone: "text-status-done" },
    { label: "In Progress", value: k.inProgress, tone: "text-status-progress" },
    { label: "Blocked", value: k.blocked, tone: "text-status-blocked" },
    { label: "Delayed", value: k.delayed, tone: "text-status-delayed" },
    { label: "Staging Ready", value: k.stagingReady, tone: "text-foreground" },
    { label: "Production Ready", value: k.productionReady, tone: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className={cn("text-2xl font-semibold tabular-nums", c.tone)}>{c.value}</div>
          <div className="mt-1 text-xs font-medium text-muted-foreground">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

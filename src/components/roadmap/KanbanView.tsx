import { useState } from "react";
import { toast } from "sonner";
import { useRoadmap } from "@/lib/roadmap/store";
import { displayDevStatus, type RoadmapItem } from "@/lib/roadmap/types";
import { formatDate } from "@/lib/roadmap/calculations";
import { Pill, deliveryTone, priorityTone } from "./StatusBadge";
import { cn } from "@/lib/utils";

const COLUMNS = ["Not Started", "In Progress", "Blocked", "Done"] as const;

export function KanbanView() {
  const { filtered, updateItem, isAdmin } = useRoadmap();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const byColumn = (col: string) =>
    filtered.filter((i) => (i.devStatus || "Not Started") === col);

  const drop = (col: (typeof COLUMNS)[number]) => {
    if (!dragId || !isAdmin) return;
    updateItem(dragId, { devStatus: col });
    toast.success(`${dragId} moved to ${displayDevStatus(col)}`);
    setDragId(null);
    setOver(null);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = byColumn(col);
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col);
            }}
            onDragLeave={() => setOver((o) => (o === col ? null : o))}
            onDrop={() => drop(col)}
            className={cn(
              "flex min-h-64 flex-col rounded-xl border bg-surface/60 p-3 transition-colors",
              over === col && "border-primary bg-primary/5",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{displayDevStatus(col)}</h3>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((i: RoadmapItem) => (
                <article
                  key={i.id}
                  draggable={isAdmin}
                  onDragStart={() => setDragId(i.id)}
                  className={cn(
                    "rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
                    isAdmin && "cursor-grab active:cursor-grabbing",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground">{i.id}</span>
                    <Pill variant={priorityTone(i.priority)}>{i.priority}</Pill>
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-snug">{i.feature}</p>
                  <p className="text-xs text-muted-foreground">{i.module}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5">{i.sprint}</span>
                    {i.etaStaging && <span className="tabular-nums">ETA {formatDate(i.etaStaging)}</span>}
                  </div>
                  {i.deliveryStatus && (
                    <div className="mt-2">
                      <Pill variant={deliveryTone(i.deliveryStatus)}>{i.deliveryStatus}</Pill>
                    </div>
                  )}
                </article>
              ))}
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No items
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

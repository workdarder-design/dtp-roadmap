import { useMemo, useState } from "react";
import { useRoadmap } from "@/lib/roadmap/store";
import type { RoadmapItem } from "@/lib/roadmap/types";
import { derivedState, formatDate } from "@/lib/roadmap/calculations";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { InlineDate, InlineSelect } from "./InlineEditor";
import { StateBadge } from "./StatusBadge";
import { DEV_STATUSES, DELIVERY_STATUSES } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

const barColor: Record<string, string> = {
  Completed: "bg-status-done/70",
  "In Progress": "bg-status-progress/70",
  Blocked: "bg-status-blocked/70",
  Delayed: "bg-status-delayed/80",
  Planned: "bg-status-planned/50",
};

export function TimelineView() {
  const { filtered, updateItem, isAdmin, sprints: programSprints } = useRoadmap();
  const [open, setOpen] = useState<string | null>(null);

  const sprints = useMemo(() => programSprints, [programSprints]);
  const startIdx = (i: RoadmapItem) => Math.max(0, sprints.indexOf(i.sprint));
  const span = (i: RoadmapItem) => (i.etaProduction ? 2 : 1);

  const grouped = useMemo(() => {
    const map = new Map<string, RoadmapItem[]>();
    for (const i of filtered) map.set(i.module, [...(map.get(i.module) ?? []), i]);
    return Array.from(map);
  }, [filtered]);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b p-3">
        <h3 className="text-sm font-semibold">Delivery Timeline</h3>
        <p className="text-xs text-muted-foreground">Sprint-based Gantt from sprint start to production ETA</p>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="min-w-[900px]">
          <div
            className="grid gap-1 border-b pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            style={{ gridTemplateColumns: `240px repeat(${sprints.length}, minmax(0,1fr))` }}
          >
            <div />
            {sprints.map((s) => (
              <div key={s}>{s}</div>
            ))}
          </div>

          {grouped.map(([module, items]) => (
            <div key={module} className="border-b py-2 last:border-b-0">
              <div className="py-1 text-sm font-semibold">{module}</div>
              {items.map((i) => {
                const state = derivedState(i);
                return (
                  <div
                    key={i.id}
                    className="grid items-center gap-1 py-1"
                    style={{ gridTemplateColumns: `240px repeat(${sprints.length}, minmax(0,1fr))` }}
                  >
                    <div className="truncate pr-3 text-xs text-muted-foreground">{i.feature}</div>
                    <div
                      style={{ gridColumnStart: startIdx(i) + 2, gridColumnEnd: `span ${span(i)}` }}
                      className="px-0.5"
                    >
                      <Popover open={open === i.id} onOpenChange={(o) => setOpen(o ? i.id : null)}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "h-6 w-full rounded-md px-2 text-left text-[11px] font-medium text-background shadow-sm transition-opacity hover:opacity-90",
                              barColor[state],
                            )}
                          >
                            <span className="truncate">{i.id}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 space-y-3" align="start">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold">{i.id}</span>
                            <StateBadge state={state} />
                          </div>
                          <p className="text-sm font-medium">{i.feature}</p>
                          <div className="space-y-2 text-xs">
                            <Line label="Staging ETA">
                              <InlineDate
                                editable={isAdmin}
                                value={i.etaStaging}
                                onChange={(v) => updateItem(i.id, { etaStaging: v })}
                              />
                            </Line>
                            <Line label="Production ETA">
                              <InlineDate
                                editable={isAdmin}
                                value={i.etaProduction}
                                onChange={(v) => updateItem(i.id, { etaProduction: v })}
                              />
                            </Line>
                            <Line label="Dev Status">
                              <InlineSelect
                                editable={isAdmin}
                                value={i.devStatus}
                                options={DEV_STATUSES}
                                onChange={(v) => updateItem(i.id, { devStatus: v as RoadmapItem["devStatus"] })}
                              />
                            </Line>
                            <Line label="Delivery">
                              <InlineSelect
                                editable={isAdmin}
                                value={i.deliveryStatus}
                                options={DELIVERY_STATUSES}
                                onChange={(v) =>
                                  updateItem(i.id, { deliveryStatus: v as RoadmapItem["deliveryStatus"] })
                                }
                              />
                            </Line>
                            <p className="text-muted-foreground">
                              {formatDate(i.etaStaging) || "No staging date"} →{" "}
                              {formatDate(i.etaProduction) || "No production date"}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(null)}>
                            Close
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">No items in scope.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

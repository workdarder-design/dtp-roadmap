import { useMemo, useState } from "react";
import { useRoadmap } from "@/lib/roadmap/store";
import { SPRINTS, type RoadmapItem } from "@/lib/roadmap/types";
import { derivedState, formatDate } from "@/lib/roadmap/calculations";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Pill, StateBadge, priorityTone, stateTone } from "./StatusBadge";
import { RoadmapItemModal } from "./RoadmapItemModal";
import { cn } from "@/lib/utils";

type Zoom = "sprint" | "month" | "pi";

const barTone: Record<string, string> = {
  Completed: "bg-status-done/15 border-status-done/40",
  "In Progress": "bg-status-progress/15 border-status-progress/40",
  Blocked: "bg-status-blocked/15 border-status-blocked/40",
  Delayed: "bg-status-delayed/20 border-status-delayed/45",
  Planned: "bg-status-planned/12 border-status-planned/35",
};

export function SafeTrainView() {
  const { filtered } = useRoadmap();
  const [zoom, setZoom] = useState<Zoom>("sprint");
  const [editing, setEditing] = useState<RoadmapItem | null>(null);

  const sprints = useMemo(() => {
    const used = new Set(filtered.map((i) => i.sprint));
    const list = SPRINTS.map(String).filter((s) => used.has(s));
    return list.length ? list : SPRINTS.map(String).slice(0, 5);
  }, [filtered]);

  const columns = zoom === "sprint" ? sprints : zoom === "month" ? chunk(sprints, 2) .map((c) => c.join(" · ")) : ["PI-2026 Q3"];
  const colIndex = (sprint: string) => {
    if (zoom === "sprint") return sprints.indexOf(sprint);
    if (zoom === "pi") return 0;
    return Math.floor(Math.max(0, sprints.indexOf(sprint)) / 2);
  };

  const modules = Array.from(new Set(filtered.map((i) => i.module)));
  const todayCol = colIndex(sprints[Math.min(2, sprints.length - 1)] ?? "");

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
        <div>
          <h3 className="text-sm font-semibold">SAFe Program Increment Train</h3>
          <p className="text-xs text-muted-foreground">PI-2026 Q3 · Agile Release Train lanes by module</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
          {(["sprint", "month", "pi"] as Zoom[]).map((z) => (
            <Button
              key={z}
              size="sm"
              variant={zoom === z ? "default" : "ghost"}
              className="h-7 px-3 text-xs capitalize"
              onClick={() => setZoom(z)}
            >
              {z}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="min-w-[900px]">
          <div className="mb-2 rounded-md bg-primary/10 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-primary">
            PI-2026 Q3
          </div>
          <div
            className="grid gap-2 border-b pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(0,1fr))` }}
          >
            <div />
            {columns.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute inset-y-0 z-10 w-px bg-status-blocked/60"
              style={{ left: `calc(180px + ((100% - 180px) / ${columns.length}) * ${todayCol + 0.5})` }}
            >
              <span className="absolute -top-1 -translate-x-1/2 rounded bg-status-blocked px-1 text-[10px] font-semibold text-background">
                Today
              </span>
            </div>

            {modules.map((m) => (
              <div key={m} className="border-b py-3 last:border-b-0">
                <div
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(0,1fr))` }}
                >
                  <div className="pr-2 text-sm font-semibold leading-tight">{m}</div>
                  {columns.map((c) => (
                    <div key={c} className="h-1 rounded bg-surface" />
                  ))}
                </div>
                <div className="mt-1 space-y-1.5">
                  {filtered
                    .filter((i) => i.module === m)
                    .map((i) => {
                      const state = derivedState(i);
                      return (
                        <div
                          key={i.id}
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(0,1fr))` }}
                        >
                          <div />
                          <div style={{ gridColumnStart: colIndex(i.sprint) + 2 }}>
                            <HoverCard openDelay={120}>
                              <HoverCardTrigger asChild>
                                <button
                                  onClick={() => setEditing(i)}
                                  className={cn(
                                    "w-full truncate rounded-md border px-2 py-1 text-left text-xs font-medium shadow-sm transition-transform hover:-translate-y-px hover:shadow",
                                    barTone[state],
                                  )}
                                >
                                  {i.feature}
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-semibold">{i.id}</span>
                                  <StateBadge state={state} />
                                </div>
                                <p className="mt-1 text-sm font-medium">{i.feature}</p>
                                <p className="text-muted-foreground">{i.module}</p>
                                <dl className="mt-2 grid grid-cols-2 gap-1">
                                  <Row k="Priority" v={<Pill variant={priorityTone(i.priority)}>{i.priority}</Pill>} />
                                  <Row k="Sprint" v={i.sprint} />
                                  <Row k="Staging ETA" v={formatDate(i.etaStaging) || "—"} />
                                  <Row k="Production ETA" v={formatDate(i.etaProduction) || "—"} />
                                  <Row k="Business" v={i.businessStatus || "—"} />
                                  <Row k="Dev" v={i.devStatus || "—"} />
                                  <Row k="Delivery" v={i.deliveryStatus || "—"} />
                                </dl>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
            {modules.length === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">No items in scope.</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {Object.keys(barTone).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2.5 w-4 rounded border", barTone[s])} />
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <RoadmapItemModal
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        {...(editing ? { item: editing } : {})}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right">{v}</dd>
    </>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export { stateTone };

import { useMemo, useState } from "react";
import { ChevronRight, CircleDot, Workflow } from "lucide-react";
import { WORKFLOW_STAGES, currentStageIndex } from "@/lib/roadmap/workflow";
import type { RoadmapItem } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

const phaseTone: Record<string, string> = {
  Business: "bg-primary/10 text-primary border-primary/20",
  Development: "bg-accent/10 text-accent-foreground border-accent/30",
  Delivery: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

export function ClientWorkflowDiagram({ items }: { items: RoadmapItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, RoadmapItem[]>();
    WORKFLOW_STAGES.forEach((s) => map.set(s.key, []));
    items.forEach((i) => {
      const stage = WORKFLOW_STAGES[currentStageIndex(i)];
      if (stage) map.get(stage.key)!.push(i);
    });
    return map;
  }, [items]);

  const total = items.length || 1;
  const activeStage = WORKFLOW_STAGES.find((s) => s.key === active) ?? null;
  const activeItems = active ? (grouped.get(active) ?? []) : [];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Workflow className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Feature Workflow</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            Click any stage to see its features
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-stretch gap-2">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const list = grouped.get(stage.key) ?? [];
              const pct = Math.round((list.length / total) * 100);
              const isActive = active === stage.key;
              return (
                <div key={stage.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActive(isActive ? null : stage.key)}
                    className={cn(
                      "w-[168px] rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                      isActive
                        ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                        : "bg-background",
                      !list.length && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        phaseTone[stage.phase],
                      )}
                    >
                      {stage.phase}
                    </span>
                    <p className="mt-2 text-xs font-semibold leading-tight">{stage.label}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-xl font-bold tabular-nums">{list.length}</span>
                      <span className="text-[10px] text-muted-foreground">/ {items.length} · {pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold">
          {activeStage ? `${activeStage.label} · ${activeItems.length} features` : "All features by stage"}
        </h3>
        {activeStage ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeItems.map((i) => (
              <FeatureCard key={i.id} item={i} />
            ))}
            {!activeItems.length && (
              <p className="text-sm text-muted-foreground">No features in this stage.</p>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {WORKFLOW_STAGES.filter((s) => (grouped.get(s.key) ?? []).length).map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CircleDot className="size-3.5 text-primary" />
                  {s.label} ({(grouped.get(s.key) ?? []).length})
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(grouped.get(s.key) ?? []).map((i) => (
                    <FeatureCard key={i.id} item={i} />
                  ))}
                </div>
              </div>
            ))}
            {!items.length && <p className="text-sm text-muted-foreground">No features to show.</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureCard({ item }: { item: RoadmapItem }) {
  const idx = currentStageIndex(item);
  const pct = Math.round(((idx + 1) / WORKFLOW_STAGES.length) * 100);
  return (
    <div className="rounded-xl border bg-background p-3 transition-shadow hover:shadow-sm">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.module}</p>
      <p className="mt-0.5 text-sm font-medium leading-tight">{item.feature}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Sprint {item.sprint}</span>
        <span>
          {item.etaProduction || item.etaStaging
            ? new Date((item.etaProduction ?? item.etaStaging) as string).toLocaleDateString()
            : "—"}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

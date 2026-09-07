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

const stageTone: Record<string, { border: string; bg: string; text: string; bar: string; dot: string }> = {
  "gathering-requirements": { border: "border-slate-300", bg: "bg-slate-50", text: "text-slate-700", bar: "bg-slate-400", dot: "text-slate-500" },
  "in-analysis": { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-400", dot: "text-blue-500" },
  validation: { border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-400", dot: "text-indigo-500" },
  planned: { border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-400", dot: "text-violet-500" },
  "in-progress": { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-400", dot: "text-amber-500" },
  done: { border: "border-teal-200", bg: "bg-teal-50", text: "text-teal-700", bar: "bg-teal-400", dot: "text-teal-500" },
  "ready-for-uat": { border: "border-cyan-200", bg: "bg-cyan-50", text: "text-cyan-700", bar: "bg-cyan-400", dot: "text-cyan-500" },
  handover: { border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-700", bar: "bg-sky-400", dot: "text-sky-500" },
  production: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400", dot: "text-emerald-500" },
  completed: { border: "border-lime-200", bg: "bg-lime-50", text: "text-lime-800", bar: "bg-lime-500", dot: "text-lime-600" },
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
              const tone = stageTone[stage.key];
              return (
                <div key={stage.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActive(isActive ? null : stage.key)}
                    className={cn(
                      "w-[168px] rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                      tone ? `${tone.bg} ${tone.border}` : "bg-background border-border",
                      isActive && "shadow-md ring-2 ring-primary/30",
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
                    <p className={cn("mt-2 text-xs font-semibold leading-tight", tone?.text)}>{stage.label}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className={cn("text-xl font-bold tabular-nums", tone?.text)}>{list.length}</span>
                      <span className="text-[10px] text-muted-foreground">/ {items.length} · {pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", tone?.bar ?? "bg-primary")}
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
              <FeatureCard key={i.id} item={i} tone={stageTone[activeStage.key]} />
            ))}
            {!activeItems.length && (
              <p className="text-sm text-muted-foreground">No features in this stage.</p>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {WORKFLOW_STAGES.filter((s) => (grouped.get(s.key) ?? []).length).map((s) => {
              const tone = stageTone[s.key];
              return (
                <div key={s.key}>
                  <div className={cn("mb-2 flex items-center gap-2 text-xs font-medium", tone?.text ?? "text-muted-foreground")}>
                    <CircleDot className={cn("size-3.5", tone?.dot ?? "text-primary")} />
                    {s.label} ({(grouped.get(s.key) ?? []).length})
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(grouped.get(s.key) ?? []).map((i) => (
                      <FeatureCard key={i.id} item={i} tone={tone} />
                    ))}
                  </div>
                </div>
              );
            })}
            {!items.length && <p className="text-sm text-muted-foreground">No features to show.</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureCard({ item, tone }: { item: RoadmapItem; tone: { border: string; bg: string; text: string; bar: string; dot: string } | undefined }) {
  const idx = currentStageIndex(item);
  const pct = Math.round(((idx + 1) / WORKFLOW_STAGES.length) * 100);
  return (
    <div className={cn("rounded-xl border p-3 transition-shadow hover:shadow-sm", tone ? `${tone.bg} ${tone.border}` : "bg-background border-border")}>
      <p className={cn("text-[10px] uppercase tracking-wide", tone?.text ?? "text-muted-foreground")}>{item.module}</p>
      <p className={cn("mt-0.5 text-sm font-medium leading-tight", tone?.text)}>{item.feature}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Sprint {item.sprint}</span>
        <span>
          {item.etaProduction || item.etaStaging
            ? new Date((item.etaProduction ?? item.etaStaging) as string).toLocaleDateString()
            : "—"}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone?.bar ?? "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

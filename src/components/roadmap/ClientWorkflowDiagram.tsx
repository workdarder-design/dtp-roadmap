import { useMemo, useState } from "react";
import { Check, ChevronRight, Circle, CircleDot, Info, MapPin, Workflow } from "lucide-react";
import { WORKFLOW_STAGES, currentStageIndex, type WorkflowStage } from "@/lib/roadmap/workflow";
import type { RoadmapItem } from "@/lib/roadmap/types";
import { formatDate } from "@/lib/roadmap/calculations";
import { Pill } from "./StatusBadge";
import { cn } from "@/lib/utils";

const phaseTone: Record<string, string> = {
  Business: "bg-primary/10 text-primary border-primary/20",
  Development: "bg-accent/10 text-accent-foreground border-accent/30",
  Delivery: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
};

const stageTone: Record<
  string,
  { border: string; bg: string; text: string; bar: string; dot: string; ring: string }
> = {
  gathering: {
    border: "border-slate-200",
    bg: "bg-slate-50/80",
    text: "text-slate-800",
    bar: "bg-slate-400",
    dot: "text-slate-500",
    ring: "ring-slate-300/50",
  },
  analysis: {
    border: "border-blue-200",
    bg: "bg-blue-50/80",
    text: "text-blue-800",
    bar: "bg-blue-500",
    dot: "text-blue-500",
    ring: "ring-blue-300/50",
  },
  validation: {
    border: "border-indigo-200",
    bg: "bg-indigo-50/80",
    text: "text-indigo-800",
    bar: "bg-indigo-500",
    dot: "text-indigo-500",
    ring: "ring-indigo-300/50",
  },
  planned: {
    border: "border-violet-200",
    bg: "bg-violet-50/80",
    text: "text-violet-800",
    bar: "bg-violet-500",
    dot: "text-violet-500",
    ring: "ring-violet-300/50",
  },
  "in-progress": {
    border: "border-amber-200",
    bg: "bg-amber-50/80",
    text: "text-amber-900",
    bar: "bg-amber-500",
    dot: "text-amber-600",
    ring: "ring-amber-300/60",
  },
  done: {
    border: "border-teal-200",
    bg: "bg-teal-50/80",
    text: "text-teal-800",
    bar: "bg-teal-500",
    dot: "text-teal-600",
    ring: "ring-teal-300/50",
  },
  uat: {
    border: "border-cyan-200",
    bg: "bg-cyan-50/80",
    text: "text-cyan-800",
    bar: "bg-cyan-500",
    dot: "text-cyan-600",
    ring: "ring-cyan-300/50",
  },
  handover: {
    border: "border-sky-200",
    bg: "bg-sky-50/80",
    text: "text-sky-800",
    bar: "bg-sky-500",
    dot: "text-sky-600",
    ring: "ring-sky-300/50",
  },
  production: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/80",
    text: "text-emerald-800",
    bar: "bg-emerald-500",
    dot: "text-emerald-600",
    ring: "ring-emerald-300/50",
  },
};

/** Client view ends at Production. Completed stays off this diagram. */
const CLIENT_WORKFLOW_STAGES = WORKFLOW_STAGES.filter((s) => s.key !== "completed");

function clientStageFor(item: RoadmapItem): WorkflowStage {
  const stage = WORKFLOW_STAGES[currentStageIndex(item)];
  if (!stage || stage.key === "completed") {
    return CLIENT_WORKFLOW_STAGES.find((s) => s.key === "production") ?? CLIENT_WORKFLOW_STAGES.at(-1)!;
  }
  return CLIENT_WORKFLOW_STAGES.find((s) => s.key === stage.key) ?? stage;
}

function clientStageIndex(item: RoadmapItem): number {
  const idx = CLIENT_WORKFLOW_STAGES.findIndex((s) => s.key === clientStageFor(item).key);
  return idx < 0 ? 0 : idx;
}

type StageRailState = "completed" | "current" | "upcoming" | "partial";

function stageRailState(items: RoadmapItem[], stageIndex: number): StageRailState {
  if (!items.length) return "upcoming";
  let at = 0;
  let past = 0;
  let before = 0;
  for (const item of items) {
    const idx = clientStageIndex(item);
    if (idx === stageIndex) at++;
    else if (idx > stageIndex) past++;
    else before++;
  }
  if (at > 0) return "current";
  if (past === items.length) return "completed";
  if (before === items.length) return "upcoming";
  return "partial";
}

const PHASE_ORDER: WorkflowStage["phase"][] = ["Business", "Development", "Delivery"];

const PHASE_STAGE_COUNTS: Record<WorkflowStage["phase"], number> = {
  Business: CLIENT_WORKFLOW_STAGES.filter((s) => s.phase === "Business").length,
  Development: CLIENT_WORKFLOW_STAGES.filter((s) => s.phase === "Development").length,
  Delivery: CLIENT_WORKFLOW_STAGES.filter((s) => s.phase === "Delivery").length,
};

export function ClientWorkflowDiagram({ items }: { items: RoadmapItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, RoadmapItem[]>();
    CLIENT_WORKFLOW_STAGES.forEach((s) => map.set(s.key, []));
    items.forEach((i) => {
      const stage = clientStageFor(i);
      map.get(stage.key)!.push(i);
    });
    return map;
  }, [items]);

  const activeStage = CLIENT_WORKFLOW_STAGES.find((s) => s.key === active) ?? null;
  const activeItems = active ? (grouped.get(active) ?? []) : [];

  const phaseSummary = useMemo(() => {
    const counts = { Business: 0, Development: 0, Delivery: 0 };
    items.forEach((i) => {
      const stage = clientStageFor(i);
      if (stage) counts[stage.phase]++;
    });
    return counts;
  }, [items]);

  const defaultFocusStage = useMemo(() => {
    for (const s of CLIENT_WORKFLOW_STAGES) {
      if (stageRailState(items, CLIENT_WORKFLOW_STAGES.indexOf(s)) === "current") return s.key;
    }
    for (let i = CLIENT_WORKFLOW_STAGES.length - 1; i >= 0; i--) {
      if (stageRailState(items, i) === "completed") return CLIENT_WORKFLOW_STAGES[i]!.key;
    }
    return CLIENT_WORKFLOW_STAGES[0]!.key;
  }, [items]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Workflow className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight">Feature Workflow</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                Track each feature from business requirements through engineering to client
                delivery. Select a stage to focus its features below.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-lg border bg-surface/80 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
              <span>Green check = stage passed · Pin = features here now</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {PHASE_ORDER.map((phase) => (
              <div
                key={phase}
                className="flex items-center justify-between rounded-xl border bg-surface/50 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    phaseTone[phase],
                  )}
                >
                  {phase}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {phaseSummary[phase]}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">features</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <ConnectedWorkflowDiagram
            items={items}
            grouped={grouped}
            active={active}
            onSelectStage={(key) => setActive(active === key ? null : key)}
            defaultFocusStage={defaultFocusStage}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="text-sm font-semibold">
              {activeStage ? activeStage.label : "All features by stage"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeStage
                ? `${activeItems.length} feature${activeItems.length === 1 ? "" : "s"} in this step`
                : "Grouped by current workflow step · progress bar shows journey completion"}
            </p>
          </div>
          {activeStage && (
            <button
              type="button"
              onClick={() => setActive(null)}
              className="text-xs font-medium text-brand hover:underline"
            >
              Show all stages
            </button>
          )}
        </div>

        {activeStage ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeItems.map((i) => (
              <FeatureCard key={i.id} item={i} tone={stageTone[activeStage.key]} highlight />
            ))}
            {!activeItems.length && (
              <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                No features in this stage.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {CLIENT_WORKFLOW_STAGES.filter((s) => (grouped.get(s.key) ?? []).length).map((s) => {
              const tone = stageTone[s.key];
              const idx = CLIENT_WORKFLOW_STAGES.indexOf(s);
              const rail = stageRailState(items, idx);
              return (
                <div key={s.key} className="scroll-mt-4">
                  <button
                    type="button"
                    onClick={() => setActive(s.key)}
                    className={cn(
                      "mb-3 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface/80",
                      rail === "current" && "bg-brand/5",
                    )}
                  >
                    <StageStatusIcon state={rail} tone={tone} compact />
                    <span className={cn("text-sm font-semibold", tone?.text ?? "text-foreground")}>
                      {s.label}
                    </span>
                    <Pill
                      variant={
                        rail === "current" ? "progress" : rail === "completed" ? "done" : "muted"
                      }
                    >
                      {(grouped.get(s.key) ?? []).length}
                    </Pill>
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
                  </button>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(grouped.get(s.key) ?? []).map((i) => (
                      <FeatureCard key={i.id} item={i} tone={tone} />
                    ))}
                  </div>
                </div>
              );
            })}
            {!items.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">No features to show.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ConnectedWorkflowDiagram({
  items,
  grouped,
  active,
  onSelectStage,
  defaultFocusStage,
}: {
  items: RoadmapItem[];
  grouped: Map<string, RoadmapItem[]>;
  active: string | null;
  onSelectStage: (key: string) => void;
  defaultFocusStage: string;
}) {
  return (
    <div className="rounded-xl border bg-surface/40 p-4 sm:p-5">
      <p className="mb-4 text-xs text-muted-foreground">
        End-to-end workflow — tap any step to see its features
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[960px] px-1">
          <div className="mb-3 flex gap-1">
            {PHASE_ORDER.map((phase, i) => (
              <div
                key={phase}
                className={cn(
                  "flex items-center justify-center rounded-lg border py-1.5 text-[10px] font-semibold uppercase tracking-wide",
                  phaseTone[phase],
                  i > 0 && "border-l-0",
                )}
                style={{ flex: PHASE_STAGE_COUNTS[phase] }}
              >
                {phase}
              </div>
            ))}
          </div>
          <div className="flex items-center">
            {CLIENT_WORKFLOW_STAGES.map((stage, stageIdx) => {
              const list = grouped.get(stage.key) ?? [];
              const isActive = active === stage.key;
              const tone = stageTone[stage.key];
              const rail = stageRailState(items, stageIdx);
              const isFocus = !active && stage.key === defaultFocusStage && rail === "current";
              const prevRail = stageIdx > 0 ? stageRailState(items, stageIdx - 1) : null;
              const linkActive =
                prevRail === "completed" || prevRail === "current" || prevRail === "partial";

              return (
                <div key={stage.key} className="flex min-w-0 flex-1 items-center">
                  {stageIdx > 0 && (
                    <div
                      className={cn(
                        "mx-0.5 h-0.5 min-w-[8px] flex-1 rounded-full",
                        linkActive ? "bg-status-done/50" : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                  <WorkflowDiagramNode
                    stage={stage}
                    listCount={list.length}
                    rail={rail}
                    tone={tone}
                    isActive={isActive}
                    isFocus={isFocus}
                    onSelect={() => onSelectStage(stage.key)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowDiagramNode({
  stage,
  listCount,
  rail,
  tone,
  isActive,
  isFocus,
  onSelect,
}: {
  stage: WorkflowStage;
  listCount: number;
  rail: StageRailState;
  tone: (typeof stageTone)[string] | undefined;
  isActive: boolean;
  isFocus: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-current={rail === "current" ? "step" : undefined}
      aria-label={`${stage.label}, ${listCount} features`}
      className={cn(
        "flex shrink-0 flex-col items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors sm:px-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        isActive && "bg-brand/5",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full border-2 bg-card text-[11px] font-bold tabular-nums shadow-sm sm:size-11 sm:text-xs",
          rail === "completed" && "border-status-done bg-status-done/10 text-status-done",
          rail === "current" && "border-brand bg-brand text-brand-foreground ring-4 ring-brand/15",
          rail === "upcoming" && "border-muted-foreground/30 text-muted-foreground",
          rail === "partial" && cn("border-primary/35", tone?.bg, tone?.text),
          isFocus && !isActive && "ring-2 ring-brand/25",
          isActive && "ring-2 ring-brand",
        )}
      >
        {rail === "completed" && listCount === 0 ? (
          <Check className="size-4" aria-hidden />
        ) : (
          listCount
        )}
      </span>
      <span
        className={cn(
          "max-w-[4.75rem] text-center text-[9px] font-semibold leading-snug sm:max-w-[5.75rem] sm:text-[10px]",
          rail === "current" ? "text-brand" : "text-foreground",
        )}
      >
        {stage.label}
      </span>
    </button>
  );
}

function StageStatusIcon({
  state,
  tone,
  compact,
}: {
  state: StageRailState;
  tone: (typeof stageTone)[string] | undefined;
  compact?: boolean;
}) {
  const size = compact ? "size-7" : "size-8";
  if (state === "completed") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-status-done/15 text-status-done ring-1 ring-status-done/30",
          size,
        )}
        title="Passed"
      >
        <Check className={compact ? "size-3.5" : "size-4"} aria-hidden />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand ring-2 ring-brand/30",
          size,
        )}
        title="Current step"
      >
        <MapPin className={compact ? "size-3.5" : "size-4"} aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border bg-background",
        tone?.border ?? "border-border",
        size,
      )}
      title={state === "partial" ? "In progress across features" : "Upcoming"}
    >
      {state === "partial" ? (
        <CircleDot
          className={cn(compact ? "size-3.5" : "size-4", tone?.dot ?? "text-muted-foreground")}
        />
      ) : (
        <Circle className={cn(compact ? "size-3" : "size-3.5", "text-muted-foreground/50")} />
      )}
    </span>
  );
}

function FeatureCard({
  item,
  tone,
  highlight,
}: {
  item: RoadmapItem;
  tone: (typeof stageTone)[string] | undefined;
  highlight?: boolean;
}) {
  const idx = clientStageIndex(item);
  const pct = Math.round(((idx + 1) / CLIENT_WORKFLOW_STAGES.length) * 100);
  const current = CLIENT_WORKFLOW_STAGES[idx]!;
  const eta = item.etaProduction ?? item.etaStaging;

  return (
    <article
      className={cn(
        "rounded-xl border p-3.5 transition-shadow hover:shadow-md",
        tone ? `${tone.bg} ${tone.border}` : "border-border bg-background",
        highlight && "ring-1 ring-brand/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] text-muted-foreground">{item.id}</p>
        <Pill variant="progress" className="max-w-[55%] truncate text-[10px]">
          Step {idx + 1}: {current.label}
        </Pill>
      </div>
      <p
        className={cn(
          "mt-1 text-[10px] font-medium uppercase tracking-wide",
          tone?.text ?? "text-muted-foreground",
        )}
      >
        {item.module}
      </p>
      <p className={cn("mt-0.5 text-sm font-semibold leading-snug", tone?.text)}>{item.feature}</p>

      <FeatureStepStrip currentIndex={idx} tone={tone} />

      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Sprint {item.sprint}</span>
        <span className="tabular-nums">{eta ? formatDate(eta) : "—"}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/80">
          <div
            className={cn("h-full rounded-full transition-all", tone?.bar ?? "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{pct}%</span>
      </div>
    </article>
  );
}

function FeatureStepStrip({
  currentIndex,
  tone,
}: {
  currentIndex: number;
  tone: (typeof stageTone)[string] | undefined;
}) {
  return (
    <div
      className="mt-3 flex items-center gap-0.5"
      role="img"
      aria-label={`Workflow step ${currentIndex + 1} of ${CLIENT_WORKFLOW_STAGES.length}`}
    >
      {CLIENT_WORKFLOW_STAGES.map((s, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div
            key={s.key}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              done && "bg-status-done/70",
              current && (tone?.bar ?? "bg-brand"),
              !done && !current && "bg-muted",
              current && "ring-1 ring-offset-1 ring-brand/40",
            )}
            title={s.label}
          />
        );
      })}
    </div>
  );
}

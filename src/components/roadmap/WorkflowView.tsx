import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useRoadmap } from "@/lib/roadmap/store";
import type { RoadmapItem } from "@/lib/roadmap/types";
import { formatDate } from "@/lib/roadmap/calculations";
import { WORKFLOW_STAGES, currentStageIndex, isBlocked, patchForStage } from "@/lib/roadmap/workflow";
import { Pill, priorityTone } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PHASE_TONE: Record<string, string> = {
  Business: "bg-status-planned/12 text-status-planned ring-status-planned/25",
  Development: "bg-status-progress/12 text-status-progress ring-status-progress/25",
  Delivery: "bg-status-done/12 text-status-done ring-status-done/25",
};

export function WorkflowView() {
  const { filtered, updateItem, isAdmin } = useRoadmap();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const columns = useMemo(() => {
    return WORKFLOW_STAGES.map((stage, index) => ({
      stage,
      index,
      items: filtered.filter((i) => currentStageIndex(i) === index),
    }));
  }, [filtered]);

  const move = (item: RoadmapItem, index: number) => {
    if (!isAdmin) return;
    const clamped = Math.max(0, Math.min(index, WORKFLOW_STAGES.length - 1));
    if (clamped === currentStageIndex(item)) return;
    updateItem(item.id, patchForStage(clamped));
    toast.success(`${item.id} → ${WORKFLOW_STAGES[clamped]!.label}`, { duration: 1600 });
  };

  const drop = (index: number) => {
    const item = filtered.find((i) => i.id === dragId);
    setDragId(null);
    setOver(null);
    if (!item || !isAdmin) return;
    move(item, index);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
        <div>
          <h3 className="text-sm font-semibold">Feature Workflow</h3>
          <p className="text-xs text-muted-foreground">
            Status lifecycle from Business to Delivery
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(["Business", "Development", "Delivery"] as const).map((p) => (
            <span
              key={p}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                PHASE_TONE[p],
              )}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No features match the current filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-3 p-3">
            {columns.map(({ stage, index, items }) => (
              <section
                key={stage.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(stage.key);
                }}
                onDragLeave={() => setOver((o) => (o === stage.key ? null : o))}
                onDrop={() => drop(index)}
                className={cn(
                  "flex w-64 min-w-[16rem] flex-col rounded-lg border bg-surface/50 transition-colors",
                  over === stage.key && "bg-primary/5 ring-1 ring-primary/20",
                )}
              >
                <header className="sticky top-0 z-10 rounded-t-lg border-b bg-card/95 p-2.5 backdrop-blur">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold" title={stage.label}>
                      {index + 1}. {stage.label}
                    </span>
                    <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                      {items.length}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                      PHASE_TONE[stage.phase],
                    )}
                  >
                    {stage.phase}
                  </span>
                </header>

                <div className="flex flex-1 flex-col gap-2 p-2">
                  {items.map((i) => (
                    <WorkflowCard
                      key={i.id}
                      item={i}
                      index={index}
                      isAdmin={isAdmin}
                      onDragStart={() => setDragId(i.id)}
                      onMove={(next) => move(i, next)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowCard({
  item,
  index,
  isAdmin,
  onDragStart,
  onMove,
}: {
  item: RoadmapItem;
  index: number;
  isAdmin: boolean;
  onDragStart: () => void;
  onMove: (next: number) => void;
}) {
  const pct = Math.round(((index + 1) / WORKFLOW_STAGES.length) * 100);
  const blocked = isBlocked(item);

  return (
    <article
      draggable={isAdmin}
      onDragStart={onDragStart}
      className={cn(
        "rounded-lg border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md",
        blocked && "border-status-blocked/40",
        isAdmin && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span className="font-mono text-[11px] font-semibold text-muted-foreground">{item.id}</span>
        <div className="flex items-center gap-1">
          <Pill variant={priorityTone(item.priority)}>{item.priority}</Pill>
          {isAdmin && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />}
        </div>
      </div>

      <p className="mt-1 line-clamp-2 text-xs font-medium" title={item.feature}>
        {item.feature}
      </p>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{item.sprint}</span>
        <span>{pct}%</span>
      </div>

      {(item.etaProduction || item.etaStaging) && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          ETA {formatDate(item.etaProduction || item.etaStaging)}
        </p>
      )}

      {blocked && (
        <p className="mt-1 text-[10px] font-medium text-status-blocked">Blocked in development</p>
      )}

      {isAdmin && (
        <div className="mt-2 flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6"
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
            aria-label={`Move ${item.id} back`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <select
            value={index}
            onChange={(e) => onMove(Number(e.target.value))}
            className="h-6 min-w-0 flex-1 rounded-md border bg-background px-1 text-[11px]"
            aria-label={`Status of ${item.id}`}
          >
            {WORKFLOW_STAGES.map((s, i) => (
              <option key={s.key} value={i}>
                {s.label}
              </option>
            ))}
          </select>
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6"
            disabled={index === WORKFLOW_STAGES.length - 1}
            onClick={() => onMove(index + 1)}
            aria-label={`Move ${item.id} forward`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </article>
  );
}

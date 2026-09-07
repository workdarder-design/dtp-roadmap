import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
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

  const modules = useMemo(
    () => Array.from(new Set(filtered.map((i) => i.module))).sort(),
    [filtered],
  );

  const move = (item: RoadmapItem, index: number) => {
    if (!isAdmin) return;
    const clamped = Math.max(0, Math.min(index, WORKFLOW_STAGES.length - 1));
    if (clamped === currentStageIndex(item)) return;
    updateItem(item.id, patchForStage(clamped));
    toast.success(`${item.id} → ${WORKFLOW_STAGES[clamped]!.label}`, { duration: 1600 });
  };

  const drop = (moduleName: string, index: number) => {
    const item = filtered.find((i) => i.id === dragId);
    setDragId(null);
    setOver(null);
    if (!item || !isAdmin || item.module !== moduleName) return;
    move(item, index);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
        <div>
          <h3 className="text-sm font-semibold">Feature Workflow</h3>
          <p className="text-xs text-muted-foreground">
            Full lifecycle from business intake to production, grouped by module
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

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* stage header */}
          <div
            className="sticky top-0 z-10 grid border-b bg-card/95 backdrop-blur"
            style={{ gridTemplateColumns: `repeat(${WORKFLOW_STAGES.length}, minmax(210px, 1fr))` }}
          >
            {WORKFLOW_STAGES.map((s, idx) => {
              const count = filtered.filter((i) => currentStageIndex(i) === idx).length;
              return (
                <div key={s.key} className="border-r px-3 py-2.5 last:border-r-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold">{s.label}</span>
                    <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                      {count}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                      PHASE_TONE[s.phase],
                    )}
                  >
                    {idx + 1} · {s.phase}
                  </span>
                </div>
              );
            })}
          </div>

          {modules.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No features match the current filters.</p>
          )}

          {modules.map((m) => {
            const items = filtered.filter((i) => i.module === m);
            return (
              <div key={m} className="border-b last:border-b-0">
                <div className="sticky left-0 flex items-center gap-2 bg-surface/70 px-3 py-1.5">
                  <span className="text-xs font-semibold">{m}</span>
                  <span className="text-[11px] text-muted-foreground">{items.length} features</span>
                </div>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${WORKFLOW_STAGES.length}, minmax(210px, 1fr))` }}
                >
                  {WORKFLOW_STAGES.map((s, idx) => {
                    const cellItems = items.filter((i) => currentStageIndex(i) === idx);
                    const key = `${m}::${idx}`;
                    return (
                      <div
                        key={s.key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setOver(key);
                        }}
                        onDragLeave={() => setOver((o) => (o === key ? null : o))}
                        onDrop={() => drop(m, idx)}
                        className={cn(
                          "min-h-24 space-y-2 border-r p-2 transition-colors last:border-r-0",
                          over === key && "bg-primary/5",
                        )}
                      >
                        {cellItems.map((i) => (
                          <WorkflowCard
                            key={i.id}
                            item={i}
                            index={idx}
                            isAdmin={isAdmin}
                            onDragStart={() => setDragId(i.id)}
                            onMove={(next) => move(i, next)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
            <ChevronLeft className="h-3.5 w-3.5" />
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
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </article>
  );
}

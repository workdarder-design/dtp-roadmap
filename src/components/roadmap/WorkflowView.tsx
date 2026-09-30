import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Code2,
  Rocket,
  GitBranch,
  FolderTree,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GripVertical,
  Search,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Sparkles,
  Edit2,
  Calendar,
  Eye,
  Check,
  RotateCcw,
} from "lucide-react";
import { useRoadmap } from "@/lib/roadmap/store";
import type { Priority, RoadmapItem } from "@/lib/roadmap/types";
import { formatDate } from "@/lib/roadmap/calculations";
import {
  WORKFLOW_STAGES,
  currentStageIndex,
  isBlocked,
  patchForStage,
  type WorkflowStage,
} from "@/lib/roadmap/workflow";
import { Pill, priorityTone } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { RoadmapItemModal } from "./RoadmapItemModal";
import { cn } from "@/lib/utils";

type ViewMode = "tree" | "pipeline" | "journey";

interface PhaseConfig {
  name: "Business" | "Development" | "Delivery";
  title: string;
  arabicTitle: string;
  icon: typeof Briefcase;
  tone: {
    accent: string;
    bg: string;
    border: string;
    badge: string;
    light: string;
    text: string;
    dot: string;
    branchLine: string;
  };
}

const PHASES: PhaseConfig[] = [
  {
    name: "Business",
    title: "Business & Requirements",
    arabicTitle: "الأعمال والمتطلبات",
    icon: Briefcase,
    tone: {
      accent: "from-blue-600 to-indigo-600",
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900/50",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/25",
      light: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
      branchLine: "border-blue-300 dark:border-blue-800",
    },
  },
  {
    name: "Development",
    title: "Engineering & Build",
    arabicTitle: "الهندسة والتطوير",
    icon: Code2,
    tone: {
      accent: "from-amber-600 to-orange-600",
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-900/50",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/25",
      light: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
      branchLine: "border-amber-300 dark:border-amber-800",
    },
  },
  {
    name: "Delivery",
    title: "Testing, Rollout & Delivery",
    arabicTitle: "الفحص والإطلاق والتسليم",
    icon: Rocket,
    tone: {
      accent: "from-emerald-600 to-teal-600",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-900/50",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25",
      light: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
      branchLine: "border-emerald-300 dark:border-emerald-800",
    },
  },
];

export function WorkflowView() {
  const { filtered, updateItem, isAdmin } = useRoadmap();
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  // Filter controls within workflow view
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [onlyBlocked, setOnlyBlocked] = useState(false);

  // Collapsed states for tree nodes
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  // Single feature inspection state
  const [inspectFeatureId, setInspectFeatureId] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<RoadmapItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Available modules for filter dropdown
  const modules = useMemo(() => {
    return Array.from(new Set(filtered.map((i) => i.module))).sort();
  }, [filtered]);

  // Apply local workflow filters
  const visibleItems = useMemo(() => {
    return filtered.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesQuery =
          item.id.toLowerCase().includes(q) ||
          item.feature.toLowerCase().includes(q) ||
          item.module.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (moduleFilter !== "all" && item.module !== moduleFilter) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (onlyBlocked && !isBlocked(item)) return false;
      return true;
    });
  }, [filtered, search, moduleFilter, priorityFilter, onlyBlocked]);

  // Group items by stage index
  const stageGroups = useMemo(() => {
    return WORKFLOW_STAGES.map((stage, index) => ({
      stage,
      index,
      items: visibleItems.filter((i) => currentStageIndex(i) === index),
    }));
  }, [visibleItems]);

  // Quick stats
  const totalCount = visibleItems.length;
  const businessItemsCount = useMemo(
    () =>
      stageGroups
        .filter((g) => g.stage.phase === "Business")
        .reduce((sum, g) => sum + g.items.length, 0),
    [stageGroups],
  );
  const devItemsCount = useMemo(
    () =>
      stageGroups
        .filter((g) => g.stage.phase === "Development")
        .reduce((sum, g) => sum + g.items.length, 0),
    [stageGroups],
  );
  const deliveryItemsCount = useMemo(
    () =>
      stageGroups
        .filter((g) => g.stage.phase === "Delivery")
        .reduce((sum, g) => sum + g.items.length, 0),
    [stageGroups],
  );
  const blockedCount = useMemo(
    () => visibleItems.filter((i) => isBlocked(i)).length,
    [visibleItems],
  );

  const move = (item: RoadmapItem, index: number) => {
    if (!isAdmin) return;
    const clamped = Math.max(0, Math.min(index, WORKFLOW_STAGES.length - 1));
    if (clamped === currentStageIndex(item)) return;
    updateItem(item.id, patchForStage(clamped));
    toast.success(`${item.id} → ${WORKFLOW_STAGES[clamped]!.label}`, { duration: 1800 });
  };

  const handleDrop = (index: number) => {
    const item = filtered.find((i) => i.id === dragId);
    setDragId(null);
    setOverStage(null);
    if (!item || !isAdmin) return;
    move(item, index);
  };

  const togglePhaseCollapse = (phase: string) => {
    setCollapsedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  const toggleStageCollapse = (stageKey: string) => {
    setCollapsedStages((prev) => ({ ...prev, [stageKey]: !prev[stageKey] }));
  };

  const expandAll = () => {
    setCollapsedPhases({});
    setCollapsedStages({});
  };

  const collapseAll = () => {
    const pMap: Record<string, boolean> = {};
    PHASES.forEach((p) => (pMap[p.name] = true));
    setCollapsedPhases(pMap);
  };

  const selectedInspectItem = useMemo(() => {
    if (inspectFeatureId) {
      return filtered.find((i) => i.id === inspectFeatureId) || null;
    }
    return visibleItems[0] || filtered[0] || null;
  }, [inspectFeatureId, filtered, visibleItems]);

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderTree className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Feature Workflow Tree</h3>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Hierarchical Flow
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Visual tree workflow tracking features from Business Requirements through Engineering to Client Delivery
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border bg-surface/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  viewMode === "tree"
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FolderTree className="h-3.5 w-3.5" />
                <span>Tree View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pipeline")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  viewMode === "pipeline"
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Flow Pipeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("journey")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  viewMode === "journey"
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Feature Path</span>
              </button>
            </div>

            {viewMode === "tree" && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="h-7 px-2.5 text-[11px]"
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  className="h-7 px-2.5 text-[11px]"
                >
                  Collapse All
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tree Life Summary Metrics Bar */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:gap-3">
          <div className="rounded-xl border bg-surface/50 p-2.5 sm:p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <Layers className="h-3.5 w-3.5" /> Total In Tree
              </span>
              <span className="font-semibold text-foreground">{totalCount}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: "100%" }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">All features in scope</p>
          </div>

          {/* Business Branch KPI */}
          <div className="rounded-xl border border-blue-200/60 bg-blue-50/40 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20 sm:p-3">
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
              <span className="flex items-center gap-1 font-medium">
                <Briefcase className="h-3.5 w-3.5" /> Business
              </span>
              <span className="font-semibold">{businessItemsCount}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${totalCount ? Math.round((businessItemsCount / totalCount) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[10px] text-blue-600/80 dark:text-blue-400">
              {totalCount ? Math.round((businessItemsCount / totalCount) * 100) : 0}% • Requirements & Planning
            </p>
          </div>

          {/* Development Branch KPI */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-3">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
              <span className="flex items-center gap-1 font-medium">
                <Code2 className="h-3.5 w-3.5" /> Development
              </span>
              <span className="font-semibold">{devItemsCount}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950">
              <div
                className="h-full rounded-full bg-amber-600"
                style={{
                  width: `${totalCount ? Math.round((devItemsCount / totalCount) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[10px] text-amber-600/80 dark:text-amber-400">
              {totalCount ? Math.round((devItemsCount / totalCount) * 100) : 0}% • In Code & Testing
            </p>
          </div>

          {/* Delivery Branch KPI */}
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20 sm:p-3">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
              <span className="flex items-center gap-1 font-medium">
                <Rocket className="h-3.5 w-3.5" /> Delivery
              </span>
              <span className="font-semibold">{deliveryItemsCount}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${totalCount ? Math.round((deliveryItemsCount / totalCount) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[10px] text-emerald-600/80 dark:text-emerald-400">
              {totalCount ? Math.round((deliveryItemsCount / totalCount) * 100) : 0}% • UAT to Production
            </p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by feature name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-surface/70 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-8 rounded-lg border bg-surface/70 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            aria-label="Filter by module"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 rounded-lg border bg-surface/70 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Blocked Filter */}
          <button
            type="button"
            onClick={() => setOnlyBlocked((v) => !v)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
              onlyBlocked
                ? "border-destructive bg-destructive/10 text-destructive font-semibold"
                : "border-border bg-surface/70 text-muted-foreground hover:text-foreground",
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Blocked ({blockedCount})</span>
          </button>

          {(search || moduleFilter !== "all" || priorityFilter !== "all" || onlyBlocked) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setModuleFilter("all");
                setPriorityFilter("all");
                setOnlyBlocked(false);
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "tree" && (
        <HierarchicalTreeView
          phases={PHASES}
          stageGroups={stageGroups}
          collapsedPhases={collapsedPhases}
          collapsedStages={collapsedStages}
          togglePhaseCollapse={togglePhaseCollapse}
          toggleStageCollapse={toggleStageCollapse}
          isAdmin={isAdmin}
          overStage={overStage}
          onDragStart={(id) => setDragId(id)}
          onDragOver={(key) => setOverStage(key)}
          onDragLeave={() => setOverStage(null)}
          onDrop={handleDrop}
          onMove={move}
          onEdit={(item) => {
            setModalItem(item);
            setModalOpen(true);
          }}
          onInspect={(id) => {
            setInspectFeatureId(id);
            setViewMode("journey");
          }}
        />
      )}

      {viewMode === "pipeline" && (
        <PipelineFlowView
          phases={PHASES}
          stageGroups={stageGroups}
          isAdmin={isAdmin}
          overStage={overStage}
          onDragStart={(id) => setDragId(id)}
          onDragOver={(key) => setOverStage(key)}
          onDragLeave={() => setOverStage(null)}
          onDrop={handleDrop}
          onMove={move}
          onEdit={(item) => {
            setModalItem(item);
            setModalOpen(true);
          }}
          onInspect={(id) => {
            setInspectFeatureId(id);
            setViewMode("journey");
          }}
        />
      )}

      {viewMode === "journey" && (
        <FeatureJourneyView
          items={visibleItems}
          selectedItem={selectedInspectItem}
          onSelectFeature={(id) => setInspectFeatureId(id)}
          isAdmin={isAdmin}
          onMove={move}
          onEdit={(item) => {
            setModalItem(item);
            setModalOpen(true);
          }}
        />
      )}

      {/* Edit Modal */}
      <RoadmapItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={modalItem ?? undefined}
      />
    </div>
  );
}

// -------------------------------------------------------------
// VIEW 1: HIERARCHICAL TREE VIEW (الشجرة الهيكلية المتفرعة)
// -------------------------------------------------------------
function HierarchicalTreeView({
  phases,
  stageGroups,
  collapsedPhases,
  collapsedStages,
  togglePhaseCollapse,
  toggleStageCollapse,
  isAdmin,
  overStage,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMove,
  onEdit,
  onInspect,
}: {
  phases: PhaseConfig[];
  stageGroups: { stage: WorkflowStage; index: number; items: RoadmapItem[] }[];
  collapsedPhases: Record<string, boolean>;
  collapsedStages: Record<string, boolean>;
  togglePhaseCollapse: (phase: string) => void;
  toggleStageCollapse: (key: string) => void;
  isAdmin: boolean;
  overStage: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (key: string) => void;
  onDragLeave: () => void;
  onDrop: (index: number) => void;
  onMove: (item: RoadmapItem, index: number) => void;
  onEdit: (item: RoadmapItem) => void;
  onInspect: (id: string) => void;
}) {
  const totalItemsCount = stageGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="relative rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      {/* Root Node: Program Roadmap Lifecycle */}
      <div className="mx-auto mb-8 max-w-xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-bold text-foreground">
            DTP Program Workflow Root Tree
          </span>
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            {totalItemsCount} Active Features
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          3 Main Delivery Trunks • 10 Lifecycle Stages
        </p>

        {/* Central Root Trunk Line */}
        <div className="mx-auto mt-3 h-6 w-0.5 bg-gradient-to-b from-primary/60 to-border" />
      </div>

      {/* Main Tree Branches (Phases) */}
      <div className="space-y-8">
        {phases.map((phase, pIdx) => {
          const phaseStages = stageGroups.filter((g) => g.stage.phase === phase.name);
          const phaseItemCount = phaseStages.reduce((sum, g) => sum + g.items.length, 0);
          const isPhaseCollapsed = !!collapsedPhases[phase.name];
          const Icon = phase.icon;

          return (
            <div key={phase.name} className="relative">
              {/* Vertical connector line between phases */}
              {pIdx < phases.length - 1 && (
                <div
                  className="pointer-events-none absolute bottom-0 left-6 top-12 z-0 hidden w-0.5 -translate-x-1/2 bg-border sm:block"
                  style={{ height: "calc(100% + 2rem)" }}
                />
              )}

              {/* Phase Trunk Node */}
              <div
                className={cn(
                  "relative z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-all shadow-xs",
                  phase.tone.bg,
                  phase.tone.border,
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-xs",
                      phase.tone.accent,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Phase {pIdx + 1}
                      </span>
                      <h4 className={cn("text-sm font-bold tracking-tight", phase.tone.text)}>
                        {phase.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">({phase.arabicTitle})</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{phaseStages.length} Stages</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        {phaseItemCount} {phaseItemCount === 1 ? "Feature" : "Features"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePhaseCollapse(phase.name)}
                    className="h-8 gap-1.5 px-3 text-xs font-medium"
                  >
                    <span>{isPhaseCollapsed ? "Expand Branch" : "Collapse Branch"}</span>
                    {isPhaseCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Sub-branches (Stages under this Phase) */}
              {!isPhaseCollapsed && (
                <div className="mt-4 pl-0 sm:pl-8">
                  <div className="relative space-y-4">
                    {phaseStages.map(({ stage, index, items }, sIdx) => {
                      const isStageCollapsed = !!collapsedStages[stage.key];
                      const stepNumber = `${pIdx + 1}.${sIdx + 1}`;
                      const isDropTarget = overStage === stage.key;

                      return (
                        <div
                          key={stage.key}
                          onDragOver={(e) => {
                            e.preventDefault();
                            onDragOver(stage.key);
                          }}
                          onDragLeave={onDragLeave}
                          onDrop={() => onDrop(index)}
                          className={cn(
                            "relative rounded-xl border bg-card p-3.5 transition-all shadow-xs",
                            isDropTarget && "border-primary bg-primary/5 ring-2 ring-primary/20",
                          )}
                        >
                          {/* Tree Branch Connector visual */}
                          <div className="hidden sm:block absolute -left-5 top-5 h-px w-5 bg-border" />
                          <div className="hidden sm:block absolute -left-5 top-0 h-5 w-px bg-border" />

                          {/* Stage Node Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-xs",
                                  phase.tone.accent,
                                )}
                              >
                                {stepNumber}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold text-foreground">
                                    {stage.label}
                                  </h5>
                                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                                    {items.length}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  Step {index + 1} of {WORKFLOW_STAGES.length}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <span className="hidden text-[10px] text-muted-foreground lg:inline">
                                  Drag items here to update
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleStageCollapse(stage.key)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-surface hover:text-foreground"
                                title={isStageCollapsed ? "Expand Stage" : "Collapse Stage"}
                              >
                                {isStageCollapsed ? (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Stage Content: Feature Leaves */}
                          {!isStageCollapsed && (
                            <div className="mt-3">
                              {items.length === 0 ? (
                                <div className="rounded-lg border border-dashed py-5 text-center text-xs text-muted-foreground">
                                  No features currently in this stage.
                                </div>
                              ) : (
                                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                  {items.map((item) => (
                                    <FeatureTreeNodeCard
                                      key={item.id}
                                      item={item}
                                      stageIndex={index}
                                      isAdmin={isAdmin}
                                      onDragStart={() => onDragStart(item.id)}
                                      onMove={(next) => onMove(item, next)}
                                      onEdit={() => onEdit(item)}
                                      onInspect={() => onInspect(item.id)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// VIEW 2: PIPELINE FLOW VIEW (المخطط التدفقي الأفقي للشجرة)
// -------------------------------------------------------------
function PipelineFlowView({
  phases,
  stageGroups,
  isAdmin,
  overStage,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMove,
  onEdit,
  onInspect,
}: {
  phases: PhaseConfig[];
  stageGroups: { stage: WorkflowStage; index: number; items: RoadmapItem[] }[];
  isAdmin: boolean;
  overStage: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (key: string) => void;
  onDragLeave: () => void;
  onDrop: (index: number) => void;
  onMove: (item: RoadmapItem, index: number) => void;
  onEdit: (item: RoadmapItem) => void;
  onInspect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold">End-to-End Pipeline Stream</h4>
          <p className="text-xs text-muted-foreground">
            Continuous delivery tree pipeline from requirements gathering to full rollout
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max items-start gap-4">
          {phases.map((phase) => {
            const phaseStages = stageGroups.filter((g) => g.stage.phase === phase.name);
            const Icon = phase.icon;

            return (
              <div
                key={phase.name}
                className={cn(
                  "rounded-2xl border p-3.5 transition-all shadow-xs",
                  phase.tone.bg,
                  phase.tone.border,
                )}
              >
                {/* Phase Pipeline Header */}
                <div className="mb-3 flex items-center gap-2 border-b pb-2.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-xs",
                      phase.tone.accent,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className={cn("text-xs font-bold", phase.tone.text)}>{phase.title}</h5>
                    <p className="text-[10px] text-muted-foreground">{phase.arabicTitle}</p>
                  </div>
                </div>

                {/* Stages In This Phase */}
                <div className="flex items-start gap-3">
                  {phaseStages.map(({ stage, index, items }) => {
                    const isDropTarget = overStage === stage.key;
                    return (
                      <div
                        key={stage.key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          onDragOver(stage.key);
                        }}
                        onDragLeave={onDragLeave}
                        onDrop={() => onDrop(index)}
                        className={cn(
                          "w-64 min-w-[16rem] rounded-xl border bg-card/95 p-3 backdrop-blur transition-all shadow-xs",
                          isDropTarget && "border-primary bg-primary/5 ring-2 ring-primary/20",
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 border-b pb-2">
                          <span className="truncate text-xs font-bold" title={stage.label}>
                            {index + 1}. {stage.label}
                          </span>
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                            {items.length}
                          </span>
                        </div>

                        <div className="mt-2.5 flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
                          {items.length === 0 ? (
                            <p className="py-4 text-center text-xs text-muted-foreground">
                              Empty stage
                            </p>
                          ) : (
                            items.map((item) => (
                              <FeatureTreeNodeCard
                                key={item.id}
                                item={item}
                                stageIndex={index}
                                isAdmin={isAdmin}
                                onDragStart={() => onDragStart(item.id)}
                                onMove={(next) => onMove(item, next)}
                                onEdit={() => onEdit(item)}
                                onInspect={() => onInspect(item.id)}
                              />
                            ))
                          )}
                        </div>
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

// -------------------------------------------------------------
// VIEW 3: FEATURE JOURNEY VIEW (تتبع مسار ميزة معينة شجرياً)
// -------------------------------------------------------------
function FeatureJourneyView({
  items,
  selectedItem,
  onSelectFeature,
  isAdmin,
  onMove,
  onEdit,
}: {
  items: RoadmapItem[];
  selectedItem: RoadmapItem | null;
  onSelectFeature: (id: string) => void;
  isAdmin: boolean;
  onMove: (item: RoadmapItem, index: number) => void;
  onEdit: (item: RoadmapItem) => void;
}) {
  if (!selectedItem) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No feature selected or available to display journey.
      </div>
    );
  }

  const currentIdx = currentStageIndex(selectedItem);
  const currentStage = WORKFLOW_STAGES[currentIdx]!;
  const blocked = isBlocked(selectedItem);
  const completionPct = Math.round(((currentIdx + 1) / WORKFLOW_STAGES.length) * 100);

  return (
    <div className="space-y-4">
      {/* Feature Selector & Header Banner */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {selectedItem.id}
              </span>
              <Pill variant={priorityTone(selectedItem.priority)}>{selectedItem.priority}</Pill>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                {selectedItem.module}
              </span>
              <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                Sprint: {selectedItem.sprint}
              </span>
              {blocked && (
                <span className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> Blocked
                </span>
              )}
            </div>

            <h3 className="mt-2 text-base font-bold text-foreground">{selectedItem.feature}</h3>

            {selectedItem.remarks && (
              <p className="mt-1 text-xs text-muted-foreground italic">
                "{selectedItem.remarks}"
              </p>
            )}
          </div>

          {/* Feature switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedItem.id}
              onChange={(e) => onSelectFeature(e.target.value)}
              className="h-9 rounded-lg border bg-surface px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              aria-label="Select feature to inspect"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id} — {i.feature.substring(0, 35)}...
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(selectedItem)}
              className="h-9 gap-1 text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Details
            </Button>
          </div>
        </div>

        {/* Progress & Current Position Summary */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t pt-4">
          <div className="rounded-xl border bg-surface/50 p-3">
            <span className="text-[11px] font-medium text-muted-foreground">Current Stage</span>
            <p className="mt-1 text-sm font-bold text-foreground">
              {currentIdx + 1}. {currentStage.label}
            </p>
            <span className="text-[10px] text-muted-foreground">Phase: {currentStage.phase}</span>
          </div>

          <div className="rounded-xl border bg-surface/50 p-3">
            <span className="text-[11px] font-medium text-muted-foreground">Lifecycle Completion</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{completionPct}%</span>
              <span className="text-[11px] text-muted-foreground">
                {currentIdx + 1} of {WORKFLOW_STAGES.length} Steps
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-surface/50 p-3">
            <span className="text-[11px] font-medium text-muted-foreground">Expected Dates</span>
            <div className="mt-1 flex flex-col text-xs text-foreground">
              <span>Staging: {formatDate(selectedItem.etaStaging) || "TBD"}</span>
              <span>Production: {formatDate(selectedItem.etaProduction) || "TBD"}</span>
            </div>
          </div>
        </div>

        {/* Admin Quick Step Controller */}
        {isAdmin && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface p-3">
            <div className="text-xs font-semibold">Change Workflow Stage:</div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => onMove(selectedItem, currentIdx - 1)}
                className="h-8 text-xs"
              >
                <ChevronUp className="mr-1 h-3.5 w-3.5" /> Previous Stage
              </Button>
              <select
                value={currentIdx}
                onChange={(e) => onMove(selectedItem, Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2 text-xs font-medium"
              >
                {WORKFLOW_STAGES.map((s, i) => (
                  <option key={s.key} value={i}>
                    {i + 1}. {s.label} ({s.phase})
                  </option>
                ))}
              </select>
              <Button
                variant="default"
                size="sm"
                disabled={currentIdx === WORKFLOW_STAGES.length - 1}
                onClick={() => onMove(selectedItem, currentIdx + 1)}
                className="h-8 text-xs"
              >
                Next Stage <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Visual Tree Path Stepper (10 Stages Tree Roadmap) */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <h4 className="mb-6 text-sm font-bold">Tree Lifecycle Milestone Path</h4>

        <div className="relative pl-6 sm:pl-8 space-y-6">
          {/* Continuous vertical tree trunk line */}
          <div className="absolute bottom-4 left-3 sm:left-4 top-4 w-0.5 bg-border" />

          {WORKFLOW_STAGES.map((stage, idx) => {
            const isPassed = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;

            return (
              <div key={stage.key} className="relative flex items-start gap-4">
                {/* Node Milestone Icon */}
                <div
                  className={cn(
                    "absolute -left-6 sm:-left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all shadow-xs",
                    isPassed &&
                      "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-500",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isFuture && "border-muted-foreground/30 bg-background text-muted-foreground/50",
                  )}
                >
                  {isPassed ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Milestone Details Card */}
                <div
                  className={cn(
                    "flex-1 rounded-xl border p-3.5 transition-all",
                    isCurrent &&
                      "border-primary/60 bg-primary/5 shadow-xs ring-1 ring-primary/20",
                    isPassed && "border-border/80 bg-surface/40 opacity-90",
                    isFuture && "border-dashed border-border/60 bg-surface/20 opacity-60",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {idx + 1}. {stage.label}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          stage.phase === "Business" &&
                            "bg-blue-500/10 text-blue-700 dark:text-blue-300",
                          stage.phase === "Development" &&
                            "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                          stage.phase === "Delivery" &&
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        )}
                      >
                        {stage.phase}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium">
                      {isCurrent && (
                        <span className="flex items-center gap-1 font-bold text-primary">
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          Current Active Stage
                        </span>
                      )}
                      {isPassed && (
                        <span className="text-emerald-600 dark:text-emerald-400">Completed</span>
                      )}
                      {isFuture && <span className="text-muted-foreground">Upcoming</span>}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    <span>
                      Mapping: Business [{stage.business}] • Dev [{stage.dev}] • Delivery [
                      {stage.delivery}]
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="mt-2.5 flex items-center gap-2 border-t pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isCurrent}
                        onClick={() => onMove(selectedItem, idx)}
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {isCurrent ? "Current Stage" : `Jump to ${stage.label}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: FEATURE TREE NODE CARD (بطاقة الميزة في الشجرة)
// -------------------------------------------------------------
function FeatureTreeNodeCard({
  item,
  stageIndex,
  isAdmin,
  onDragStart,
  onMove,
  onEdit,
  onInspect,
}: {
  item: RoadmapItem;
  stageIndex: number;
  isAdmin: boolean;
  onDragStart: () => void;
  onMove: (next: number) => void;
  onEdit: () => void;
  onInspect: () => void;
}) {
  const pct = Math.round(((stageIndex + 1) / WORKFLOW_STAGES.length) * 100);
  const blocked = isBlocked(item);

  return (
    <article
      draggable={isAdmin}
      onDragStart={onDragStart}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border bg-card p-3 shadow-xs transition-all hover:shadow-md",
        blocked && "border-destructive/60 bg-destructive/5 ring-1 ring-destructive/20",
        isAdmin && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold text-muted-foreground">
              {item.id}
            </span>
            <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
              {item.module}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Pill variant={priorityTone(item.priority)} className="text-[10px] px-1.5 py-0">
              {item.priority}
            </Pill>
            {isAdmin && (
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Feature Title */}
        <h6
          onClick={onInspect}
          className="mt-1.5 cursor-pointer text-xs font-semibold leading-snug text-foreground hover:text-primary transition-colors line-clamp-2"
          title={item.feature}
        >
          {item.feature}
        </h6>

        {/* Blocked Alert */}
        {blocked && (
          <div className="mt-2 flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[10px] font-bold text-destructive">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Blocked in development</span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t pt-2">
        {/* Lifecycle progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              blocked ? "bg-destructive" : pct >= 90 ? "bg-emerald-500" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Sprint: {item.sprint}</span>
          <span className="font-semibold">{pct}%</span>
        </div>

        {(item.etaProduction || item.etaStaging) && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>ETA: {formatDate(item.etaProduction || item.etaStaging)}</span>
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-2.5 flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            onClick={onInspect}
            title="Inspect Tree Path"
          >
            <Eye className="h-3 w-3" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            onClick={onEdit}
            title="Edit Feature"
          >
            <Edit2 className="h-3 w-3" />
          </Button>

          {isAdmin && (
            <div className="ml-auto flex items-center gap-0.5">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                disabled={stageIndex === 0}
                onClick={() => onMove(stageIndex - 1)}
                title="Move to Previous Stage"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>

              <select
                value={stageIndex}
                onChange={(e) => onMove(Number(e.target.value))}
                className="h-6 max-w-[90px] truncate rounded border bg-background px-1 text-[10px] text-foreground"
                aria-label={`Status of ${item.id}`}
              >
                {WORKFLOW_STAGES.map((s, i) => (
                  <option key={s.key} value={i}>
                    {i + 1}. {s.label}
                  </option>
                ))}
              </select>

              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                disabled={stageIndex === WORKFLOW_STAGES.length - 1}
                onClick={() => onMove(stageIndex + 1)}
                title="Move to Next Stage"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

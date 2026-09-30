import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRoadmap } from "@/lib/roadmap/store";
import {
  BUSINESS_STATUSES,
  DEFAULT_FILTERS,
  DELIVERY_STATUSES,
  DEV_STATUSES,
  displayDevStatus,
  PRIORITIES,
  type RoadmapFilterState,
  type ScopeType,
} from "@/lib/roadmap/types";
import { formatDate } from "@/lib/roadmap/calculations";

const SCOPE_LABELS: Record<ScopeType, string> = {
  project: "Whole Project",
  module: "Module",
  feature: "Feature",
  sprint: "Sprint",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="all">{allLabel}</SelectItem>
        {options
          .filter((o) => o !== "")
          .map((o) => (
            <SelectItem key={o} value={o}>
              {displayDevStatus(o)}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

interface Chip {
  key: keyof RoadmapFilterState;
  label: string;
}

export function RoadmapFilters() {
  const { filters, setFilters, resetFilters, items, sprints } = useRoadmap();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RoadmapFilterState>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const scopeOptions =
    draft.scopeType === "module"
      ? Array.from(new Set(items.map((i) => i.module)))
      : draft.scopeType === "feature"
        ? Array.from(new Set(items.map((i) => i.feature)))
        : draft.scopeType === "sprint"
          ? Array.from(new Set(items.map((i) => i.sprint)))
          : [];

  const chips = useMemo<Chip[]>(() => {
    const list: Chip[] = [];
    if (filters.scopeType !== "project" && filters.scopeValue)
      list.push({ key: "scopeValue", label: `${SCOPE_LABELS[filters.scopeType]}: ${filters.scopeValue}` });
    if (filters.module !== "all") list.push({ key: "module", label: `Module: ${filters.module}` });
    if (filters.sprint !== "all") list.push({ key: "sprint", label: filters.sprint });
    if (filters.priority !== "all") list.push({ key: "priority", label: `Priority: ${filters.priority}` });
    if (filters.status !== "all") list.push({ key: "status", label: filters.status });
    if (filters.businessStatus !== "all")
      list.push({ key: "businessStatus", label: `Business: ${filters.businessStatus}` });
    if (filters.devStatus !== "all") list.push({ key: "devStatus", label: `Dev: ${displayDevStatus(filters.devStatus)}` });
    if (filters.deliveryStatus !== "all")
      list.push({ key: "deliveryStatus", label: `Delivery: ${filters.deliveryStatus}` });
    if (filters.etaFrom || filters.etaTo)
      list.push({
        key: "etaFrom",
        label: `ETA: ${filters.etaFrom ? formatDate(filters.etaFrom) : "…"} → ${filters.etaTo ? formatDate(filters.etaTo) : "…"}`,
      });
    return list;
  }, [filters]);

  const removeChip = (chip: Chip) => {
    if (chip.key === "scopeValue") setFilters({ scopeType: "project", scopeValue: null });
    else if (chip.key === "etaFrom") setFilters({ etaFrom: "", etaTo: "" });
    else setFilters({ [chip.key]: "all" } as Partial<RoadmapFilterState>);
  };

  const patch = (p: Partial<RoadmapFilterState>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Search roadmap…"
            className="h-9 rounded-full border bg-card pl-8 shadow-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-full bg-card shadow-sm"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {chips.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-brand-foreground">
              {chips.length}
            </span>
          )}
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.label}`}
              onClick={() => removeChip(c)}
              className="group flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium shadow-sm transition-colors hover:bg-muted"
            >
              {c.label}
              <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
            </button>
          ))}
          <button
            onClick={resetFilters}
            className="px-1.5 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Narrow the roadmap across all views.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            <Field label="Project Scope">
              <Select
                value={draft.scopeType}
                onValueChange={(v) => patch({ scopeType: v as ScopeType, scopeValue: null })}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SCOPE_LABELS) as ScopeType[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SCOPE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {draft.scopeType !== "project" && (
              <Field label={SCOPE_LABELS[draft.scopeType]}>
                <Select value={draft.scopeValue ?? ""} onValueChange={(v) => patch({ scopeValue: v })}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder={`Select ${SCOPE_LABELS[draft.scopeType]}`} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {scopeOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field label="Module">
              <FilterSelect
                value={draft.module}
                onChange={(v) => patch({ module: v })}
                allLabel="All Modules"
                options={Array.from(new Set(items.map((i) => i.module)))}
              />
            </Field>

            <Field label="Feature">
              <FilterSelect
                value={draft.scopeType === "feature" ? (draft.scopeValue ?? "all") : "all"}
                onChange={(v) => patch({ scopeType: v === "all" ? "project" : "feature", scopeValue: v === "all" ? null : v })}
                allLabel="All Features"
                options={Array.from(new Set(items.map((i) => i.feature)))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Sprint">
                <FilterSelect
                  value={draft.sprint}
                  onChange={(v) => patch({ sprint: v })}
                  allLabel="All Sprints"
                  options={sprints}
                />
              </Field>
            </div>

            <Field label="Priority">
              <FilterSelect
                value={draft.priority}
                onChange={(v) => patch({ priority: v })}
                allLabel="All Priorities"
                options={PRIORITIES}
              />
            </Field>

            <Field label="Business Status">
              <FilterSelect
                value={draft.businessStatus}
                onChange={(v) => patch({ businessStatus: v })}
                allLabel="All"
                options={BUSINESS_STATUSES}
              />
            </Field>

            <Field label="Dev Status">
              <FilterSelect
                value={draft.devStatus}
                onChange={(v) => patch({ devStatus: v })}
                allLabel="All"
                options={DEV_STATUSES}
              />
            </Field>

            <Field label="Delivery Status">
              <FilterSelect
                value={draft.deliveryStatus}
                onChange={(v) => patch({ deliveryStatus: v })}
                allLabel="All"
                options={DELIVERY_STATUSES}
              />
            </Field>

            <Field label="ETA Date Range">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={draft.etaFrom}
                  onChange={(e) => patch({ etaFrom: e.target.value })}
                  className="h-9"
                />
                <Input
                  type="date"
                  value={draft.etaTo}
                  onChange={(e) => patch({ etaTo: e.target.value })}
                  className="h-9"
                />
              </div>
            </Field>
          </div>

          <SheetFooter className="flex-row gap-2 border-t p-4">
            <Button variant="outline" className="flex-1" onClick={() => setDraft(DEFAULT_FILTERS)}>
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setFilters(draft);
                setOpen(false);
              }}
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoadmap } from "@/lib/roadmap/store";
import { MODULES, PIS, PRIORITIES, SPRINTS, type ScopeType } from "@/lib/roadmap/types";

const SCOPE_LABELS: Record<ScopeType, string> = {
  project: "Whole Project",
  module: "Module",
  feature: "Feature",
  sprint: "Sprint",
  pi: "PI",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function RoadmapFilters() {
  const { filters, setFilters, resetFilters, items } = useRoadmap();

  const scopeOptions =
    filters.scopeType === "module"
      ? Array.from(new Set(items.map((i) => i.module)))
      : filters.scopeType === "feature"
        ? Array.from(new Set(items.map((i) => i.feature)))
        : filters.scopeType === "sprint"
          ? Array.from(new Set(items.map((i) => i.sprint)))
          : filters.scopeType === "pi"
            ? Array.from(new Set(items.map((i) => i.pi)))
            : [];

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <Field label="View By">
        <Select
          value={filters.scopeType}
          onValueChange={(v) => setFilters({ scopeType: v as ScopeType, scopeValue: null })}
        >
          <SelectTrigger className="h-9 w-44">
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

      {filters.scopeType !== "project" && (
        <Field label={SCOPE_LABELS[filters.scopeType]}>
          <Select
            value={filters.scopeValue ?? ""}
            onValueChange={(v) => setFilters({ scopeValue: v })}
          >
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder={`Select ${SCOPE_LABELS[filters.scopeType]}`} />
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

      <Field label="PI">
        <Select value={filters.pi} onValueChange={(v) => setFilters({ pi: v })}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PIs</SelectItem>
            {PIS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Sprint">
        <Select value={filters.sprint} onValueChange={(v) => setFilters({ sprint: v })}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sprints</SelectItem>
            {SPRINTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Module">
        <Select value={filters.module} onValueChange={(v) => setFilters({ module: v })}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Priority">
        <Select value={filters.priority} onValueChange={(v) => setFilters({ priority: v })}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Status">
        <Select value={filters.status} onValueChange={(v) => setFilters({ status: v })}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["all", "Planned", "In Progress", "Completed", "Blocked", "Delayed"].map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Search roadmap…"
            className="h-9 w-56 pl-8"
          />
        </div>
      </Field>

      <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
        <X className="mr-1 h-4 w-4" /> Reset
      </Button>
    </div>
  );
}

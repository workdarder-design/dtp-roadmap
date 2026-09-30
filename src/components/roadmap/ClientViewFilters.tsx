import { Download, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["Planned", "In Progress", "Completed", "Delayed", "Blocked"] as const;

function FilterField({
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: readonly string[];
}) {
  const active = value !== "all";
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "h-7 w-full gap-1 rounded-md px-2 text-xs shadow-sm [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:opacity-60",
            active && "border-brand/40 ring-1 ring-brand/15",
          )}
        >
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent className="max-h-52 text-xs">
          <SelectItem value="all" className="py-1 pl-2 pr-7 text-xs">
            {allLabel}
          </SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="py-1 pl-2 pr-7 text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface ClientViewFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  module: string;
  onModuleChange: (v: string) => void;
  sprint: string;
  onSprintChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  moduleOptions: string[];
  sprintOptions: string[];
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
}

export function ClientViewFilters({
  search,
  onSearchChange,
  module,
  onModuleChange,
  sprint,
  onSprintChange,
  status,
  onStatusChange,
  moduleOptions,
  sprintOptions,
  filteredCount,
  totalCount,
  onReset,
  onExport,
  exportDisabled,
}: ClientViewFiltersProps) {
  const activeCount =
    (search.trim() ? 1 : 0) +
    (module !== "all" ? 1 : 0) +
    (sprint !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0);

  const chips: { label: string; onClear: () => void }[] = [];
  if (search.trim()) chips.push({ label: `Search: “${search.trim()}”`, onClear: () => onSearchChange("") });
  if (module !== "all") chips.push({ label: module, onClear: () => onModuleChange("all") });
  if (sprint !== "all") chips.push({ label: sprint, onClear: () => onSprintChange("all") });
  if (status !== "all") chips.push({ label: status, onClear: () => onStatusChange("all") });

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/25 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by feature, module, sprint, or ID…"
              className="h-10 rounded-full border bg-background pl-9 pr-9 shadow-sm"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">{filteredCount}</span>
              {totalCount !== filteredCount ? (
                <>
                  {" "}
                  of <span className="tabular-nums">{totalCount}</span>
                </>
              ) : null}{" "}
              items
              {activeCount > 0 ? (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-foreground">
                  {activeCount}
                </span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-full bg-background shadow-sm"
                disabled={activeCount === 0}
                onClick={onReset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1.5 rounded-full shadow-sm"
                disabled={exportDisabled}
                onClick={onExport}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 px-4 pb-3 pt-2">
        <div className="w-[128px] min-w-0 sm:w-[136px]">
          <FilterField
            label="Module"
            value={module}
            onChange={onModuleChange}
            allLabel="All modules"
            options={moduleOptions}
          />
        </div>
        <div className="w-[108px] min-w-0 sm:w-[116px]">
          <FilterField
            label="Sprint"
            value={sprint}
            onChange={onSprintChange}
            allLabel="All sprints"
            options={sprintOptions}
          />
        </div>
        <div className="w-[120px] min-w-0 sm:w-[128px]">
          <FilterField
            label="Status"
            value={status}
            onChange={onStatusChange}
            allLabel="All statuses"
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t bg-muted/15 px-4 py-2.5">
          <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Active</span>
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.onClear}
              className="group inline-flex max-w-[240px] items-center gap-1 truncate rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <span className="truncate">{c.label}</span>
              <X className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="px-1.5 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </section>
  );
}

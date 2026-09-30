import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Layers,
  Rocket,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, StateBadge, deliveryTone, priorityTone, businessTone, stateTone } from "./StatusBadge";
import { useRoadmap } from "@/lib/roadmap/store";
import type { RoadmapItem } from "@/lib/roadmap/types";
import {
  computeKpis,
  derivedState,
  formatDate,
  groupCount,
  isCompleted,
  isProductionReady,
  isStagingReady,
  todayISO,
} from "@/lib/roadmap/calculations";
import { clientRemark } from "@/lib/roadmap/share";
import { ClientWorkflowDiagram } from "./ClientWorkflowDiagram";
import { useProgramTheme } from "@/components/theme/ProgramThemeProvider";
import { ClientViewFilters } from "./ClientViewFilters";
import { cn } from "@/lib/utils";
import { ROADMAP_PRODUCT_NAME, clientRoadmapTitle } from "@/lib/brand";
import { CLIENT_LOGO_PATH, clientHeroGradient, clientHeroTextClass } from "@/lib/brand/clientView";

const deliveryEta = (i: RoadmapItem) => i.etaProduction ?? i.etaStaging;

type ClientColKey =
  | "id"
  | "module"
  | "feature"
  | "priority"
  | "sprint"
  | "etaStaging"
  | "etaProduction"
  | "businessStatus"
  | "deliveryStatus"
  | "notes";

const CLIENT_COLUMNS: { key: ClientColKey; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "module", label: "Module" },
  { key: "feature", label: "Feature" },
  { key: "priority", label: "Priority" },
  { key: "sprint", label: "Sprint" },
  { key: "etaStaging", label: "ETA Staging" },
  { key: "etaProduction", label: "ETA Production" },
  { key: "businessStatus", label: "Business Status" },
  { key: "deliveryStatus", label: "Delivery Status" },
  { key: "notes", label: "Notes" },
];

const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function clientSortValue(item: RoadmapItem, key: ClientColKey): string {
  if (key === "notes") return clientRemark(item.remarks);
  return String(item[key] ?? "");
}

function compareClientItems(a: RoadmapItem, b: RoadmapItem, key: ClientColKey, dir: "asc" | "desc") {
  const mul = dir === "asc" ? 1 : -1;
  if (key === "priority") {
    const ra = PRIORITY_RANK[a.priority] ?? 99;
    const rb = PRIORITY_RANK[b.priority] ?? 99;
    return (ra - rb) * mul;
  }
  const va = clientSortValue(a, key);
  const vb = clientSortValue(b, key);
  if (!va && !vb) return 0;
  if (!va) return 1;
  if (!vb) return -1;
  return va.localeCompare(vb, undefined, { numeric: true, sensitivity: "base" }) * mul;
}

const PALETTE_BASE = [
  "oklch(0.45 0.16 315)",
  "oklch(0.72 0.15 65)",
  "oklch(0.58 0.19 25)",
  "oklch(0.55 0.1 300)",
  "oklch(0.62 0.03 250)",
];

const barTone: Record<string, string> = {
  Completed: "bg-status-done/15 border-status-done/40",
  "In Progress": "bg-status-progress/15 border-status-progress/40",
  Blocked: "bg-status-blocked/15 border-status-blocked/40",
  Delayed: "bg-status-delayed/20 border-status-delayed/45",
  Planned: "bg-status-planned/12 border-status-planned/35",
};

export function ClientRoadmapView({ clientName }: { clientName?: string } = {}) {
  const { items, loading, error, refresh, hydrated, modules, sprints } = useRoadmap();
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [sprint, setSprint] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<{ key: ClientColKey; dir: "asc" | "desc" } | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (module !== "all" && i.module !== module) return false;
        if (sprint !== "all" && i.sprint !== sprint) return false;
        if (status !== "all" && derivedState(i) !== status) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const hay = [i.id, i.module, i.feature, i.sprint, i.deliveryStatus, i.businessStatus]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [items, module, sprint, status, search],
  );

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => compareClientItems(a, b, sort.key, sort.dir));
  }, [filtered, sort]);

  const k = computeKpis(filtered);
  const today = todayISO();

  const upcoming = useMemo(
    () =>
      filtered
        .filter((i) => !isCompleted(i) && deliveryEta(i))
        .sort((a, b) => (deliveryEta(a) as string).localeCompare(deliveryEta(b) as string)),
    [filtered],
  );
  const completed = useMemo(
    () =>
      filtered
        .filter(isCompleted)
        .sort((a, b) => (deliveryEta(b) ?? "").localeCompare(deliveryEta(a) ?? "")),
    [filtered],
  );
  const next = upcoming.find((i) => (deliveryEta(i) as string) >= today) ?? upcoming[0] ?? null;

  const readyForUat = useMemo(
    () =>
      filtered
        .filter((i) => i.deliveryStatus === "Ready for UAT" || i.deliveryStatus === "UAT")
        .sort((a, b) => (deliveryEta(a) ?? "9999").localeCompare(deliveryEta(b) ?? "9999")),
    [filtered],
  );


  const kpis = [
    { label: "Total Items", value: k.total, icon: Layers, tone: "text-foreground" },
    { label: "Completed", value: k.completed, icon: CheckCircle2, tone: "text-status-done" },
    { label: "In Progress", value: k.inProgress, icon: Timer, tone: "text-status-progress" },
    {
      label: "Next Delivery",
      value: next ? formatDate(deliveryEta(next)) : "—",
      icon: Rocket,
      tone: "text-brand",
    },
    { label: "Upcoming Deliveries", value: upcoming.length, icon: CalendarDays, tone: "text-foreground" },
    { label: "Production Ready", value: k.productionReady, icon: Clock, tone: "text-foreground" },
  ];

  const sprintsUsed = sprints.filter((s) => filtered.some((i) => i.sprint === s));
  const modulesUsed = Array.from(new Set(filtered.map((i) => i.module)));
  const cols = sprintsUsed.length ? sprintsUsed : sprints;

  const moduleFilterOptions = useMemo(() => {
    const inData = new Set(items.map((i) => i.module));
    return modules.filter((m) => inData.has(m));
  }, [items, modules]);

  const sprintFilterOptions = useMemo(() => {
    const inData = new Set(items.map((i) => i.sprint));
    return sprints.filter((s) => inData.has(s));
  }, [items, sprints]);

  const resetClientFilters = () => {
    setSearch("");
    setModule("all");
    setSprint("all");
    setStatus("all");
  };

  const exportTitle = clientRoadmapTitle(clientName);

  const exportExcel = async () => {
    if (!filtered.length) {
      toast.error("No items to export for the current filters.");
      return;
    }
    try {
      const { exportClientRoadmapExcel } = await import("@/lib/roadmap/exportClientExcel");
      await exportClientRoadmapExcel({
        title: exportTitle,
        items: filtered,
        clientName,
        filters: { search, module, sprint, status },
      });
      toast.success("Excel file downloaded");
    } catch {
      toast.error("Could not export Excel file");
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <p className="text-sm text-muted-foreground">Loading roadmap…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">Roadmap unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={CLIENT_LOGO_PATH}
              alt="Dubai Culture — دبي للثقافة"
              className="h-8 w-auto max-w-[120px] object-contain object-left"
            />
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                {ROADMAP_PRODUCT_NAME}
              </h1>
              <p className="text-xs text-muted-foreground">
                {clientName ? `Client view · ${clientName}` : "Client view · SAFe"}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Pill variant="planned">Read-only</Pill>
            <Pill variant="done">Live · updates automatically</Pill>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-5 px-6 py-6">
        {/* Project overview — gradient hero card */}
        <section
          className={cn("overflow-hidden rounded-2xl p-6 shadow-md", clientHeroTextClass)}
          style={{ backgroundImage: clientHeroGradient() }}
        >
          <div>
            <Pill className="border-white/30 bg-white/15 text-white">SAFe Program Train</Pill>
            <h2 className="mt-3 text-xl font-semibold">Project Overview</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/85">
              Delivery roadmap for the DTP program, planned across {sprintsUsed.length || sprints.length}{" "}
              sprints and {modulesUsed.length} modules. This page shows scope, delivery dates for staging
              and production, and current progress.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {modulesUsed.map((m) => (
                <Pill key={m} className="border-white/25 bg-white/10 text-white">
                  {m}
                </Pill>
              ))}
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <c.icon className="h-4 w-4 text-muted-foreground" />
              <div className={cn("mt-2 text-2xl font-semibold tabular-nums", c.tone)}>{c.value}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </section>

        <ClientViewFilters
          search={search}
          onSearchChange={setSearch}
          module={module}
          onModuleChange={setModule}
          sprint={sprint}
          onSprintChange={setSprint}
          status={status}
          onStatusChange={setStatus}
          moduleOptions={moduleFilterOptions}
          sprintOptions={sprintFilterOptions}
          filteredCount={filtered.length}
          totalCount={items.length}
          onReset={resetClientFilters}
          onExport={() => void exportExcel()}
          exportDisabled={!filtered.length}
        />

        {/* Tabs */}
        <Tabs defaultValue="roadmap" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="train">SAFe Train</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Roadmap table */}
          <TabsContent value="roadmap">
            <section className="rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-base font-semibold">Roadmap</h2>
                <span className="text-xs text-muted-foreground">{filtered.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {CLIENT_COLUMNS.map((col) => {
                        const activeDir = sort?.key === col.key ? sort.dir : null;
                        return (
                          <th
                            key={col.key}
                            className="group whitespace-nowrap px-3 py-2.5 text-left font-semibold"
                            aria-sort={activeDir === "asc" ? "ascending" : activeDir === "desc" ? "descending" : "none"}
                          >
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-foreground"
                              onClick={() =>
                                setSort((current) =>
                                  current?.key === col.key
                                    ? { key: col.key, dir: current.dir === "asc" ? "desc" : "asc" }
                                    : { key: col.key, dir: "asc" },
                                )
                              }
                            >
                              {col.label}
                              {activeDir === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : activeDir === "desc" ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ChevronsUpDown className="h-3 w-3 opacity-40 group-hover:opacity-80" />
                              )}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((i) => (
                      <tr key={i.id} className="border-t transition-colors hover:bg-surface/60">
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">{i.id}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">{i.module}</td>
                        <td className="px-3 py-2.5 font-medium">{i.feature}</td>
                        <td className="px-3 py-2.5">
                          <Pill variant={priorityTone(i.priority)}>{i.priority}</Pill>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">{i.sprint}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatDate(i.etaStaging) || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatDate(i.etaProduction) || "—"}</td>
                        <td className="px-3 py-2.5">
                          <Pill variant={businessTone(i.businessStatus)}>{i.businessStatus || "—"}</Pill>
                        </td>
                        <td className="px-3 py-2.5">
                          <Pill variant={deliveryTone(i.deliveryStatus)}>{i.deliveryStatus || "Pending"}</Pill>
                        </td>
                        <td className="max-w-[260px] px-3 py-2.5 text-muted-foreground">{clientRemark(i.remarks)}</td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr>
                        <td colSpan={10} className="px-3 py-10 text-center text-sm text-muted-foreground">
                          No items match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          {/* SAFe program train */}
          <TabsContent value="train">
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">SAFe Program Train</h2>
              <p className="text-xs text-muted-foreground">Lanes by module</p>
              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[900px]">
                  <div
                    className="grid gap-2 border-b pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    style={{ gridTemplateColumns: `180px repeat(${cols.length}, minmax(0,1fr))` }}
                  >
                    <div />
                    {cols.map((s) => (
                      <div key={s}>{s}</div>
                    ))}
                  </div>
                  {modulesUsed.map((m) => (
                    <div key={m} className="border-b py-3 last:border-b-0">
                      <div
                        className="grid items-center gap-2"
                        style={{ gridTemplateColumns: `180px repeat(${cols.length}, minmax(0,1fr))` }}
                      >
                        <div className="pr-2 text-sm font-semibold leading-tight">{m}</div>
                        {cols.map((s) => (
                          <div key={s} className="h-1 rounded bg-surface" />
                        ))}
                      </div>
                      <div className="mt-1 space-y-1.5">
                        {filtered
                          .filter((i) => i.module === m)
                          .map((i) => {
                            const idx = Math.max(0, cols.indexOf(i.sprint));
                            return (
                              <div
                                key={i.id}
                                className="grid gap-2"
                                style={{ gridTemplateColumns: `180px repeat(${cols.length}, minmax(0,1fr))` }}
                              >
                                <div />
                                <div style={{ gridColumnStart: idx + 2 }}>
                                  <div
                                    className={cn(
                                      "truncate rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition-transform hover:scale-[1.02]",
                                      barTone[derivedState(i)],
                                    )}
                                    title={`${i.feature} · ${i.sprint}`}
                                  >
                                    {i.feature}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </TabsContent>

          {/* Deliveries */}
          <TabsContent value="deliveries" className="space-y-4">
            {/* Next delivery */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Next Delivery</h2>
              {next ? (
                <div className="mt-4 grid gap-4 rounded-xl border border-brand/30 bg-brand/5 p-5 md:grid-cols-5">
                  <Field label="Feature" value={next.feature} strong />
                  <Field label="Module" value={next.module} />
                  <Field label="Sprint" value={next.sprint} />
                  <Field label="ETA" value={formatDate(deliveryEta(next)) || "—"} strong />
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Delivery Status
                    </div>
                    <div className="mt-1.5">
                      <Pill variant={deliveryTone(next.deliveryStatus)}>
                        {next.deliveryStatus || "Pending"}
                      </Pill>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No upcoming delivery in this scope.</p>
              )}
            </section>

            {/* Delivery timeline */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Delivery Timeline</h2>
              <p className="text-xs text-muted-foreground">Upcoming and completed deliveries</p>
              <div className="mt-5 overflow-x-auto pb-2">
                <div className="flex min-w-max items-stretch gap-4">
                  {cols.map((s) => {
                    const sprintItems = filtered.filter((i) => i.sprint === s);
                    const done = sprintItems.filter(isCompleted).length;
                    return (
                      <div key={s} className="w-64 shrink-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full ring-4",
                              done === sprintItems.length && sprintItems.length
                                ? "bg-status-done ring-status-done/20"
                                : "bg-brand ring-brand/15",
                            )}
                          />
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="mt-2 text-sm font-semibold">{s}</div>
                        <div className="text-xs text-muted-foreground">
                          {done}/{sprintItems.length} delivered
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {sprintItems.map((i) => (
                            <div
                              key={i.id}
                              className={cn(
                                "truncate rounded-md border px-2 py-1 text-xs font-medium transition-transform hover:scale-[1.02]",
                                barTone[derivedState(i)],
                              )}
                              title={`${i.feature} · ${formatDate(deliveryEta(i))}`}
                            >
                              {i.feature}
                            </div>
                          ))}
                          {!sprintItems.length && (
                            <div className="rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
                              No items
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Upcoming / Completed / Status */}
            <section className="grid gap-4 lg:grid-cols-3">
              <DeliveryList
                title="Upcoming Deliveries"
                empty="Nothing scheduled ahead."
                items={upcoming.slice(0, 8)}
              />
              <DeliveryList
                title="Completed Deliveries"
                empty="No deliveries completed yet."
                items={completed.slice(0, 8)}
              />
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Ready for UAT</h3>
                  <Pill variant="progress">{readyForUat.length}</Pill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Features available for client acceptance testing
                </p>
                <div className="mt-4 space-y-2">
                  {readyForUat.slice(0, 8).map((i) => (
                    <div key={i.id} className="rounded-xl border bg-surface p-3">
                      <div className="truncate text-sm font-medium" title={i.feature}>
                        {i.feature}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {i.module} · {i.sprint}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Pill variant={deliveryTone(i.deliveryStatus)}>
                          {i.deliveryStatus || "Ready for UAT"}
                        </Pill>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatDate(deliveryEta(i)) || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!readyForUat.length && (
                    <p className="text-sm text-muted-foreground">No features are ready for UAT yet.</p>
                  )}
                  {readyForUat.length > 8 && (
                    <p className="text-xs text-muted-foreground">
                      +{readyForUat.length - 8} more ready for UAT
                    </p>
                  )}
                </div>
              </div>

            </section>

            {/* Staging & production ETA */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Staging &amp; Production ETA</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {["Feature", "Module", "Sprint", "ETA Staging", "ETA Production", "State"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered
                      .filter((i) => i.etaStaging || i.etaProduction)
                      .sort((a, b) => (deliveryEta(a) ?? "").localeCompare(deliveryEta(b) ?? ""))
                      .map((i) => (
                        <tr key={i.id} className="border-t transition-colors hover:bg-surface/60">
                          <td className="px-3 py-2.5 font-medium">{i.feature}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{i.module}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{i.sprint}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatDate(i.etaStaging) || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatDate(i.etaProduction) || "—"}</td>
                          <td className="px-3 py-2.5">
                            <StateBadge state={derivedState(i)} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights">
            <InsightsPanel items={filtered} />
          </TabsContent>

          <TabsContent value="workflow">
            <ClientWorkflowDiagram items={filtered} />
          </TabsContent>
        </Tabs>

        <footer className="space-y-1 pb-8 text-center text-xs text-muted-foreground">
          <p>Shared read-only view · {ROADMAP_PRODUCT_NAME}</p>
          <p>
            Administrator?{" "}
            <Link to="/login" className="underline underline-offset-2">
              Admin sign in
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

function InsightsPanel({ items }: { items: RoadmapItem[] }) {
  const { statusDoneColor } = useProgramTheme();
  const palette = useMemo(
    () => [PALETTE_BASE[0]!, statusDoneColor, ...PALETTE_BASE.slice(1)],
    [statusDoneColor],
  );
  const k = computeKpis(items);
  const byModule = groupCount(items, (i) => i.module);
  const byBusiness = groupCount(items, (i) => i.businessStatus || "Unset");
  const byPriority = groupCount(items, (i) => i.priority);
  const byDelivery = groupCount(items, (i) => i.deliveryStatus || "Pending");
  const bySprint = groupCount(items, (i) => i.sprint).sort((a, b) => a.name.localeCompare(b.name));
  const readiness = [
    { name: "Staging Ready", value: items.filter(isStagingReady).length },
    { name: "Production Ready", value: items.filter(isProductionReady).length },
    { name: "Not Ready", value: items.filter((i) => !isStagingReady(i) && !isProductionReady(i)).length },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Roadmap Completion" subtitle="Across the current scope">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold tabular-nums">{k.completionPct}%</span>
          <span className="pb-1.5 text-xs text-muted-foreground">
            {k.completed} of {k.total} items
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-status-done transition-all"
            style={{ width: `${k.completionPct}%` }}
          />
        </div>
      </Panel>

      <Panel title="Items by Module">
        <Donut data={byModule} palette={palette} />
      </Panel>

      <Panel title="Delivery Status">
        <Donut data={byDelivery} palette={palette} />
      </Panel>

      <Panel title="Business Status" subtitle="Distribution across the intake pipeline">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byBusiness} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis type="category" dataKey="name" width={110} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill={palette[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Priority Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byPriority}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {byPriority.map((d, idx) => (
                <Cell key={d.name} fill={palette[idx % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Sprint Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bySprint}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill={palette[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Staging vs Production Readiness">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={readiness}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill={palette[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Status Mix" subtitle="Roadmap health at a glance">
        <div className="flex flex-wrap gap-2">
          {groupCount(items, (i) => derivedState(i)).map((d) => (
            <Pill key={d.name} variant={stateTone(d.name as never)}>
              {d.name}: {d.value}
            </Pill>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <header className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Donut({ data, palette }: { data: { name: string; value: number }[]; palette: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1.5 text-sm", strong && "font-semibold")}>{value}</div>
    </div>
  );
}

function DeliveryList({
  title,
  items,
  empty,
}: {
  title: string;
  items: RoadmapItem[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((i) => (
          <div key={i.id} className="rounded-xl border bg-surface/60 p-3 transition-shadow hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{i.feature}</div>
                <div className="text-xs text-muted-foreground">
                  {i.module} · {i.sprint}
                </div>
              </div>
              <Pill variant={stateTone(derivedState(i))}>{formatDate(deliveryEta(i)) || "—"}</Pill>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}

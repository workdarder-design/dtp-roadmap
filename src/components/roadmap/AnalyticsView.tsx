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
import { useRoadmap } from "@/lib/roadmap/store";
import {
  computeKpis,
  derivedState,
  formatDate,
  groupCount,
  isDelayed,
  isStagingReady,
  isProductionReady,
} from "@/lib/roadmap/calculations";
import { Progress } from "@/components/ui/progress";
import { Pill, priorityTone, stateTone } from "./StatusBadge";

const PALETTE = [
  "oklch(0.52 0.11 232)",
  "oklch(0.6 0.12 155)",
  "oklch(0.72 0.15 65)",
  "oklch(0.58 0.19 25)",
  "oklch(0.55 0.1 300)",
  "oklch(0.62 0.03 250)",
];

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <header className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

export function AnalyticsView() {
  const { filtered } = useRoadmap();
  const kpi = computeKpis(filtered);

  const byModule = groupCount(filtered, (i) => i.module);
  const byDev = groupCount(filtered, (i) => i.devStatus || "Unset");
  const byBusiness = groupCount(filtered, (i) => i.businessStatus || "Unset");
  const byPriority = groupCount(filtered, (i) => i.priority);
  const byDelivery = groupCount(filtered, (i) => i.deliveryStatus || "Unset");
  const bySprint = groupCount(filtered, (i) => i.sprint).sort((a, b) => a.name.localeCompare(b.name));
  const upcoming = filtered
    .filter((i) => i.etaStaging || i.etaProduction)
    .sort((a, b) => (a.etaProduction ?? a.etaStaging ?? "").localeCompare(b.etaProduction ?? b.etaStaging ?? ""))
    .slice(0, 6);
  const delayed = filtered.filter(isDelayed).slice(0, 6);
  const readiness = [
    { name: "Staging Ready", value: filtered.filter(isStagingReady).length },
    { name: "Production Ready", value: filtered.filter(isProductionReady).length },
    { name: "Not Ready", value: filtered.filter((i) => !isStagingReady(i) && !isProductionReady(i)).length },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Roadmap Completion" subtitle="Completed items across current scope">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold tabular-nums">{kpi.completionPct}%</span>
          <span className="pb-1.5 text-xs text-muted-foreground">
            {kpi.completed} of {kpi.total} items
          </span>
        </div>
        <Progress value={kpi.completionPct} className="mt-3" />
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <Stat label="In Progress" value={kpi.inProgress} />
          <Stat label="Blocked" value={kpi.blocked} />
          <Stat label="Delayed" value={kpi.delayed} />
          <Stat label="Pending Client" value={kpi.pendingClient} />
        </div>
      </Panel>

      <Panel title="Items by Module">
        <Donut data={byModule} />
      </Panel>

      <Panel title="Development Status">
        <Donut data={byDev} />
      </Panel>

      <Panel title="Business Status" subtitle="Distribution across the intake pipeline">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byBusiness} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis type="category" dataKey="name" width={110} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
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
                <Cell key={d.name} fill={PALETTE[idx % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Delivery Status">
        <Donut data={byDelivery} />
      </Panel>

      <Panel title="Sprint Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bySprint}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill={PALETTE[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Upcoming Deliveries" subtitle="Nearest staging / production dates">
        <ul className="space-y-2">
          {upcoming.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-mono text-muted-foreground">{i.id}</span> {i.feature}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatDate(i.etaProduction ?? i.etaStaging)}
              </span>
            </li>
          ))}
          {upcoming.length === 0 && <p className="text-xs text-muted-foreground">No dated items in scope.</p>}
        </ul>
      </Panel>

      <Panel title="Delayed Items" subtitle="Past ETA and not completed">
        <ul className="space-y-2">
          {delayed.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-mono text-muted-foreground">{i.id}</span> {i.feature}
              </span>
              <Pill variant={priorityTone(i.priority)}>{i.priority}</Pill>
            </li>
          ))}
          {delayed.length === 0 && <p className="text-xs text-muted-foreground">Nothing delayed. </p>}
        </ul>
      </Panel>

      <Panel title="Staging vs Production Readiness">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={readiness}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill={PALETTE[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Status Mix" subtitle="Derived roadmap health">
        <div className="flex flex-wrap gap-2">
          {groupCount(filtered, (i) => derivedState(i)).map((d) => (
            <Pill key={d.name} variant={stateTone(d.name as never)}>
              {d.name}: {d.value}
            </Pill>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

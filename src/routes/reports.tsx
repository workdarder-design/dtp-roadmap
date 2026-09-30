import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useRoadmap } from "@/lib/roadmap/store";
import { computeKpis, derivedState, formatDate } from "@/lib/roadmap/calculations";
import { StateBadge } from "@/components/roadmap/StatusBadge";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — DTP— Roadmap" },
      { name: "description", content: "Status reports and exports for the DTP SAFe program roadmap." },
      { property: "og:title", content: "Reports — DTP— Roadmap" },
      { property: "og:description", content: "Export and review roadmap status across sprints and modules." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  );
}

function Body() {
  const { filtered } = useRoadmap();
  const k = computeKpis(filtered);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dcaa-roadmap-report.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Status Report</h2>
          <p className="text-sm text-muted-foreground">
            {k.total} items · {k.completionPct}% complete · {k.delayed} delayed
          </p>
        </div>
        <Button variant="outline" onClick={exportJson}>
          <Download className="mr-1.5 h-4 w-4" /> Export
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2">Feature</th>
              <th className="px-3 py-2">Sprint</th>
              <th className="px-3 py-2">Staging</th>
              <th className="px-3 py-2">Production</th>
              <th className="px-3 py-2">State</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i.id}</td>
                <td className="px-3 py-2">{i.module}</td>
                <td className="px-3 py-2">{i.feature}</td>
                <td className="px-3 py-2">{i.sprint}</td>
                <td className="px-3 py-2 tabular-nums">{formatDate(i.etaStaging) || "—"}</td>
                <td className="px-3 py-2 tabular-nums">{formatDate(i.etaProduction) || "—"}</td>
                <td className="px-3 py-2">
                  <StateBadge state={derivedState(i)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

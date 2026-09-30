import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsView } from "@/components/roadmap/AnalyticsView";
import { RoadmapKpis } from "@/components/roadmap/RoadmapKpis";
import { RoadmapFilters } from "@/components/roadmap/RoadmapFilters";
import { useRoadmap } from "@/lib/roadmap/store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — DTP— Roadmap" },
      { name: "description", content: "Completion, delivery readiness and status analytics for the DTP SAFe roadmap." },
      { property: "og:title", content: "Analytics — DTP— Roadmap" },
      { property: "og:description", content: "Roadmap completion, module mix, delays and delivery readiness." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  );
}

function Body() {
  const { filtered } = useRoadmap();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Program Analytics</h2>
        <p className="text-sm text-muted-foreground">Metrics recalculate with the selected scope</p>
      </div>
      <RoadmapKpis items={filtered} />
      <RoadmapFilters />
      <AnalyticsView />
    </div>
  );
}

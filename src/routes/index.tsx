import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RoadmapKpis } from "@/components/roadmap/RoadmapKpis";
import { RoadmapFilters } from "@/components/roadmap/RoadmapFilters";
import { RoadmapTable } from "@/components/roadmap/RoadmapTable";
import { SafeTrainView } from "@/components/roadmap/SafeTrainView";
import { TimelineView } from "@/components/roadmap/TimelineView";
import { KanbanView } from "@/components/roadmap/KanbanView";
import { AnalyticsView } from "@/components/roadmap/AnalyticsView";
import { RoadmapItemModal } from "@/components/roadmap/RoadmapItemModal";
import { ShareRoadmapDialog } from "@/components/roadmap/ShareRoadmapDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRoadmap } from "@/lib/roadmap/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roadmap — DCAA Project Roadmap" },
      {
        name: "description",
        content:
          "SAFe program roadmap for DCAA: table, program train, timeline, kanban and analytics in one screen.",
      },
      { property: "og:title", content: "Roadmap — DCAA Project Roadmap" },
      {
        property: "og:description",
        content: "Manage the DCAA SAFe roadmap: features, sprints, statuses and delivery dates.",
      },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  return (
    <AppShell>
      <RoadmapWorkspace />
    </AppShell>
  );
}

function RoadmapWorkspace() {
  const { filtered, isAdmin } = useRoadmap();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">Program Roadmap</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} items in current scope
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareRoadmapDialog />
          <Button onClick={() => setAddOpen(true)} disabled={!isAdmin}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Roadmap Item
          </Button>
        </div>
      </div>

      <RoadmapKpis items={filtered} />
      <RoadmapFilters />

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="train">SAFe Train</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <RoadmapTable />
        </TabsContent>
        <TabsContent value="train">
          <SafeTrainView />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineView />
        </TabsContent>
        <TabsContent value="kanban">
          <KanbanView />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsView />
        </TabsContent>
      </Tabs>

      <RoadmapItemModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

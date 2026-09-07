import { createFileRoute } from "@tanstack/react-router";
import { ClientRoadmapView } from "@/components/roadmap/ClientRoadmapView";

export const Route = createFileRoute("/share/$token")({
  head: () => ({
    meta: [
      { title: "Client Roadmap — DCAA Project Roadmap" },
      {
        name: "description",
        content:
          "Read-only client view of the DCAA SAFe roadmap: deliveries, sprints, staging and production ETAs.",
      },
      { property: "og:title", content: "Client Roadmap — DCAA Project Roadmap" },
      {
        property: "og:description",
        content: "Live, read-only roadmap shared with the client: next delivery, timeline and progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientSharePage,
});

function ClientSharePage() {
  return <ClientRoadmapView />;
}

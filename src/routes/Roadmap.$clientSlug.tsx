import { createFileRoute } from "@tanstack/react-router";
import { ClientRoadmapView } from "@/components/roadmap/ClientRoadmapView";
import { findConsultationBySlug } from "@/lib/roadmap/consultations";
import { ROADMAP_PRODUCT_NAME } from "@/lib/brand";

export const Route = createFileRoute("/Roadmap/$clientSlug")({
  head: () => {
    return {
      meta: [
        { title: ROADMAP_PRODUCT_NAME },
        {
          name: "description",
          content:
            "Read-only client view of the DTP SAFe roadmap: deliveries, sprints, staging and production ETAs.",
        },
        { property: "og:title", content: ROADMAP_PRODUCT_NAME },
        {
          property: "og:description",
          content: "Live, read-only roadmap shared with the client: next delivery, timeline and progress.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ConsultationClientPage,
});

function ConsultationClientPage() {
  const { clientSlug } = Route.useParams();
  const consultation = findConsultationBySlug(clientSlug);

  if (!consultation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">Consultation not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No client roadmap is available for this link. Ask your administrator for an updated
            share link.
          </p>
        </div>
      </div>
    );
  }

  return <ClientRoadmapView clientName={consultation.clientName} />;
}

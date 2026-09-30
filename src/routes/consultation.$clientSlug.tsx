import { createFileRoute } from "@tanstack/react-router";
import { ClientRoadmapView } from "@/components/roadmap/ClientRoadmapView";
import { useConsultationBySlug } from "@/hooks/useConsultations";
import { ROADMAP_PRODUCT_NAME } from "@/lib/brand";

export const Route = createFileRoute("/consultation/$clientSlug")({
  head: () => ({
    meta: [
      { title: ROADMAP_PRODUCT_NAME },
      {
        name: "description",
        content:
          "Read-only client view of the DTP SAFe roadmap: deliveries, sprints, staging and production ETAs.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsultationClientPage,
});

function ConsultationClientPage() {
  const { clientSlug } = Route.useParams();
  const { consultation, loading, error } = useConsultationBySlug(clientSlug);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading roadmap…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">Could not load consultation</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">Consultation not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No client roadmap is available for this link. Ask your administrator for an updated share
            link.
          </p>
        </div>
      </div>
    );
  }

  return <ClientRoadmapView clientName={consultation.clientName} />;
}

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientRoadmapView } from "@/components/roadmap/ClientRoadmapView";
import { validateShareToken } from "@/lib/services/appSettings";

export const Route = createFileRoute("/share/$token")({
  head: () => ({
    meta: [
      { title: "Client Roadmap — DTP— Roadmap" },
      {
        name: "description",
        content:
          "Read-only client view of the DTP SAFe roadmap: deliveries, sprints, staging and production ETAs.",
      },
      { property: "og:title", content: "Client Roadmap — DTP— Roadmap" },
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
  const { token } = Route.useParams();
  const [state, setState] = useState<"loading" | "valid" | "invalid" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    validateShareToken(token)
      .then((valid) => {
        if (!cancelled) setState(valid ? "valid" : "invalid");
      })
      .catch((err) => {
        if (!cancelled) {
          setState("error");
          setErrorMessage(err instanceof Error ? err.message : "Could not validate share link");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading shared roadmap…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">Share link unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">Invalid or expired link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This share link is not valid. Ask your administrator for a new client link.
          </p>
        </div>
      </div>
    );
  }

  return <ClientRoadmapView />;
}

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Rocket, CalendarCheck2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRoadmap } from "@/lib/roadmap/store";
import { formatDate } from "@/lib/roadmap/calculations";
import {
  allReleaseNotesMarkdown,
  buildReleaseNotes,
  releaseNoteMarkdown,
} from "@/lib/roadmap/releaseNotes";

export const Route = createFileRoute("/release-notes")({
  head: () => ({
    meta: [
      { title: "Release Notes — DCAA Project Roadmap" },
      {
        name: "description",
        content: "Automatically generated release notes for every completed DCAA sprint, grouped by module and feature.",
      },
      { property: "og:title", content: "Release Notes — DCAA Project Roadmap" },
      { property: "og:description", content: "Sprint-by-sprint delivery history with UAT dates and delivered features." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReleaseNotesPage,
});

function ReleaseNotesPage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  );
}

function Body() {
  const { items } = useRoadmap();
  const [q, setQ] = useState("");

  const notes = useMemo(() => buildReleaseNotes(items), [items]);
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return notes;
    return notes.filter(
      (n) =>
        n.sprint.name.toLowerCase().includes(s) ||
        n.modules.some(
          (m) =>
            m.module.toLowerCase().includes(s) ||
            m.features.some((f) => f.feature.toLowerCase().includes(s)),
        ),
    );
  }, [notes, q]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const downloadAll = () => {
    const blob = new Blob([allReleaseNotesMarkdown(notes)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dcaa-release-notes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDelivered = notes.reduce((n, r) => n + r.delivered.length, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-primary/90 to-teal-500/80 p-5 text-primary-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Rocket className="h-5 w-5" /> Release Notes
            </h2>
            <p className="mt-1 text-sm opacity-90">
              {notes.length} completed sprint{notes.length === 1 ? "" : "s"} · {totalDelivered} delivered features
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => copy(allReleaseNotesMarkdown(notes), "All release notes")}>
              <Copy className="mr-1.5 h-4 w-4" /> Copy all
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadAll}>
              <Download className="mr-1.5 h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search sprint, module or feature…"
        className="max-w-sm"
      />

      {!visible.length && (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No past sprints yet — release notes appear once a sprint end date has passed.
        </div>
      )}

      <div className="space-y-4">
        {visible.map((n) => (
          <article key={n.sprint.name} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{n.sprint.name}</h3>
                  <Badge variant="secondary">{n.version}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(n.sprint.start)} – {formatDate(n.sprint.end)} · UAT {formatDate(n.sprint.uat)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {n.delivered.length} delivered · {n.modules.length} modules
                </span>
                <Button variant="outline" size="sm" onClick={() => copy(releaseNoteMarkdown(n), n.sprint.name)}>
                  <Copy className="mr-1.5 h-4 w-4" /> Copy
                </Button>
              </div>
            </header>

            <div className="space-y-4 p-4">
              {n.modules.length ? (
                n.modules.map((m) => (
                  <div key={m.module}>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.module}</h4>
                    <ul className="mt-1.5 space-y-1.5">
                      {m.features.map((f) => (
                        <li key={f.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <CalendarCheck2 className="h-3.5 w-3.5 text-primary" />
                          <span>{f.feature}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {f.deliveryStatus || f.businessStatus}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No features reached Production or Completed in this sprint.
                </p>
              )}

              {n.pending.length > 0 && (
                <div className="rounded-lg border border-dashed p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carried over</h4>
                  <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                    {n.pending.map((p) => (
                      <li key={p.id}>
                        {p.module} · {p.feature} — {p.deliveryStatus || p.businessStatus}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

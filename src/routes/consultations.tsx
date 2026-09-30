import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { consultationShareUrl, type Consultation } from "@/lib/roadmap/consultations";
import { useConsultations } from "@/hooks/useConsultations";
import { toast } from "sonner";

export const Route = createFileRoute("/consultations")({
  head: () => ({
    meta: [
      { title: "Consultations — DTP— Roadmap" },
      {
        name: "description",
        content: "Admin view of client consultations and shareable roadmap links.",
      },
    ],
  }),
  component: ConsultationsPage,
});

function ConsultationsPage() {
  return (
    <AppShell>
      <ConsultationsBody />
    </AppShell>
  );
}

function ConsultationsBody() {
  const { items, loading, error, refresh, create, remove } = useConsultations();
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const slugCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of items) {
      counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await create({ clientName, notes });
      toast.success(`Consultation created for ${created.clientName}`);
      setClientName("");
      setNotes("");
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create consultation");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async (c: Consultation) => {
    const url = consultationShareUrl(c.slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(c.id);
      toast.success("Client link copied");
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading consultations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button variant="outline" className="mt-3" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">Consultations</h2>
          <p className="text-sm text-muted-foreground">
            Client roadmap shares — links use the client name only
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> New Consultation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={(e) => void onCreate(e)}>
              <DialogHeader>
                <DialogTitle>New consultation</DialogTitle>
                <DialogDescription>
                  The client share link will be based on the client name (e.g.
                  /consultation/ahmed-mohamed).
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ahmed Mohamed"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal note"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-16 text-center shadow-sm">
          <Users className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No consultations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one to generate a client-name share link.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Client Name</th>
                  <th className="px-4 py-3 font-semibold">Share link</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const url = consultationShareUrl(c.slug);
                  const path = `/consultation/${c.slug}`;
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.clientName}</div>
                        {(slugCounts.get(c.slug) ?? 0) > 1 ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Shared slug — client link shows the most recently updated record
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{path}</code>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {c.notes || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void copyLink(c)}
                            title="Copy client link"
                          >
                            {copiedId === c.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" asChild title="Open client view">
                            <a href={url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => {
                              void remove(c.id)
                                .then(() => refresh())
                                .then(() => toast.success("Consultation removed"))
                                .catch((err) =>
                                  toast.error(
                                    err instanceof Error ? err.message : "Could not delete consultation",
                                  ),
                                );
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Duplicate client names reuse the same slug; the most recently updated consultation is shown on
        the client link. Internal IDs are never included in the URL.{" "}
        <Link to="/" className="underline underline-offset-2">
          Back to roadmap
        </Link>
      </p>
    </div>
  );
}

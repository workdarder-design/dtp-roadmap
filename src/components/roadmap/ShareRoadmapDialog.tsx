import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Share2, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { consultationShareUrl } from "@/lib/roadmap/consultations";
import { useConsultations } from "@/hooks/useConsultations";
import { toast } from "sonner";

export function ShareRoadmapDialog() {
  const [open, setOpen] = useState(false);
  const { items: consultations, refresh, create, loading } = useConsultations();
  const [selectedId, setSelectedId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!selectedId && consultations[0]) setSelectedId(consultations[0].id);
  }, [consultations, selectedId]);

  const selected = useMemo(
    () => consultations.find((c) => c.id === selectedId) ?? null,
    [consultations, selectedId],
  );

  /** Visible client link: client-name slug only — never an ID. */
  const url = selected ? consultationShareUrl(selected.slug) : "";

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Client link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const createAndSelect = async () => {
    setCreating(true);
    try {
      const created = await create({ clientName: newName });
      await refresh();
      setSelectedId(created.id);
      setNewName("");
      toast.success(`Link ready for ${created.clientName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create consultation");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-1.5 h-4 w-4" /> Share Roadmap
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share with the client</DialogTitle>
          <DialogDescription>
            The client link uses only the client name (e.g. /consultation/ahmed-mohamed). No login needed;
            internal fields stay hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Client consultation</Label>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading…" : "Select a client"} />
              </SelectTrigger>
              <SelectContent>
                {consultations.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="new-client">Or create by client name</Label>
              <Input
                id="new-client"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ahmed Mohamed"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void createAndSelect()}
              disabled={!newName.trim() || creating}
            >
              Create
            </Button>
          </div>

          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={url}
                  className="font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button onClick={() => void copy()} className="shrink-0">
                  {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                  Copy Client Link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Client: <span className="font-medium text-foreground">{selected.clientName}</span>
                {" · "}
                Path: <code className="rounded bg-muted px-1">/consultation/{selected.slug}</code>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Open client view
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/consultations">
                    <Users className="mr-1.5 h-4 w-4" /> Manage consultations
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Create a consultation with a client name to generate a share link.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

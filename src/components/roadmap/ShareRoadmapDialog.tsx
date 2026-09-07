import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getShareToken, rotateShareToken, shareUrl } from "@/lib/roadmap/share";
import { toast } from "sonner";

export function ShareRoadmapDialog() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setToken(getShareToken());
  }, [open]);

  const url = token ? shareUrl(token) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Client link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the link");
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
            A read-only, full-screen roadmap view. No login needed, and it always shows the latest
            roadmap. Internal fields (dev status, internal remarks) stay hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copy} className="shrink-0">
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              Copy Client Link
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" /> Open client view
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setToken(rotateShareToken());
                toast.success("New link generated — the old one no longer works");
              }}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" /> Generate new link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

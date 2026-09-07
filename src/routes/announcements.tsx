import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Code2, Copy, Eye, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/roadmap/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoadmap } from "@/lib/roadmap/store";
import { useAnnouncements } from "@/lib/roadmap/useAnnouncements";
import {
  ANNOUNCEMENT_STATUSES,
  announcementEmail,
  announcementEmailHtml,
  announcementSubject,
  type AnnouncementStatus,
  type SprintAnnouncement,
} from "@/lib/roadmap/announcements";
import { formatDate } from "@/lib/roadmap/calculations";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — DCAA Project Roadmap" },
      {
        name: "description",
        content:
          "Auto-generated sprint delivery announcements for completed and production features, ready to review, publish and email.",
      },
      { property: "og:title", content: "Announcements — DCAA Project Roadmap" },
      {
        property: "og:description",
        content: "Review, publish and email sprint delivery announcements with UAT dates.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  );
}

const ALL = "all";

function Body() {
  const { isAdmin } = useRoadmap();
  const { announcements, setStatus } = useAnnouncements();

  const [sprint, setSprint] = useState(ALL);
  const [module, setModule] = useState(ALL);
  const [feature, setFeature] = useState(ALL);
  const [status, setStatusFilter] = useState(ALL);
  const [emailFor, setEmailFor] = useState<SprintAnnouncement | null>(null);

  const modules = useMemo(
    () => Array.from(new Set(announcements.flatMap((a) => a.modules.map((m) => m.module)))).sort(),
    [announcements],
  );
  const features = useMemo(
    () =>
      Array.from(
        new Set(
          announcements
            .flatMap((a) => a.items)
            .filter((i) => module === ALL || i.module === module)
            .map((i) => i.feature),
        ),
      ).sort(),
    [announcements, module],
  );

  const visible = useMemo(() => {
    return announcements
      .filter((a) => (sprint === ALL ? true : a.sprint.name === sprint))
      .filter((a) => (status === ALL ? true : a.status === status))
      .map((a) => {
        const groups = a.modules
          .filter((m) => (module === ALL ? true : m.module === module))
          .map((m) => ({
            ...m,
            features: m.features.filter((f) => (feature === ALL ? true : f.feature === feature)),
          }))
          .filter((m) => m.features.length);
        return { ...a, modules: groups, items: groups.flatMap((m) => m.features) };
      })
      .filter((a) => a.modules.length);
  }, [announcements, sprint, module, feature, status]);

  const clear = () => {
    setSprint(ALL);
    setModule(ALL);
    setFeature(ALL);
    setStatusFilter(ALL);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Megaphone className="h-4 w-4 text-brand" /> Announcements
          </h2>
          <p className="text-sm text-muted-foreground">
            Auto-generated from completed & production deliveries · {visible.length} sprint
            {visible.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="outline" onClick={clear}>
          Clear filters
        </Button>
      </div>

      {/* Selectors */}
      <div className="grid gap-3 rounded-xl border bg-card p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <Picker
          label="Sprint"
          value={sprint}
          onChange={setSprint}
          options={announcements.map((a) => a.sprint.name)}
        />
        <Picker
          label="Module"
          value={module}
          onChange={(v) => {
            setModule(v);
            setFeature(ALL);
          }}
          options={modules}
        />
        <Picker label="Feature" value={feature} onChange={setFeature} options={features} />
        <Picker
          label="Announcement status"
          value={status}
          onChange={setStatusFilter}
          options={[...ANNOUNCEMENT_STATUSES]}
        />
      </div>

      {!visible.length && (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
          No completed or production features match this selection yet.
        </div>
      )}

      <div className="space-y-4">
        {visible.map((a) => (
          <AnnouncementCard
            key={a.key}
            a={a}
            isAdmin={isAdmin}
            onStatus={(s) => {
              setStatus(a.key, s);
              toast.success(`${a.sprint.name} announcement ${s.toLowerCase()}`);
            }}
            onEmail={() => setEmailFor(a)}
          />
        ))}
      </div>

      <EmailDialog announcement={emailFor} onClose={() => setEmailFor(null)} />
    </div>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

const statusTone = (s: AnnouncementStatus) =>
  s === "Published" ? "done" : s === "Archived" ? "muted" : "delayed";

function AnnouncementCard({
  a,
  isAdmin,
  onStatus,
  onEmail,
}: {
  a: SprintAnnouncement;
  isAdmin: boolean;
  onStatus: (s: AnnouncementStatus) => void;
  onEmail: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-surface px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{a.sprint.name} Delivery Announcement</h3>
            <Pill variant={statusTone(a.status)}>{a.status}</Pill>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(a.sprint.start)} – {formatDate(a.sprint.end)} · UAT{" "}
            <span className="font-medium text-foreground">{formatDate(a.sprint.uat)}</span> ·{" "}
            {a.modules.length} modules · {a.items.length} features
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEmail}>
            <Eye className="mr-1.5 h-4 w-4" /> Preview Email
          </Button>
          {isAdmin && a.status !== "Published" && (
            <Button size="sm" onClick={() => onStatus("Published")}>
              Publish
            </Button>
          )}
          {isAdmin && a.status === "Published" && (
            <Button variant="outline" size="sm" onClick={() => onStatus("Archived")}>
              Archive
            </Button>
          )}
          {isAdmin && a.status === "Archived" && (
            <Button variant="outline" size="sm" onClick={() => onStatus("Draft")}>
              Back to Draft
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-4">
        <Fact label="Sprint" value={a.sprint.name} />
        <Fact label="Start date" value={formatDate(a.sprint.start)} />
        <Fact label="End date" value={formatDate(a.sprint.end)} />
        <Fact label="UAT date" value={formatDate(a.sprint.uat)} />
      </div>

      <div className="space-y-3 border-t px-4 py-3">
        {a.modules.map((m) => (
          <div key={m.module} className="rounded-lg border bg-surface/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium">{m.module}</h4>
              <span className="text-xs text-muted-foreground">{m.features.length} features</span>
            </div>
            <ul className="space-y-1.5">
              {m.features.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0 truncate">{f.feature}</span>
                  <span className="flex items-center gap-2">
                    <Pill variant="done">
                      {f.deliveryStatus || (f.businessStatus === "Completed" ? "Completed" : "Production")}
                    </Pill>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      UAT {formatDate(a.sprint.uat)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

function EmailDialog({
  announcement,
  onClose,
}: {
  announcement: SprintAnnouncement | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"design" | "html" | "text">("design");
  if (!announcement) return null;
  const subject = announcementSubject(announcement);
  const body = announcementEmail(announcement);
  const html = announcementEmailHtml(announcement);

  const write = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy the email");
    }
  };

  const send = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "design", label: "Designed email" },
    { id: "html", label: "HTML source" },
    { id: "text", label: "Plain text" },
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Announcement email</DialogTitle>
          <DialogDescription>{subject}</DialogDescription>
        </DialogHeader>

        <div className="inline-flex w-fit gap-1 rounded-lg border bg-surface p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "design" ? (
          <iframe
            title="Announcement email preview"
            srcDoc={html}
            className="h-[55vh] w-full rounded-lg border bg-card"
          />
        ) : (
          <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-surface p-4 text-xs leading-relaxed">
            {tab === "html" ? html : body}
          </pre>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => write(html, "HTML")}>
            <Code2 className="mr-1.5 h-4 w-4" /> Copy HTML
          </Button>
          <Button variant="outline" onClick={() => write(`Subject: ${subject}\n\n${body}`, "Email")}>
            <Copy className="mr-1.5 h-4 w-4" /> Copy Text
          </Button>
          <Button onClick={send}>
            <Send className="mr-1.5 h-4 w-4" /> Send Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

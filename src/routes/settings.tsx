import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoadmap } from "@/lib/roadmap/store";
import { MODULES, PIS, SPRINTS } from "@/lib/roadmap/types";
import { Pill } from "@/components/roadmap/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DCAA Project Roadmap" },
      { name: "description", content: "Framework, permissions and program configuration for the DCAA roadmap." },
      { property: "og:title", content: "Settings — DCAA Project Roadmap" },
      { property: "og:description", content: "Configure roles, framework and program increment settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  );
}

function Body() {
  const { role, setRole } = useRoadmap();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Program configuration for DCAA Project Roadmap</p>
      </div>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Framework</h3>
        <div className="flex items-center gap-2">
          <Pill variant="progress">SAFe</Pill>
          <span className="text-xs text-muted-foreground">
            Scrum support is planned; the data model already supports it.
          </span>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Access</h3>
        <div className="max-w-xs space-y-1.5">
          <Label>Current role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "admin" | "viewer")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin — full edit access</SelectItem>
              <SelectItem value="viewer">Viewer — read only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Program Increment</h3>
        <div className="flex flex-wrap gap-1.5">
          {PIS.map((p) => (
            <Pill key={p} variant="progress">
              {p}
            </Pill>
          ))}
          {SPRINTS.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Modules / Value Streams</h3>
        <div className="flex flex-wrap gap-1.5">
          {MODULES.map((m) => (
            <Pill key={m}>{m}</Pill>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Data</h3>
        <p className="text-xs text-muted-foreground">
          Roadmap changes are stored in this browser. Resetting restores the seeded DCAA baseline.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem("dcaa-roadmap-v1");
            toast.success("Roadmap reset — reloading");
            setTimeout(() => window.location.reload(), 600);
          }}
        >
          Reset to seed data
        </Button>
      </section>
    </div>
  );
}

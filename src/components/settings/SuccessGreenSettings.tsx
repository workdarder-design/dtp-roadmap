import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/roadmap/StatusBadge";
import { useProgramTheme } from "@/components/theme/ProgramThemeProvider";
import { cssColorToHex, normalizeHex } from "@/lib/theme/colorFormat";
import { DEFAULT_STATUS_DONE_HEX, DEFAULT_STATUS_DONE_LIGHT } from "@/lib/theme/defaults";

export function SuccessGreenSettings({ isAdmin }: { isAdmin: boolean }) {
  const { theme, saveTheme, hydrated } = useProgramTheme();
  const [hex, setHex] = useState(DEFAULT_STATUS_DONE_HEX);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const src = theme.statusDoneLight ?? DEFAULT_STATUS_DONE_LIGHT;
    setHex(cssColorToHex(src));
  }, [hydrated, theme.statusDoneLight]);

  const previewStyle = { color: hex };

  const onSave = () => {
    if (!isAdmin) return;
    setSaving(true);
    const normalized = normalizeHex(hex);
    void saveTheme({ statusDoneLight: normalized, statusDoneDark: null })
      .then(() => toast.success("Success green updated"))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save color"))
      .finally(() => setSaving(false));
  };

  const onReset = () => {
    if (!isAdmin) return;
    setSaving(true);
    void saveTheme({ statusDoneLight: null, statusDoneDark: null })
      .then(() => {
        setHex(DEFAULT_STATUS_DONE_HEX);
        toast.success("Restored default green");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not reset color"))
      .finally(() => setSaving(false));
  };

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Success green</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Color for <span className="font-medium">Completed</span> states, KPIs, and charts (
            <code className="rounded bg-muted px-1">--status-done</code>).
          </p>
        </div>
        <Pill variant="done">Completed</Pill>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Pick color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={hex}
              disabled={!isAdmin}
              onChange={(e) => setHex(normalizeHex(e.target.value))}
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Success green color"
            />
            <Input
              value={hex}
              disabled={!isAdmin}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "") setHex(v);
              }}
              onBlur={() => {
                if (/^#[0-9a-fA-F]{6}$/.test(hex)) setHex(normalizeHex(hex));
              }}
              className="h-9 w-[7.5rem] font-mono text-xs uppercase"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Preview:{" "}
          <span className="font-semibold" style={previewStyle}>
            {hex}
          </span>
        </div>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={saving || !/^#[0-9a-fA-F]{6}$/.test(hex)} onClick={onSave}>
            {saving ? "Saving…" : "Save color"}
          </Button>
          <Button size="sm" variant="outline" disabled={saving} onClick={onReset}>
            Reset to default
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Admin access required to change theme colors.</p>
      )}
    </section>
  );
}

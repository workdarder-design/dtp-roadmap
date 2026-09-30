import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoadmap } from "@/lib/roadmap/store";
import { useAuth } from "@/lib/auth/store";
import { Pill } from "@/components/roadmap/StatusBadge";
import { resetRoadmapToSeed } from "@/lib/services/roadmapItems";
import { fetchShareToken, rotateShareTokenInDb, setShareCodeInDb } from "@/lib/services/appSettings";
import { isValidShareCode, normalizeShareCode, SHARE_CODE_MAX } from "@/lib/roadmap/shareCode";
import {
  addProgramModule,
  addProgramSprint,
  deleteProgramModule,
  deleteProgramSprint,
} from "@/lib/services/programConfig";
import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  updateTeamMemberRole,
  type TeamMember,
} from "@/lib/services/teamUsers";
import { shareUrl } from "@/lib/roadmap/share";
import type { UserRole } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { SuccessGreenSettings } from "@/components/settings/SuccessGreenSettings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DTP— Roadmap" },
      { name: "description", content: "Framework, permissions and program configuration for the DTP roadmap." },
      { property: "og:title", content: "Settings — DTP— Roadmap" },
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

function RemovableTagList({
  items,
  disabled,
  onRemove,
  onAdd,
  addPlaceholder,
}: {
  items: string[];
  disabled?: boolean;
  onRemove: (name: string) => void;
  onAdd: (name: string) => void;
  addPlaceholder: string;
}) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Already exists");
      return;
    }
    onAdd(trimmed);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {items.map((name) => (
          <span
            key={name}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
              "bg-muted text-muted-foreground ring-border",
            )}
          >
            {name}
            {!disabled ? (
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-background/80"
                aria-label={`Remove ${name}`}
                onClick={() => onRemove(name)}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {!disabled ? (
        <div className="flex max-w-md gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={addPlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" onClick={submit} aria-label="Add">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function UsersSection({ isAdmin, currentUserId }: { isAdmin: boolean; currentUserId: string | undefined }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("viewer");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMembers(await fetchTeamMembers());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = () => {
    setCreating(true);
    void createTeamMember({ email, password, role: newRole, displayName: displayName || undefined })
      .then(() => {
        toast.success("User created");
        setEmail("");
        setPassword("");
        setDisplayName("");
        setAddOpen(false);
        return load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not create user"))
      .finally(() => setCreating(false));
  };

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Users</h3>
        {isAdmin ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddOpen((open) => !open)}
            aria-expanded={addOpen}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        ) : null}
      </div>

      {!isAdmin ? (
        <p className="text-xs text-muted-foreground">Admin access required to manage users.</p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Loading users…</p>
      ) : (
        <>
          <ul className="divide-y rounded-lg border text-sm">
            {members.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-muted-foreground">No users yet.</li>
            ) : (
              members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate">{m.email ?? m.displayName ?? m.id}</span>
                  <Select
                    value={m.role}
                    onValueChange={(v) => {
                      void updateTeamMemberRole(m.id, v as UserRole)
                        .then(() => load())
                        .catch((err) =>
                          toast.error(err instanceof Error ? err.message : "Could not update role"),
                        );
                    }}
                  >
                    <SelectTrigger className="h-8 w-[108px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={m.id === currentUserId}
                    aria-label="Delete user"
                    onClick={() => {
                      if (!window.confirm(`Delete ${m.email ?? "this user"}?`)) return;
                      void deleteTeamMember(m.id)
                        .then(() => {
                          toast.success("User deleted");
                          return load();
                        })
                        .catch((err) =>
                          toast.error(err instanceof Error ? err.message : "Could not delete user"),
                        );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))
            )}
          </ul>

          <Collapsible open={addOpen} onOpenChange={setAddOpen}>
            <CollapsibleContent className="overflow-hidden">
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3 pt-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Display name (optional)</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Shown in the app"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={creating || !email.trim() || password.length < 8}
                    onClick={onCreate}
                  >
                    {creating ? "Creating…" : "Create user"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </section>
  );
}

function Body() {
  const { role, setRole, refresh, isAdmin, modules, sprints, refreshProgramConfig } = useRoadmap();
  const { user } = useAuth();
  const [shareCode, setShareCode] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [savingShareCode, setSavingShareCode] = useState(false);

  const applyShareCode = (code: string) => {
    setShareCode(code);
    setShareLink(shareUrl(code));
  };

  const loadShareLink = async () => {
    try {
      const token = await fetchShareToken();
      if (token) applyShareCode(token);
      else {
        setShareCode("");
        setShareLink(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load share link");
    }
  };

  const mutateModule = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await refreshProgramConfig();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save module");
    }
  };

  const mutateSprint = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await refreshProgramConfig();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save sprint");
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Program configuration for DTP— Roadmap</p>
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

      <SuccessGreenSettings isAdmin={isAdmin} />

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
          <p className="text-xs text-muted-foreground">
            Role is stored in your Supabase profile and enforced by row-level security for writes.
          </p>
        </div>
      </section>

      <UsersSection isAdmin={isAdmin} currentUserId={user?.id} />

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Public share link</h3>
        <p className="text-xs text-muted-foreground">
          Short read-only code in the URL: <code className="rounded bg-muted px-1">/share/dcaa1</code> (4–5 letters or
          numbers).
        </p>
        {shareLink ? (
          <code className="block truncate rounded-lg bg-muted px-3 py-2 text-xs">{shareLink}</code>
        ) : null}
        <div className="flex max-w-xs flex-col gap-2">
          <Label className="text-xs">Share code</Label>
          <div className="flex gap-2">
            <Input
              value={shareCode}
              onChange={(e) =>
                setShareCode(normalizeShareCode(e.target.value).replace(/[^a-z0-9]/g, "").slice(0, SHARE_CODE_MAX))
              }
              placeholder="e.g. dcaa1"
              maxLength={SHARE_CODE_MAX}
              disabled={!isAdmin}
              className="font-mono lowercase"
              autoComplete="off"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!isAdmin || savingShareCode || !isValidShareCode(shareCode)}
              onClick={() => {
                setSavingShareCode(true);
                void setShareCodeInDb(shareCode)
                  .then((code) => {
                    applyShareCode(code);
                    toast.success("Share code saved");
                  })
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Could not save share code"),
                  )
                  .finally(() => setSavingShareCode(false));
              }}
            >
              {savingShareCode ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadShareLink()}>
            Show current link
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isAdmin || rotating}
            onClick={() => {
              setRotating(true);
              void rotateShareTokenInDb()
                .then((code) => {
                  applyShareCode(code);
                  toast.success("New random code generated");
                })
                .catch((err) =>
                  toast.error(err instanceof Error ? err.message : "Could not generate code"),
                )
                .finally(() => setRotating(false));
            }}
          >
            {rotating ? "Generating…" : "Random code"}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Sprints</h3>
        <RemovableTagList
          items={sprints}
          disabled={!isAdmin}
          addPlaceholder="e.g. Sprint 21"
          onAdd={(name) => void mutateSprint(() => addProgramSprint(name))}
          onRemove={(name) => void mutateSprint(() => deleteProgramSprint(name))}
        />
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Modules / Value Streams</h3>
        <RemovableTagList
          items={modules}
          disabled={!isAdmin}
          addPlaceholder="e.g. Finance"
          onAdd={(name) => void mutateModule(() => addProgramModule(name))}
          onRemove={(name) => void mutateModule(() => deleteProgramModule(name))}
        />
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Data</h3>
        <p className="text-xs text-muted-foreground">
          Roadmap data is stored in Supabase. Resetting restores the baseline seed in the database.
        </p>
        <Button
          variant="outline"
          disabled={!isAdmin || resetting}
          onClick={() => {
            setResetting(true);
            void resetRoadmapToSeed()
              .then(() => refresh())
              .then(() => toast.success("Roadmap reset to baseline"))
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not reset roadmap"))
              .finally(() => setResetting(false));
          }}
        >
          {resetting ? "Resetting…" : "Reset to seed data"}
        </Button>
      </section>
    </div>
  );
}

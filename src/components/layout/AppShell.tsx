import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, Bell, FileText, LayoutGrid, Search, Settings, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoadmap } from "@/lib/roadmap/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Roadmap", icon: LayoutGrid },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { filters, setFilters, role, setRole } = useRoadmap();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            D
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">DCAA</p>
            <p className="truncate text-[11px] text-muted-foreground">Project Roadmap</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Main menu
          </p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold data-[status=active]:text-sidebar-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="m-3 rounded-xl border border-sidebar-border bg-surface p-3 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground">Framework: SAFe</p>
          <p>PI-2026 Q3 · Sprints 10–16</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-card/90 px-4 py-3 backdrop-blur sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-base font-semibold">DCAA Project Roadmap</h1>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary sm:inline-flex">
              <ShieldCheck className="h-3 w-3" /> SAFe
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Search items…"
                className="h-9 w-64 pl-8"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-status-blocked" />
            </Button>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "viewer")}>
              <SelectTrigger className="h-9 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn("bg-primary/10 text-xs font-semibold text-primary")}>AH</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

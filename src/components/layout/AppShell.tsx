import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  ChevronDown,
  FileText,
  Home,
  LifeBuoy,
  LogOut,
  Megaphone,
  Rocket,
  Search,
  Settings,
  Table2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoadmap } from "@/lib/roadmap/store";
import { cn } from "@/lib/utils";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/lib/auth/store";
import { ROADMAP_PRODUCT_NAME } from "@/lib/brand";

const NAV = [
  { to: "/", label: "Roadmap", icon: Table2, exact: true },
  { to: "/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/reports", label: "Reports", icon: FileText, exact: false },
  { to: "/consultations", label: "Consultations", icon: Users, exact: false },
  { to: "/announcements", label: "Announcements", icon: Megaphone, exact: false },
  { to: "/release-notes", label: "Release Notes", icon: Rocket, exact: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { filters, setFilters, role, setRole } = useRoadmap();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { logout, session } = useAuth();

  const signOut = () => {
    logout();
    void navigate({ to: "/login", replace: true });
  };

  const adminInitials =
    session?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-surface">
      {/* Left icon rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center py-4 md:flex">
        <Link
          to="/"
          className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-sm"
          aria-label={ROADMAP_PRODUCT_NAME}
        >
          <Home className="h-5 w-5" />
        </Link>

        <nav className="mt-6 flex flex-col items-center gap-1 rounded-full bg-card p-1.5 shadow-sm">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              title={label}
              aria-label={label}
              activeOptions={{ exact }}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(to, exact) &&
                  "bg-highlight text-highlight-foreground shadow-sm hover:bg-highlight hover:text-highlight-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-1 rounded-full bg-card p-1.5 shadow-sm">
          <Link
            to="/settings"
            title="Settings"
            aria-label="Settings"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isActive("/settings", false) && "bg-highlight text-highlight-foreground",
            )}
          >
            <Settings className="h-[18px] w-[18px]" />
          </Link>
          <button
            type="button"
            title="Support"
            aria-label="Support"
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LifeBuoy className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={signOut}
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen min-w-0 flex-col md:pl-16">
        <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card px-4 py-2.5 shadow-sm sm:flex sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground md:hidden">
                <Home className="h-4 w-4" />
              </div>
              <h1 className="truncate text-sm font-semibold tracking-tight">
                {ROADMAP_PRODUCT_NAME}
              </h1>
              <span className="hidden shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand sm:inline-flex">
                SAFe
              </span>
            </div>

            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Search a roadmap item..."
                className="h-9 w-72 rounded-full border border-border bg-muted/60 pl-9 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘S
              </kbd>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-status-blocked" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 outline-none transition-colors hover:bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-highlight text-xs font-semibold text-highlight-foreground">
                      {adminInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:block">
                    {session?.name ?? "Admin"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={() => setRole("admin")}>
                    Admin {role === "admin" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRole("viewer")}>
                    Viewer {role === "viewer" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-5">{children}</main>
      </div>
    </div>
    </RequireAuth>
  );
}

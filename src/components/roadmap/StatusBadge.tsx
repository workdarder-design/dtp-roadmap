import { cn } from "@/lib/utils";
import type { DerivedState } from "@/lib/roadmap/calculations";

const tone = {
  planned: "bg-status-planned/12 text-status-planned ring-status-planned/25",
  progress: "bg-status-progress/12 text-status-progress ring-status-progress/25",
  done: "bg-status-done/12 text-status-done ring-status-done/25",
  blocked: "bg-status-blocked/12 text-status-blocked ring-status-blocked/25",
  delayed: "bg-status-delayed/15 text-status-delayed ring-status-delayed/30",
  muted: "bg-muted text-muted-foreground ring-border",
} as const;

type Tone = keyof typeof tone;

export function Pill({
  children,
  variant = "muted",
  className,
}: {
  children: React.ReactNode;
  variant?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tone[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const priorityTone = (v: string): Tone =>
  v === "High" ? "blocked" : v === "Medium" ? "delayed" : "planned";

export const devTone = (v: string): Tone =>
  v === "Done" ? "done" : v === "In Progress" ? "progress" : v === "Blocked" ? "blocked" : "muted";

export const businessTone = (v: string): Tone =>
  v === "Completed" ? "done" : v === "Cancelled" || v === "On Hold" ? "blocked" : v === "Planned" ? "progress" : v ? "planned" : "muted";

export const deliveryTone = (v: string): Tone =>
  v === "Completed" || v === "Production" ? "done" : v === "Pending" || !v ? "muted" : "delayed";

export const stateTone = (v: DerivedState): Tone =>
  v === "Completed" ? "done" : v === "Blocked" ? "blocked" : v === "Delayed" ? "delayed" : v === "In Progress" ? "progress" : "planned";

export function StateBadge({ state }: { state: DerivedState }) {
  return <Pill variant={stateTone(state)}>{state}</Pill>;
}

import { useState } from "react";
import { CalendarIcon, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/roadmap/calculations";
import { Pill } from "./StatusBadge";

const EMPTY = "__empty__";

export function SavedFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-status-done">
      <Check className="h-3 w-3" /> Saved
    </span>
  );
}

export function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };
  return { saved, flash };
}

export function InlineSelect({
  value,
  options,
  onChange,
  editable,
  render,
  placeholder = "—",
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  editable: boolean;
  render?: (v: string) => React.ReactNode;
  placeholder?: string;
}) {
  const { saved, flash } = useSavedFlash();
  const display = render ? render(value) : <span>{value || placeholder}</span>;

  if (!editable) return <>{display}</>;

  return (
    <div className="flex items-center">
      <Select
        value={value === "" ? EMPTY : value}
        onValueChange={(v) => {
          onChange(v === EMPTY ? "" : v);
          flash();
        }}
      >
        <SelectTrigger
          className="h-7 w-auto min-w-0 gap-1 border-transparent bg-transparent px-1.5 py-0 text-sm shadow-none hover:border-border hover:bg-muted/60 focus:ring-1 data-[state=open]:border-border"
          aria-label="Edit value"
        >
          {display}
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o || EMPTY} value={o === "" ? EMPTY : o}>
              {o || "— None —"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SavedFlash show={saved} />
    </div>
  );
}

export function InlineDate({
  value,
  onChange,
  editable,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  editable: boolean;
}) {
  const { saved, flash } = useSavedFlash();
  const [open, setOpen] = useState(false);
  const label = value ? formatDate(value) : "—";

  if (!editable) return <span className="tabular-nums">{label}</span>;

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-1.5 text-sm tabular-nums transition-colors hover:border-border hover:bg-muted/60",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(d) => {
              onChange(d ? d.toISOString().slice(0, 10) : null);
              flash();
              setOpen(false);
            }}
            initialFocus
            className={cn("pointer-events-auto p-3")}
          />
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(null);
                flash();
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <SavedFlash show={saved} />
    </div>
  );
}

export function InlineText({
  value,
  onChange,
  editable,
  placeholder = "Add note…",
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  placeholder?: string;
}) {
  const { saved, flash } = useSavedFlash();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editable)
    return <span className="text-sm text-muted-foreground">{value || "—"}</span>;

  if (!editing)
    return (
      <div className="flex items-center">
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className={cn(
            "min-h-7 rounded-md border border-transparent px-1.5 py-1 text-left text-sm transition-colors hover:border-border hover:bg-muted/60",
            !value && "text-muted-foreground",
          )}
        >
          {value ? <Pill variant="planned">{value}</Pill> : placeholder}
        </button>
        <SavedFlash show={saved} />
      </div>
    );

  return (
    <Input
      autoFocus
      value={draft}
      className="h-7 min-w-40 text-sm"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) {
          onChange(draft);
          flash();
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
      }}
    />
  );
}

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRoadmap } from "@/lib/roadmap/store";
import {
  BUSINESS_STATUSES,
  DELIVERY_STATUSES,
  DEV_STATUSES,
  displayDevStatus,
  PRIORITIES,
  type RoadmapItem,
} from "@/lib/roadmap/types";
import { formatDate } from "@/lib/roadmap/calculations";
import { InlineDate, InlineSelect, InlineText } from "./InlineEditor";
import { Pill, businessTone, deliveryTone, devTone, priorityTone } from "./StatusBadge";
import { cn } from "@/lib/utils";

type ColKey =
  | "id" | "module" | "feature" | "priority" | "sprint" | "etaStaging" | "etaProduction"
  | "businessStatus" | "devStatus" | "deliveryStatus" | "remarks";

const COLUMNS: { key: ColKey; label: string; width: number }[] = [
  { key: "id", label: "ID", width: 110 },
  { key: "module", label: "Module", width: 190 },
  { key: "feature", label: "Feature", width: 260 },
  { key: "priority", label: "Priority", width: 120 },
  { key: "sprint", label: "Sprint", width: 130 },
  { key: "etaStaging", label: "ETA on Staging", width: 160 },
  { key: "etaProduction", label: "ETA on Production", width: 170 },
  { key: "businessStatus", label: "Business Status", width: 170 },
  { key: "devStatus", label: "Dev Status", width: 150 },
  { key: "deliveryStatus", label: "Delivery Status", width: 190 },
  { key: "remarks", label: "Remarks / Notes", width: 220 },
];

export function RoadmapTable() {
  const { filtered, updateItem, deleteItems, isAdmin, modules, sprints } = useRoadmap();
  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [visible, setVisible] = useState<ColKey[]>(COLUMNS.map((c) => c.key));
  const [widths, setWidths] = useState<Record<string, number>>(
    Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const resizing = useRef<{ key: string; startX: number; startW: number } | null>(null);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = String(a[sort.key] ?? "");
      const vb = String(b[sort.key] ?? "");
      return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return arr;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const rows = sorted.slice(current * pageSize, current * pageSize + pageSize);
  const cols = COLUMNS.filter((c) => visible.includes(c.key));

  const startResize = (key: string, e: React.MouseEvent) => {
    resizing.current = { key, startX: e.clientX, startW: widths[key] ?? 140 };
    const move = (ev: MouseEvent) => {
      const r = resizing.current;
      if (!r) return;
      setWidths((w) => ({ ...w, [r.key]: Math.max(80, r.startW + ev.clientX - r.startX) }));
    };
    const up = () => {
      resizing.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const exportCsv = () => {
    const head = COLUMNS.map((c) => c.label).join(",");
    const body = sorted
      .map((i) =>
        COLUMNS.map((c) => {
          const v = c.key === "etaStaging" || c.key === "etaProduction" ? formatDate(i[c.key]) : String(i[c.key] ?? "");
          return `"${v.replace(/"/g, '""')}"`;
        }).join(","),
      )
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dcaa-roadmap.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Roadmap exported");
  };

  const set = (item: RoadmapItem, patch: Partial<RoadmapItem>) => {
    updateItem(item.id, patch);
    toast.success(`${item.id} updated`, { duration: 1400 });
  };

  const cell = (item: RoadmapItem, key: ColKey) => {
    switch (key) {
      case "id":
        return <span className="font-mono text-xs font-semibold text-muted-foreground">{item.id}</span>;
      case "module":
        return (
          <InlineSelect
            editable={isAdmin}
            value={item.module}
            options={modules}
            onChange={(v) => set(item, { module: v })}
            render={(v) => <span className="truncate text-sm font-medium">{v}</span>}
          />
        );
      case "feature":
        return (
          <InlineText editable={isAdmin} value={item.feature} onChange={(v) => set(item, { feature: v })} placeholder="Feature" />
        );
      case "priority":
        return (
          <InlineSelect
            editable={isAdmin}
            value={item.priority}
            options={PRIORITIES}
            onChange={(v) => set(item, { priority: v as RoadmapItem["priority"] })}
            render={(v) => <Pill variant={priorityTone(v)}>{v}</Pill>}
          />
        );
      case "sprint":
        return (
          <InlineSelect
            editable={isAdmin}
            value={item.sprint}
            options={sprints}
            onChange={(v) => set(item, { sprint: v })}
            render={(v) => <span className="text-sm">{v}</span>}
          />
        );
      case "etaStaging":
        return <InlineDate editable={isAdmin} value={item.etaStaging} onChange={(v) => set(item, { etaStaging: v })} />;
      case "etaProduction":
        return <InlineDate editable={isAdmin} value={item.etaProduction} onChange={(v) => set(item, { etaProduction: v })} />;
      case "businessStatus":
        return (
          <InlineSelect
            editable={isAdmin}
            value={item.businessStatus}
            options={BUSINESS_STATUSES}
            onChange={(v) => set(item, { businessStatus: v as RoadmapItem["businessStatus"] })}
            render={(v) => (v ? <Pill variant={businessTone(v)}>{v}</Pill> : <span className="text-muted-foreground">—</span>)}
          />
        );
      case "devStatus":
        return (
          <InlineSelect
            editable={isAdmin}
            value={item.devStatus}
            options={DEV_STATUSES}
            onChange={(v) => set(item, { devStatus: v as RoadmapItem["devStatus"] })}
            render={(v) => (v ? <Pill variant={devTone(v)}>{displayDevStatus(v)}</Pill> : <span className="text-muted-foreground">—</span>)}
          />
        );
      case "deliveryStatus":
        return (
          <InlineSelect
            editable={isAdmin}
            value={item.deliveryStatus}
            options={DELIVERY_STATUSES}
            onChange={(v) => set(item, { deliveryStatus: v as RoadmapItem["deliveryStatus"] })}
            render={(v) => (v ? <Pill variant={deliveryTone(v)}>{v}</Pill> : <span className="text-muted-foreground">—</span>)}
          />
        );
      case "remarks":
        return <InlineText editable={isAdmin} value={item.remarks} onChange={(v) => set(item, { remarks: v })} />;
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <div className="text-sm text-muted-foreground">
          {selected.length > 0 ? (
            <span className="font-medium text-foreground">{selected.length} selected</span>
          ) : (
            <>
              Showing <span className="font-medium text-foreground">{rows.length}</span> of {sorted.length} items
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && selected.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-1.5 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              {COLUMNS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={visible.includes(c.key)}
                  onCheckedChange={(on) =>
                    setVisible((v) => (on ? [...v, c.key] : v.filter((k) => k !== c.key)))
                  }
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="max-h-[62vh] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 w-10 border-b bg-surface px-3 py-2">
                <Checkbox
                  checked={rows.length > 0 && rows.every((r) => selected.includes(r.id))}
                  onCheckedChange={(on) =>
                    setSelected(on ? Array.from(new Set([...selected, ...rows.map((r) => r.id)])) : [])
                  }
                  aria-label="Select all"
                />
              </th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  style={{ width: widths[c.key], minWidth: widths[c.key] }}
                  className="group relative border-b bg-surface px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() =>
                      setSort((s) =>
                        s.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" },
                      )
                    }
                  >
                    {c.label}
                    {sort.key === c.key ? (
                      sort.dir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                  <span
                    onMouseDown={(e) => startResize(c.key, e)}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/40"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className={cn("group", selected.includes(item.id) && "bg-primary/5")}>
                <td className="sticky left-0 z-10 border-b bg-card px-3 py-1.5 group-hover:bg-muted/40">
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={(on) =>
                      setSelected((s) => (on ? [...s, item.id] : s.filter((x) => x !== item.id)))
                    }
                    aria-label={`Select ${item.id}`}
                  />
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="border-b px-3 py-1.5 align-middle group-hover:bg-muted/40">
                    {cell(item, c.key)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} className="px-3 py-16 text-center text-sm text-muted-foreground">
                  No roadmap items match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t p-3 text-sm">
        <span className="text-muted-foreground">
          Page {current + 1} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} item(s)?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteItems(selected);
                toast.success(`${selected.length} item(s) deleted`);
                setSelected([]);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

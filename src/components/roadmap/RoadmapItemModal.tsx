import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoadmap } from "@/lib/roadmap/store";
import { roadmapItemSchema, type RoadmapItemInput } from "@/lib/roadmap/validations";
import {
  BUSINESS_STATUSES,
  DELIVERY_STATUSES,
  DEV_STATUSES,
  MODULES,
  PIS,
  PRIORITIES,
  SPRINTS,
  type RoadmapItem,
} from "@/lib/roadmap/types";

const NONE = "__none__";

export function RoadmapItemModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: RoadmapItem;
}) {
  const { addItem, updateItem, nextId, isAdmin } = useRoadmap();
  const editing = !!item;

  const form = useForm<RoadmapItemInput>({
    resolver: zodResolver(roadmapItemSchema),
    defaultValues: blank(nextId()),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      item
        ? {
            ...item,
            etaStaging: item.etaStaging ?? "",
            etaProduction: item.etaProduction ?? "",
          }
        : blank(nextId()),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const submit = (values: RoadmapItemInput) => {
    const payload: RoadmapItem = {
      ...values,
      etaStaging: values.etaStaging || null,
      etaProduction: values.etaProduction || null,
      framework: "SAFe",
    };
    if (editing && item) {
      updateItem(item.id, payload);
      toast.success(`${item.id} updated`);
    } else {
      addItem(payload);
      toast.success(`${payload.id} added to the roadmap`);
    }
    onOpenChange(false);
  };

  const sel = (name: keyof RoadmapItemInput, label: string, options: readonly string[]) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={(form.watch(name) as string) || NONE}
        onValueChange={(v) => form.setValue(name, v === NONE ? "" : v, { shouldValidate: true })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o || NONE} value={o === "" ? NONE : o}>
              {o || "— None —"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${item?.id}` : "Add Roadmap Item"}</DialogTitle>
          <DialogDescription>
            SAFe roadmap item details. Changes apply instantly across every view.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>ID</Label>
            <Input {...form.register("id")} disabled={editing} />
            <FieldError msg={form.formState.errors.id?.message} />
          </div>
          {sel("module", "Module", MODULES)}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Feature</Label>
            <Input {...form.register("feature")} placeholder="Feature name" />
            <FieldError msg={form.formState.errors.feature?.message} />
          </div>
          {sel("priority", "Priority", PRIORITIES)}
          {sel("sprint", "Sprint", SPRINTS)}
          {sel("pi", "PI", PIS)}
          <div className="space-y-1.5">
            <Label>ETA on Staging</Label>
            <Input type="date" {...form.register("etaStaging")} />
          </div>
          <div className="space-y-1.5">
            <Label>ETA on Production</Label>
            <Input type="date" {...form.register("etaProduction")} />
          </div>
          {sel("businessStatus", "Business Status", BUSINESS_STATUSES)}
          {sel("devStatus", "Dev Status", DEV_STATUSES)}
          {sel("deliveryStatus", "Delivery Status", DELIVERY_STATUSES)}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Remarks / Notes</Label>
            <Textarea rows={3} {...form.register("remarks")} placeholder="Optional notes" />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isAdmin}>
              {editing ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive">{msg}</p>;
}

function blank(id: string): RoadmapItemInput {
  return {
    id,
    module: "Employee Appraisal",
    feature: "",
    priority: "Medium",
    sprint: "Sprint 14",
    pi: "PI-2026 Q3",
    etaStaging: "",
    etaProduction: "",
    businessStatus: "",
    devStatus: "",
    deliveryStatus: "",
    remarks: "",
  };
}

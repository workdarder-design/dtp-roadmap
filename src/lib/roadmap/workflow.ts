import type { BusinessStatus, DeliveryStatus, DevStatus, RoadmapItem } from "./types";

export interface WorkflowStage {
  key: string;
  label: string;
  phase: "Business" | "Development" | "Delivery";
  business: BusinessStatus;
  dev: DevStatus;
  delivery: DeliveryStatus;
}

/** Complete feature lifecycle: Business → Development → Delivery. */
export const WORKFLOW_STAGES: WorkflowStage[] = [
  { key: "gathering", label: "Gathering Requirements", phase: "Business", business: "Gathering Req", dev: "Not Started", delivery: "Pending" },
  { key: "analysis", label: "In Analysis", phase: "Business", business: "In Analysis", dev: "Not Started", delivery: "Pending" },
  { key: "validation", label: "Validation", phase: "Business", business: "Validation", dev: "Not Started", delivery: "Pending" },
  { key: "planned", label: "Planned", phase: "Business", business: "Planned", dev: "Not Started", delivery: "Pending" },
  { key: "in-progress", label: "In Progress", phase: "Development", business: "Planned", dev: "In Progress", delivery: "Pending" },
  { key: "done", label: "Done", phase: "Development", business: "Planned", dev: "Done", delivery: "Pending" },
  { key: "uat", label: "Ready for UAT", phase: "Delivery", business: "Planned", dev: "Done", delivery: "Ready for UAT" },
  { key: "handover", label: "Handover to Client", phase: "Delivery", business: "Planned", dev: "Done", delivery: "Handover (to Client)" },
  { key: "production", label: "Production", phase: "Delivery", business: "Planned", dev: "Done", delivery: "Production" },
  { key: "completed", label: "Completed", phase: "Delivery", business: "Completed", dev: "Done", delivery: "Completed" },
];

export const stageIndexByKey = (key: string) => WORKFLOW_STAGES.findIndex((s) => s.key === key);

/** Map an item's three status fields onto a single lifecycle stage. */
export function currentStageIndex(item: RoadmapItem): number {
  switch (item.deliveryStatus) {
    case "Completed":
      return stageIndexByKey("completed");
    case "Production":
      return stageIndexByKey("production");
    case "Handover (to Client)":
      return stageIndexByKey("handover");
    case "Ready for UAT":
    case "UAT":
      return stageIndexByKey("uat");
    default:
      break;
  }
  if (item.devStatus === "Done") return stageIndexByKey("done");
  if (item.devStatus === "In Progress" || item.devStatus === "Blocked") return stageIndexByKey("in-progress");
  switch (item.businessStatus) {
    case "Completed":
      return stageIndexByKey("completed");
    case "Planned":
    case "Ready To Planning":
      return stageIndexByKey("planned");
    case "Validation":
      return stageIndexByKey("validation");
    case "In Analysis":
      return stageIndexByKey("analysis");
    default:
      return 0;
  }
}

/** The status patch that moves an item to the given lifecycle stage. */
export function patchForStage(index: number): Partial<RoadmapItem> {
  const s = WORKFLOW_STAGES[Math.max(0, Math.min(index, WORKFLOW_STAGES.length - 1))]!;
  return { businessStatus: s.business, devStatus: s.dev, deliveryStatus: s.delivery };
}

export const isBlocked = (item: RoadmapItem) => item.devStatus === "Blocked";

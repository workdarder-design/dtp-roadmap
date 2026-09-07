export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const BUSINESS_STATUSES = [
  "",
  "Gathering Req",
  "Ready To Planning",
  "In Analysis",
  "Validation",
  "Planned",
  "No Action",
  "On Hold",
  "Completed",
  "Cancelled",
] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const DEV_STATUSES = ["", "Not Started", "In Progress", "Blocked", "Done"] as const;
export type DevStatus = (typeof DEV_STATUSES)[number];

export const DELIVERY_STATUSES = [
  "",
  "Pending",
  "Ready for UAT",
  "UAT",
  "Handover (to Client)",
  "Production",
  "Completed",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const SPRINTS = [
  "Sprint 10",
  "Sprint 11",
  "Sprint 12",
  "Sprint 13",
  "Sprint 14",
  "Sprint 15",
  "Sprint 16",
] as const;
export type Sprint = (typeof SPRINTS)[number];

export const PIS = ["PI-2026 Q3"] as const;

export const MODULES = [
  "Employee Appraisal",
  "Performance",
  "Committee",
  "Audit",
  "Filter Unification",
  "Committee MOM Enhancements",
] as const;

/** Framework is SAFe-only for now; the model keeps room for Scrum later. */
export type Framework = "SAFe" | "Scrum";

export interface RoadmapItem {
  id: string;
  module: string;
  feature: string;
  priority: Priority;
  sprint: string;
  pi: string;
  etaStaging: string | null; // ISO yyyy-mm-dd
  etaProduction: string | null;
  businessStatus: BusinessStatus;
  devStatus: DevStatus;
  deliveryStatus: DeliveryStatus;
  remarks: string;
  framework: Framework;
}

export type ScopeType = "project" | "module" | "feature" | "sprint" | "pi";

export interface RoadmapFilterState {
  scopeType: ScopeType;
  scopeValue: string | null;
  pi: string;
  sprint: string;
  module: string;
  priority: string;
  status: string;
  businessStatus: string;
  devStatus: string;
  deliveryStatus: string;
  etaFrom: string;
  etaTo: string;
  search: string;
}

export const DEFAULT_FILTERS: RoadmapFilterState = {
  scopeType: "project",
  scopeValue: null,
  pi: "all",
  sprint: "all",
  module: "all",
  priority: "all",
  status: "all",
  businessStatus: "all",
  devStatus: "all",
  deliveryStatus: "all",
  etaFrom: "",
  etaTo: "",
  search: "",
};

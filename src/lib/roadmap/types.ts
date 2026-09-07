import { SPRINT_NAMES } from "./sprints";

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

export const SPRINTS = SPRINT_NAMES;
export type Sprint = string;



export const MODULES = [
  "Dashboards",
  "Performance",
  "Services",
  "Projects",
  "Admin",
  "Committees",
  "BAU",
  "Employee Appraisal",
  "Innovation",
  "Audit",
] as const;

/** Older saved data used legacy module names — normalize them to the current list. */
export const LEGACY_MODULE_MAP: Record<string, string> = {
  Committee: "Committees",
  "Committee MOM Enhancements": "Committees",
  "Filter Unification": "Dashboards",
};

export const normalizeModule = (m: string) => LEGACY_MODULE_MAP[m] ?? m;

/** Framework is SAFe-only for now; the model keeps room for Scrum later. */
export type Framework = "SAFe" | "Scrum";

export interface RoadmapItem {
  id: string;
  module: string;
  feature: string;
  priority: Priority;
  sprint: string;
  etaStaging: string | null; // ISO yyyy-mm-dd
  etaProduction: string | null;
  businessStatus: BusinessStatus;
  devStatus: DevStatus;
  deliveryStatus: DeliveryStatus;
  remarks: string;
  framework: Framework;
}

export type ScopeType = "project" | "module" | "feature" | "sprint";

export interface RoadmapFilterState {
  scopeType: ScopeType;
  scopeValue: string | null;
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

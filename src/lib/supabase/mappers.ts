import type { Consultation } from "@/lib/roadmap/consultations";
import type { RoadmapItem } from "@/lib/roadmap/types";
import { normalizeModule } from "@/lib/roadmap/types";
import type { Database } from "./database.types";

type RoadmapRow = Database["public"]["Tables"]["roadmap_items"]["Row"];
type ConsultationRow = Database["public"]["Tables"]["consultations"]["Row"];

export function roadmapRowToItem(row: RoadmapRow): RoadmapItem {
  return {
    id: row.id,
    module: normalizeModule(row.module),
    feature: row.feature,
    priority: row.priority as RoadmapItem["priority"],
    sprint: row.sprint,
    etaStaging: row.eta_staging,
    etaProduction: row.eta_production,
    businessStatus: row.business_status as RoadmapItem["businessStatus"],
    devStatus: row.dev_status as RoadmapItem["devStatus"],
    deliveryStatus: row.delivery_status as RoadmapItem["deliveryStatus"],
    remarks: row.remarks ?? "",
    framework: (row.framework as RoadmapItem["framework"]) ?? "SAFe",
  };
}

export function roadmapItemToRow(item: RoadmapItem): Database["public"]["Tables"]["roadmap_items"]["Insert"] {
  return {
    id: item.id,
    module: item.module,
    feature: item.feature,
    priority: item.priority,
    sprint: item.sprint,
    eta_staging: item.etaStaging || null,
    eta_production: item.etaProduction || null,
    business_status: item.businessStatus ?? "",
    dev_status: item.devStatus ?? "",
    delivery_status: item.deliveryStatus ?? "",
    remarks: item.remarks ?? "",
    framework: item.framework ?? "SAFe",
  };
}

export function roadmapPatchToRow(
  patch: Partial<RoadmapItem>,
): Database["public"]["Tables"]["roadmap_items"]["Update"] {
  const row: Database["public"]["Tables"]["roadmap_items"]["Update"] = {};
  if (patch.module !== undefined) row.module = patch.module;
  if (patch.feature !== undefined) row.feature = patch.feature;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.sprint !== undefined) row.sprint = patch.sprint;
  if (patch.etaStaging !== undefined) row.eta_staging = patch.etaStaging || null;
  if (patch.etaProduction !== undefined) row.eta_production = patch.etaProduction || null;
  if (patch.businessStatus !== undefined) row.business_status = patch.businessStatus ?? "";
  if (patch.devStatus !== undefined) row.dev_status = patch.devStatus ?? "";
  if (patch.deliveryStatus !== undefined) row.delivery_status = patch.deliveryStatus ?? "";
  if (patch.remarks !== undefined) row.remarks = patch.remarks ?? "";
  if (patch.framework !== undefined) row.framework = patch.framework;
  return row;
}

export function consultationRowToModel(row: ConsultationRow): Consultation {
  return {
    id: row.id,
    clientName: row.client_name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes ?? undefined,
  };
}

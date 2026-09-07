import { z } from "zod";
import { BUSINESS_STATUSES, DELIVERY_STATUSES, DEV_STATUSES, PRIORITIES } from "./types";

export const roadmapItemSchema = z.object({
  id: z.string().regex(/^DCAA-\d{3,}$/, "ID must look like DCAA-019"),
  module: z.string().min(1, "Module is required"),
  feature: z.string().min(2, "Feature is required"),
  priority: z.enum(PRIORITIES),
  sprint: z.string().min(1, "Sprint is required"),
  pi: z.string().min(1, "PI is required"),
  etaStaging: z.string().default(""),
  etaProduction: z.string().default(""),
  businessStatus: z.enum(BUSINESS_STATUSES),
  devStatus: z.enum(DEV_STATUSES),
  deliveryStatus: z.enum(DELIVERY_STATUSES),
  remarks: z.string().default(""),
});

export type RoadmapItemInput = z.infer<typeof roadmapItemSchema>;

import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";
import { roadmapItemToRow, roadmapPatchToRow, roadmapRowToItem } from "@/lib/supabase/mappers";
import type { RoadmapItem } from "@/lib/roadmap/types";

export async function fetchRoadmapItems(): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from("roadmap_items")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []).map(roadmapRowToItem);
}

export async function insertRoadmapItem(item: RoadmapItem): Promise<RoadmapItem> {
  const { data, error } = await supabase.from("roadmap_items").insert(roadmapItemToRow(item)).select().single();

  if (error) throw new Error(supabaseErrorMessage(error));
  return roadmapRowToItem(data);
}

export async function updateRoadmapItem(id: string, patch: Partial<RoadmapItem>): Promise<RoadmapItem> {
  const { data, error } = await supabase
    .from("roadmap_items")
    .update(roadmapPatchToRow(patch))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(supabaseErrorMessage(error));
  return roadmapRowToItem(data);
}

export async function deleteRoadmapItems(ids: string[]): Promise<void> {
  const { error } = await supabase.from("roadmap_items").delete().in("id", ids);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function nextRoadmapItemId(items: RoadmapItem[]): Promise<string> {
  const { data, error } = await supabase.from("roadmap_items").select("id").order("id", { ascending: false }).limit(50);

  if (error) {
    const max = items.reduce((acc, i) => {
      const n = Number(i.id.split("-")[1]);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
    return `DCAA-${String(max + 1).padStart(3, "0")}`;
  }

  const ids = [...(data ?? []).map((r) => r.id), ...items.map((i) => i.id)];
  const max = ids.reduce((acc, id) => {
    const n = Number(id.split("-")[1]);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `DCAA-${String(max + 1).padStart(3, "0")}`;
}

export async function resetRoadmapToSeed(): Promise<void> {
  const { error } = await supabase.rpc("reset_roadmap_to_seed");
  if (error) throw new Error(supabaseErrorMessage(error));
}

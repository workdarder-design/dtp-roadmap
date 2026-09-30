import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";
import { DEFAULT_MODULES, DEFAULT_SPRINTS } from "@/lib/roadmap/types";

export async function fetchProgramModules(): Promise<string[]> {
  const { data, error } = await supabase
    .from("program_modules")
    .select("name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "42P01") return [...DEFAULT_MODULES];
    throw new Error(supabaseErrorMessage(error));
  }
  if (!data?.length) return [...DEFAULT_MODULES];
  return data.map((r) => r.name);
}

export async function fetchProgramSprints(): Promise<string[]> {
  const { data, error } = await supabase
    .from("program_sprints")
    .select("name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "42P01") return [...DEFAULT_SPRINTS];
    throw new Error(supabaseErrorMessage(error));
  }
  if (!data?.length) return [...DEFAULT_SPRINTS];
  return data.map((r) => r.name);
}

export async function addProgramModule(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Module name is required");

  const { data: existing } = await supabase.from("program_modules").select("sort_order").order("sort_order", {
    ascending: false,
  }).limit(1);

  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("program_modules").insert({ name: trimmed, sort_order: sortOrder });
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function deleteProgramModule(name: string): Promise<void> {
  const { error } = await supabase.from("program_modules").delete().eq("name", name);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function addProgramSprint(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Sprint name is required");

  const { data: existing } = await supabase.from("program_sprints").select("sort_order").order("sort_order", {
    ascending: false,
  }).limit(1);

  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("program_sprints").insert({ name: trimmed, sort_order: sortOrder });
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function deleteProgramSprint(name: string): Promise<void> {
  const { error } = await supabase.from("program_sprints").delete().eq("name", name);
  if (error) throw new Error(supabaseErrorMessage(error));
}

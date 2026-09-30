import { slugifyClientName } from "@/lib/roadmap/slug";
import type { Consultation } from "@/lib/roadmap/consultations";
import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";
import { consultationRowToModel } from "@/lib/supabase/mappers";

export async function fetchConsultations(): Promise<Consultation[]> {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(supabaseErrorMessage(error));
  return (data ?? []).map(consultationRowToModel);
}

export async function fetchConsultationBySlug(slug: string): Promise<Consultation | null> {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("slug", slug)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(supabaseErrorMessage(error));
  const row = data?.[0];
  return row ? consultationRowToModel(row) : null;
}

export async function createConsultationRecord(input: {
  clientName: string;
  notes?: string;
}): Promise<Consultation> {
  const clientName = input.clientName.trim();
  const slug = slugifyClientName(clientName);
  if (!slug) {
    throw new Error("Client name must contain at least one letter or number");
  }

  const { data, error } = await supabase
    .from("consultations")
    .insert({
      client_name: clientName,
      slug,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(supabaseErrorMessage(error));
  return consultationRowToModel(data);
}

export async function updateConsultationRecord(
  id: string,
  patch: Partial<Pick<Consultation, "clientName" | "notes">>,
): Promise<Consultation> {
  const { data: existing, error: readErr } = await supabase.from("consultations").select("*").eq("id", id).single();
  if (readErr) throw new Error(supabaseErrorMessage(readErr));

  const clientName = patch.clientName?.trim() ?? existing.client_name;
  const slug = slugifyClientName(clientName);
  if (!slug) throw new Error("Client name must contain at least one letter or number");

  const { data, error } = await supabase
    .from("consultations")
    .update({
      client_name: clientName,
      slug,
      notes: patch.notes !== undefined ? patch.notes.trim() || null : existing.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(supabaseErrorMessage(error));
  return consultationRowToModel(data);
}

export async function deleteConsultationRecord(id: string): Promise<void> {
  const { error } = await supabase.from("consultations").delete().eq("id", id);
  if (error) throw new Error(supabaseErrorMessage(error));
}

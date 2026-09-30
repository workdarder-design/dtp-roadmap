import type { UserRole } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";

export interface TeamMember {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .order("created_at", { ascending: true });

  if (error) throw new Error(supabaseErrorMessage(error));

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  }));
}

export async function updateTeamMemberRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function deleteTeamMember(userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", { target_id: userId });
  if (error) throw new Error(supabaseErrorMessage(error));
}

export async function createTeamMember(input: {
  email: string;
  password: string;
  role: UserRole;
  displayName?: string;
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: {
      action: "create",
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
      displayName: input.displayName?.trim() || undefined,
    },
  });

  if (error) throw new Error(supabaseErrorMessage(error));

  const payload = data as { error?: string } | null;
  if (payload?.error) throw new Error(payload.error);
}

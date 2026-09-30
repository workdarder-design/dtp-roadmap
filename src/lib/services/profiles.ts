import type { UserRole } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";

export interface UserProfile {
  id: string;
  displayName: string | null;
  role: UserRole;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) throw new Error(supabaseErrorMessage(error));
  if (!data) return null;

  return {
    id: data.id,
    displayName: data.display_name,
    role: data.role,
  };
}

export async function updateProfileRole(userId: string, role: UserRole): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(supabaseErrorMessage(error));

  return {
    id: data.id,
    displayName: data.display_name,
    role: data.role,
  };
}

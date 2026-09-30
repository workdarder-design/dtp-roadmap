import { supabase } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase/errors";
import { isValidShareCode, normalizeShareCode, randomShareCode } from "@/lib/roadmap/shareCode";
import type { ProgramThemeColors } from "@/lib/theme/applyProgramTheme";
import { isValidCssColor } from "@/lib/theme/colorFormat";

type ThemeRow = {
  status_done_color: string | null;
  status_done_color_dark: string | null;
};

function mapThemeRow(row: ThemeRow | null): ProgramThemeColors {
  return {
    statusDoneLight: row?.status_done_color ?? null,
    statusDoneDark: row?.status_done_color_dark ?? null,
  };
}

export async function fetchProgramTheme(): Promise<ProgramThemeColors> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("status_done_color, status_done_color_dark")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code === "42703") return { statusDoneLight: null, statusDoneDark: null };
    throw new Error(supabaseErrorMessage(error));
  }

  return mapThemeRow(data as ThemeRow | null);
}

export async function updateProgramTheme(theme: ProgramThemeColors): Promise<ProgramThemeColors> {
  const light = theme.statusDoneLight?.trim() || null;
  const dark = theme.statusDoneDark?.trim() || null;

  if (light && !isValidCssColor(light)) {
    throw new Error("Invalid light-mode success color");
  }
  if (dark && !isValidCssColor(dark)) {
    throw new Error("Invalid dark-mode success color");
  }

  const { data, error } = await supabase
    .from("app_settings")
    .update({
      status_done_color: light,
      status_done_color_dark: dark,
    })
    .eq("id", 1)
    .select("status_done_color, status_done_color_dark")
    .single();

  if (error) throw new Error(supabaseErrorMessage(error));
  return mapThemeRow(data as ThemeRow);
}

export async function fetchShareToken(): Promise<string | null> {
  const { data, error } = await supabase.from("app_settings").select("share_token").eq("id", 1).maybeSingle();

  if (error) throw new Error(supabaseErrorMessage(error));
  const token = data?.share_token ?? null;
  return token ? normalizeShareCode(token) : null;
}

export async function validateShareToken(token: string): Promise<boolean> {
  const shareToken = await fetchShareToken();
  if (!shareToken) return false;
  return shareToken === normalizeShareCode(token);
}

export async function setShareCodeInDb(code: string): Promise<string> {
  const token = normalizeShareCode(code);
  if (!isValidShareCode(token)) {
    throw new Error("Share code must be 4–5 letters or numbers (a–z, 0–9)");
  }

  const { error } = await supabase.from("app_settings").update({ share_token: token }).eq("id", 1);

  if (error) throw new Error(supabaseErrorMessage(error));
  return token;
}

export async function rotateShareTokenInDb(): Promise<string> {
  return setShareCodeInDb(randomShareCode());
}

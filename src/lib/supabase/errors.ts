export function supabaseErrorMessage(error: { message?: string; code?: string } | null): string {
  if (!error) return "Something went wrong";
  if (error.code === "PGRST205") {
    return "Database is not set up yet. Run the Supabase migration in supabase/migrations.";
  }
  return error.message ?? "Something went wrong";
}

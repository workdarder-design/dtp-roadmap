import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const publishableKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      req.headers.get("apikey") ||
      "";
    const secretKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";

    if (!supabaseUrl || !publishableKey || !secretKey) {
      return json({ error: "Server is missing Supabase credentials" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ error: userError?.message ?? "Unauthorized" }, 401);
    }

    const adminDb = createClient(supabaseUrl, secretKey);
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      return json({ error: profileError?.message ?? "Admin access required" }, 403);
    }

    const body = await req.json();
    const action = body.action as string;

    if (action === "create") {
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(body.password ?? "");
      const role = body.role === "viewer" ? "viewer" : "admin";
      const displayName = String(body.displayName ?? "").trim() || email.split("@")[0];

      if (!email || password.length < 8) {
        return json({ error: "Valid email and password (8+ chars) required" }, 400);
      }

      const { data, error } = await adminDb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName, role },
      });

      if (error) {
        return json({ error: error.message }, 400);
      }

      if (data.user?.id) {
        await adminDb
          .from("profiles")
          .update({ role, display_name: displayName, email })
          .eq("id", data.user.id);
      }

      return json({ userId: data.user?.id, email });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return json({ error: message }, 500);
  }
});

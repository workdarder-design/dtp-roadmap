/**
 * Creates a confirmed admin user (server-side only — requires secret key).
 *
 * PowerShell:
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."  # Dashboard → Project Settings → API
 *   node scripts/create-admin.mjs
 *
 * Optional:
 *   $env:ADMIN_EMAIL = "admin@example.com"
 *   $env:ADMIN_PASSWORD = "Admin@123456"
 */
const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "Admin@123456";

if (!url || !serviceRole) {
  console.error(
    "Set VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY from Supabase → Project Settings → API (secret key).",
  );
  process.exit(1);
}

const res = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Admin", role: "admin" },
  }),
});

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error("Failed to create admin:", res.status, body);
  process.exit(1);
}

console.log("Admin user created:");
console.log("  Email:", email);
console.log("  Password:", password);
console.log("  User ID:", body.id ?? body.user?.id ?? "(see response)");
if (body.msg) console.log("  Note:", body.msg);

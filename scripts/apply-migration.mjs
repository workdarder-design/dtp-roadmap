/**
 * Applies supabase/migrations/20260330000000_initial_schema.sql via Supabase Management API.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_ACCESS_TOKEN = "your-personal-access-token"
 *   node scripts/apply-migration.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "mdeecqiugodycazypdsp";
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN (Supabase dashboard → Account → Access Tokens).");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(
  join(root, "supabase", "migrations", "20260330000000_initial_schema.sql"),
  "utf8",
);

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (!res.ok) {
  console.error("Migration failed:", res.status, text);
  process.exit(1);
}

console.log("Migration applied successfully.");
if (text.trim()) console.log(text);

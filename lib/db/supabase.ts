/**
 * Supabase service-role client — the system of record for /admin.
 *
 * SERVER-ONLY. The service-role key bypasses RLS, so this client must never
 * be imported into a client component or shipped to the browser. Every table
 * has RLS enabled with no policies (deny-all); the service role is the only
 * way in, which is why all DB access goes through server components / route
 * handlers gated by middleware.ts + auth().
 *
 * Fail-soft, like lib/admin/sheets.ts: if the env vars are absent the feature
 * degrades to an "unconfigured" empty state rather than throwing at import.
 *
 * Env vars (set on Vercel):
 *   SUPABASE_URL                (e.g. https://eetzayxxasfkunijofxg.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY   (Settings → API → service_role secret)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type DbHealth = {
  configured: boolean;
  ok: boolean;
  error?: string;
  url?: string;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && SERVICE_ROLE_KEY);
}

let _client: SupabaseClient<Database> | null = null;

/**
 * Returns the singleton service-role client. Throws a typed error if the
 * env is missing — callers in fail-soft paths should guard with
 * isSupabaseConfigured() first.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!URL || !SERVICE_ROLE_KEY) {
    throw new Error("Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  if (!_client) {
    _client = createClient<Database>(URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

/** Health check mirroring lib/admin/sheets.ts checkSheetHealth(). */
export async function checkDbHealth(): Promise<DbHealth> {
  if (!isSupabaseConfigured()) {
    return { configured: false, ok: false, error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set" };
  }
  try {
    // Cheapest possible round-trip: count zero rows on a tiny table.
    const { error } = await getSupabase()
      .from("events")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return { configured: true, ok: true, url: URL };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      url: URL,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

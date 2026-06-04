/**
 * Stored Google OAuth refresh token for the admin account. Captured once at
 * sign-in (when Google returns a refresh_token under access_type=offline +
 * prompt=consent) and reused server-side — including by background reads — to
 * mint short-lived Calendar API access tokens. One admin, so the latest row
 * wins. RLS deny-all; service-role only.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";

export async function saveGoogleRefreshToken(email: string, refreshToken: string, scope?: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await getSupabase()
      .from("google_tokens")
      .upsert({ email: email.toLowerCase(), refresh_token: refreshToken, scope: scope ?? null, updated_at: new Date().toISOString() }, { onConflict: "email" });
  } catch {
    /* best-effort — never break sign-in */
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await getSupabase()
      .from("google_tokens")
      .select("refresh_token")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { refresh_token: string } | null)?.refresh_token ?? null;
  } catch {
    return null;
  }
}

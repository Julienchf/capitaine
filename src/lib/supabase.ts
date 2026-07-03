import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when the app is not (yet) connected to a Supabase project — local-only mode. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // PKCE returns the token as ?code=… (query), not in the URL #fragment,
          // so it doesn't collide with the app's hash-based router.
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const isSyncConfigured = supabase !== null;

/** Shared household row id — both accounts read/write the same document. */
export const HOUSEHOLD_ID = "capitaine";

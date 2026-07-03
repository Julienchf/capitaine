import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when the app is not (yet) connected to a Supabase project — local-only mode. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // Implicit flow: the magic-link token works whatever browser opens it
          // (no code-verifier tied to the originating browser). With a path-based
          // router (createBrowserRouter) it doesn't collide with the URL.
          flowType: "implicit",
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const isSyncConfigured = supabase !== null;

/** Shared household row id — both accounts read/write the same document. */
export const HOUSEHOLD_ID = "capitaine";

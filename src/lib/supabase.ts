import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when the app is not (yet) connected to a Supabase project — local-only mode. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSyncConfigured = supabase !== null;

/** Shared household row id — both accounts read/write the same document. */
export const HOUSEHOLD_ID = "capitaine";

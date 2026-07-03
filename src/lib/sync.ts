import type { AppData } from "./types";
import { supabase, HOUSEHOLD_ID } from "./supabase";
import { applyRemote, getData, setPushHandler } from "./store";
import { shareSnapshot } from "./share";

const TABLE = "household";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Start two-way sync of the shared household document.
 * - Loads the remote copy (or seeds it from local on first run).
 * - Pushes local mutations (debounced) to Supabase.
 * - Applies realtime updates coming from the other account.
 * Call once, after a session is confirmed.
 */
export async function startSync(): Promise<void> {
  if (!supabase) return;

  const { data: row, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("id", HOUSEHOLD_ID)
    .maybeSingle();

  if (error) {
    console.warn("Sync: initial fetch failed", error.message);
  }

  if (row?.data) {
    applyRemote(row.data as AppData);
  } else {
    // First run for this household — seed the remote with what we have locally.
    await pushNow(getData());
  }

  // Push local changes upward (debounced to coalesce rapid edits).
  setPushHandler((d) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void pushNow(d), 600);
  });

  // Receive the other account's changes in near real time.
  supabase
    .channel("household-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${HOUSEHOLD_ID}` },
      (payload) => {
        const next = (payload.new as { data?: AppData })?.data;
        if (next) applyRemote(next);
      },
    )
    .subscribe();
}

async function pushNow(d: AppData): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: HOUSEHOLD_ID, data: d, updated_at: new Date().toISOString() });
  if (error) console.warn("Sync: push failed", error.message);
  // Keep the public share snapshot in sync too, if a link exists.
  if (d.shareToken) await publishShare();
}

/** Publish (or refresh) the public read-only snapshot for the current share token. */
export async function publishShare(): Promise<boolean> {
  if (!supabase) return false;
  const d = getData();
  if (!d.shareToken) return false;
  const { error } = await supabase
    .from("shares")
    .upsert({ id: d.shareToken, data: shareSnapshot(d), updated_at: new Date().toISOString() });
  if (error) {
    console.warn("Share: publish failed", error.message);
    return false;
  }
  return true;
}

export async function revokeShare(token: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("shares").delete().eq("id", token);
}

export function stopSync() {
  setPushHandler(null);
  if (debounceTimer) clearTimeout(debounceTimer);
  supabase?.removeAllChannels();
}

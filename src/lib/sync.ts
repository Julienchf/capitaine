import type { AppData } from "./types";
import { supabase, HOUSEHOLD_ID } from "./supabase";
import { applyRemote, getData, setPushHandler } from "./store";
import { mergeData } from "./merge";
import { shareSnapshot } from "./share";

const TABLE = "household";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let hydrated = false;
let hydrating = false;
let lastPushedJson = "";

/**
 * Load the remote document and MERGE it with the local one — never replace.
 * Safety rules that prevent data loss:
 * - a fetch failure NEVER leads to a write (retry instead),
 * - nothing is ever pushed before the remote state has been read once,
 * - local ∪ remote is pushed back only if it contains more than the remote.
 */
async function hydrate(): Promise<void> {
  if (!supabase || hydrating) return;
  hydrating = true;
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .select("data")
      .eq("id", HOUSEHOLD_ID)
      .maybeSingle();

    if (error) {
      console.warn("Sync : lecture du cloud impossible, nouvel essai dans 5 s…", error.message);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => void hydrate(), 5000);
      return;
    }

    if (row?.data) {
      const remote = row.data as AppData;
      const merged = mergeData(getData(), remote);
      applyRemote(merged);
      hydrated = true;
      if (JSON.stringify(merged) !== JSON.stringify(remote)) {
        await pushNow(getData());
      }
    } else {
      // The row genuinely doesn't exist: very first run for the household.
      hydrated = true;
      await pushNow(getData());
    }
  } finally {
    hydrating = false;
  }
}

function schedulePush(delay = 300) {
  if (!hydrated) return; // never write before having read the remote state
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushNow(getData());
  }, delay);
}

/** Send a pending push immediately (the app is being hidden/closed). */
function flushPendingPush() {
  if (debounceTimer && hydrated) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    void pushNow(getData());
  }
}

export async function startSync(): Promise<void> {
  if (!supabase) return;

  await hydrate();

  // Push local changes upward (debounced to coalesce rapid edits).
  setPushHandler(() => schedulePush());

  // Receive the other account's changes in near real time — merged, not applied blindly.
  supabase
    .channel("household-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${HOUSEHOLD_ID}` },
      (payload) => {
        const incoming = (payload.new as { data?: AppData } | null)?.data;
        if (!incoming) return;
        const incomingJson = JSON.stringify(incoming);
        if (incomingJson === lastPushedJson) return; // echo of our own push
        const merged = mergeData(getData(), incoming);
        applyRemote(merged);
        hydrated = true;
        // If we hold items the other device doesn't have, push the union back.
        if (JSON.stringify(merged) !== incomingJson) schedulePush();
      },
    )
    .subscribe((status) => {
      // After every (re)connection, catch up on anything missed while offline.
      if (status === "SUBSCRIBED") void hydrate();
    });

  // A PWA can stay frozen for hours: re-sync on wake, flush before sleeping.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void hydrate();
    else flushPendingPush();
  });
  window.addEventListener("focus", () => void hydrate());
  window.addEventListener("online", () => void hydrate());
  window.addEventListener("pagehide", flushPendingPush);
}

async function pushNow(d: AppData): Promise<void> {
  if (!supabase) return;
  const body = JSON.stringify(d);
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: HOUSEHOLD_ID, data: d, updated_at: new Date().toISOString() });
  if (error) {
    console.warn("Sync : envoi impossible, nouvel essai dans 5 s…", error.message);
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => void pushNow(getData()), 5000);
    return;
  }
  lastPushedJson = body;
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
  if (retryTimer) clearTimeout(retryTimer);
  supabase?.removeAllChannels();
}

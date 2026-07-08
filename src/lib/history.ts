import type { AppData } from "./types";
import { supabase, HOUSEHOLD_ID } from "./supabase";

const TABLE = "household_history";
/** How many past snapshots to keep. 40 ≈ several weeks of edits, well under the free-tier size limit. */
const KEEP = 40;

export interface SnapshotMeta {
  id: number;
  created_at: string;
  counts: { health: number; expenses: number; careEvents: number; treatments: number; appointments: number };
}

let lastSavedJson = "";

/**
 * Append a timestamped snapshot of the document, then prune to the last KEEP.
 * Called after every successful push. No-op if the data is unchanged since the
 * last snapshot (avoids piling identical rows during rapid re-syncs).
 */
export async function saveSnapshot(d: AppData): Promise<void> {
  if (!supabase) return;
  const json = JSON.stringify(d);
  if (json === lastSavedJson) return;

  const { error } = await supabase.from(TABLE).insert({ household_id: HOUSEHOLD_ID, data: d });
  if (error) {
    console.warn("Historique : instantané non enregistré", error.message);
    return;
  }
  lastSavedJson = json;

  // Prune everything older than the KEEP most recent snapshots.
  const { data: rows } = await supabase
    .from(TABLE)
    .select("id")
    .eq("household_id", HOUSEHOLD_ID)
    .order("created_at", { ascending: false })
    .range(KEEP, KEEP + 200);
  const stale = (rows ?? []).map((r) => (r as { id: number }).id);
  if (stale.length) await supabase.from(TABLE).delete().in("id", stale);
}

/** List available snapshots (most recent first), with lightweight item counts. */
export async function listSnapshots(): Promise<SnapshotMeta[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,created_at,data")
    .eq("household_id", HOUSEHOLD_ID)
    .order("created_at", { ascending: false })
    .limit(KEEP);
  if (error) {
    console.warn("Historique : lecture impossible", error.message);
    return [];
  }
  return (data ?? []).map((r) => {
    const row = r as { id: number; created_at: string; data: AppData };
    const d = row.data;
    return {
      id: row.id,
      created_at: row.created_at,
      counts: {
        health: d.health?.length ?? 0,
        expenses: d.expenses?.length ?? 0,
        careEvents: d.careEvents?.length ?? 0,
        treatments: d.treatments?.length ?? 0,
        appointments: d.appointments?.length ?? 0,
      },
    };
  });
}

/** Fetch the full document of a given snapshot, for restoring. */
export async function getSnapshot(id: number): Promise<AppData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("data").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return (data as { data: AppData }).data;
}

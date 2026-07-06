import type { AppData } from "./types";

/** Every collection in the document that is merged item-by-item. */
export const ARRAY_KEYS = [
  "careEvents",
  "health",
  "treatments",
  "appointments",
  "expenses",
  "stock",
  "questions",
] as const;

type Item = { id: string };

/**
 * Non-destructive merge of two document versions.
 *
 * - Collections are merged by item id (union) — an item present on either
 *   side survives, so one device can never wipe the other's entries.
 * - When both sides have the same item, the one edited most recently wins
 *   (per-item timestamps in `itemTs`, maintained by store.update()).
 * - Deletions are tombstones (`tombstones`), so a deletion on one device
 *   propagates instead of the item being resurrected by the union.
 * - Scalars (profile, careConfig, budget…) come from the most recently
 *   edited document.
 */
export function mergeData(a: AppData, b: AppData): AppData {
  const newer = (a.updatedAt ?? 0) >= (b.updatedAt ?? 0) ? a : b;
  const older = newer === a ? b : a;
  const out: AppData = JSON.parse(JSON.stringify(newer));

  // Per-item edit timestamps: keep the max of both sides.
  const itemTs: Record<string, number> = {};
  for (const src of [a.itemTs, b.itemTs]) {
    for (const [id, ts] of Object.entries(src ?? {})) {
      itemTs[id] = Math.max(itemTs[id] ?? 0, ts);
    }
  }
  // Deletion tombstones: keep the max of both sides.
  const tombstones: Record<string, number> = {};
  for (const src of [a.tombstones, b.tombstones]) {
    for (const [id, ts] of Object.entries(src ?? {})) {
      tombstones[id] = Math.max(tombstones[id] ?? 0, ts);
    }
  }
  // An item edited AFTER its deletion cancels the tombstone.
  for (const [id, delTs] of Object.entries(tombstones)) {
    if ((itemTs[id] ?? 0) > delTs) delete tombstones[id];
  }

  for (const key of ARRAY_KEYS) {
    const merged = new Map<string, Item>();
    for (const item of ((b[key] ?? []) as unknown as Item[])) merged.set(item.id, item);
    for (const item of ((a[key] ?? []) as unknown as Item[])) {
      const other = merged.get(item.id);
      if (!other) {
        merged.set(item.id, item);
      } else {
        const ta = (a.itemTs ?? {})[item.id] ?? 0;
        const tb = (b.itemTs ?? {})[item.id] ?? 0;
        if (ta >= tb) merged.set(item.id, item);
      }
    }
    (out as unknown as Record<string, Item[]>)[key] = [...merged.values()].filter(
      (item) => tombstones[item.id] === undefined,
    );
  }

  out.itemTs = itemTs;
  out.tombstones = tombstones;
  out.updatedAt = Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0);
  // A share link generated on either device must survive the merge.
  out.shareToken = newer.shareToken ?? older.shareToken;
  return out;
}

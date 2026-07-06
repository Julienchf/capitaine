import { useSyncExternalStore } from "react";
import type { AppData } from "./types";
import { DEFAULT_CARE_CONFIG } from "./types";
import { ARRAY_KEYS, mergeData } from "./merge";
import { addDays, todayISO } from "./dates";

const KEY = "capitaine.data.v1";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const CLINIC = {
  vetName: "Clinique Vétérinaire du Dr Sutter",
  vetPhone: "01 42 02 12 01",
  vetAddress: "46 Boulevard de Magenta, 75010 Paris",
  vetWebsite: "https://www.clinique-veterinaire-magenta.fr/",
  vetHours:
    "Mardi 9h–21h · Mer.–Ven. 9h–19h30 · Samedi 9h–17h30 · Dim. & Lundi fermé",
};

const GUIDE = {
  feeding:
    "• Rythme : 2×/jour, matin et soir\n" +
    "• Quantité : 70 g par repas\n" +
    "• On humidifie les croquettes (un peu d'eau dans le fond de la gamelle, ça l'aide à digérer)",
  outings:
    "Normalement propre la nuit, mais peut se réveiller assez tôt.\n" +
    "1. Après le réveil\n" +
    "2. Avant / après le repas du midi\n" +
    "3. Plusieurs fois dans l'après-midi\n" +
    "4. Après le repas du soir\n" +
    "5. Avant d'aller dormir\n\n" +
    "Au parc à chien : parfois trop d'excitation, il peut se mettre à aboyer. On le calme en le mettant à l'écart un moment ; si c'est le point de non-retour, on part.",
  commands:
    "En cours d'apprentissage : Assis · Couché · Pas bouger · La patte (et l'autre) · " +
    "Stop · Au pied (viens) · Attends · Doucement (surtout pour la nourriture, quand il joue trop fort ou tire sur la laisse).",
  rules:
    "• Il ne mange qu'à ses repas\n" +
    "• Exception : les friandises, mais il doit faire quelque chose pour en avoir\n" +
    "• Bain 1×/mois maximum (déconseillé plus souvent pour la race), à l'eau de préférence s'il n'est pas trop sale\n" +
    "• À la maison : autorisé sur le canapé et le lit",
};

function seed(): AppData {
  const t = todayISO();
  return {
    profile: {
      name: "Capitaine",
      breed: "Border terrier",
      birthDate: "2025-04-18",
      ...CLINIC,
      ...GUIDE,
      emergencyNote: "",
    },
    monthlyBudget: 200,
    careConfig: JSON.parse(JSON.stringify(DEFAULT_CARE_CONFIG)),
    careEvents: [
      { id: uid(), kind: "antiparasite", date: addDays(t, -25) },
      { id: uid(), kind: "vermifuge", date: addDays(t, -40) },
      { id: uid(), kind: "epilation", date: addDays(t, -95) },
    ],
    health: [],
    treatments: [],
    appointments: [],
    expenses: [],
    stock: [
      {
        id: uid(),
        name: "Croquettes",
        kind: "croquettes",
        lastRestock: addDays(t, -25),
        durationDays: 30,
      },
    ],
    questions: [],
  };
}

let data: AppData = load();
const listeners = new Set<() => void>();

/** Optional remote sync: set by the sync layer once a session is active. */
let pushHandler: ((d: AppData) => void) | null = null;
let applyingRemote = false;

export function setPushHandler(fn: ((d: AppData) => void) | null) {
  pushHandler = fn;
}

/** Apply data received from the remote without echoing it back. */
export function applyRemote(incoming: AppData) {
  applyingRemote = true;
  data = normalize(incoming);
  persist();
  applyingRemote = false;
}

/** Current in-memory snapshot, for seeding the remote on first sync. */
export function getData(): AppData {
  return data;
}

/** Fill in fields added after a user's data was first saved. */
function normalize(d: AppData): AppData {
  if (!d.careConfig) {
    d.careConfig = JSON.parse(JSON.stringify(DEFAULT_CARE_CONFIG));
  }
  if (!d.treatments) d.treatments = [];
  if (!d.appointments) d.appointments = [];
  // Migrate the old single nextVetVisit into the appointments list.
  if (d.profile?.nextVetVisit) {
    d.appointments.push({
      id: uid(),
      date: d.profile.nextVetVisit,
      reason: "Rendez-vous",
      attachments: [],
    });
    d.profile.nextVetVisit = undefined;
  }
  // Ensure every appointment has an attachments array.
  d.appointments.forEach((a) => {
    if (!a.attachments) a.attachments = [];
  });
  // Fill the vet clinic info once, only if nothing was entered yet.
  if (d.profile && !d.profile.vetName && !d.profile.vetPhone && !d.profile.vetAddress) {
    Object.assign(d.profile, CLINIC);
  }
  // Fill the care guide once, only if nothing was entered yet.
  if (d.profile && !d.profile.feeding && !d.profile.outings && !d.profile.commands && !d.profile.rules) {
    Object.assign(d.profile, GUIDE);
  }
  // Hardening: every collection must be an array (a malformed doc from an
  // old app version must never crash the app).
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray((d as unknown as Record<string, unknown>)[key])) {
      (d as unknown as Record<string, unknown>)[key] = [];
    }
  }
  d.health.forEach((h) => {
    if (!Array.isArray(h.attachments)) h.attachments = [];
  });
  // Sync bookkeeping fields.
  if (!d.itemTs || typeof d.itemTs !== "object") d.itemTs = {};
  if (!d.tombstones || typeof d.tombstones !== "object") d.tombstones = {};
  // Prune: tombstones older than 90 days, and timestamps of vanished items.
  const cutoff = Date.now() - 90 * 86400000;
  for (const [id, ts] of Object.entries(d.tombstones)) {
    if (ts < cutoff) delete d.tombstones[id];
  }
  const liveIds = new Set<string>();
  for (const key of ARRAY_KEYS) {
    for (const item of d[key] as { id: string }[]) liveIds.add(item.id);
  }
  for (const id of Object.keys(d.itemTs)) {
    if (!liveIds.has(id)) delete d.itemTs[id];
  }
  return d;
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw) as AppData);
  } catch {
    /* ignore */
  }
  const s = seed();
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  return s;
}

let storageFullWarned = false;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full (large attachments): surface it instead of failing silently
    // — a silently-stale local copy is how data gets lost.
    console.error("Stockage local plein ou indisponible :", e);
    if (!storageFullWarned) {
      storageFullWarned = true;
      setTimeout(() => {
        alert(
          "⚠️ Le stockage local de l'appareil est plein : les pièces jointes sont trop lourdes. " +
            "Les données restent synchronisées dans le cloud, mais pense à supprimer quelques grosses pièces jointes.",
        );
      }, 100);
    }
  }
  listeners.forEach((l) => l());
  if (pushHandler && !applyingRemote) pushHandler(data);
}

function deepClone(d: AppData): AppData {
  return typeof structuredClone === "function"
    ? structuredClone(d)
    : (JSON.parse(JSON.stringify(d)) as AppData);
}

/**
 * Mutate the store with an updater and notify subscribers.
 * Automatically maintains the sync bookkeeping used by mergeData():
 * - stamps `itemTs[id]` for every added or edited item,
 * - records a tombstone for every removed item.
 */
export function update(mutator: (draft: AppData) => void) {
  const prev = data;
  const next = deepClone(data);
  mutator(next);

  const now = Date.now();
  const itemTs = { ...(next.itemTs ?? {}) };
  const tombstones = { ...(next.tombstones ?? {}) };
  for (const key of ARRAY_KEYS) {
    const prevArr = (prev[key] ?? []) as { id: string }[];
    const nextArr = (next[key] ?? []) as { id: string }[];
    const prevJson = new Map(prevArr.map((i) => [i.id, JSON.stringify(i)]));
    const nextIds = new Set<string>();
    for (const item of nextArr) {
      nextIds.add(item.id);
      const before = prevJson.get(item.id);
      if (before === undefined || before !== JSON.stringify(item)) {
        itemTs[item.id] = now;
        delete tombstones[item.id];
      }
    }
    for (const id of prevJson.keys()) {
      if (!nextIds.has(id)) {
        tombstones[id] = now;
        delete itemTs[id];
      }
    }
  }
  next.itemTs = itemTs;
  next.tombstones = tombstones;
  next.updatedAt = now;

  data = next;
  persist();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot() {
  return data;
}

export function useData(): AppData {
  return useSyncExternalStore(subscribe, snapshot);
}

export function resetData() {
  data = seed();
  persist();
}

// Dev-only hook so merge/sync behaviour can be tested from the console.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__cap = { getData, update, mergeData, resetData };
}

export type CareKind = "epilation" | "antiparasite" | "vermifuge";

export interface CareEvent {
  id: string;
  kind: CareKind;
  date: string; // ISO yyyy-mm-dd
  cost?: number;
  note?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  dataUrl: string; // base64 data URL (photo or PDF)
  type: string;
}

export interface HealthEntry {
  id: string;
  date: string;
  title: string;
  description?: string;
  medications?: string;
  cost?: number;
  attachments: Attachment[];
}

export type ExpenseCategory =
  | "veto"
  | "nourriture"
  | "friandises"
  | "hygiene"
  | "accessoires"
  | "toilettage"
  | "dogsitting"
  | "assurance"
  | "autre";

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  label?: string;
  attachments?: Attachment[];
}

export type StockKind = "croquettes" | "friandises" | "sacs" | "autre";

export interface StockPurchase {
  id: string;
  date: string; // ISO date
  amount: number;
}

export interface StockItem {
  id: string;
  name: string;
  kind: StockKind;
  lastRestock: string; // ISO date
  durationDays: number; // how long one restock is expected to last
  cost?: number; // cost of one restock (€)
  purchases?: StockPurchase[]; // logged restock purchases, for the budget
}

export const STOCK_META: Record<StockKind, { label: string; emoji: string; icon: string; iconClass: string }> = {
  croquettes: { label: "Croquettes", emoji: "🥣", icon: "bowl", iconClass: "ic-warning" },
  friandises: { label: "Friandises", emoji: "🦴", icon: "bone", iconClass: "ic-accent" },
  sacs: { label: "Sacs à caca", emoji: "💩", icon: "bag", iconClass: "ic-muted" },
  autre: { label: "Autre", emoji: "📦", icon: "box", iconClass: "ic-muted" },
};

export interface VetQuestion {
  id: string;
  text: string;
  description?: string;
  done: boolean;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  date: string; // ISO date
  reason?: string;
  notes?: string;
  attachments: Attachment[];
}

export type AntiparasiteForm = "cachet" | "piqure";

export interface CareConfig {
  intervalDays: number;
  antiparasiteForm?: AntiparasiteForm;
  /** Optional manual target date for the next care (overrides the computed one). */
  plannedDate?: string;
}

export interface Treatment {
  id: string;
  healthEntryId?: string;
  medication: string;
  dose?: string;
  frequency?: string;
  timing?: string; // moment de la prise (matin, soir…)
  startDate: string;
  endDate?: string;
  notes?: string;
  /** Follow-up after the treatment ends: has the outcome been recorded? */
  followUpDone?: boolean;
  resolved?: boolean;
  stopReason?: string;
  attachments?: Attachment[];
}

/** Days before the due date at which a reminder should fire. */
export const REMINDER_OFFSETS = [30, 15, 7];

/** Quick-pick options for how often a treatment is given. */
export const FREQUENCY_PRESETS = ["1×/jour", "2×/jour", "3×/jour"];

/** Quick-pick options for when the treatment is given (multi-select). */
export const TIMING_PRESETS = ["Matin", "Midi", "Soir", "Pendant les repas"];

/** Reasons a treatment is stopped. */
export const STOP_REASONS = [
  "Problème résolu",
  "Fin de la durée prescrite",
  "Changement de traitement",
  "Effets indésirables",
  "Sur recommandation du vétérinaire",
  "Autre",
];

/** Structured "mode d'emploi" for the dogsitter (replaces the old free-text guide). */
export type TriState = "oui" | "non" | "depend";

export interface DogGuide {
  // Caractère
  sociable?: TriState;
  sociableNote?: string;
  energy?: "bas" | "moyen" | "haut";
  dominant?: TriState;
  dominantNote?: string;
  // Repas
  mealsPerDay?: 1 | 2 | 3;
  mealGrams?: number;
  kibbleBrand?: string;
  kibbleUrl?: string;
  treats?: "oui" | "non" | "parfois";
  treatsNote?: string;
  mealsNote?: string;
  // Sorties
  housetrained?: "propre" | "presque" | "non";
  outingMoments?: string[];
  dogPark?: "oui" | "non";
  dogParkNote?: string;
  offLeash?: "oui" | "non";
  offLeashNote?: string;
  outingsNote?: string;
  // Tours
  tricks?: string[];
  tricksNote?: string;
  // Règles à la maison
  sofa?: "oui" | "non" | "parfois";
  bed?: "oui" | "non" | "parfois";
  bath?: "oui" | "non" | "eviter";
}

/** Choix possibles des moments de sortie (multi-sélection). */
export const OUTING_MOMENTS = [
  "Au réveil",
  "Après chaque repas",
  "Milieu de journée",
  "Fin d'après-midi",
  "Avant de dormir",
  "Toutes les 2–3 h",
  "Quand il demande",
];

/** Libellés d'affichage des valeurs du guide. */
export const GUIDE_LABELS: Record<string, string> = {
  oui: "Oui",
  non: "Non",
  depend: "Ça dépend",
  parfois: "Parfois",
  eviter: "À éviter",
  bas: "Basse",
  moyen: "Moyenne",
  haut: "Haute",
  propre: "Propre",
  presque: "Presque propre",
};

export interface Profile {
  name: string;
  breed: string;
  birthDate: string; // ISO
  vetName?: string;
  vetPhone?: string;
  vetEmail?: string;
  vetAddress?: string;
  vetMapsUrl?: string;
  vetWebsite?: string;
  vetHours?: string;
  photoDataUrl?: string;
  emergencyNote?: string;
  // Guide de garde (mode d'emploi pour la dogsitter)
  feeding?: string;
  outings?: string;
  commands?: string;
  rules?: string;
  /** Structured care guide (new). Falls back to the free-text fields above if absent. */
  guide?: DogGuide;
  nextVetVisit?: string; // deprecated — migrated to appointments[]
}

export interface AppData {
  profile: Profile;
  monthlyBudget: number;
  careConfig: Record<CareKind, CareConfig>;
  careEvents: CareEvent[];
  health: HealthEntry[];
  treatments: Treatment[];
  appointments: Appointment[];
  expenses: Expense[];
  stock: StockItem[];
  questions: VetQuestion[];
  /** Token of the public read-only share link (if generated). */
  shareToken?: string;
  /** Last local edit (ms epoch) — used to pick scalar fields during merge. */
  updatedAt?: number;
  /** Per-item last-edit timestamps (id → ms epoch), maintained automatically. */
  itemTs?: Record<string, number>;
  /** Deletion tombstones (id → ms epoch) so deletions sync without resurrect. */
  tombstones?: Record<string, number>;
}

export const CARE_META: Record<
  CareKind,
  { label: string; icon: string; defaultIntervalDays: number; iconClass: string }
> = {
  antiparasite: {
    label: "Antiparasite",
    icon: "🐛",
    defaultIntervalDays: 90,
    iconClass: "ic-danger",
  },
  vermifuge: {
    label: "Vermifuge",
    icon: "💊",
    defaultIntervalDays: 90,
    iconClass: "ic-warning",
  },
  epilation: {
    label: "Épilation",
    icon: "✂️",
    defaultIntervalDays: 120,
    iconClass: "ic-muted",
  },
};

export const ANTIPARASITE_FORMS: Record<
  AntiparasiteForm,
  { label: string; intervalDays: number; hint: string }
> = {
  cachet: { label: "Cachet", intervalDays: 90, hint: "tous les 3 mois" },
  piqure: { label: "Piqûre", intervalDays: 365, hint: "tous les 12 mois" },
};

export const DEFAULT_CARE_CONFIG: Record<CareKind, CareConfig> = {
  antiparasite: { intervalDays: 90, antiparasiteForm: "cachet" },
  vermifuge: { intervalDays: 90 },
  epilation: { intervalDays: 120 },
};

export const EXPENSE_META: Record<
  ExpenseCategory,
  { label: string; icon: string }
> = {
  veto: { label: "Vétérinaire", icon: "🏥" },
  nourriture: { label: "Nourriture", icon: "🥣" },
  friandises: { label: "Friandises", icon: "🦴" },
  hygiene: { label: "Produits d'hygiène", icon: "🧴" },
  accessoires: { label: "Accessoires", icon: "🎽" },
  toilettage: { label: "Toilettage", icon: "✂️" },
  dogsitting: { label: "Dogsitting", icon: "🏠" },
  assurance: { label: "Assurance", icon: "🛡️" },
  autre: { label: "Autre", icon: "🐾" },
};

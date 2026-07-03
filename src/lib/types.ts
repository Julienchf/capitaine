export type CareKind = "epilation" | "antiparasite" | "vermifuge";

export interface CareEvent {
  id: string;
  kind: CareKind;
  date: string; // ISO yyyy-mm-dd
  cost?: number;
  note?: string;
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
  | "assurance"
  | "autre";

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  label?: string;
}

export interface StockItem {
  id: string;
  name: string;
  kind: "croquettes" | "friandises";
  lastRestock: string; // ISO date
  durationDays: number; // how long one restock is expected to last
}

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
  assurance: { label: "Assurance", icon: "🛡️" },
  autre: { label: "Autre", icon: "🐾" },
};

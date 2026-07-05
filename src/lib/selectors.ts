import type { AppData, Appointment, CareKind, Expense, ExpenseCategory, StockItem, StockKind, Treatment } from "./types";
import { CARE_META, REMINDER_OFFSETS } from "./types";
import { addDays, daysBetween, todayISO } from "./dates";

export function careInterval(data: AppData, kind: CareKind): number {
  return data.careConfig?.[kind]?.intervalDays ?? CARE_META[kind].defaultIntervalDays;
}

export interface CareStatus {
  kind: CareKind;
  lastDone: string | null;
  nextDue: string | null;
  planned: boolean; // nextDue comes from a manual planned date
  overdue: boolean;
  daysUntil: number | null;
  /** The next reminder milestone (30/15/7 days before), if within range. */
  reminderDays: number | null;
}

export function careStatus(data: AppData, kind: CareKind): CareStatus {
  const events = data.careEvents
    .filter((e) => e.kind === kind)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastDone = events[0]?.date ?? null;
  const planned = data.careConfig?.[kind]?.plannedDate ?? null;

  let nextDue: string | null = null;
  if (planned) nextDue = planned;
  else if (lastDone) nextDue = addDays(lastDone, careInterval(data, kind));

  if (!nextDue) {
    return {
      kind, lastDone, nextDue: null, planned: false,
      overdue: !!lastDone, daysUntil: null, reminderDays: null,
    };
  }
  const daysUntil = daysBetween(todayISO(), nextDue);
  const reminderDays =
    daysUntil >= 0 ? REMINDER_OFFSETS.find((o) => daysUntil <= o) ?? null : null;
  return {
    kind, lastDone, nextDue, planned: !!planned,
    overdue: daysUntil < 0, daysUntil, reminderDays,
  };
}

export function allCareStatuses(data: AppData): CareStatus[] {
  return (Object.keys(CARE_META) as CareKind[])
    .map((k) => careStatus(data, k))
    .sort((a, b) => {
      const av = a.daysUntil ?? -9999;
      const bv = b.daysUntil ?? -9999;
      return av - bv;
    });
}

export interface StockStatus {
  item: StockItem;
  daysLeft: number;
  runOutDate: string;
  low: boolean;
  /** Nearest reminder milestone (30/15/7 days before run-out), if within range. */
  reminderDays: number | null;
}

export function stockStatus(item: StockItem): StockStatus {
  const runOutDate = addDays(item.lastRestock, item.durationDays);
  const daysLeft = daysBetween(todayISO(), runOutDate);
  const reminderDays =
    daysLeft >= 0 ? REMINDER_OFFSETS.find((o) => daysLeft <= o) ?? null : null;
  return { item, daysLeft, runOutDate, low: daysLeft <= 7, reminderDays };
}

export function expensesBetween(
  expenses: Expense[],
  fromISO: string,
  toISO: string,
): Expense[] {
  return expenses
    .filter((e) => e.date >= fromISO && e.date <= toISO)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function sum(expenses: Expense[]): number {
  return expenses.reduce((t, e) => t + e.amount, 0);
}

/** A line in the budget — from a manual expense, a care event, a health entry or a stock purchase. */
export interface BudgetItem {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  label: string;
  source: "expense" | "soin" | "sante" | "stock";
  expenseId?: string; // set when the item is an editable manual expense
}

function stockCategory(kind: StockKind): ExpenseCategory {
  if (kind === "croquettes") return "nourriture";
  if (kind === "friandises") return "friandises";
  if (kind === "sacs") return "hygiene";
  return "autre";
}

/** All money spent in a date range, aggregated across every source. */
export function budgetItems(data: AppData, fromISO: string, toISO: string): BudgetItem[] {
  const inRange = (d: string) => d >= fromISO && d <= toISO;
  const items: BudgetItem[] = [];

  for (const e of data.expenses) {
    if (inRange(e.date))
      items.push({ id: e.id, date: e.date, amount: e.amount, category: e.category, label: e.label || "", source: "expense", expenseId: e.id });
  }
  for (const c of data.careEvents) {
    if (c.cost && inRange(c.date))
      items.push({ id: `care-${c.id}`, date: c.date, amount: c.cost, category: c.kind === "epilation" ? "toilettage" : "veto", label: CARE_META[c.kind].label, source: "soin" });
  }
  for (const h of data.health) {
    if (h.cost && inRange(h.date))
      items.push({ id: `health-${h.id}`, date: h.date, amount: h.cost, category: "veto", label: h.title, source: "sante" });
  }
  for (const s of data.stock) {
    for (const p of s.purchases ?? []) {
      if (inRange(p.date))
        items.push({ id: `stock-${p.id}`, date: p.date, amount: p.amount, category: stockCategory(s.kind), label: s.name, source: "stock" });
    }
  }
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export function budgetTotal(items: BudgetItem[]): number {
  return items.reduce((t, i) => t + i.amount, 0);
}

/** A treatment is active if today is within its window AND it wasn't stopped. */
export function isTreatmentActive(t: Treatment): boolean {
  if (t.stopReason) return false; // explicitly stopped → archived immediately
  const today = todayISO();
  if (t.startDate > today) return false;
  if (t.endDate && t.endDate < today) return false;
  return true;
}

export function activeTreatments(data: AppData): Treatment[] {
  return data.treatments
    .filter(isTreatmentActive)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Finished treatments whose outcome hasn't been recorded yet. */
export function treatmentsAwaitingFollowUp(data: AppData): Treatment[] {
  const today = todayISO();
  return data.treatments.filter(
    (t) => t.endDate && t.endDate < today && !t.followUpDone,
  );
}

/** Upcoming appointments (today or later), soonest first. */
export function upcomingAppointments(data: AppData): Appointment[] {
  const today = todayISO();
  return [...data.appointments]
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function nextAppointment(data: AppData): Appointment | null {
  return upcomingAppointments(data)[0] ?? null;
}

/** Past appointments (before today), most recent first. */
export function pastAppointments(data: AppData): Appointment[] {
  const today = todayISO();
  return [...data.appointments]
    .filter((a) => a.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Budget target for an arbitrary period, prorated from the monthly budget. */
export function periodBudget(monthlyBudget: number, fromISO: string, toISO: string): number {
  const days = daysBetween(fromISO, toISO) + 1;
  return Math.round((monthlyBudget * days) / 30.44);
}

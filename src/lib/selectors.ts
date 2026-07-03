import type { AppData, Appointment, CareKind, Expense, StockItem, Treatment } from "./types";
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

/** A treatment is active if today is within its start/end window. */
export function isTreatmentActive(t: Treatment): boolean {
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

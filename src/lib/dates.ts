/**
 * Format a Date as yyyy-mm-dd using its LOCAL components.
 * Never use Date.toISOString() for this: it converts to UTC, which in a
 * positive-offset timezone (France) shifts the calendar day backwards and
 * makes "today" or an end-of-month day land on the wrong date.
 */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Last calendar day of the month a yyyy-mm key points to (local, tz-safe). */
export function endOfMonthISO(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return toISODate(new Date(y, m, 0));
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO).getTime();
  const b = parseISO(toISO).getTime();
  return Math.round((b - a) / 86400000);
}

const MONTHS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function formatDate(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Human-friendly "in X days" / "X days ago" relative to today. */
export function relativeToToday(iso: string): { text: string; days: number } {
  const days = daysBetween(todayISO(), iso);
  if (days === 0) return { text: "aujourd'hui", days };
  if (days === 1) return { text: "demain", days };
  if (days === -1) return { text: "hier", days };
  if (days > 0) {
    if (days < 14) return { text: `dans ${days} j`, days };
    if (days < 60) return { text: `dans ${Math.round(days / 7)} sem.`, days };
    return { text: `dans ${Math.round(days / 30)} mois`, days };
  }
  const a = -days;
  if (a < 14) return { text: `il y a ${a} j`, days };
  if (a < 60) return { text: `il y a ${Math.round(a / 7)} sem.`, days };
  return { text: `il y a ${Math.round(a / 30)} mois`, days };
}

/** Age of the dog, in "X an(s) Y mois". */
export function ageText(birthISO: string): string {
  const b = parseISO(birthISO);
  const now = new Date();
  let months =
    (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} an${y > 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} mois`);
  if (parts.length === 0) return "quelques jours";
  return parts.join(" ");
}

/**
 * Human-age equivalent for a small dog (border terrier ~ small/medium breed).
 * Common formula: 15 years for year 1, 9 for year 2, then ~4 per year.
 */
export function humanAge(birthISO: string): number {
  const days = daysBetween(birthISO, todayISO());
  const years = days / 365.25;
  if (years <= 0) return 0;
  if (years <= 1) return Math.round(years * 15);
  if (years <= 2) return Math.round(15 + (years - 1) * 9);
  return Math.round(24 + (years - 2) * 4);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // yyyy-mm
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const names = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${names[m - 1]} ${y}`;
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7);
}

export function startOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`;
}

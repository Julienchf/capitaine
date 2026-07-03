import type { AppData } from "./types";

/**
 * The read-only data exposed through a public share link: everything the
 * dogsitter needs (identity, vet, care guide, treatments, care, history) but
 * NEVER the budget/expenses (nor stock or private vet questions).
 */
export function shareSnapshot(data: AppData): AppData {
  return {
    ...data,
    expenses: [],
    monthlyBudget: 0,
    stock: [],
    questions: [],
  };
}

export function shareUrl(token: string): string {
  return `${window.location.origin}/s/${token}`;
}

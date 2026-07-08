import type { ExpenseCategory, CareKind } from "./types";
import { fileToDataUrl } from "./format";

/** Fields the invoice extractor may return. All optional — the user validates before saving. */
export interface ExtractedFacture {
  date?: string;
  amount?: number;
  category?: ExpenseCategory;
  label?: string;
  vendor?: string;
  careType?: CareKind | "none";
  medications?: string;
  summary?: string;
}

/** Max size we send to the extractor (Gemini inline limit is generous; keep it sane). */
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Send a PDF or image invoice to the serverless extractor and get back the
 * pre-fill fields. Throws with a user-facing French message on failure.
 */
export async function extractFacture(file: File): Promise<ExtractedFacture> {
  if (file.size > MAX_BYTES) {
    throw new Error("Fichier trop lourd (max 15 Mo).");
  }
  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(",")[1] ?? "";
  const mimeType = file.type || (dataUrl.match(/^data:(.*?);/)?.[1] ?? "application/octet-stream");

  let res: Response;
  try {
    res = await fetch("/.netlify/functions/extract-facture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileBase64: base64, mimeType }),
    });
  } catch {
    throw new Error("Analyse indisponible (pas de connexion au serveur).");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error || "L'analyse de la facture a échoué.");
  }
  const f = body.fields as ExtractedFacture;
  // Normalise: drop the "none" sentinel and empty strings.
  if (f.careType === "none") f.careType = undefined;
  if (f.medications === "") f.medications = undefined;
  if (f.date === "") f.date = undefined;
  return f;
}

import { useState } from "react";
import Icon from "./Icon";
import { uid } from "../lib/store";
import { fileToDataUrl } from "../lib/format";
import { extractFacture, type ExtractedFacture } from "../lib/extract";
import type { Attachment } from "../lib/types";

/**
 * Reusable "Charger une facture" button.
 * - Keeps the file as an attachment (via onAttachment), whatever happens next.
 * - Sends it to the extractor and hands the parsed fields back (via onFields)
 *   so each sheet pre-fills its own inputs.
 */
export default function FactureLoader({
  onAttachment,
  onFields,
  label = "Charger une facture (PDF ou photo)",
}: {
  onAttachment: (a: Attachment) => void;
  onFields: (f: ExtractedFacture) => void;
  label?: string;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    // Keep every file as an attachment, whatever the extraction does.
    for (const file of list) {
      const dataUrl = await fileToDataUrl(file);
      onAttachment({ id: uid(), name: file.name, dataUrl, type: file.type });
    }
    setAnalyzing(true);
    setNote(null);
    try {
      const f = await extractFacture(list);
      onFields(f);
      const n = list.length > 1 ? `${list.length} documents analysés` : "Facture analysée";
      setNote(`${n} — champs pré-remplis, vérifie puis enregistre. ✅`);
    } catch (e) {
      setNote((e as Error).message + " Les fichiers restent joints, saisis les champs à la main.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <label
        className="btn block"
        style={{
          marginBottom: 4,
          cursor: analyzing ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Icon name={analyzing ? "sparkles" : "file"} size={18} />
        {analyzing ? "Analyse de la facture…" : label}
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          disabled={analyzing}
          onChange={(e) => {
            void handle(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {note && (
        <div className="meta" style={{ marginBottom: 8, lineHeight: 1.4, color: "var(--muted)" }}>
          {note}
        </div>
      )}
    </>
  );
}

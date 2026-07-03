import Sheet from "./Sheet";
import { update } from "../lib/store";
import type { Treatment } from "../lib/types";
import { STOP_REASONS } from "../lib/types";
import { todayISO } from "../lib/dates";

export default function StopTreatmentSheet({
  treatment,
  onClose,
}: {
  treatment: Treatment;
  onClose: () => void;
}) {
  function stop(reason: string) {
    update((d) => {
      const t = d.treatments.find((x) => x.id === treatment.id);
      if (t) {
        // End it today if it was still running.
        if (!t.endDate || t.endDate > todayISO()) t.endDate = todayISO();
        t.stopReason = reason;
        t.followUpDone = true;
        t.resolved = reason === "Problème résolu";
      }
    });
    onClose();
  }

  return (
    <Sheet title="Arrêter le traitement" onClose={onClose}>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: "4px 0 16px", lineHeight: 1.5 }}>
        Pourquoi arrêter « <b>{treatment.medication}</b> » ? Le traitement sera archivé dans l'historique.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STOP_REASONS.map((r) => (
          <button key={r} className="btn block" onClick={() => stop(r)} style={{ justifyContent: "flex-start" }}>
            {r}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

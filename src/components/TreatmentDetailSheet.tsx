import { useState } from "react";
import Sheet from "./Sheet";
import Icon from "./Icon";
import StopTreatmentSheet from "./StopTreatmentSheet";
import { isTreatmentActive } from "../lib/selectors";
import type { Treatment } from "../lib/types";
import { formatDate } from "../lib/dates";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "0.5px solid var(--line)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 14, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function TreatmentDetailSheet({
  treatment,
  onClose,
  onEdit,
}: {
  treatment: Treatment;
  onClose: () => void;
  onEdit: () => void;
}) {
  const t = treatment;
  const [stopping, setStopping] = useState(false);
  const active = isTreatmentActive(t);

  return (
    <Sheet title={t.medication} onClose={onClose}>
      <div style={{ marginTop: 6 }}>
        {t.dose && <Row label="Dose" value={t.dose} />}
        {t.frequency && <Row label="Fréquence" value={t.frequency} />}
        {t.timing && <Row label="Moment" value={t.timing} />}
        <Row label="Début" value={formatDate(t.startDate)} />
        <Row label="Fin" value={t.endDate ? formatDate(t.endDate) : "à vie (en continu)"} />
        {t.stopReason && <Row label="Motif d'arrêt" value={t.stopReason} />}
        {t.notes && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 3 }}>Notes</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{t.notes}</div>
          </div>
        )}
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={onEdit}>
        <Icon name="edit" size={17} /> Modifier
      </button>
      {active && (
        <button
          className="btn block"
          style={{ marginTop: 6, color: "var(--danger)", borderColor: "var(--danger)" }}
          onClick={() => setStopping(true)}
        >
          Arrêter le traitement
        </button>
      )}

      {stopping && (
        <StopTreatmentSheet
          treatment={t}
          onClose={() => {
            setStopping(false);
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}

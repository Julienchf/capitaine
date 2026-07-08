import { useState } from "react";
import Sheet from "./Sheet";
import Icon from "./Icon";
import { AttachmentView } from "./Attachments";
import { update } from "../lib/store";
import { isTreatmentActive } from "../lib/selectors";
import type { Treatment } from "../lib/types";
import { STOP_REASONS } from "../lib/types";
import { formatDate, todayISO } from "../lib/dates";

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
  const [mode, setMode] = useState<"view" | "stop" | "delete">("view");
  const active = isTreatmentActive(t);

  function stop(reason: string) {
    update((d) => {
      const x = d.treatments.find((y) => y.id === t.id);
      if (x) {
        if (!x.endDate || x.endDate > todayISO()) x.endDate = todayISO();
        x.stopReason = reason;
        x.followUpDone = true;
        x.resolved = reason === "Problème résolu";
      }
    });
    onClose();
  }

  function remove() {
    update((d) => {
      d.treatments = d.treatments.filter((y) => y.id !== t.id);
    });
    onClose();
  }

  // Stop-reason step
  if (mode === "stop") {
    return (
      <Sheet title="Arrêter le traitement" onClose={onClose}>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "4px 0 16px", lineHeight: 1.5 }}>
          Pourquoi arrêter « <b>{t.medication}</b> » ? Il sera archivé dans les traitements terminés.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STOP_REASONS.map((r) => (
            <button key={r} className="btn block" style={{ justifyContent: "flex-start" }} onClick={() => stop(r)}>
              {r}
            </button>
          ))}
        </div>
        <button className="btn ghost block" style={{ marginTop: 10, color: "var(--muted)" }} onClick={() => setMode("view")}>
          Retour
        </button>
      </Sheet>
    );
  }

  // Delete confirmation step
  if (mode === "delete") {
    return (
      <Sheet title="Supprimer le traitement" onClose={onClose}>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "4px 0 20px", lineHeight: 1.5 }}>
          Supprimer définitivement « <b>{t.medication}</b> » ? Cette action est irréversible (contrairement à « Arrêter », qui le garde dans l'historique).
        </p>
        <button className="btn primary block" style={{ background: "var(--danger)", borderColor: "var(--danger)" }} onClick={remove}>
          <Icon name="trash" size={17} /> Supprimer définitivement
        </button>
        <button className="btn ghost block" style={{ marginTop: 8, color: "var(--muted)" }} onClick={() => setMode("view")}>
          Annuler
        </button>
      </Sheet>
    );
  }

  // Detail view
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
      <AttachmentView items={t.attachments} />

      <button className="btn primary block" style={{ marginTop: 20 }} onClick={onEdit}>
        <Icon name="edit" size={17} /> Modifier
      </button>
      {active && (
        <button
          className="btn block"
          style={{ marginTop: 6, color: "var(--danger)", borderColor: "var(--danger)" }}
          onClick={() => setMode("stop")}
        >
          Arrêter le traitement
        </button>
      )}
      <button className="btn danger-text block" style={{ marginTop: 6 }} onClick={() => setMode("delete")}>
        <Icon name="trash" size={16} /> Supprimer
      </button>
    </Sheet>
  );
}

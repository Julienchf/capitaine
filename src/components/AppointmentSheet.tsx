import { useState } from "react";
import Sheet from "./Sheet";
import { update, uid } from "../lib/store";
import type { Appointment } from "../lib/types";
import { todayISO } from "../lib/dates";

export default function AppointmentSheet({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const [date, setDate] = useState(appointment?.date ?? todayISO());
  const [reason, setReason] = useState(appointment?.reason ?? "");
  const [notes, setNotes] = useState(appointment?.notes ?? "");

  function save() {
    update((d) => {
      if (appointment) {
        const t = d.appointments.find((x) => x.id === appointment.id);
        if (t) {
          t.date = date;
          t.reason = reason || undefined;
          t.notes = notes || undefined;
        }
      } else {
        d.appointments.push({ id: uid(), date, reason: reason || undefined, notes: notes || undefined, attachments: [] });
      }
    });
    onClose();
  }

  return (
    <Sheet title={appointment ? "Modifier le RDV" : "Nouveau rendez-vous"} onClose={onClose}>
      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Motif</label>
        <input placeholder="ex. Vaccin annuel, contrôle…" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="field">
        <label>Notes (optionnel)</label>
        <textarea placeholder="ex. à jeun, apporter le carnet…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        Enregistrer
      </button>
      {appointment && (
        <button
          className="btn danger-text block"
          style={{ marginTop: 6 }}
          onClick={() => {
            update((d) => {
              d.appointments = d.appointments.filter((x) => x.id !== appointment.id);
            });
            onClose();
          }}
        >
          Supprimer ce RDV
        </button>
      )}
    </Sheet>
  );
}

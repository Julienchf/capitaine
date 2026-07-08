import { useState } from "react";
import Sheet from "./Sheet";
import FactureLoader from "./FactureLoader";
import { AttachmentChips } from "./Attachments";
import { update, uid } from "../lib/store";
import type { Treatment, Attachment } from "../lib/types";
import { FREQUENCY_PRESETS, TIMING_PRESETS } from "../lib/types";
import { todayISO } from "../lib/dates";

export interface TreatmentDraft {
  medication?: string;
  startDate?: string;
  healthEntryId?: string;
}

export default function TreatmentSheet({
  treatment,
  draft,
  onClose,
  onSubmit,
}: {
  treatment?: Treatment;
  draft?: TreatmentDraft;
  onClose: () => void;
  /** When provided, return the treatment data instead of writing to the store. */
  onSubmit?: (t: Omit<Treatment, "id">) => void;
}) {
  const [medication, setMedication] = useState(treatment?.medication ?? draft?.medication ?? "");
  const [dose, setDose] = useState(treatment?.dose ?? "");
  const [frequency, setFrequency] = useState(treatment?.frequency ?? "");
  const [timing, setTiming] = useState(treatment?.timing ?? "");
  const [startDate, setStartDate] = useState(treatment?.startDate ?? draft?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(treatment?.endDate ?? "");
  const [lifelong, setLifelong] = useState(treatment ? !treatment.endDate : false);
  const [notes, setNotes] = useState(treatment?.notes ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(treatment?.attachments ?? []);

  function save() {
    if (!medication.trim()) return;
    const atts = attachments.length ? attachments : undefined;
    if (onSubmit) {
      onSubmit({
        healthEntryId: draft?.healthEntryId,
        medication,
        dose: dose || undefined,
        frequency: frequency || undefined,
        timing: timing || undefined,
        startDate,
        endDate: lifelong ? undefined : endDate || undefined,
        notes: notes || undefined,
        attachments: atts,
      });
      onClose();
      return;
    }
    update((d) => {
      if (treatment) {
        const t = d.treatments.find((x) => x.id === treatment.id);
        if (t) {
          t.medication = medication;
          t.dose = dose || undefined;
          t.frequency = frequency || undefined;
          t.timing = timing || undefined;
          t.startDate = startDate;
          t.endDate = lifelong ? undefined : endDate || undefined;
          t.notes = notes || undefined;
          t.attachments = atts;
        }
      } else {
        d.treatments.push({
          id: uid(),
          healthEntryId: draft?.healthEntryId,
          medication,
          dose: dose || undefined,
          frequency: frequency || undefined,
          timing: timing || undefined,
          startDate,
          endDate: lifelong ? undefined : endDate || undefined,
          notes: notes || undefined,
          attachments: atts,
        });
      }
    });
    onClose();
  }

  return (
    <Sheet title={treatment ? "Modifier le traitement" : "Nouveau traitement"} onClose={onClose}>
      <FactureLoader
        onAttachment={(a) => setAttachments((prev) => [...prev, a])}
        onFields={(f) => {
          if (f.medications && !medication.trim()) setMedication(f.medications.split(/[,\n;]/)[0].trim());
          if (f.date) setStartDate(f.date);
          if (f.medications && !notes.trim()) setNotes(f.medications);
        }}
      />
      <AttachmentChips items={attachments} onRemove={(id) => setAttachments((x) => x.filter((y) => y.id !== id))} />
      <div className="field">
        <label>Médicament</label>
        <input placeholder="ex. Metacam" value={medication} onChange={(e) => setMedication(e.target.value)} />
      </div>
      <div className="field">
        <label>Dose</label>
        <input placeholder="ex. 1,5 ml / 1 cachet" value={dose} onChange={(e) => setDose(e.target.value)} />
      </div>
      <div className="field">
        <label>Fréquence</label>
        <div className="chips" style={{ marginBottom: 8 }}>
          {FREQUENCY_PRESETS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${frequency === f ? "on" : ""}`}
              onClick={() => setFrequency(frequency === f ? "" : f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input placeholder="ou saisir librement…" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
      </div>
      <div className="field">
        <label>Moment de la prise</label>
        <div className="chips" style={{ marginBottom: 8 }}>
          {TIMING_PRESETS.map((m) => {
            const parts = timing.split(",").map((s) => s.trim()).filter(Boolean);
            const on = parts.includes(m);
            return (
              <button
                key={m}
                type="button"
                className={`chip ${on ? "on" : ""}`}
                onClick={() => {
                  const next = on ? parts.filter((p) => p !== m) : [...parts, m];
                  setTiming(next.join(", "));
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
        <input placeholder="ou préciser…" value={timing} onChange={(e) => setTiming(e.target.value)} />
      </div>
      <div className="field">
        <label>Début</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <label
        style={{
          display: "flex", alignItems: "center", gap: 10, marginTop: 14,
          fontSize: 14, cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={lifelong}
          onChange={(e) => setLifelong(e.target.checked)}
          style={{ width: 20, height: 20 }}
        />
        Traitement à vie
      </label>
      {!lifelong && (
        <div className="field">
          <label>Date de fin</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label>Notes (optionnel)</label>
        <input placeholder="ex. pendant le repas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        Enregistrer
      </button>
    </Sheet>
  );
}

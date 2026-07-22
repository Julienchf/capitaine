import { Link } from "react-router-dom";
import Sheet from "./Sheet";
import Icon from "./Icon";
import { useData, update } from "../lib/store";
import { activeTreatments } from "../lib/selectors";
import type { Appointment, Attachment, VetQuestion } from "../lib/types";
import { formatDate, formatShort, relativeToToday } from "../lib/dates";
import { fileToAttachment, attachmentSrc } from "../lib/storage";

function SectionTitle({ icon, label, to }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; to?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 0 8px" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
        <Icon name={icon} size={15} /> {label}
      </span>
      {to && <Link to={to} style={{ fontSize: 13, color: "var(--accent-ink)", fontWeight: 500 }}>Voir tout</Link>}
    </div>
  );
}

export default function AppointmentDetailSheet({
  appointment,
  onClose,
  onEdit,
  onValidateQuestion,
}: {
  appointment: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onValidateQuestion: (q: VetQuestion) => void;
}) {
  const data = useData();
  // Read the live copy so attachment edits reflect immediately.
  const appt = data.appointments.find((a) => a.id === appointment.id) ?? appointment;
  const treatments = activeTreatments(data);
  const recentHealth = [...data.health].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const openQuestions = data.questions.filter((q) => !q.done);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const added: Attachment[] = [];
    for (const f of Array.from(files)) {
      added.push(await fileToAttachment(f));
    }
    update((d) => {
      const a = d.appointments.find((x) => x.id === appt.id);
      if (a) a.attachments = [...a.attachments, ...added];
    });
  }

  function removeAttachment(id: string) {
    update((d) => {
      const a = d.appointments.find((x) => x.id === appt.id);
      if (a) a.attachments = a.attachments.filter((x) => x.id !== id);
    });
  }

  return (
    <Sheet title={appt.reason || "Rendez-vous"} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent-ink)", fontSize: 14, marginTop: 2 }}>
        <Icon name="calendar" size={16} /> {formatDate(appt.date)} · {relativeToToday(appt.date).text}
      </div>
      {appt.notes && (
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {appt.notes}
        </div>
      )}
      <button className="btn block" style={{ marginTop: 12 }} onClick={onEdit}>
        <Icon name="edit" size={16} /> Modifier ce RDV
      </button>

      {/* Attachments */}
      <SectionTitle icon="file" label="Pièces jointes" />
      {appt.attachments.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {appt.attachments.map((a) =>
            a.type.startsWith("image") ? (
              <div key={a.id} style={{ position: "relative" }}>
                <a href={attachmentSrc(a)} target="_blank" rel="noreferrer">
                  <img src={attachmentSrc(a)} alt={a.name} style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 10, border: "0.5px solid var(--line)" }} />
                </a>
                <button
                  onClick={() => removeAttachment(a.id)}
                  aria-label="Retirer"
                  style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "var(--danger)", color: "#fff", border: "none", fontSize: 12 }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span key={a.id} className="chip" onClick={() => removeAttachment(a.id)}>
                <Icon name="file" size={14} /> {a.name.length > 16 ? a.name.slice(0, 14) + "…" : a.name} ✕
              </span>
            ),
          )}
        </div>
      )}
      <label className="btn block" style={{ cursor: "pointer" }}>
        <Icon name="camera" size={17} /> Ajouter une PJ (ordonnance, facture…)
        <input type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </label>

      {/* Questions */}
      <SectionTitle icon="question" label="Questions à poser" />
      {openQuestions.length === 0 ? (
        <div style={{ fontSize: 13.5, color: "var(--faint)", padding: "2px 0" }}>Aucune question en attente.</div>
      ) : (
        openQuestions.map((q) => (
          <div className="row" key={q.id} style={{ marginBottom: 8, alignItems: "flex-start" }}>
            <button
              className="ic-badge ic-muted"
              style={{ border: "none", background: "var(--surface-2)", marginTop: 1 }}
              aria-label="Valider et répondre"
              onClick={() => onValidateQuestion(q)}
            >
              <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--line-strong)", display: "block" }} />
            </button>
            <div className="grow">
              <div className="title" style={{ fontWeight: 400 }}>{q.text}</div>
              {q.description && <div className="meta">{q.description}</div>}
            </div>
          </div>
        ))
      )}

      {/* Treatments */}
      {treatments.length > 0 && (
        <>
          <SectionTitle icon="pill" label="Traitement en cours" to="/sante?tab=traitements" />
          {treatments.map((t) => (
            <div className="row" key={t.id} style={{ marginBottom: 8 }}>
              <div className="ic-badge ic-danger"><Icon name="pill" size={20} /></div>
              <div className="grow">
                <div className="title">{t.medication}</div>
                <div className="meta">
                  {[t.dose, t.frequency, t.timing].filter(Boolean).join(" · ") || "en cours"}
                  {t.endDate ? ` · jusqu'au ${formatShort(t.endDate)}` : " · en continu"}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Recent health */}
      <SectionTitle icon="health" label="Derniers pépins de santé" to="/sante?tab=carnet" />
      {recentHealth.length === 0 ? (
        <div style={{ fontSize: 13.5, color: "var(--faint)", padding: "2px 0" }}>Rien dans le carnet.</div>
      ) : (
        recentHealth.map((h) => (
          <div className="row" key={h.id} style={{ marginBottom: 8 }}>
            <div className="ic-badge ic-muted"><Icon name="health" size={18} /></div>
            <div className="grow">
              <div className="title">{h.title}</div>
              <div className="meta">{formatDate(h.date)}</div>
            </div>
          </div>
        ))
      )}

      <button className="btn danger-text block" style={{ marginTop: 18 }}
        onClick={() => {
          update((d) => { d.appointments = d.appointments.filter((x) => x.id !== appt.id); });
          onClose();
        }}
      >
        Supprimer ce RDV
      </button>
    </Sheet>
  );
}

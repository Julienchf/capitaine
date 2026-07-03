import { useState } from "react";
import Icon from "./Icon";
import AppointmentSheet from "./AppointmentSheet";
import AppointmentDetailSheet from "./AppointmentDetailSheet";
import QuestionSheet from "./QuestionSheet";
import AnswerSheet from "./AnswerSheet";
import EventCard from "./EventCard";
import { useData } from "../lib/store";
import { pastAppointments, upcomingAppointments } from "../lib/selectors";
import type { Appointment, VetQuestion } from "../lib/types";
import { formatDate, relativeToToday } from "../lib/dates";

export default function RdvTab() {
  const data = useData();
  const [apptDetail, setApptDetail] = useState<Appointment | null>(null);
  const [apptEdit, setApptEdit] = useState<Appointment | "new" | null>(null);
  const [questionSheet, setQuestionSheet] = useState<VetQuestion | "new" | null>(null);
  const [answerQuestion, setAnswerQuestion] = useState<VetQuestion | null>(null);
  const [histSearch, setHistSearch] = useState("");

  const appointments = upcomingAppointments(data);
  const past = pastAppointments(data);
  const openQuestions = data.questions.filter((x) => !x.done);
  const answered = [...data.questions]
    .filter((x) => x.done)
    .sort((a, b) => (b.answeredAt ?? "").localeCompare(a.answeredAt ?? ""));

  const hq = histSearch.trim().toLowerCase();
  const history = hq
    ? answered.filter((q) =>
        [q.text, q.description, q.answer].filter(Boolean).some((f) => f!.toLowerCase().includes(hq)),
      )
    : answered;

  return (
    <>
      {/* Upcoming appointments */}
      <div className="section-title" style={{ marginTop: 4 }}>
        <Icon name="calendar" size={15} /> Rendez-vous à venir
      </div>
      {appointments.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>Aucun RDV prévu.</div>
          <button className="btn primary" onClick={() => setApptEdit("new")}>
            <Icon name="plus" size={17} /> Créer un rendez-vous
          </button>
        </div>
      ) : (
        <>
          {appointments.map((a) => (
            <button
              key={a.id}
              className="row"
              style={{ marginBottom: 8, width: "100%", textAlign: "left" }}
              onClick={() => setApptDetail(a)}
            >
              <div className="ic-badge ic-accent"><Icon name="calendar" size={20} /></div>
              <div className="grow">
                <div className="title">{a.reason || "Rendez-vous"}</div>
                <div className="meta">
                  {formatDate(a.date)} · {relativeToToday(a.date).text}
                  {a.attachments.length ? ` · ${a.attachments.length} PJ` : ""}
                </div>
              </div>
              <Icon name="chevron" size={18} className="ic-badge" />
            </button>
          ))}
          <button className="btn block" style={{ marginTop: 4 }} onClick={() => setApptEdit("new")}>
            <Icon name="plus" size={17} /> Ajouter un RDV
          </button>
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="section-title">RDV passés</div>
          <div className="grid-2">
            {past.map((a) => (
              <EventCard
                key={a.id}
                title={a.reason || "Rendez-vous"}
                dateLabel={formatDate(a.date)}
                extra={a.attachments.length ? (
                  <span style={{ fontSize: 11, color: "var(--accent-ink)", background: "var(--accent-soft)", padding: "2px 7px", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                    <Icon name="file" size={12} /> {a.attachments.length}
                  </span>
                ) : undefined}
                onClick={() => setApptDetail(a)}
              />
            ))}
          </div>
        </>
      )}

      {/* Open questions */}
      <div className="section-title"><Icon name="question" size={15} /> Questions à poser</div>
      {openQuestions.length === 0 ? (
        <div className="empty" style={{ padding: 16 }}>Aucune question en attente.</div>
      ) : (
        openQuestions.map((q) => (
          <div className="row" key={q.id} style={{ marginBottom: 8, alignItems: "flex-start" }}>
            <button
              className="ic-badge ic-muted"
              style={{ border: "none", background: "var(--surface-2)", marginTop: 1 }}
              aria-label="Valider et répondre"
              onClick={() => setAnswerQuestion(q)}
            >
              <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--line-strong)", display: "block" }} />
            </button>
            <div className="grow" style={{ cursor: "pointer" }} onClick={() => setQuestionSheet(q)}>
              <div className="title" style={{ fontWeight: 400 }}>{q.text}</div>
              {q.description && <div className="meta">{q.description}</div>}
            </div>
            <button className="btn ghost" style={{ padding: 4, color: "var(--muted)" }} aria-label="Modifier" onClick={() => setQuestionSheet(q)}>
              <Icon name="chevron" size={18} />
            </button>
          </div>
        ))
      )}
      <button className="btn block" style={{ marginTop: 4 }} onClick={() => setQuestionSheet("new")}>
        <Icon name="plus" size={17} /> Ajouter une question
      </button>

      {/* Answered history */}
      {answered.length > 0 && (
        <>
          <div className="section-title"><Icon name="check" size={15} /> Historique des questions</div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }}>
              <Icon name="search" size={16} />
            </span>
            <input
              placeholder="Rechercher une question ou réponse…"
              value={histSearch}
              onChange={(e) => setHistSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 36px", border: "0.5px solid var(--line-strong)", borderRadius: 10, background: "var(--surface)" }}
            />
          </div>
          {history.length === 0 ? (
            <div className="empty" style={{ padding: 16 }}>Aucun résultat.</div>
          ) : (
            history.map((q) => (
              <button
                key={q.id}
                className="row"
                style={{ marginBottom: 8, width: "100%", textAlign: "left", alignItems: "flex-start" }}
                onClick={() => setAnswerQuestion(q)}
              >
                <div className="ic-badge ic-ok" style={{ marginTop: 1 }}><Icon name="check" size={18} /></div>
                <div className="grow">
                  <div className="title" style={{ fontWeight: 500 }}>{q.text}</div>
                  <div className="meta" style={{ color: q.answer ? "var(--text)" : "var(--faint)", whiteSpace: "pre-wrap" }}>
                    {q.answer || "Sans réponse notée"}
                  </div>
                  {q.answeredAt && <div className="meta">Répondu le {formatDate(q.answeredAt)}</div>}
                </div>
              </button>
            ))
          )}
        </>
      )}

      <div style={{ height: 8 }} />

      {apptDetail && (
        <AppointmentDetailSheet
          appointment={apptDetail}
          onClose={() => setApptDetail(null)}
          onEdit={() => {
            const a = apptDetail;
            setApptDetail(null);
            setApptEdit(a);
          }}
          onValidateQuestion={(q) => setAnswerQuestion(q)}
        />
      )}
      {apptEdit && (
        <AppointmentSheet appointment={apptEdit === "new" ? null : apptEdit} onClose={() => setApptEdit(null)} />
      )}
      {questionSheet && (
        <QuestionSheet question={questionSheet} onClose={() => setQuestionSheet(null)} />
      )}
      {answerQuestion && (
        <AnswerSheet question={answerQuestion} onClose={() => setAnswerQuestion(null)} />
      )}
    </>
  );
}

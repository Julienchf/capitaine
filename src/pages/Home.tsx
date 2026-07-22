import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import TreatmentSheet from "../components/TreatmentSheet";
import TreatmentDetailSheet from "../components/TreatmentDetailSheet";
import { useData } from "../lib/store";
import type { Treatment } from "../lib/types";
import { activeTreatments, allCareStatuses, budgetItems, budgetTotal, nextAppointment, stockStatus } from "../lib/selectors";
import { CARE_META } from "../lib/types";
import type { CareKind } from "../lib/types";
import {
  ageText,
  currentMonthKey,
  endOfMonthISO,
  formatShort,
  humanAge,
  monthLabel,
  relativeToToday,
} from "../lib/dates";
import { euro } from "../lib/format";
import { photoSrc } from "../lib/storage";

const careIcon: Record<CareKind, "bug" | "pill" | "scissors"> = {
  antiparasite: "bug",
  vermifuge: "pill",
  epilation: "scissors",
};

export default function Home() {
  const data = useData();
  const { profile } = data;
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);
  const [detailTreatment, setDetailTreatment] = useState<Treatment | null>(null);
  const treatments = activeTreatments(data);
  const nextRdv = nextAppointment(data);

  const mk = currentMonthKey();
  const first = `${mk}-01`;
  const last = endOfMonthISO(mk);
  const spent = budgetTotal(budgetItems(data, first, last));
  const budget = data.monthlyBudget;
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const over = spent > budget;

  const upcomingCare = allCareStatuses(data)
    .filter((s) => s.daysUntil === null || s.daysUntil <= 30)
    .slice(0, 3);

  const stocks = data.stock.map(stockStatus);
  const lowStock = stocks.filter((s) => s.reminderDays != null || s.low).length;
  const stockValue =
    stocks.length === 0 ? "Aucun" : lowStock > 0 ? `${lowStock} à racheter` : "À jour";
  const openQuestions = data.questions.filter((q) => !q.done).length;

  return (
    <div className="page">
      {/* Hero */}
      <Link
        to="/profil"
        className="card"
        style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, marginTop: 18 }}
      >
        <div
          style={{
            width: 62, height: 62, borderRadius: "50%",
            background: photoSrc(profile) ? undefined : "var(--accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
          }}
        >
          {photoSrc(profile) ? (
            <img src={photoSrc(profile)} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "var(--accent-ink)" }}><Icon name="paw" size={30} /></span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{profile.name}</div>
          <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 2 }}>
            {profile.breed} · {ageText(profile.birthDate)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span
            style={{
              fontSize: 12, fontWeight: 600, color: "var(--accent-ink)",
              background: "var(--accent-soft)", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
            }}
          >
            ≈ {humanAge(profile.birthDate)} ans
          </span>
          <span style={{ color: "var(--faint)" }}><Icon name="chevron" size={18} /></span>
        </div>
      </Link>

      {/* Current treatments — highlighted */}
      {treatments.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {treatments.map((t) => {
            const attrs: { l: string; v: string }[] = [];
            if (t.dose) attrs.push({ l: "Dose", v: t.dose });
            if (t.frequency) attrs.push({ l: "Fréquence", v: t.frequency });
            if (t.timing) attrs.push({ l: "Moment", v: t.timing });
            attrs.push({ l: "Fin", v: t.endDate ? formatShort(t.endDate) : "En continu" });
            return (
              <button
                key={t.id}
                onClick={() => setDetailTreatment(t)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "block",
                  background: "var(--danger-soft)",
                  border: "0.5px solid var(--danger)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  marginBottom: 8,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                      background: "var(--danger)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="pill" size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--danger)" }}>Traitement en cours</div>
                    <div style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.2 }}>{t.medication}</div>
                  </div>
                  <span style={{ color: "var(--danger)" }}><Icon name="chevron" size={18} /></span>
                </div>

                {/* Attributes grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px 14px",
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "0.5px solid rgba(192,64,47,0.18)",
                  }}
                >
                  {attrs.map((a) => (
                    <div key={a.l}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--danger)", opacity: 0.72 }}>{a.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginTop: 1 }}>{a.v}</div>
                    </div>
                  ))}
                </div>

                {t.notes && (
                  <div style={{ fontSize: 13, color: "var(--danger)", marginTop: 12, paddingTop: 10, borderTop: "0.5px solid rgba(192,64,47,0.18)", fontStyle: "italic" }}>
                    {t.notes}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Upcoming care — grouped card */}
      <div className="group" style={{ marginTop: 14 }}>
        <div className="group-head">
          <span className="t">Prochains soins</span>
          <Link to="/sante">Voir</Link>
        </div>
        {upcomingCare.length === 0 ? (
          <div className="group-item">
            <div className="ic-badge ic-ok"><Icon name="check" size={18} /></div>
            <div className="grow">
              <div className="title">Tout est à jour</div>
              <div className="meta">Rien à prévoir ce mois-ci</div>
            </div>
          </div>
        ) : (
          upcomingCare.map((s) => {
            const meta = CARE_META[s.kind];
            const rel = s.nextDue ? relativeToToday(s.nextDue) : null;
            const cls = !s.nextDue ? "muted" : s.overdue ? "danger" : s.daysUntil! <= 10 ? "warning" : "ok";
            return (
              <Link to="/sante" className="group-item" key={s.kind}>
                <div className={`ic-badge ${meta.iconClass}`}><Icon name={careIcon[s.kind]} size={18} /></div>
                <div className="grow">
                  <div className="title">{meta.label}</div>
                  <div className="meta">{s.lastDone ? "Prochain rappel" : "À planifier"}</div>
                </div>
                <span className={`pill ${cls}`}>{!s.nextDue ? "à planifier" : s.overdue ? "en retard" : rel!.text}</span>
              </Link>
            );
          })
        )}
      </div>

      {/* Tiles: stocks + rendez-vous */}
      <div className="tiles" style={{ marginTop: 14 }}>
        <Link to="/stocks" className="tile">
          <div className="ic-badge ic-warning"><Icon name="box" size={20} /></div>
          <div className="lbl">Stocks</div>
          <div className="val">{stockValue}</div>
          {stocks.length > 0 && <div className="sub">{stocks.length} suivi{stocks.length > 1 ? "s" : ""}</div>}
        </Link>
        <Link to="/sante?tab=rdv" className="tile">
          <div className="ic-badge ic-accent"><Icon name="calendar" size={20} /></div>
          <div className="lbl">Prochain RDV</div>
          <div className="val">{nextRdv ? formatShort(nextRdv.date) : "Aucun"}</div>
          <div className="sub">
            {openQuestions > 0 ? `${openQuestions} question${openQuestions > 1 ? "s" : ""} à poser` : "Aucune question"}
          </div>
        </Link>
      </div>

      {/* Budget */}
      <Link to="/budget" className="card card-pad" style={{ display: "block", marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Budget de {monthLabel(mk).split(" ")[0].toLowerCase()}</span>
          <span style={{ fontSize: 13, color: over ? "var(--danger)" : "var(--muted)" }}>
            {over ? `dépassé de ${euro(spent - budget)}` : `reste ${euro(budget - spent)}`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "5px 0 9px" }}>
          <span style={{ fontSize: 26, fontWeight: 600 }}>{euro(spent)}</span>
          <span style={{ fontSize: 14, color: "var(--faint)" }}>/ {euro(budget)}</span>
        </div>
        <div className={`bar ${over ? "over" : ""}`}>
          <span style={{ width: `${pct}%` }} />
        </div>
      </Link>

      {detailTreatment && (
        <TreatmentDetailSheet
          treatment={detailTreatment}
          onClose={() => setDetailTreatment(null)}
          onEdit={() => {
            const t = detailTreatment;
            setDetailTreatment(null);
            setEditTreatment(t);
          }}
        />
      )}
      {editTreatment && (
        <TreatmentSheet treatment={editTreatment} onClose={() => setEditTreatment(null)} />
      )}
    </div>
  );
}

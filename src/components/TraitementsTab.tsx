import { useState } from "react";
import Icon from "./Icon";
import EventCard from "./EventCard";
import TreatmentSheet from "./TreatmentSheet";
import TreatmentDetailSheet from "./TreatmentDetailSheet";
import { useData } from "../lib/store";
import { isTreatmentActive } from "../lib/selectors";
import type { Treatment } from "../lib/types";
import { formatShort } from "../lib/dates";

export default function TraitementsTab() {
  const data = useData();
  const [detail, setDetail] = useState<Treatment | null>(null);
  const [edit, setEdit] = useState<Treatment | "new" | null>(null);

  const sorted = [...data.treatments].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const active = sorted.filter(isTreatmentActive);
  const past = sorted.filter((t) => !isTreatmentActive(t));

  function card(t: Treatment) {
    const activeOne = isTreatmentActive(t);
    return (
      <button
        key={t.id}
        className="row"
        style={{ marginBottom: 8, width: "100%", textAlign: "left", opacity: activeOne ? 1 : 0.7 }}
        onClick={() => setDetail(t)}
      >
        <div className={`ic-badge ${activeOne ? "ic-danger" : "ic-muted"}`}><Icon name="pill" size={20} /></div>
        <div className="grow">
          <div className="title">{t.medication}</div>
          <div className="meta">
            {[t.dose, t.frequency, t.timing].filter(Boolean).join(" · ")}
            {t.endDate ? ` · jusqu'au ${formatShort(t.endDate)}` : " · en continu"}
          </div>
        </div>
        <Icon name="chevron" size={18} className="ic-badge" />
      </button>
    );
  }

  return (
    <>
      {data.treatments.length === 0 ? (
        <div className="empty">
          <Icon name="pill" size={34} className="ic" />
          Aucun traitement enregistré.
          <br />
          Ajoute un traitement prescrit par le véto.
        </div>
      ) : (
        <>
          {active.length > 0 && <div className="section-title" style={{ marginTop: 4 }}>En cours</div>}
          {active.map(card)}
          {past.length > 0 && <div className="section-title">Terminés</div>}
          {past.length > 0 && (
            <div className="grid-2">
              {past.map((t) => (
                <EventCard
                  key={t.id}
                  title={t.medication}
                  dateLabel={t.endDate ? `terminé ${formatShort(t.endDate)}` : formatShort(t.startDate)}
                  onClick={() => setDetail(t)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <button className="btn primary block" style={{ marginTop: 12 }} onClick={() => setEdit("new")}>
        <Icon name="plus" size={18} /> Nouveau traitement
      </button>

      {detail && (
        <TreatmentDetailSheet
          treatment={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            const t = detail;
            setDetail(null);
            setEdit(t);
          }}
        />
      )}
      {edit && (
        <TreatmentSheet
          treatment={edit === "new" ? undefined : edit}
          onClose={() => setEdit(null)}
        />
      )}
    </>
  );
}

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import TreatmentSheet, { type TreatmentDraft } from "../components/TreatmentSheet";
import TraitementsTab from "../components/TraitementsTab";
import RdvTab from "../components/RdvTab";
import EventCard from "../components/EventCard";
import { useData, update, uid } from "../lib/store";
import { allCareStatuses, careInterval } from "../lib/selectors";
import { CARE_META, ANTIPARASITE_FORMS } from "../lib/types";
import type { CareKind, HealthEntry, Attachment, CareEvent, AntiparasiteForm } from "../lib/types";
import { formatDate, formatShort, relativeToToday, todayISO } from "../lib/dates";
import { euro, fileToDataUrl } from "../lib/format";

const careIcon: Record<CareKind, "bug" | "pill" | "scissors"> = {
  antiparasite: "bug",
  vermifuge: "pill",
  epilation: "scissors",
};

function intervalLabel(days: number): string {
  if (days >= 350) return "tous les 12 mois";
  const months = Math.round(days / 30);
  return months <= 1 ? "tous les mois" : `tous les ${months} mois`;
}

function CostChip({ value }: { value: number }) {
  return (
    <span
      style={{
        fontSize: 11, color: "var(--muted)", background: "var(--surface-2)",
        border: "0.5px solid var(--line)", padding: "2px 7px", borderRadius: 999,
      }}
    >
      {euro(value)}
    </span>
  );
}

type Tab = "soins" | "carnet" | "traitements" | "rdv";

export default function Sante() {
  const data = useData();
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get("tab") as Tab) || "soins";
  const setTab = (t: Tab) => setSp(t === "soins" ? {} : { tab: t });
  const [logKind, setLogKind] = useState<CareKind | null>(null);
  const [editEvent, setEditEvent] = useState<CareEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<CareEvent | null>(null);
  const [configKind, setConfigKind] = useState<CareKind | null>(null);
  const [editEntry, setEditEntry] = useState<HealthEntry | "new" | null>(null);
  const [detailEntry, setDetailEntry] = useState<HealthEntry | null>(null);
  const [treatmentDraft, setTreatmentDraft] = useState<TreatmentDraft | null>(null);
  const [search, setSearch] = useState("");

  const statuses = allCareStatuses(data);
  const q = search.trim().toLowerCase();
  const health = [...data.health]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((h) =>
      !q
        ? true
        : [h.title, h.description, h.medications, formatDate(h.date), h.cost ? String(h.cost) : ""]
            .filter(Boolean)
            .some((f) => f!.toLowerCase().includes(q)),
    );

  return (
    <div className="page">
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <h1>Santé</h1>
        <div className="sub">Soins récurrents et carnet de santé</div>
      </div>

      <div className="segmented" style={{ marginBottom: 16 }}>
        <button className={tab === "soins" ? "on" : ""} onClick={() => setTab("soins")}>Soins</button>
        <button className={tab === "carnet" ? "on" : ""} onClick={() => setTab("carnet")}>Carnet</button>
        <button className={tab === "traitements" ? "on" : ""} onClick={() => setTab("traitements")}>Traitements</button>
        <button className={tab === "rdv" ? "on" : ""} onClick={() => setTab("rdv")}>RDV</button>
      </div>

      {tab === "traitements" && <TraitementsTab />}
      {tab === "rdv" && <RdvTab />}

      {tab === "soins" && (
        <>
          {statuses.map((s) => {
            const meta = CARE_META[s.kind];
            const rel = s.nextDue ? relativeToToday(s.nextDue) : null;
            const pill = !s.nextDue
              ? { cls: "muted", txt: "à planifier" }
              : s.overdue
                ? { cls: "danger", txt: `en retard` }
                : s.daysUntil! <= 10
                  ? { cls: "warning", txt: rel!.text }
                  : { cls: "ok", txt: rel!.text };
            const form =
              s.kind === "antiparasite" ? data.careConfig.antiparasite.antiparasiteForm : undefined;
            return (
              <div className="row" key={s.kind} style={{ marginBottom: 8 }}>
                <div className={`ic-badge ${meta.iconClass}`}>
                  <Icon name={careIcon[s.kind]} size={20} />
                </div>
                <div className="grow">
                  <div className="title">
                    {meta.label}
                    {form ? ` · ${ANTIPARASITE_FORMS[form].label}` : ""}
                  </div>
                  <div className="meta">
                    {s.nextDue
                      ? `${s.planned ? "Prévu" : "Prochain"} : ${formatShort(s.nextDue)} · ${intervalLabel(careInterval(data, s.kind))}`
                      : `Jamais enregistré · ${intervalLabel(careInterval(data, s.kind))}`}
                  </div>
                  {s.reminderDays != null && !s.overdue && (
                    <div className="meta" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--warning)" }}>
                      <Icon name="bell" size={13} /> Rappel {s.reminderDays === 30 ? "1 mois" : `${s.reminderDays} j`} avant
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span className={`pill ${pill.cls}`}>{pill.txt}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button
                      className="btn ghost"
                      style={{ padding: "2px 6px", fontSize: 13, color: "var(--muted)" }}
                      aria-label="Régler"
                      onClick={() => setConfigKind(s.kind)}
                    >
                      Régler
                    </button>
                    <button className="btn ghost" style={{ padding: "2px 6px", fontSize: 13 }} onClick={() => setLogKind(s.kind)}>
                      + Noter
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="section-title">Historique des soins</div>
          {data.careEvents.length === 0 ? (
            <div className="empty">Aucun soin enregistré</div>
          ) : (
            <div className="grid-2">
              {[...data.careEvents]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => (
                  <EventCard
                    key={e.id}
                    title={CARE_META[e.kind].label}
                    dateLabel={formatShort(e.date)}
                    extra={e.cost ? <CostChip value={e.cost} /> : undefined}
                    onClick={() => setDetailEvent(e)}
                  />
                ))}
            </div>
          )}
        </>
      )}

      {tab === "carnet" && (
        <>
          {data.health.length > 0 && (
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }}>
                <Icon name="search" size={18} />
              </span>
              <input
                placeholder="Rechercher (pépin, date, médicament…)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "11px 12px 11px 38px",
                  border: "0.5px solid var(--line-strong)", borderRadius: 10, background: "var(--surface)",
                }}
              />
            </div>
          )}

          {data.health.length === 0 ? (
            <div className="empty">
              <Icon name="health" size={34} className="ic" />
              Aucun pépin de santé enregistré.
              <br />
              Ajoutez une consultation, un traitement, une ordonnance.
            </div>
          ) : health.length === 0 ? (
            <div className="empty">Aucun résultat pour « {search} ».</div>
          ) : (
            <div className="grid-2">
              {health.map((h) => (
                <EventCard
                  key={h.id}
                  title={h.title}
                  dateLabel={formatShort(h.date)}
                  extra={
                    h.attachments.length > 0 ? (
                      <span
                        style={{
                          fontSize: 11, color: "var(--accent-ink)", background: "var(--accent-soft)",
                          padding: "2px 7px", borderRadius: 999, display: "flex", alignItems: "center", gap: 3,
                        }}
                      >
                        <Icon name="file" size={12} /> {h.attachments.length}
                      </span>
                    ) : undefined
                  }
                  onClick={() => setDetailEntry(h)}
                />
              ))}
            </div>
          )}
          <button className="btn primary block" style={{ marginTop: 14 }} onClick={() => setEditEntry("new")}>
            <Icon name="plus" size={18} /> Ajouter au carnet
          </button>
        </>
      )}

      {logKind && <CareEventSheet kind={logKind} onClose={() => setLogKind(null)} />}
      {detailEvent && (
        <CareEventDetailSheet
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => {
            const ev = detailEvent;
            setDetailEvent(null);
            setEditEvent(ev);
          }}
        />
      )}
      {editEvent && (
        <CareEventSheet kind={editEvent.kind} event={editEvent} onClose={() => setEditEvent(null)} />
      )}
      {configKind && <CareConfigSheet kind={configKind} onClose={() => setConfigKind(null)} />}
      {detailEntry && (
        <HealthDetailSheet
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onEdit={() => {
            const en = detailEntry;
            setDetailEntry(null);
            setEditEntry(en);
          }}
        />
      )}
      {editEntry && (
        <HealthSheet
          entry={editEntry === "new" ? null : editEntry}
          onClose={() => setEditEntry(null)}
          onCreated={(e) => {
            if (e.medications) {
              setTreatmentDraft({
                medication: e.medications,
                startDate: e.date,
                healthEntryId: e.id,
              });
            }
          }}
        />
      )}
      {treatmentDraft && (
        <TreatmentSheet draft={treatmentDraft} onClose={() => setTreatmentDraft(null)} />
      )}
    </div>
  );
}

function CareConfigSheet({ kind, onClose }: { kind: CareKind; onClose: () => void }) {
  const data = useData();
  const cfg = data.careConfig[kind];
  const meta = CARE_META[kind];
  const lastEvent = [...data.careEvents]
    .filter((e) => e.kind === kind)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const [form, setForm] = useState<AntiparasiteForm>(cfg.antiparasiteForm ?? "cachet");
  const [months, setMonths] = useState(String(Math.round(cfg.intervalDays / 30)));
  const [lastDate, setLastDate] = useState(lastEvent?.date ?? "");
  const [plannedDate, setPlannedDate] = useState(cfg.plannedDate ?? "");

  function save() {
    update((d) => {
      const base =
        kind === "antiparasite"
          ? { antiparasiteForm: form, intervalDays: ANTIPARASITE_FORMS[form].intervalDays }
          : { intervalDays: Math.max(1, parseInt(months) || 1) * 30 };
      d.careConfig[kind] = { ...base, plannedDate: plannedDate || undefined };

      // Update (or create) the "dernier soin" event.
      if (lastDate) {
        const evs = d.careEvents.filter((e) => e.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
        if (evs[0]) {
          const t = d.careEvents.find((e) => e.id === evs[0].id);
          if (t) t.date = lastDate;
        } else {
          d.careEvents.push({ id: uid(), kind, date: lastDate });
        }
      }
    });
    onClose();
  }

  return (
    <Sheet title={`Réglage : ${meta.label}`} onClose={onClose}>
      {kind === "antiparasite" ? (
        <div className="field">
          <label>Type d'antiparasite</label>
          <div className="chips">
            {(Object.keys(ANTIPARASITE_FORMS) as AntiparasiteForm[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`chip ${form === f ? "on" : ""}`}
                onClick={() => setForm(f)}
              >
                {ANTIPARASITE_FORMS[f].label} · {ANTIPARASITE_FORMS[f].hint}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="field">
          <label>Fréquence : tous les combien de mois ?</label>
          <input
            type="number"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label>Date du dernier soin</label>
        <input type="date" value={lastDate} onChange={(e) => setLastDate(e.target.value)} />
      </div>

      <div className="field">
        <label>Date prévue du prochain (optionnel)</label>
        <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
          Laisse vide pour la calculer automatiquement. Rappels à 1 mois, 15 j et 7 j avant.
        </div>
      </div>

      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        Enregistrer le réglage
      </button>
    </Sheet>
  );
}

function CareEventSheet({
  kind,
  event,
  onClose,
}: {
  kind: CareKind;
  event?: CareEvent;
  onClose: () => void;
}) {
  const [date, setDate] = useState(event?.date ?? todayISO());
  const [cost, setCost] = useState(event?.cost != null ? String(event.cost) : "");
  const [note, setNote] = useState(event?.note ?? "");
  const meta = CARE_META[kind];

  function save() {
    update((d) => {
      if (event) {
        const t = d.careEvents.find((x) => x.id === event.id);
        if (t) {
          t.date = date;
          t.cost = cost ? parseFloat(cost) : undefined;
          t.note = note || undefined;
        }
      } else {
        d.careEvents.push({
          id: uid(),
          kind,
          date,
          cost: cost ? parseFloat(cost) : undefined,
          note: note || undefined,
        });
      }
    });
    onClose();
  }

  function remove() {
    if (!event) return;
    update((d) => {
      d.careEvents = d.careEvents.filter((x) => x.id !== event.id);
    });
    onClose();
  }

  return (
    <Sheet title={`${event ? "Modifier" : "Noter"} : ${meta.label}`} onClose={onClose}>
      <div className="field">
        <label>Date du soin</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Coût (optionnel)</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="ex. 15"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Note (optionnel)</label>
        <input placeholder="ex. Frontline, marque…" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        Enregistrer
      </button>
      {event && (
        <button className="btn danger-text block" style={{ marginTop: 6 }} onClick={remove}>
          Supprimer ce soin
        </button>
      )}
    </Sheet>
  );
}

function HealthSheet({
  entry,
  onClose,
  onCreated,
}: {
  entry: HealthEntry | null;
  onClose: () => void;
  onCreated?: (entry: HealthEntry) => void;
}) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [description, setDescription] = useState(entry?.description ?? "");
  const [medications, setMedications] = useState(entry?.medications ?? "");
  const [cost, setCost] = useState(entry?.cost != null ? String(entry.cost) : "");
  const [attachments, setAttachments] = useState<Attachment[]>(entry?.attachments ?? []);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const added: Attachment[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await fileToDataUrl(f);
      added.push({ id: uid(), name: f.name, dataUrl, type: f.type });
    }
    setAttachments((a) => [...a, ...added]);
  }

  function save() {
    if (!title.trim()) return;
    let created: HealthEntry | undefined;
    update((d) => {
      if (entry) {
        const t = d.health.find((h) => h.id === entry.id);
        if (t) {
          t.title = title;
          t.date = date;
          t.description = description || undefined;
          t.medications = medications || undefined;
          t.cost = cost ? parseFloat(cost) : undefined;
          t.attachments = attachments;
        }
      } else {
        created = {
          id: uid(),
          title,
          date,
          description: description || undefined,
          medications: medications || undefined,
          cost: cost ? parseFloat(cost) : undefined,
          attachments,
        };
        d.health.push(created);
      }
    });
    if (created) onCreated?.(created);
    onClose();
  }

  function remove() {
    if (!entry) return;
    update((d) => {
      d.health = d.health.filter((h) => h.id !== entry.id);
    });
    onClose();
  }

  return (
    <Sheet title={entry ? "Modifier" : "Nouveau pépin de santé"} onClose={onClose}>
      <div className="field">
        <label>Intitulé</label>
        <input placeholder="ex. Boiterie patte avant" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Description (optionnel)</label>
        <textarea placeholder="Symptômes, diagnostic du véto…" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Médicaments prescrits (optionnel)</label>
        <textarea placeholder="ex. Metacam 1,5 ml / jour, 5 jours" value={medications} onChange={(e) => setMedications(e.target.value)} />
      </div>
      <div className="field">
        <label>Coût (optionnel)</label>
        <input type="number" inputMode="decimal" placeholder="ex. 48" value={cost} onChange={(e) => setCost(e.target.value)} />
      </div>

      <div className="field">
        <label>Ordonnances / factures</label>
        <div className="chips" style={{ marginBottom: attachments.length ? 10 : 0 }}>
          {attachments.map((a) => (
            <span key={a.id} className="chip on" onClick={() => setAttachments((x) => x.filter((y) => y.id !== a.id))}>
              <Icon name="file" size={15} /> {a.name.length > 16 ? a.name.slice(0, 14) + "…" : a.name} ✕
            </span>
          ))}
        </div>
        <label className="btn block" style={{ cursor: "pointer" }}>
          <Icon name="camera" size={18} /> Photo ou fichier
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      </div>

      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        Enregistrer
      </button>
      {entry && (
        <button className="btn danger-text block" style={{ marginTop: 6 }} onClick={remove}>
          Supprimer cette entrée
        </button>
      )}
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "0.5px solid var(--line)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 14, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "0.5px solid var(--line)" }}>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}

function CareEventDetailSheet({
  event,
  onClose,
  onEdit,
}: {
  event: CareEvent;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Sheet title={CARE_META[event.kind].label} onClose={onClose}>
      <div style={{ marginTop: 6 }}>
        <DetailRow label="Date" value={formatDate(event.date)} />
        {event.cost != null && <DetailRow label="Coût" value={euro(event.cost)} />}
        {event.note && <DetailBlock label="Note" value={event.note} />}
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={onEdit}>
        <Icon name="edit" size={17} /> Modifier
      </button>
      <button
        className="btn danger-text block"
        style={{ marginTop: 6 }}
        onClick={() => {
          update((d) => {
            d.careEvents = d.careEvents.filter((x) => x.id !== event.id);
          });
          onClose();
        }}
      >
        Supprimer ce soin
      </button>
    </Sheet>
  );
}

function HealthDetailSheet({
  entry,
  onClose,
  onEdit,
}: {
  entry: HealthEntry;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Sheet title={entry.title} onClose={onClose}>
      <div style={{ marginTop: 6 }}>
        <DetailRow label="Date" value={formatDate(entry.date)} />
        {entry.cost != null && <DetailRow label="Coût" value={euro(entry.cost)} />}
        {entry.description && <DetailBlock label="Description" value={entry.description} />}
        {entry.medications && <DetailBlock label="Médicaments prescrits" value={entry.medications} />}
      </div>

      {entry.attachments.length > 0 && (
        <div className="field">
          <label>Ordonnances / factures</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {entry.attachments.map((a) =>
              a.type.startsWith("image") ? (
                <a key={a.id} href={a.dataUrl} target="_blank" rel="noreferrer">
                  <img
                    src={a.dataUrl}
                    alt={a.name}
                    style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: "0.5px solid var(--line)" }}
                  />
                </a>
              ) : (
                <a key={a.id} href={a.dataUrl} download={a.name} className="chip">
                  <Icon name="file" size={15} /> {a.name.length > 18 ? a.name.slice(0, 16) + "…" : a.name}
                </a>
              ),
            )}
          </div>
        </div>
      )}

      <button className="btn primary block" style={{ marginTop: 20 }} onClick={onEdit}>
        <Icon name="edit" size={17} /> Modifier
      </button>
      <button
        className="btn danger-text block"
        style={{ marginTop: 6 }}
        onClick={() => {
          update((d) => {
            d.health = d.health.filter((x) => x.id !== entry.id);
          });
          onClose();
        }}
      >
        Supprimer cette entrée
      </button>
    </Sheet>
  );
}

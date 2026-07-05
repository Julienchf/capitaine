import { useState } from "react";
import Icon from "./Icon";
import { activeTreatments, allCareStatuses } from "../lib/selectors";
import { CARE_META } from "../lib/types";
import type { AppData, HealthEntry, Treatment } from "../lib/types";
import { ageText, formatDate, relativeToToday } from "../lib/dates";

export default function SharedCard({ data }: { data: AppData }) {
  const { profile } = data;
  const health = [...data.health].sort((a, b) => b.date.localeCompare(a.date));
  const treatments = activeTreatments(data);
  const care = allCareStatuses(data);
  const [showAllHealth, setShowAllHealth] = useState(false);
  const hasVet =
    profile.vetName || profile.vetPhone || profile.vetEmail || profile.vetAddress || profile.vetMapsUrl;
  const guideSections = [
    { title: "Repas", content: profile.feeding },
    { title: "Sorties", content: profile.outings },
    { title: "Ce que Capitaine sait", content: profile.commands },
    { title: "Règles à la maison", content: profile.rules },
  ].filter((s) => s.content);

  const shownHealth = showAllHealth ? health : health.slice(0, 5);

  return (
    <>
      {/* Identity */}
      <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
            background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {profile.photoDataUrl ? (
            <img src={profile.photoDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "var(--accent-ink)" }}><Icon name="paw" size={26} /></span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 600 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            {profile.breed} · {ageText(profile.birthDate)}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 1 }}>
            Né le {formatDate(profile.birthDate)}
          </div>
        </div>
      </div>

      {profile.emergencyNote && (
        <>
          <div className="section-title" style={{ color: "var(--danger)" }}>
            <Icon name="bell" size={15} /> En cas d'urgence
          </div>
          <div
            className="card-pad"
            style={{
              background: "var(--danger-soft)", border: "0.5px solid var(--danger)",
              borderRadius: 14, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
            }}
          >
            {profile.emergencyNote}
          </div>
        </>
      )}

      {hasVet && (
        <>
          <div className="section-title"><Icon name="hospital" size={15} /> Vétérinaire</div>
          <div className="card card-pad">
            {profile.vetName && <div style={{ fontSize: 16, fontWeight: 600 }}>{profile.vetName}</div>}
            {profile.vetPhone && (
              <a href={`tel:${profile.vetPhone.replace(/\s/g, "")}`} className="btn primary block" style={{ marginTop: profile.vetName ? 12 : 0 }}>
                <Icon name="phone" size={17} /> Appeler · {profile.vetPhone}
              </a>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              {profile.vetAddress && (
                <InfoLine icon="hospital">
                  <div>{profile.vetAddress}</div>
                  {profile.vetMapsUrl && (
                    <a href={profile.vetMapsUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)", fontWeight: 500 }}>Voir l'itinéraire</a>
                  )}
                </InfoLine>
              )}
              {profile.vetHours && (
                <InfoLine icon="clock">
                  {profile.vetHours.split("·").map((line, i) => <div key={i}>{line.trim()}</div>)}
                </InfoLine>
              )}
              {profile.vetEmail && (
                <InfoLine icon="mail"><a href={`mailto:${profile.vetEmail}`} style={{ color: "var(--accent-ink)" }}>{profile.vetEmail}</a></InfoLine>
              )}
              {profile.vetWebsite && (
                <InfoLine icon="link"><a href={profile.vetWebsite} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)" }}>Site internet</a></InfoLine>
              )}
            </div>
          </div>
        </>
      )}

      {guideSections.length > 0 && (
        <>
          <div className="section-title"><Icon name="paw" size={15} /> Guide de garde</div>
          <div className="card" style={{ padding: "0 15px" }}>
            {guideSections.map((s) => (
              <details className="acc" key={s.title}>
                <summary>
                  <span style={{ fontWeight: 500 }}>{s.title}</span>
                  <span className="chev"><Icon name="chevron" size={16} /></span>
                </summary>
                <div className="acc-body" style={{ color: "var(--text)" }}>
                  <GuideText text={s.content!} />
                </div>
              </details>
            ))}
          </div>
        </>
      )}

      {treatments.length > 0 && (
        <>
          <div className="section-title"><Icon name="pill" size={15} /> Traitement en cours</div>
          {treatments.map((t) => <TreatmentCard key={t.id} t={t} />)}
        </>
      )}

      {/* Recurring care — last / next / overdue */}
      <div className="section-title"><Icon name="scissors" size={15} /> Soins récurrents</div>
      <div className="card card-pad">
        {care.map((c, i) => {
          const pillCls = !c.nextDue ? "muted" : c.overdue ? "danger" : c.daysUntil! <= 10 ? "warning" : "ok";
          const pillTxt = !c.nextDue ? "à planifier" : c.overdue ? "en retard" : relativeToToday(c.nextDue).text;
          return (
            <div key={c.kind} style={{ padding: "10px 0", borderTop: i ? "0.5px solid var(--line)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{CARE_META[c.kind].label}</span>
                <span className={`pill ${pillCls}`}>{pillTxt}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
                {c.lastDone ? `Dernier : ${formatDate(c.lastDone)}` : "Jamais fait"}
                {c.nextDue ? ` · Prochain : ${formatDate(c.nextDue)}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      {health.length > 0 && (
        <>
          <div className="section-title"><Icon name="health" size={15} /> Antécédents ({health.length})</div>
          <div className="card" style={{ padding: "0 15px" }}>
            {shownHealth.map((h) => <HealthAccordion key={h.id} h={h} />)}
          </div>
          {health.length > 5 && (
            <button
              className="btn ghost block"
              style={{ marginTop: 8, color: "var(--accent-ink)" }}
              onClick={() => setShowAllHealth((v) => !v)}
            >
              {showAllHealth ? "Réduire" : `Voir les ${health.length - 5} autres`}
            </button>
          )}
        </>
      )}
    </>
  );
}

function InfoLine({ icon, children }: { icon: Parameters<typeof Icon>[0]["name"]; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
      <span style={{ color: "var(--faint)", marginTop: 1, flexShrink: 0 }}><Icon name={icon} size={16} /></span>
      <div>{children}</div>
    </div>
  );
}

/** Renders a guide section's plain text as a clean list (bullets, numbers, paragraphs). */
function GuideText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {lines.map((raw, i) => {
        const t = raw.trim();
        if (!t) return null;
        const num = t.match(/^(\d+)[.)]\s*(.*)$/);
        if (num) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span
                style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                  background: "var(--accent-soft)", color: "var(--accent-ink)",
                  fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {num[1]}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--text)" }}>{num[2]}</span>
            </div>
          );
        }
        if (t.startsWith("•") || t.startsWith("-")) {
          return (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{ color: "var(--accent)", fontSize: 15, lineHeight: 1.35, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--text)" }}>{t.replace(/^[•-]\s*/, "")}</span>
            </div>
          );
        }
        // "Label : item · item · item" → label + chips (e.g. "ce que Capitaine sait")
        if (t.includes(" · ")) {
          const colon = t.indexOf(":");
          let label = "";
          let listPart = t;
          if (colon !== -1 && t.slice(colon + 1).includes("·")) {
            label = t.slice(0, colon).trim();
            listPart = t.slice(colon + 1).trim();
          }
          const chips = listPart.split("·").map((s) => s.trim()).filter(Boolean);
          return (
            <div key={i}>
              {label && <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 7 }}>{label}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {chips.map((c, j) => (
                  <span
                    key={j}
                    style={{
                      fontSize: 13, background: "var(--accent-soft)", color: "var(--accent-ink)",
                      padding: "4px 10px", borderRadius: 999, lineHeight: 1.35,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text)" }}>{t}</div>
        );
      })}
    </div>
  );
}

function TreatmentCard({ t }: { t: Treatment }) {
  const attrs: { l: string; v: string }[] = [];
  if (t.dose) attrs.push({ l: "Dose", v: t.dose });
  if (t.frequency) attrs.push({ l: "Fréquence", v: t.frequency });
  if (t.timing) attrs.push({ l: "Moment", v: t.timing });
  attrs.push({ l: "Fin", v: t.endDate ? formatDate(t.endDate) : "En continu" });
  return (
    <div className="card card-pad" style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{t.medication}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--line)" }}>
        {attrs.map((a) => (
          <div key={a.l}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{a.l}</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 1 }}>{a.v}</div>
          </div>
        ))}
      </div>
      {t.notes && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, fontStyle: "italic" }}>{t.notes}</div>}
    </div>
  );
}

function HealthAccordion({ h }: { h: HealthEntry }) {
  return (
    <details className="acc">
      <summary>
        <span style={{ fontWeight: 500 }}>{h.title}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{formatDate(h.date)}</span>
          <span className="chev"><Icon name="chevron" size={16} /></span>
        </span>
      </summary>
      <div className="acc-body">
        {h.description && <div>{h.description}</div>}
        {h.medications && <div>Médicaments : {h.medications}</div>}
        {h.attachments.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: h.description || h.medications ? 8 : 0 }}>
            {h.attachments.map((a) =>
              a.type.startsWith("image") ? (
                <a key={a.id} href={a.dataUrl} target="_blank" rel="noreferrer">
                  <img src={a.dataUrl} alt={a.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "0.5px solid var(--line)" }} />
                </a>
              ) : (
                <a key={a.id} href={a.dataUrl} download={a.name} className="chip">
                  <Icon name="file" size={14} /> {a.name.length > 16 ? a.name.slice(0, 14) + "…" : a.name}
                </a>
              ),
            )}
          </div>
        )}
        {!h.description && !h.medications && !h.attachments.length && (
          <div style={{ color: "var(--faint)" }}>Aucun détail supplémentaire.</div>
        )}
      </div>
    </details>
  );
}

import { useState } from "react";
import Icon from "./Icon";
import { activeTreatments, allCareStatuses } from "../lib/selectors";
import { CARE_META, GUIDE_LABELS } from "../lib/types";
import type { AppData, DogGuide, HealthEntry, Treatment } from "../lib/types";
import { ageText, formatDate, relativeToToday } from "../lib/dates";

function guideHasContent(g?: DogGuide): boolean {
  return !!g && Object.values(g).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ""));
}

type IconName = Parameters<typeof Icon>[0]["name"];
const GUIDE_ICON: Record<string, IconName> = {
  "Repas": "bowl",
  "Sorties": "paw",
  "Ce que Capitaine sait": "check",
  "Règles à la maison": "home",
};

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

      {guideHasContent(profile.guide) ? (
        <>
          <div className="section-title"><Icon name="paw" size={15} /> Guide de garde</div>
          <GuideView guide={profile.guide!} />
        </>
      ) : guideSections.length > 0 ? (
        <>
          <div className="section-title"><Icon name="paw" size={15} /> Guide de garde</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {guideSections.map((s) => (
              <div className="card card-pad" key={s.title}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: "var(--accent-soft)", color: "var(--accent-ink)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name={GUIDE_ICON[s.title] ?? "paw"} size={18} />
                  </span>
                  <span style={{ fontSize: 15.5, fontWeight: 600 }}>{s.title}</span>
                </div>
                <GuideText text={s.content!} />
              </div>
            ))}
          </div>
        </>
      ) : null}

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

/** A line of guide text, possibly "Label : détails" → bold the label for scannability. */
function LabeledText({ text, size = 14 }: { text: string; size?: number }) {
  const m = text.match(/^([^:]{1,28}):\s*(.+)$/);
  if (m) {
    return (
      <span style={{ fontSize: size, lineHeight: 1.45, color: "var(--text)" }}>
        <b style={{ fontWeight: 600 }}>{m[1].trim()}</b> — {m[2].trim()}
      </span>
    );
  }
  return <span style={{ fontSize: size, lineHeight: 1.45, color: "var(--text)" }}>{text}</span>;
}

/**
 * Renders a guide section's free text as one harmonised layout, whatever the
 * raw formatting: intro paragraphs, bullet lists, numbered steps, and
 * "· "-separated inline lists all get a consistent, scannable style.
 */
function GuideText({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {lines.map((t, i) => {
        // Numbered step → numbered badge.
        const num = t.match(/^(\d+)[.)]\s*(.*)$/);
        if (num) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span
                style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                  background: "var(--accent)", color: "#fff",
                  fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {num[1]}
              </span>
              <LabeledText text={num[2]} />
            </div>
          );
        }
        // Bullet line → coloured dot + labelled text.
        if (t.startsWith("•") || t.startsWith("-") || t.startsWith("*")) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "var(--accent)", fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>•</span>
              <LabeledText text={t.replace(/^[•\-*]\s*/, "")} />
            </div>
          );
        }
        // "Label : item · item · item" → small label + chips.
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
              {label && (
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--muted)", marginBottom: 8 }}>
                  {label}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {chips.map((c, j) => (
                  <span
                    key={j}
                    style={{
                      fontSize: 13, background: "var(--accent-soft)", color: "var(--accent-ink)",
                      padding: "5px 11px", borderRadius: 999, lineHeight: 1.3, fontWeight: 500,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        // Plain paragraph (intro / free text).
        return (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>{t}</div>
        );
      })}
    </div>
  );
}

const HOUSETRAINED: Record<string, string> = {
  propre: "Propre", presque: "Presque propre", non: "Pas encore propre",
};
function lab(v?: string): string | undefined {
  return v ? GUIDE_LABELS[v] ?? v : undefined;
}

function GPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 12.5, fontWeight: 600, background: "var(--accent-soft)", color: "var(--accent-ink)", padding: "3px 11px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
function GRow({ label, value, note }: { label: string; value?: React.ReactNode; note?: React.ReactNode }) {
  if (value === undefined && !note) return null;
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13.5, color: "var(--muted)" }}>{label}</span>
        {value !== undefined && (typeof value === "string" ? <GPill>{value}</GPill> : value)}
      </div>
      {note && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}
function GChips({ label, items }: { label?: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
      {label && <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 8 }}>{label}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((c, i) => (
          <span key={i} style={{ fontSize: 13, background: "var(--accent-soft)", color: "var(--accent-ink)", padding: "5px 11px", borderRadius: 999, fontWeight: 500 }}>{c}</span>
        ))}
      </div>
    </div>
  );
}
function GuideCard({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={18} />
        </span>
        <span style={{ fontSize: 15.5, fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function GuideView({ guide: g }: { guide: DogGuide }) {
  const moments = g.outingMoments ?? [];
  const tricks = g.tricks ?? [];
  const hasCarac = g.sociable || g.energy || g.dominant || g.sociableNote || g.dominantNote;
  const hasRepas = g.mealsPerDay || g.mealGrams != null || g.kibbleBrand || g.kibbleUrl || g.treats || g.treatsNote || g.mealsNote;
  const hasSorties = g.housetrained || moments.length || g.dogPark || g.offLeash || g.dogParkNote || g.offLeashNote || g.outingsNote;
  const hasTricks = tricks.length || g.tricksNote;
  const hasRules = g.sofa || g.bed || g.bath;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {hasCarac && (
        <GuideCard icon="paw" title="Caractère">
          <GRow label="Sociable" value={lab(g.sociable)} note={g.sociableNote} />
          <GRow label="Niveau d'énergie" value={lab(g.energy)} />
          <GRow label="Dominant·e" value={lab(g.dominant)} note={g.dominantNote} />
        </GuideCard>
      )}
      {hasRepas && (
        <GuideCard icon="bowl" title="Repas">
          <GRow label="Rythme" value={g.mealsPerDay ? `${g.mealsPerDay}×/jour` : undefined} />
          <GRow label="Quantité" value={g.mealGrams != null ? `${g.mealGrams} g / repas` : undefined} />
          <GRow
            label="Croquettes"
            value={g.kibbleBrand}
            note={g.kibbleUrl ? <a href={g.kibbleUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)", fontWeight: 500 }}>Voir le produit →</a> : undefined}
          />
          <GRow label="Friandises" value={lab(g.treats)} note={g.treatsNote} />
          {g.mealsNote && <GRow label="Remarque" note={g.mealsNote} />}
        </GuideCard>
      )}
      {hasSorties && (
        <GuideCard icon="paw" title="Sorties">
          <GRow label="Propreté" value={g.housetrained ? HOUSETRAINED[g.housetrained] : undefined} />
          <GChips label="Rythme des sorties" items={moments} />
          <GRow label="Parc à chiens" value={lab(g.dogPark)} note={g.dogParkNote} />
          <GRow label="Sans laisse" value={lab(g.offLeash)} note={g.offLeashNote} />
          {g.outingsNote && <GRow label="Remarque" note={g.outingsNote} />}
        </GuideCard>
      )}
      {hasTricks && (
        <GuideCard icon="check" title="Ce que Capitaine sait">
          <GChips items={tricks} />
          {g.tricksNote && <GRow label="Remarque" note={g.tricksNote} />}
        </GuideCard>
      )}
      {hasRules && (
        <GuideCard icon="home" title="Règles à la maison">
          <GRow label="Canapé" value={lab(g.sofa)} />
          <GRow label="Lit" value={lab(g.bed)} />
          <GRow label="Bain / douche" value={lab(g.bath)} />
        </GuideCard>
      )}
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

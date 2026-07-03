import Icon from "./Icon";
import { activeTreatments, allCareStatuses } from "../lib/selectors";
import { CARE_META } from "../lib/types";
import type { AppData, HealthEntry, Treatment } from "../lib/types";
import { ageText, formatDate } from "../lib/dates";
import { euro } from "../lib/format";

export default function SharedCard({ data }: { data: AppData }) {
  const { profile } = data;
  const health = [...data.health].sort((a, b) => b.date.localeCompare(a.date));
  const treatments = activeTreatments(data);
  const care = allCareStatuses(data);
  const hasVet =
    profile.vetName || profile.vetPhone || profile.vetEmail || profile.vetAddress || profile.vetMapsUrl;
  const guideSections = [
    { title: "Repas", content: profile.feeding },
    { title: "Sorties", content: profile.outings },
    { title: "Ce que Capitaine sait", content: profile.commands },
    { title: "Règles à la maison", content: profile.rules },
  ].filter((s) => s.content);

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
                <div className="acc-body" style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>{s.content}</div>
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

      <div className="section-title"><Icon name="scissors" size={15} /> Soins récurrents</div>
      <div className="card card-pad">
        {care.map((c, i) => (
          <div key={c.kind} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: i ? "0.5px solid var(--line)" : "none" }}>
            <span style={{ fontSize: 14 }}>{CARE_META[c.kind].label}</span>
            <span style={{ fontSize: 13.5, color: "var(--muted)" }}>{c.nextDue ? formatDate(c.nextDue) : "à planifier"}</span>
          </div>
        ))}
      </div>

      {health.length > 0 && (
        <>
          <div className="section-title"><Icon name="health" size={15} /> Antécédents ({health.length})</div>
          <div className="card" style={{ padding: "0 15px" }}>
            {health.map((h) => <HealthAccordion key={h.id} h={h} />)}
          </div>
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
        {h.cost != null && <div>Coût : {euro(h.cost)}</div>}
        {h.attachments.length > 0 && <div>{h.attachments.length} pièce(s) jointe(s)</div>}
        {!h.description && !h.medications && h.cost == null && !h.attachments.length && (
          <div style={{ color: "var(--faint)" }}>Aucun détail supplémentaire.</div>
        )}
      </div>
    </details>
  );
}

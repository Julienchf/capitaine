import { useState } from "react";
import Icon from "../components/Icon";
import SharedCard from "../components/SharedCard";
import { useData, update } from "../lib/store";
import { isSyncConfigured } from "../lib/supabase";
import { publishShare, revokeShare } from "../lib/sync";
import { shareUrl } from "../lib/share";

export default function Partage() {
  const data = useData();
  const token = data.shareToken;
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    const t = crypto.randomUUID();
    update((d) => {
      d.shareToken = t;
    });
    await publishShare();
    setBusy(false);
  }

  async function copy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function revoke() {
    if (!token) return;
    setBusy(true);
    await revokeShare(token);
    update((d) => {
      d.shareToken = undefined;
    });
    setBusy(false);
  }

  return (
    <div className="page">
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <h1>Partage</h1>
        <div className="sub">Une fiche pour la dogsitter ou les amis qui gardent Capitaine</div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: "var(--accent)" }}><Icon name="link" size={22} /></span>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>Lien de partage sécurisé</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
              Un lien en lecture seule vers la fiche ci-dessous — sans le budget. Se met à jour tout seul, révocable à tout moment.
            </div>
          </div>
        </div>

        {!isSyncConfigured ? (
          <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 12 }}>
            Le partage sera disponible une fois la synchro connectée.
          </div>
        ) : token ? (
          <>
            <div
              style={{
                marginTop: 12, padding: "10px 12px", background: "var(--surface-2)",
                border: "0.5px solid var(--line)", borderRadius: 10, fontSize: 13,
                wordBreak: "break-all", color: "var(--muted)",
              }}
            >
              {shareUrl(token)}
            </div>
            <button className="btn primary block" style={{ marginTop: 10 }} onClick={copy}>
              <Icon name={copied ? "check" : "link"} size={17} /> {copied ? "Lien copié !" : "Copier le lien"}
            </button>
            <button className="btn danger-text block" style={{ marginTop: 6 }} onClick={revoke} disabled={busy}>
              Révoquer le lien
            </button>
          </>
        ) : (
          <button className="btn primary block" style={{ marginTop: 12 }} onClick={generate} disabled={busy}>
            <Icon name="share" size={17} /> {busy ? "…" : "Générer le lien de partage"}
          </button>
        )}
      </div>

      <div className="sub" style={{ fontSize: 13, color: "var(--faint)", marginBottom: 10 }}>
        Aperçu de la fiche partagée
      </div>

      <SharedCard data={data} />

      <div style={{ fontSize: 12.5, color: "var(--faint)", textAlign: "center", marginTop: 16, padding: "0 20px" }}>
        Le budget et les dépenses ne sont jamais inclus dans le partage.
      </div>
    </div>
  );
}

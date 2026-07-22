import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import ImageCropper from "../components/ImageCropper";
import BreedPicker from "../components/BreedPicker";
import GuideEditor from "../components/GuideEditor";
import Sheet from "../components/Sheet";
import { useData, update, resetData, getData, mergeInData } from "../lib/store";
import { ageText, humanAge, formatDate, todayISO } from "../lib/dates";
import { fileToDataUrl } from "../lib/format";
import { supabase, isSyncConfigured } from "../lib/supabase";
import { listSnapshots, getSnapshot, type SnapshotMeta } from "../lib/history";
import { photoSrc, uploadDataUrl } from "../lib/storage";
import type { AppData } from "../lib/types";

export default function Profil() {
  const data = useData();
  const nav = useNavigate();
  const { profile } = data;
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function set<K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) {
    update((d) => {
      d.profile[key] = value;
    });
  }

  const [historyOpen, setHistoryOpen] = useState(false);

  async function onPhoto(files: FileList | null) {
    if (!files?.[0]) return;
    const url = await fileToDataUrl(files[0]);
    setCropSrc(url);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capitaine-sauvegarde-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AppData;
      if (!parsed || typeof parsed !== "object" || !parsed.profile) {
        alert("Ce fichier n'est pas une sauvegarde Capitaine valide.");
        return;
      }
      const gained = mergeInData(parsed);
      alert(
        gained > 0
          ? `Sauvegarde importée : ${gained} élément(s) restauré(s). ✅`
          : "Sauvegarde importée. Aucun élément manquant à ajouter.",
      );
    } catch {
      alert("Impossible de lire ce fichier de sauvegarde.");
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn ghost" style={{ padding: 4, marginLeft: -4 }} onClick={() => nav(-1)} aria-label="Retour">
          <Icon name="chevron-left" size={24} />
        </button>
        <h1 style={{ fontSize: 24 }}>Profil</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0 18px" }}>
        <label style={{ cursor: "pointer", position: "relative" }}>
          <div
            style={{
              width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
              background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {photoSrc(profile) ? (
              <img src={photoSrc(profile)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ color: "var(--accent-ink)" }}><Icon name="paw" size={44} /></span>
            )}
          </div>
          <span
            style={{
              position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: "50%",
              background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid var(--bg)",
            }}
          >
            <Icon name="camera" size={16} />
          </span>
          <input type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files)} />
        </label>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 10 }}>{profile.name}</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 2 }}>
          {ageText(profile.birthDate)} · ≈ {humanAge(profile.birthDate)} ans humains
        </div>
        <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 1 }}>
          Né le {formatDate(profile.birthDate)}
        </div>
      </div>

      <div className="field" style={{ marginTop: 0 }}>
        <label>Nom</label>
        <input value={profile.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="field">
        <label>Race</label>
        <BreedPicker value={profile.breed} onChange={(b) => set("breed", b)} />
      </div>
      <div className="field">
        <label>Date de naissance</label>
        <input type="date" value={profile.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
      </div>

      <div className="section-title">Budget</div>
      <div className="field" style={{ marginTop: 0 }}>
        <label>Budget mensuel (€)</label>
        <input
          type="number"
          inputMode="numeric"
          value={data.monthlyBudget}
          onChange={(e) => update((d) => { d.monthlyBudget = parseInt(e.target.value) || 0; })}
        />
      </div>

      <div className="section-title">Vétérinaire</div>
      <div className="field" style={{ marginTop: 0 }}>
        <label>Nom / clinique</label>
        <input value={profile.vetName ?? ""} placeholder="ex. Clinique des Lilas" onChange={(e) => set("vetName", e.target.value)} />
      </div>
      <div className="field">
        <label>Téléphone</label>
        <input value={profile.vetPhone ?? ""} placeholder="ex. 01 23 45 67 89" onChange={(e) => set("vetPhone", e.target.value)} inputMode="tel" />
      </div>
      <div className="field">
        <label>Email</label>
        <input value={profile.vetEmail ?? ""} placeholder="ex. contact@clinique.fr" onChange={(e) => set("vetEmail", e.target.value)} inputMode="email" />
      </div>
      <div className="field">
        <label>Adresse</label>
        <input value={profile.vetAddress ?? ""} placeholder="ex. 12 rue des Lilas, Paris" onChange={(e) => set("vetAddress", e.target.value)} />
      </div>
      <div className="field">
        <label>Lien Google Maps</label>
        <input value={profile.vetMapsUrl ?? ""} placeholder="Coller le lien de partage" onChange={(e) => set("vetMapsUrl", e.target.value)} inputMode="url" />
      </div>
      <div className="field">
        <label>Site internet</label>
        <input value={profile.vetWebsite ?? ""} placeholder="https://…" onChange={(e) => set("vetWebsite", e.target.value)} inputMode="url" />
      </div>
      <div className="field">
        <label>Horaires d'ouverture</label>
        <textarea value={profile.vetHours ?? ""} placeholder="ex. Mardi 9h–21h · Mer.–Ven. 9h–19h30…" onChange={(e) => set("vetHours", e.target.value)} />
      </div>
      <div className="field">
        <label>Note pour la garde / urgence</label>
        <textarea
          value={profile.emergencyNote ?? ""}
          placeholder="Allergies, habitudes, contacts…"
          onChange={(e) => set("emergencyNote", e.target.value)}
        />
      </div>

      <div className="section-title">Guide de garde</div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 4, lineHeight: 1.5 }}>
        Le mode d'emploi pour la dogsitter — visible dans la fiche partagée.
      </div>
      <GuideEditor
        value={profile.guide ?? {}}
        onChange={(patch) =>
          update((d) => {
            d.profile.guide = { ...(d.profile.guide ?? {}), ...patch };
          })
        }
      />

      <div className="section-title">Bientôt disponible</div>
      <div className="row" style={{ marginBottom: 8, opacity: 0.7 }}>
        <div className="ic-badge ic-accent"><Icon name="gift" size={20} /></div>
        <div className="grow"><div className="title">Photos d'anniversaire</div>
          <div className="meta">Un souvenir chaque année, façon BeReal</div></div>
        <span className="pill muted">v2</span>
      </div>
      <div className="row" style={{ opacity: 0.7 }}>
        <div className="ic-badge ic-accent"><Icon name="sparkles" size={20} /></div>
        <div className="grow"><div className="title">Essayage d'accessoires (IA)</div>
          <div className="meta">Voir un collier ou harnais sur Capitaine</div></div>
        <span className="pill muted">v2</span>
      </div>

      {!isSyncConfigured && (
        <button
          className="btn danger-text block"
          style={{ marginTop: 24 }}
          onClick={() => {
            if (confirm("Réinitialiser toutes les données de démonstration ?")) resetData();
          }}
        >
          Réinitialiser les données
        </button>
      )}

      <div className="section-title">Sauvegarde &amp; sécurité</div>
      <div className="card card-pad">
        <div className="meta" style={{ marginBottom: 12, lineHeight: 1.5 }}>
          Tes données sont synchronisées et versionnées dans le cloud. Tu peux
          aussi en garder une copie sur ton appareil.
        </div>

        {isSyncConfigured && (
          <button
            className="row"
            style={{ width: "100%", textAlign: "left", marginBottom: 8 }}
            onClick={() => setHistoryOpen(true)}
          >
            <div className="ic-badge ic-accent"><Icon name="clock" size={20} /></div>
            <div className="grow">
              <div className="title">Historique des versions</div>
              <div className="meta">Restaurer une version antérieure</div>
            </div>
            <Icon name="chevron" size={18} className="ic-badge" />
          </button>
        )}

        <button
          className="row"
          style={{ width: "100%", textAlign: "left", marginBottom: 8 }}
          onClick={exportBackup}
        >
          <div className="ic-badge ic-muted"><Icon name="file" size={20} /></div>
          <div className="grow">
            <div className="title">Exporter une sauvegarde</div>
            <div className="meta">Télécharger un fichier .json</div>
          </div>
        </button>

        <label className="row" style={{ width: "100%", textAlign: "left", cursor: "pointer", margin: 0 }}>
          <div className="ic-badge ic-muted"><Icon name="share" size={20} /></div>
          <div className="grow">
            <div className="title">Importer une sauvegarde</div>
            <div className="meta">Restaurer depuis un fichier .json</div>
          </div>
          <input
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => {
              void importBackup(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {isSyncConfigured && (
        <button
          className="btn block"
          style={{ marginTop: 8 }}
          onClick={() => supabase?.auth.signOut()}
        >
          Se déconnecter
        </button>
      )}

      {historyOpen && <HistorySheet onClose={() => setHistoryOpen(false)} />}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onClose={() => setCropSrc(null)}
          onDone={async (url) => {
            setCropSrc(null);
            const uploaded = await uploadDataUrl(url, "capitaine.jpg");
            update((d) => {
              if (uploaded) {
                d.profile.photoUrl = uploaded.url;
                d.profile.photoDataUrl = undefined;
              } else {
                d.profile.photoDataUrl = url;
                d.profile.photoUrl = undefined;
              }
            });
          }}
        />
      )}
    </div>
  );
}

function HistorySheet({ onClose }: { onClose: () => void }) {
  const [snaps, setSnaps] = useState<SnapshotMeta[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    void listSnapshots().then(setSnaps);
  }, []);

  function fmt(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `${date} à ${time}`;
  }

  async function restore(s: SnapshotMeta) {
    const total = s.counts.health + s.counts.expenses + s.counts.careEvents + s.counts.treatments + s.counts.appointments;
    if (!confirm(`Restaurer la version du ${fmt(s.created_at)} ?\nElle contient ${total} élément(s). Ils seront réintégrés à tes données actuelles (rien ne sera supprimé).`)) return;
    setBusy(s.id);
    const doc = await getSnapshot(s.id);
    setBusy(null);
    if (!doc) {
      alert("Impossible de charger cette version.");
      return;
    }
    const gained = mergeInData(doc);
    alert(gained > 0 ? `Version restaurée : ${gained} élément(s) réintégré(s). ✅` : "Version restaurée. Tes données étaient déjà à jour.");
    onClose();
  }

  return (
    <Sheet title="Historique des versions" onClose={onClose}>
      {snaps === null ? (
        <div className="meta" style={{ padding: "12px 0" }}>Chargement…</div>
      ) : snaps.length === 0 ? (
        <div className="empty">
          <Icon name="clock" size={34} className="ic" />
          Aucune version enregistrée pour l'instant. Les sauvegardes automatiques
          apparaîtront ici au fil de tes modifications.
        </div>
      ) : (
        <>
          <div className="meta" style={{ marginBottom: 10, lineHeight: 1.5 }}>
            Chaque ligne est un instantané automatique. Choisis-en une pour
            réintégrer son contenu.
          </div>
          {snaps.map((s) => (
            <div className="row" key={s.id} style={{ marginBottom: 8 }}>
              <div className="grow">
                <div className="title">{fmt(s.created_at)}</div>
                <div className="meta">
                  {s.counts.health} pépin(s) · {s.counts.expenses} dépense(s) ·{" "}
                  {s.counts.careEvents} soin(s) · {s.counts.appointments} RDV
                </div>
              </div>
              <button
                className="btn ghost"
                style={{ color: "var(--accent-ink)" }}
                disabled={busy !== null}
                onClick={() => void restore(s)}
              >
                {busy === s.id ? "…" : "Restaurer"}
              </button>
            </div>
          ))}
        </>
      )}
    </Sheet>
  );
}

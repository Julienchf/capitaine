import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import ImageCropper from "../components/ImageCropper";
import { useData, update, resetData } from "../lib/store";
import { ageText, humanAge, formatDate } from "../lib/dates";
import { fileToDataUrl } from "../lib/format";
import { supabase, isSyncConfigured } from "../lib/supabase";

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

  async function onPhoto(files: FileList | null) {
    if (!files?.[0]) return;
    const url = await fileToDataUrl(files[0]);
    setCropSrc(url);
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
            {profile.photoDataUrl ? (
              <img src={profile.photoDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
        <input value={profile.breed} onChange={(e) => set("breed", e.target.value)} />
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
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
        Le mode d'emploi pour la dogsitter — visible dans la fiche partagée.
      </div>
      <div className="field" style={{ marginTop: 0 }}>
        <label>Repas</label>
        <textarea value={profile.feeding ?? ""} placeholder="Rythme, quantité, préparation…" onChange={(e) => set("feeding", e.target.value)} style={{ minHeight: 90 }} />
      </div>
      <div className="field">
        <label>Sorties</label>
        <textarea value={profile.outings ?? ""} placeholder="Horaires, comportement au parc…" onChange={(e) => set("outings", e.target.value)} style={{ minHeight: 110 }} />
      </div>
      <div className="field">
        <label>Ce que Capitaine sait</label>
        <textarea value={profile.commands ?? ""} placeholder="Ordres connus…" onChange={(e) => set("commands", e.target.value)} style={{ minHeight: 80 }} />
      </div>
      <div className="field">
        <label>Règles à la maison</label>
        <textarea value={profile.rules ?? ""} placeholder="Ce qui est autorisé ou non…" onChange={(e) => set("rules", e.target.value)} style={{ minHeight: 90 }} />
      </div>

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

      <button
        className="btn danger-text block"
        style={{ marginTop: 24 }}
        onClick={() => {
          if (confirm("Réinitialiser toutes les données de démonstration ?")) resetData();
        }}
      >
        Réinitialiser les données
      </button>

      {isSyncConfigured && (
        <button
          className="btn block"
          style={{ marginTop: 8 }}
          onClick={() => supabase?.auth.signOut()}
        >
          Se déconnecter
        </button>
      )}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onClose={() => setCropSrc(null)}
          onDone={(url) => {
            set("photoDataUrl", url);
            setCropSrc(null);
          }}
        />
      )}
    </div>
  );
}

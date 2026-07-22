import type { DogGuide } from "../lib/types";
import { OUTING_MOMENTS } from "../lib/types";
import { DOG_TRICKS } from "../lib/tricks";
import MultiPicker from "./MultiPicker";

type Opt = { v: string; l: string };
const YND: Opt[] = [{ v: "oui", l: "Oui" }, { v: "non", l: "Non" }, { v: "depend", l: "Ça dépend" }];
const YNP: Opt[] = [{ v: "oui", l: "Oui" }, { v: "non", l: "Non" }, { v: "parfois", l: "Parfois" }];
const YN: Opt[] = [{ v: "oui", l: "Oui" }, { v: "non", l: "Non" }];
const ENERGY: Opt[] = [{ v: "bas", l: "Basse" }, { v: "moyen", l: "Moyenne" }, { v: "haut", l: "Haute" }];
const CLEAN: Opt[] = [{ v: "propre", l: "Propre" }, { v: "presque", l: "Presque" }, { v: "non", l: "Pas encore" }];
const MEALS: Opt[] = [{ v: "1", l: "1×/jour" }, { v: "2", l: "2×/jour" }, { v: "3", l: "3×/jour" }];
const BATH: Opt[] = [{ v: "oui", l: "Oui" }, { v: "non", l: "Non" }, { v: "eviter", l: "À éviter" }];

function Choice({
  label, value, options, onSelect,
}: { label: string; value?: string; options: Opt[]; onSelect: (v: string | undefined) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chips">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className={`chip ${value === o.v ? "on" : ""}`}
            onClick={() => onSelect(value === o.v ? undefined : o.v)}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="section-title" style={{ marginTop: 22 }}>{title}</div>
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</div>
    </>
  );
}

export default function GuideEditor({
  value,
  onChange,
}: {
  value: DogGuide;
  onChange: (patch: Partial<DogGuide>) => void;
}) {
  const g = value;
  const note = (key: keyof DogGuide, placeholder: string) => (
    <div className="field">
      <input
        placeholder={placeholder}
        value={(g[key] as string) ?? ""}
        onChange={(e) => onChange({ [key]: e.target.value || undefined } as Partial<DogGuide>)}
      />
    </div>
  );

  const moments = g.outingMoments ?? [];
  const toggleMoment = (m: string) =>
    onChange({ outingMoments: moments.includes(m) ? moments.filter((x) => x !== m) : [...moments, m] });

  return (
    <div>
      <GuideSection title="Caractère">
        <Choice label="Sociable" value={g.sociable} options={YND} onSelect={(v) => onChange({ sociable: v as DogGuide["sociable"] })} />
        {note("sociableNote", "Précision (ex. craintif avec les grands chiens)…")}
        <Choice label="Niveau d'énergie" value={g.energy} options={ENERGY} onSelect={(v) => onChange({ energy: v as DogGuide["energy"] })} />
        <Choice label="Dominant·e" value={g.dominant} options={YND} onSelect={(v) => onChange({ dominant: v as DogGuide["dominant"] })} />
        {note("dominantNote", "Précision (ex. avec la nourriture)…")}
      </GuideSection>

      <GuideSection title="Repas">
        <Choice label="Rythme des repas" value={g.mealsPerDay ? String(g.mealsPerDay) : undefined} options={MEALS} onSelect={(v) => onChange({ mealsPerDay: v ? (Number(v) as DogGuide["mealsPerDay"]) : undefined })} />
        <div className="field">
          <label>Quantité par repas (g)</label>
          <input type="number" inputMode="numeric" placeholder="ex. 70" value={g.mealGrams ?? ""} onChange={(e) => onChange({ mealGrams: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div className="field">
          <label>Marque de croquettes</label>
          <input placeholder="ex. Royal Canin Medium" value={g.kibbleBrand ?? ""} onChange={(e) => onChange({ kibbleBrand: e.target.value || undefined })} />
        </div>
        <div className="field">
          <label>Lien du produit (optionnel)</label>
          <input type="url" inputMode="url" placeholder="https://…" value={g.kibbleUrl ?? ""} onChange={(e) => onChange({ kibbleUrl: e.target.value || undefined })} />
        </div>
        <Choice label="Friandises autorisées" value={g.treats} options={YNP} onSelect={(v) => onChange({ treats: v as DogGuide["treats"] })} />
        {note("treatsNote", "Lesquelles / dans quelles conditions…")}
        {note("mealsNote", "Commentaire ou spécificité (repas)…")}
      </GuideSection>

      <GuideSection title="Sorties">
        <Choice label="Propreté" value={g.housetrained} options={CLEAN} onSelect={(v) => onChange({ housetrained: v as DogGuide["housetrained"] })} />
        <div className="field">
          <label>Rythme des sorties {g.housetrained === "non" || g.housetrained === "presque" ? "(sortir souvent)" : ""}</label>
          <div className="chips">
            {OUTING_MOMENTS.map((m) => (
              <button key={m} type="button" className={`chip ${moments.includes(m) ? "on" : ""}`} onClick={() => toggleMoment(m)}>{m}</button>
            ))}
          </div>
        </div>
        <Choice label="Parc à chiens" value={g.dogPark} options={YN} onSelect={(v) => onChange({ dogPark: v as DogGuide["dogPark"] })} />
        {note("dogParkNote", "Précision (ex. OK si peu de monde)…")}
        <Choice label="Promener sans laisse" value={g.offLeash} options={YN} onSelect={(v) => onChange({ offLeash: v as DogGuide["offLeash"] })} />
        {note("offLeashNote", "Précision (ex. seulement en forêt)…")}
        {note("outingsNote", "Commentaire ou spécificité (sorties)…")}
      </GuideSection>

      <GuideSection title="Les tours qu'il connaît">
        <div className="field">
          <MultiPicker
            value={g.tricks ?? []}
            options={DOG_TRICKS}
            onChange={(next) => onChange({ tricks: next.length ? next : undefined })}
            title="Tours du chien"
            addLabel="Choisir les tours"
            placeholder="Rechercher un tour…"
          />
        </div>
        {note("tricksNote", "Commentaire (ex. « Roule » en cours d'apprentissage)…")}
      </GuideSection>

      <GuideSection title="Règles à la maison">
        <Choice label="Canapé" value={g.sofa} options={YNP} onSelect={(v) => onChange({ sofa: v as DogGuide["sofa"] })} />
        <Choice label="Lit" value={g.bed} options={YNP} onSelect={(v) => onChange({ bed: v as DogGuide["bed"] })} />
        <Choice label="Bain / douche" value={g.bath} options={BATH} onSelect={(v) => onChange({ bath: v as DogGuide["bath"] })} />
      </GuideSection>
    </div>
  );
}

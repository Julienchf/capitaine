import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import Icon from "./Icon";
import { DOG_BREEDS, normalizeBreed } from "../lib/breeds";

export default function BreedPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (breed: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn block"
        style={{ justifyContent: "space-between", fontWeight: 500 }}
        onClick={() => setOpen(true)}
      >
        <span style={{ color: value ? "var(--text)" : "var(--faint)" }}>
          {value || "Choisir une race…"}
        </span>
        <Icon name="search" size={18} className="ic-badge" />
      </button>
      {open && (
        <BreedSheet
          value={value}
          onClose={() => setOpen(false)}
          onPick={(b) => {
            onChange(b);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function BreedSheet({
  value,
  onClose,
  onPick,
}: {
  value: string;
  onClose: () => void;
  onPick: (breed: string) => void;
}) {
  const [q, setQ] = useState("");
  const nq = normalizeBreed(q);
  const results = useMemo(
    () => (nq ? DOG_BREEDS.filter((b) => normalizeBreed(b).includes(nq)) : DOG_BREEDS),
    [nq],
  );
  const exact = results.some((b) => normalizeBreed(b) === nq);

  return (
    <Sheet title="Race de Capitaine" onClose={onClose}>
      <div className="field" style={{ marginTop: 6 }}>
        <input
          autoFocus
          placeholder="Rechercher une race…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div style={{ maxHeight: "60vh", overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        {q.trim() && !exact && (
          <button
            type="button"
            className="row"
            style={{ width: "100%", textAlign: "left", marginBottom: 4 }}
            onClick={() => onPick(q.trim())}
          >
            <span className="ic-badge ic-grad"><Icon name="plus" size={18} /></span>
            <span className="grow"><span className="title">Utiliser « {q.trim()} »</span></span>
          </button>
        )}
        {results.map((b) => {
          const on = b === value;
          return (
            <button
              key={b}
              type="button"
              onClick={() => onPick(b)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", textAlign: "left", background: "transparent", border: "none",
                padding: "12px 6px", borderBottom: "1px solid var(--line)",
                color: "var(--text)", fontSize: 15, fontWeight: on ? 700 : 500,
              }}
            >
              {b}
              {on && <Icon name="check" size={18} className="ic-badge" />}
            </button>
          );
        })}
        {results.length === 0 && (
          <div className="empty" style={{ padding: "24px 0" }}>Aucune race trouvée — utilise la saisie libre ci-dessus.</div>
        )}
      </div>
    </Sheet>
  );
}

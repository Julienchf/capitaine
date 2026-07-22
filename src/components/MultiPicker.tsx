import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import Icon from "./Icon";
import { normalizeBreed as normalize } from "../lib/breeds";

/** Multi-select from an ordered list, with search and free-text add. */
export default function MultiPicker({
  value,
  options,
  onChange,
  title,
  addLabel = "Ajouter",
  placeholder = "Rechercher…",
}: {
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
  title: string;
  addLabel?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((x) => x !== item) : [...value, item]);

  return (
    <>
      {value.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {value.map((v) => (
            <span key={v} className="chip on" onClick={() => toggle(v)}>
              {v} ✕
            </span>
          ))}
        </div>
      )}
      <button type="button" className="btn block" onClick={() => setOpen(true)}>
        <Icon name="plus" size={17} /> {addLabel}
      </button>
      {open && (
        <PickerSheet
          value={value}
          options={options}
          title={title}
          placeholder={placeholder}
          onToggle={toggle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PickerSheet({
  value,
  options,
  title,
  placeholder,
  onToggle,
  onClose,
}: {
  value: string[];
  options: string[];
  title: string;
  placeholder: string;
  onToggle: (item: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const nq = normalize(q);
  const results = useMemo(
    () => (nq ? options.filter((o) => normalize(o).includes(nq)) : options),
    [nq, options],
  );
  const exact = options.some((o) => normalize(o) === nq);

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="field" style={{ marginTop: 6 }}>
        <input autoFocus placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ maxHeight: "58vh", overflowY: "auto", marginTop: 8 }}>
        {q.trim() && !exact && (
          <button
            type="button"
            className="row"
            style={{ width: "100%", textAlign: "left", marginBottom: 6 }}
            onClick={() => { onToggle(q.trim()); setQ(""); }}
          >
            <span className="ic-badge ic-grad"><Icon name="plus" size={18} /></span>
            <span className="grow"><span className="title">Ajouter « {q.trim()} »</span></span>
          </button>
        )}
        {results.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", textAlign: "left", background: "transparent", border: "none",
                padding: "12px 6px", borderBottom: "1px solid var(--line)",
                color: on ? "var(--accent-ink)" : "var(--text)", fontSize: 15, fontWeight: on ? 700 : 500,
              }}
            >
              {o}
              {on && <Icon name="check" size={18} />}
            </button>
          );
        })}
      </div>
      <button className="btn primary block" style={{ marginTop: 14 }} onClick={onClose}>
        Terminé{value.length ? ` (${value.length})` : ""}
      </button>
    </Sheet>
  );
}

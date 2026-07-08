import Icon from "./Icon";
import type { Attachment } from "../lib/types";

const clip = (n: string) => (n.length > 18 ? n.slice(0, 16) + "…" : n);

/** Removable chips for editing sheets. */
export function AttachmentChips({
  items,
  onRemove,
}: {
  items: Attachment[];
  onRemove: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="chips" style={{ marginBottom: 6 }}>
      {items.map((a) => (
        <span key={a.id} className="chip on" onClick={() => onRemove(a.id)}>
          <Icon name="file" size={13} /> {clip(a.name || "Facture")} ✕
        </span>
      ))}
    </div>
  );
}

/** Read-only viewer for detail sheets: image thumbnails or downloadable file chips. */
export function AttachmentView({ items, label = "Ordonnances / factures" }: { items?: Attachment[]; label?: string }) {
  if (!items || !items.length) return null;
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((a) =>
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
              <Icon name="file" size={15} /> {clip(a.name)}
            </a>
          ),
        )}
      </div>
    </div>
  );
}

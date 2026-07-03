import { useState } from "react";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import { useData, update, uid } from "../lib/store";
import { stockStatus } from "../lib/selectors";
import type { StockItem } from "../lib/types";
import { todayISO } from "../lib/dates";

export default function Rappels() {
  const data = useData();
  const [editStock, setEditStock] = useState<StockItem | "new" | null>(null);

  return (
    <div className="page">
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <h1>Stocks</h1>
        <div className="sub">Croquettes, friandises… rappel 30, 15 et 7 jours avant la fin</div>
      </div>

      {data.stock.length === 0 ? (
        <div className="empty">
          <Icon name="box" size={34} className="ic" />
          Aucun stock suivi.
          <br />
          Ajoute tes croquettes ou friandises pour être relancé à temps.
        </div>
      ) : (
        data.stock.map((item) => {
          const s = stockStatus(item);
          const cls = s.daysLeft <= 3 ? "danger" : s.low ? "warning" : "ok";
          const txt =
            s.daysLeft < 0 ? "épuisé" : s.daysLeft === 0 ? "aujourd'hui" : `~${s.daysLeft} j`;
          return (
            <div className="row" key={item.id} style={{ marginBottom: 8 }}>
              <div className={`ic-badge ${item.kind === "croquettes" ? "ic-warning" : "ic-accent"}`}>
                <Icon name={item.kind === "croquettes" ? "bowl" : "bone"} size={20} />
              </div>
              <div className="grow" style={{ cursor: "pointer" }} onClick={() => setEditStock(item)}>
                <div className="title">{item.name}</div>
                <div className="meta">
                  Autonomie : {item.durationDays} j
                  {s.reminderDays != null && s.daysLeft >= 0
                    ? ` · rappel ${s.reminderDays === 30 ? "1 mois" : `${s.reminderDays} j`} avant`
                    : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span className={`pill ${cls}`}>{txt}</span>
                <button
                  className="btn ghost"
                  style={{ padding: "2px 6px", fontSize: 13 }}
                  onClick={() =>
                    update((d) => {
                      const t = d.stock.find((x) => x.id === item.id);
                      if (t) t.lastRestock = todayISO();
                    })
                  }
                >
                  Recommandé ✓
                </button>
              </div>
            </div>
          );
        })
      )}

      <button className="btn block" style={{ marginTop: 8 }} onClick={() => setEditStock("new")}>
        <Icon name="plus" size={17} /> Ajouter un stock à suivre
      </button>

      {editStock && (
        <StockSheet item={editStock === "new" ? null : editStock} onClose={() => setEditStock(null)} />
      )}
    </div>
  );
}

function StockSheet({ item, onClose }: { item: StockItem | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [kind, setKind] = useState<StockItem["kind"]>(item?.kind ?? "croquettes");
  const [durationDays, setDurationDays] = useState(String(item?.durationDays ?? 30));
  const [lastRestock, setLastRestock] = useState(item?.lastRestock ?? todayISO());

  function save() {
    if (!name.trim()) return;
    update((d) => {
      if (item) {
        const t = d.stock.find((x) => x.id === item.id);
        if (t) {
          t.name = name;
          t.kind = kind;
          t.durationDays = parseInt(durationDays) || 30;
          t.lastRestock = lastRestock;
        }
      } else {
        d.stock.push({
          id: uid(),
          name,
          kind,
          durationDays: parseInt(durationDays) || 30,
          lastRestock,
        });
      }
    });
    onClose();
  }

  return (
    <Sheet title={item ? "Modifier le stock" : "Nouveau stock à suivre"} onClose={onClose}>
      <div className="field">
        <label>Nom</label>
        <input placeholder="ex. Croquettes Acana" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Type</label>
        <div className="chips">
          <button type="button" className={`chip ${kind === "croquettes" ? "on" : ""}`} onClick={() => setKind("croquettes")}>
            🥣 Croquettes
          </button>
          <button type="button" className={`chip ${kind === "friandises" ? "on" : ""}`} onClick={() => setKind("friandises")}>
            🦴 Friandises
          </button>
        </div>
      </div>
      <div className="field">
        <label>Combien de temps dure un réassort ? (jours)</label>
        <input type="number" inputMode="numeric" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
      </div>
      <div className="field">
        <label>Dernier réassort</label>
        <input type="date" value={lastRestock} onChange={(e) => setLastRestock(e.target.value)} />
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        Enregistrer
      </button>
      {item && (
        <button
          className="btn danger-text block"
          style={{ marginTop: 6 }}
          onClick={() => {
            update((d) => {
              d.stock = d.stock.filter((x) => x.id !== item.id);
            });
            onClose();
          }}
        >
          Supprimer
        </button>
      )}
    </Sheet>
  );
}

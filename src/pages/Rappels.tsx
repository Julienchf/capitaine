import { useState } from "react";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import { useData, update, uid } from "../lib/store";
import { stockStatus } from "../lib/selectors";
import type { StockItem, StockKind } from "../lib/types";
import { STOCK_META } from "../lib/types";
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
              <div className={`ic-badge ${STOCK_META[item.kind].iconClass}`}>
                <Icon name={STOCK_META[item.kind].icon as Parameters<typeof Icon>[0]["name"]} size={20} />
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
                      if (!t) return;
                      t.lastRestock = todayISO();
                      // Log the purchase so it counts in the budget.
                      if (t.cost) {
                        t.purchases = [...(t.purchases ?? []), { id: uid(), date: todayISO(), amount: t.cost }];
                      }
                    })
                  }
                >
                  {item.cost ? "Racheté ✓" : "Recommandé ✓"}
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
  const [kind, setKind] = useState<StockKind>(item?.kind ?? "croquettes");
  const [durationDays, setDurationDays] = useState(String(item?.durationDays ?? 30));
  const [lastRestock, setLastRestock] = useState(item?.lastRestock ?? todayISO());
  const [cost, setCost] = useState(item?.cost != null ? String(item.cost) : "");

  function save() {
    if (!name.trim()) return;
    const costN = cost ? parseFloat(cost) : undefined;
    update((d) => {
      if (item) {
        const t = d.stock.find((x) => x.id === item.id);
        if (t) {
          t.name = name;
          t.kind = kind;
          t.durationDays = parseInt(durationDays) || 30;
          t.lastRestock = lastRestock;
          t.cost = costN;
        }
      } else {
        d.stock.push({
          id: uid(),
          name,
          kind,
          durationDays: parseInt(durationDays) || 30,
          lastRestock,
          cost: costN,
          // Log the first purchase (at the last-restock date) so it counts in the budget.
          purchases: costN ? [{ id: uid(), date: lastRestock, amount: costN }] : [],
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
          {(Object.keys(STOCK_META) as StockKind[]).map((k) => (
            <button key={k} type="button" className={`chip ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>
              {STOCK_META[k].emoji} {STOCK_META[k].label}
            </button>
          ))}
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
      <div className="field">
        <label>Coût par réassort (€, optionnel)</label>
        <input type="number" inputMode="decimal" placeholder="ex. 45" value={cost} onChange={(e) => setCost(e.target.value)} />
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
          Compté dans le budget à chaque « Racheté ✓ ».
        </div>
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

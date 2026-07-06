import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import { useData, update, uid } from "../lib/store";
import { budgetItems, budgetTotal, periodBudget } from "../lib/selectors";
import { EXPENSE_META } from "../lib/types";
import type { ExpenseCategory } from "../lib/types";

const SOURCE_LABEL: Record<string, string> = { soin: "Soin", sante: "Santé", stock: "Stock" };
import {
  currentMonthKey,
  endOfMonthISO,
  formatShort,
  monthLabel,
  startOfYearISO,
  todayISO,
} from "../lib/dates";
import { euro } from "../lib/format";
import type { Expense } from "../lib/types";

type Period = "month" | "year" | "custom";

function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Budget() {
  const data = useData();
  const [period, setPeriod] = useState<Period>("month");
  const [monthK, setMonthK] = useState(currentMonthKey());
  const [from, setFrom] = useState(startOfYearISO());
  const [to, setTo] = useState(todayISO());
  const [sheet, setSheet] = useState<Expense | "new" | null>(null);
  const [expanded, setExpanded] = useState(false);

  const range = useMemo(() => {
    if (period === "month") {
      const first = `${monthK}-01`;
      const last = endOfMonthISO(monthK);
      return { from: first, to: last, label: monthLabel(monthK) };
    }
    if (period === "year") {
      const y = new Date().getFullYear();
      return { from: `${y}-01-01`, to: `${y}-12-31`, label: `Année ${y}` };
    }
    return { from, to, label: "Période choisie" };
  }, [period, monthK, from, to]);

  const items = useMemo(() => budgetItems(data, range.from, range.to), [data, range.from, range.to]);
  const total = budgetTotal(items);

  const byCat = useMemo(() => {
    const m = new Map<ExpenseCategory, number>();
    for (const it of items) m.set(it.category, (m.get(it.category) ?? 0) + it.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const budget = useMemo(() => {
    if (period === "month") return data.monthlyBudget;
    if (period === "year") return data.monthlyBudget * 12;
    return periodBudget(data.monthlyBudget, range.from, range.to);
  }, [period, data.monthlyBudget, range.from, range.to]);
  const pct = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  const over = total > budget;

  return (
    <div className="page">
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <h1>Budget</h1>
        <div className="sub">{budget} € prévus chaque mois pour Capitaine</div>
      </div>

      <div className="segmented" style={{ marginBottom: 14 }}>
        <button className={period === "month" ? "on" : ""} onClick={() => setPeriod("month")}>
          Par mois
        </button>
        <button className={period === "year" ? "on" : ""} onClick={() => setPeriod("year")}>
          Cette année
        </button>
        <button className={period === "custom" ? "on" : ""} onClick={() => setPeriod("custom")}>
          Période
        </button>
      </div>

      {period === "month" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 14,
            background: "var(--surface)",
            border: "0.5px solid var(--line)",
            borderRadius: 10,
            padding: "4px 6px",
          }}
        >
          <button
            className="btn ghost"
            style={{ padding: 6, color: "var(--muted)" }}
            aria-label="Mois précédent"
            onClick={() => setMonthK(shiftMonth(monthK, -1))}
          >
            <Icon name="chevron-left" size={22} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{monthLabel(monthK)}</span>
          <button
            className="btn ghost"
            style={{ padding: 6, color: monthK >= currentMonthKey() ? "var(--faint)" : "var(--muted)" }}
            aria-label="Mois suivant"
            disabled={monthK >= currentMonthKey()}
            onClick={() => setMonthK(shiftMonth(monthK, 1))}
          >
            <Icon name="chevron" size={22} />
          </button>
        </div>
      )}

      {period === "custom" && (
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="field" style={{ marginTop: 0 }}>
            <label>Du</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field" style={{ marginTop: 0 }}>
            <label>Au</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      )}

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{range.label}</span>
          <span style={{ fontSize: 13, color: over ? "var(--danger)" : "var(--muted)" }}>
            {over ? `dépassé de ${euro(total - budget)}` : `reste ${euro(budget - total)}`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "6px 0 10px" }}>
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>{euro(total)}</span>
          <span style={{ fontSize: 15, color: "var(--faint)" }}>/ {euro(budget)}</span>
        </div>
        <div className={`bar ${over ? "over" : ""}`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        {period !== "month" && (
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
            Budget prévu {period === "year" ? "sur l'année" : "sur la période"} : {euro(budget)}
            {items.length > 0 ? ` · ${items.length} dépense${items.length > 1 ? "s" : ""}` : ""}
          </div>
        )}
      </div>

      {byCat.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 0 }}>Par catégorie</div>
          <div className="card card-pad">
            {byCat.map(([cat, amt]) => (
              <div
                key={cat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 0",
                }}
              >
                <span style={{ fontSize: 18 }}>{EXPENSE_META[cat].icon}</span>
                <span style={{ flex: 1, fontSize: 14 }}>{EXPENSE_META[cat].label}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{euro(amt)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">Dépenses</div>
      {items.length === 0 ? (
        <div className="empty">
          <Icon name="wallet" size={34} className="ic" />
          Aucune dépense sur cette période.
        </div>
      ) : (
        (expanded ? items : items.slice(0, 5)).map((it) => {
          const meta = EXPENSE_META[it.category];
          const sub =
            `${formatShort(it.date)} · ${meta.label}` +
            (it.source !== "expense" ? ` · ${SOURCE_LABEL[it.source]}` : "");
          const inner = (
            <>
              <div className="ic-badge ic-muted" style={{ fontSize: 18 }}>{meta.icon}</div>
              <div className="grow">
                <div className="title">{it.label || meta.label}</div>
                <div className="meta">{sub}</div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{euro(it.amount)}</span>
              {it.source === "expense" && <Icon name="chevron" size={18} className="ic-badge" />}
            </>
          );
          return it.source === "expense" ? (
            <button
              className="row"
              key={it.id}
              style={{ marginBottom: 8, width: "100%", textAlign: "left" }}
              onClick={() => {
                const e = data.expenses.find((x) => x.id === it.expenseId);
                if (e) setSheet(e);
              }}
            >
              {inner}
            </button>
          ) : (
            <div className="row" key={it.id} style={{ marginBottom: 8 }}>{inner}</div>
          );
        })
      )}

      {items.length > 5 && (
        <button
          className="btn ghost block"
          style={{ marginTop: 4, color: "var(--accent-ink)" }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Réduire la liste" : `Voir les ${items.length - 5} autres dépenses`}
        </button>
      )}

      <button className="fab" aria-label="Ajouter une dépense" onClick={() => setSheet("new")}>
        <Icon name="plus" size={26} />
      </button>

      {sheet && (
        <ExpenseSheet expense={sheet === "new" ? null : sheet} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

function ExpenseSheet({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "veto");
  const [label, setLabel] = useState(expense?.label ?? "");
  const [date, setDate] = useState(expense?.date ?? todayISO());

  function save() {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    update((d) => {
      if (expense) {
        const t = d.expenses.find((x) => x.id === expense.id);
        if (t) {
          t.amount = a;
          t.category = category;
          t.label = label || undefined;
          t.date = date;
        }
      } else {
        d.expenses.push({ id: uid(), amount: a, category, label: label || undefined, date });
      }
    });
    onClose();
  }

  function remove() {
    if (!expense) return;
    update((d) => {
      d.expenses = d.expenses.filter((x) => x.id !== expense.id);
    });
    onClose();
  }

  const cats = Object.keys(EXPENSE_META) as ExpenseCategory[];

  return (
    <Sheet title={expense ? "Modifier la dépense" : "Nouvelle dépense"} onClose={onClose}>
      <div className="field">
        <label>Montant (€)</label>
        <input
          type="number"
          inputMode="decimal"
          autoFocus
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Catégorie</label>
        <div className="chips">
          {cats.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? "on" : ""}`}
              onClick={() => setCategory(c)}
              type="button"
            >
              {EXPENSE_META[c].icon} {EXPENSE_META[c].label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Libellé (optionnel)</label>
        <input placeholder="ex. Consultation + vaccin" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        {expense ? "Enregistrer" : "Ajouter"}
      </button>
      {expense && (
        <button className="btn danger-text block" style={{ marginTop: 6 }} onClick={remove}>
          Supprimer cette dépense
        </button>
      )}
    </Sheet>
  );
}

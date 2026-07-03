import { useState } from "react";
import Icon from "./Icon";
import { useData, update } from "../lib/store";
import { treatmentsAwaitingFollowUp } from "../lib/selectors";
import { formatDate } from "../lib/dates";

/**
 * Shown on app open when a treatment has ended: asks whether the issue is
 * resolved, so the outcome is recorded. (Real push notification comes with
 * the deployed PWA — this in-app prompt works now.)
 */
export default function FollowUpPrompt() {
  const data = useData();
  const [snoozed, setSnoozed] = useState<string[]>([]);

  const pending = treatmentsAwaitingFollowUp(data).filter((t) => !snoozed.includes(t.id));
  const t = pending[0];
  if (!t) return null;

  function answer(resolved: boolean) {
    update((d) => {
      const x = d.treatments.find((y) => y.id === t!.id);
      if (x) {
        x.followUpDone = true;
        x.resolved = resolved;
      }
    });
  }

  return (
    <div className="sheet-backdrop" style={{ alignItems: "center" }}>
      <div
        style={{
          background: "var(--bg)", borderRadius: 16, maxWidth: 340,
          width: "calc(100% - 40px)", padding: "24px 22px", textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52, height: 52, borderRadius: 14, background: "var(--accent-soft)", color: "var(--accent-ink)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}
        >
          <Icon name="pill" size={26} />
        </div>
        <h2 style={{ fontSize: 19 }}>Traitement terminé</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5, margin: "8px 0 20px" }}>
          Le traitement « <b>{t.medication}</b> » s'est terminé le {formatDate(t.endDate!)}.
          <br />
          Le souci de Capitaine est-il réglé ?
        </p>
        <button className="btn primary block" onClick={() => answer(true)}>
          <Icon name="check" size={17} /> Oui, c'est réglé
        </button>
        <button className="btn block" style={{ marginTop: 8 }} onClick={() => answer(false)}>
          Non, toujours présent
        </button>
        <button
          className="btn ghost block"
          style={{ marginTop: 4, color: "var(--muted)" }}
          onClick={() => setSnoozed((s) => [...s, t.id])}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import Sheet from "./Sheet";
import { update } from "../lib/store";
import type { VetQuestion } from "../lib/types";
import { todayISO } from "../lib/dates";

export default function AnswerSheet({
  question,
  onClose,
}: {
  question: VetQuestion;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState(question.answer ?? "");

  function saveAnswered() {
    update((d) => {
      const t = d.questions.find((x) => x.id === question.id);
      if (t) {
        t.answer = answer.trim() || undefined;
        t.done = true;
        t.answeredAt = todayISO();
      }
    });
    onClose();
  }

  function reopen() {
    update((d) => {
      const t = d.questions.find((x) => x.id === question.id);
      if (t) {
        t.done = false;
        t.answeredAt = undefined;
      }
    });
    onClose();
  }

  return (
    <Sheet title="Réponse du vétérinaire" onClose={onClose}>
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 6 }}>{question.text}</div>
      {question.description && (
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{question.description}</div>
      )}
      <div className="field">
        <label>Réponse / ce qu'a dit le véto</label>
        <textarea
          autoFocus
          placeholder="ex. RAS, continuer les croquettes actuelles"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      <button className="btn primary block" style={{ marginTop: 18 }} onClick={saveAnswered}>
        Enregistrer la réponse
      </button>
      {question.done && (
        <button className="btn block" style={{ marginTop: 6 }} onClick={reopen}>
          Rouvrir la question
        </button>
      )}
    </Sheet>
  );
}

import { useState } from "react";
import Sheet from "./Sheet";
import { update, uid } from "../lib/store";
import type { VetQuestion } from "../lib/types";
import { todayISO } from "../lib/dates";

export default function QuestionSheet({
  question,
  onClose,
}: {
  question: VetQuestion | "new";
  onClose: () => void;
}) {
  const existing = question === "new" ? null : question;
  const [text, setText] = useState(existing?.text ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");

  function save() {
    if (!text.trim()) return;
    update((d) => {
      if (existing) {
        const t = d.questions.find((x) => x.id === existing.id);
        if (t) {
          t.text = text.trim();
          t.description = description.trim() || undefined;
        }
      } else {
        d.questions.push({
          id: uid(),
          text: text.trim(),
          description: description.trim() || undefined,
          done: false,
          createdAt: todayISO(),
        });
      }
    });
    onClose();
  }

  return (
    <Sheet title={existing ? "Modifier la question" : "Nouvelle question"} onClose={onClose}>
      <div className="field">
        <label>Question (titre)</label>
        <input
          autoFocus={!existing}
          placeholder="ex. Faut-il changer de croquettes ?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Détails / notes (optionnel)</label>
        <textarea
          placeholder="Contexte, symptômes observés, à préciser au véto…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button className="btn primary block" style={{ marginTop: 20 }} onClick={save}>
        Enregistrer
      </button>
      {existing && (
        <button
          className="btn danger-text block"
          style={{ marginTop: 6 }}
          onClick={() => {
            update((d) => {
              d.questions = d.questions.filter((x) => x.id !== existing.id);
            });
            onClose();
          }}
        >
          Supprimer la question
        </button>
      )}
    </Sheet>
  );
}

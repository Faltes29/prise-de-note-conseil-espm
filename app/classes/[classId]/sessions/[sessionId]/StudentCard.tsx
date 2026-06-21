"use client";

import { useState } from "react";
import { addDecision, addNote, castVote, deleteNote, updateDecisionStatus } from "@/app/actions";
import type {
  Decision,
  DecisionStatus,
  Note,
  NoteCategory,
  Subject,
  Vote,
  VoteValue,
} from "@/types/database";

const categoryLabels: Record<NoteCategory, string> = {
  matiere: "Matière",
  comportement: "Comportement",
  general: "Général",
};

const decisionStatusLabels: Record<DecisionStatus, string> = {
  proposee: "Proposée",
  adoptee: "Adoptée",
  rejetee: "Rejetée",
};

export interface StudentCardProps {
  classId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  subjects: Subject[];
  notes: Note[];
  decisions: Decision[];
  votes: Vote[];
  authorNames: Record<string, string>;
  currentUserId: string;
  canDecide: boolean;
}

export default function StudentCard({
  classId,
  sessionId,
  studentId,
  studentName,
  subjects,
  notes,
  decisions,
  votes,
  authorNames,
  currentUserId,
  canDecide,
}: StudentCardProps) {
  const [category, setCategory] = useState<NoteCategory>("general");
  const [subjectId, setSubjectId] = useState<string>("");
  const [content, setContent] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [pending, setPending] = useState(false);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    try {
      await addNote({
        classId,
        sessionId,
        studentId,
        category,
        subjectId: category === "matiere" ? subjectId || null : null,
        content,
      });
      setContent("");
    } finally {
      setPending(false);
    }
  }

  async function handleAddDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionText.trim()) return;
    setPending(true);
    try {
      await addDecision({ classId, sessionId, studentId, decisionText });
      setDecisionText("");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-3 font-medium">{studentName}</h3>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-gray-500">Notes</h4>
        {notes.length === 0 && <p className="text-sm text-gray-400">Aucune note.</p>}
        <ul className="space-y-1">
          {notes.map((n) => (
            <li key={n.id} className="rounded bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {categoryLabels[n.category]} — {authorNames[n.author_id] ?? "Inconnu"}
                </span>
                {n.author_id === currentUserId && (
                  <button
                    className="no-print text-red-500 hover:underline"
                    onClick={() => deleteNote(classId, sessionId, n.id)}
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <p>{n.content}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddNote} className="no-print space-y-2 rounded border p-3">
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NoteCategory)}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="general">Général</option>
              <option value="matiere">Matière</option>
              <option value="comportement">Comportement</option>
            </select>
            {category === "matiere" && (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="">Choisir une matière</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Votre note…"
            className="w-full rounded border px-2 py-1 text-sm"
            rows={2}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-primary px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
          >
            Ajouter la note
          </button>
        </form>
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-xs font-semibold uppercase text-gray-500">Décisions</h4>
        {decisions.length === 0 && <p className="text-sm text-gray-400">Aucune décision proposée.</p>}
        <ul className="space-y-2">
          {decisions.map((d) => {
            const decisionVotes = votes.filter((v) => v.decision_id === d.id);
            const myVote = decisionVotes.find((v) => v.voter_id === currentUserId);
            const tally: Record<VoteValue, number> = {
              pour: decisionVotes.filter((v) => v.value === "pour").length,
              contre: decisionVotes.filter((v) => v.value === "contre").length,
              abstention: decisionVotes.filter((v) => v.value === "abstention").length,
            };

            return (
              <li key={d.id} className="rounded border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <p>{d.decision_text}</p>
                  <span className="text-xs text-gray-500">{decisionStatusLabels[d.status]}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Pour: {tally.pour} · Contre: {tally.contre} · Abstention: {tally.abstention}
                </p>
                <div className="no-print mt-2 flex items-center gap-2">
                  {(["pour", "contre", "abstention"] as VoteValue[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => castVote(classId, sessionId, d.id, v)}
                      className={`rounded border px-2 py-0.5 text-xs ${
                        myVote?.value === v ? "border-primary bg-primary/10" : ""
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  {canDecide && (
                    <select
                      value={d.status}
                      onChange={(e) =>
                        updateDecisionStatus(classId, sessionId, d.id, e.target.value as DecisionStatus)
                      }
                      className="ml-auto rounded border px-1 py-0.5 text-xs"
                    >
                      <option value="proposee">Proposée</option>
                      <option value="adoptee">Adoptée</option>
                      <option value="rejetee">Rejetée</option>
                    </select>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <form onSubmit={handleAddDecision} className="no-print flex gap-2">
          <input
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            placeholder="Proposer une décision…"
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-primary px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
          >
            Proposer
          </button>
        </form>
      </div>
    </div>
  );
}

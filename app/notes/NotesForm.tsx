"use client";

import { useEffect, useMemo, useState } from "react";
import { saveEncoding } from "@/app/actions";
import { renderTemplate, buildAiPrompt, joinWithEt } from "@/lib/template";
import {
  TA_ITEMS,
  degreeForYear,
  genreLabel,
  type Cas,
  type Competency,
  type Period,
  type ResourcePerson,
  type SchoolClass,
  type Sexe,
  type Student,
  type StudentEncoding,
  type SubjectStatus,
  type Subject,
  type TaItemKey,
  type TaStatus,
  type TaskStatus,
  type Template,
} from "@/types/database";

const YEARS = [1, 2, 3, 4, 5, 6];
const PERIODS: Period[] = ["P1", "P2", "P3"];
const CAS_OPTIONS: { value: Cas; label: string }[] = [
  { value: 1, label: "Cas 1 — Maîtrise complète (aucun échec)" },
  { value: 2, label: "Cas 2 — Difficultés modérées" },
  { value: 3, label: "Cas 3 — Situation critique" },
];

interface FormState {
  cas: Cas;
  subjectStatus: Record<string, SubjectStatus>;
  competencies: Record<string, boolean>;
  taStatus: Record<string, TaStatus>;
  taManualText: string;
  freins: string;
  forces: string;
  conseils: string;
  suiviNecessaire: boolean;
  suiviRaisons: string;
  suiviContact1: string;
  suiviContact2: string;
  statusId: string;
}

function defaultFormState(): FormState {
  return {
    cas: 1,
    subjectStatus: {},
    competencies: {},
    taStatus: {},
    taManualText: "",
    freins: "",
    forces: "",
    conseils: "",
    suiviNecessaire: false,
    suiviRaisons: "",
    suiviContact1: "",
    suiviContact2: "",
    statusId: "",
  };
}

function encodingToFormState(encoding: StudentEncoding): FormState {
  return {
    cas: encoding.cas,
    subjectStatus: encoding.subject_status ?? {},
    competencies: encoding.competencies ?? {},
    taStatus: encoding.ta_status ?? {},
    taManualText: encoding.ta_manual_text ?? "",
    freins: encoding.freins ?? "",
    forces: encoding.forces ?? "",
    conseils: encoding.conseils ?? "",
    suiviNecessaire: encoding.suivi_necessaire,
    suiviRaisons: encoding.suivi_raisons ?? "",
    suiviContact1: encoding.suivi_contact_1 ?? "",
    suiviContact2: encoding.suivi_contact_2 ?? "",
    statusId: encoding.status_id ?? "",
  };
}

export default function NotesForm({
  classes,
  students,
  subjects,
  competencies,
  resourcePersons,
  taskStatuses,
  templates,
  encodings,
}: {
  classes: SchoolClass[];
  students: Student[];
  subjects: Subject[];
  competencies: Competency[];
  resourcePersons: ResourcePerson[];
  taskStatuses: TaskStatus[];
  templates: Template[];
  encodings: StudentEncoding[];
}) {
  const [year, setYear] = useState<number | null>(null);
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("P1");
  const [form, setForm] = useState<FormState>(defaultFormState());
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const encodingsByKey = useMemo(() => {
    const map = new Map<string, StudentEncoding>();
    for (const e of encodings) map.set(`${e.student_id}__${e.period}`, e);
    return map;
  }, [encodings]);

  const classesForYear = useMemo(
    () => classes.filter((c) => c.year === year),
    [classes, year]
  );

  const studentsForClass = useMemo(
    () => students.filter((s) => s.class_id === classId).sort((a, b) => a.last_name.localeCompare(b.last_name)),
    [students, classId]
  );

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? null, [students, studentId]);

  const degree = year ? degreeForYear(year) : null;

  const subjectsForDegree = useMemo(
    () => (degree ? subjects.filter((s) => s.degree === degree) : []),
    [subjects, degree]
  );

  const competenciesForDegree = useMemo(
    () => (degree ? competencies.filter((c) => c.degree === degree) : []),
    [competencies, degree]
  );

  // Charge l'encodage existant (ou réinitialise) quand l'élève ou la période change.
  useEffect(() => {
    if (!studentId) {
      setForm(defaultFormState());
      return;
    }
    const existing = encodingsByKey.get(`${studentId}__${period}`);
    setForm(existing ? encodingToFormState(existing) : defaultFormState());
    setSavedMessage(null);
  }, [studentId, period, encodingsByKey]);

  function toggleSubjectStatus(subjectId: string, status: SubjectStatus) {
    setForm((prev) => {
      const next = { ...prev.subjectStatus };
      if (next[subjectId] === status) {
        delete next[subjectId];
      } else {
        next[subjectId] = status;
      }
      return { ...prev, subjectStatus: next };
    });
  }

  function toggleCompetency(competencyId: string) {
    setForm((prev) => {
      const next = { ...prev.competencies };
      if (next[competencyId]) delete next[competencyId];
      else next[competencyId] = true;
      return { ...prev, competencies: next };
    });
  }

  function setTaStatus(key: TaItemKey, status: TaStatus) {
    setForm((prev) => {
      const next = { ...prev.taStatus };
      if (next[key] === status) delete next[key];
      else next[key] = status;
      return { ...prev, taStatus: next };
    });
  }

  const genre = student ? genreLabel(student.sexe) : null;

  const pronouns = useMemo(() => {
    const sexe: Sexe = student?.sexe ?? "X";
    if (sexe === "F") return { il_elle: "elle", son_sa: "sa", le_la: "la" };
    return { il_elle: "il", son_sa: "son", le_la: "le" };
  }, [student]);

  const template = useMemo(
    () => (degree ? templates.find((t) => t.cas === form.cas && t.degree === degree && t.period === period) : null),
    [templates, form.cas, degree, period]
  );

  const generatedComment = useMemo(() => {
    if (!student || !template) return "";

    const subjectNames = (status: SubjectStatus) =>
      joinWithEt(
        subjectsForDegree.filter((s) => form.subjectStatus[s.id] === status).map((s) => s.name)
      );

    const competenceNames = joinWithEt(
      competenciesForDegree.filter((c) => form.competencies[c.id]).map((c) => c.name)
    );

    const taNames = (status: TaStatus) =>
      joinWithEt(TA_ITEMS.filter((item) => form.taStatus[item.key] === status).map((item) => item.label));

    const contact1 = resourcePersons.find((p) => p.id === form.suiviContact1)?.name ?? "";
    const contact2 = resourcePersons.find((p) => p.id === form.suiviContact2)?.name ?? "";
    const contacts = joinWithEt([contact1, contact2].filter(Boolean));
    const suivi = form.suiviNecessaire
      ? `Un suivi est à prévoir${contacts ? ` avec ${contacts}` : ""}${
          form.suiviRaisons ? ` : ${form.suiviRaisons}` : ""
        }.`
      : "";

    const vars: Record<string, string> = {
      prenom: student.first_name,
      nom: student.last_name,
      ...pronouns,
      matieres_echec: subjectNames("echec"),
      matieres_difficulte: subjectNames("difficulte"),
      matieres_ne: subjectNames("ne"),
      competences: competenceNames,
      ta_forces: taNames("force"),
      ta_faiblesses: taNames("faiblesse"),
      ta_manuel: form.taManualText,
      freins: form.freins,
      forces: form.forces,
      conseils: form.conseils,
      suivi,
    };

    return renderTemplate(template.body, vars);
  }, [student, template, form, subjectsForDegree, competenciesForDegree, resourcePersons, pronouns]);

  const aiPrompt = useMemo(
    () => (generatedComment ? buildAiPrompt(generatedComment, genre ?? "Non-défini") : ""),
    [generatedComment, genre]
  );

  async function handleSave() {
    if (!studentId) return;
    setSaving(true);
    try {
      await saveEncoding({
        studentId,
        period,
        cas: form.cas,
        subjectStatus: form.subjectStatus,
        competencies: form.competencies,
        taStatus: form.taStatus,
        taManualText: form.taManualText || null,
        freins: form.freins || null,
        forces: form.forces || null,
        conseils: form.conseils || null,
        suiviNecessaire: form.suiviNecessaire,
        suiviRaisons: form.suiviRaisons || null,
        suiviContact1: form.suiviContact1 || null,
        suiviContact2: form.suiviContact2 || null,
        statusId: form.statusId || null,
        generatedComment: generatedComment || null,
      });
      setSavedMessage("Enregistré ✓");
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    await handleSave();
    const idx = studentsForClass.findIndex((s) => s.id === studentId);
    const next = studentsForClass[idx + 1];
    if (next) setStudentId(next.id);
  }

  async function handlePrevious() {
    await handleSave();
    const idx = studentsForClass.findIndex((s) => s.id === studentId);
    const prev = studentsForClass[idx - 1];
    if (prev) setStudentId(prev.id);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <main className="mx-auto max-w-6xl gap-6 px-4 py-6 lg:flex">
      <aside className="no-print mb-6 w-full shrink-0 space-y-1 lg:mb-0 lg:w-48">
        <p className="mb-2 text-xs font-medium uppercase text-gray-500">Élèves de la classe</p>
        {studentsForClass.map((s) => {
          const done = encodingsByKey.has(`${s.id}__${period}`);
          return (
            <button
              key={s.id}
              onClick={() => setStudentId(s.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                s.id === studentId ? "bg-gray-100 font-medium" : ""
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${done ? "bg-green-500" : "bg-gray-300"}`} />
              {s.last_name} {s.first_name}
            </button>
          );
        })}
        {classId && studentsForClass.length === 0 && (
          <p className="text-sm text-gray-400">Aucun élève dans cette classe.</p>
        )}
      </aside>

      <div className="flex-1 space-y-6">
        <section className="grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Année</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={year ?? ""}
              onChange={(e) => {
                setYear(e.target.value ? Number(e.target.value) : null);
                setClassId("");
                setStudentId("");
              }}
            >
              <option value="">Sélectionner l'année</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}e année
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Classe</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={classId}
              disabled={!year}
              onChange={(e) => {
                setClassId(e.target.value);
                setStudentId("");
              }}
            >
              <option value="">Sélectionner la classe</option>
              {classesForYear.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Élève</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={studentId}
              disabled={!classId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Sélectionner l'élève</option>
              {studentsForClass.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.last_name} {s.first_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Période</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {student && (
            <p className="col-span-full text-sm text-gray-500">
              Genre grammatical auto-dérivé : <span className="font-medium">{genre}</span>
            </p>
          )}
        </section>

        {student && degree && (
          <>
            <section className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">Matières ({degree})</h2>
              <div className="space-y-2">
                {subjectsForDegree.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{subject.name}</span>
                    <div className="flex gap-3">
                      {(["echec", "difficulte", "ne"] as SubjectStatus[]).map((status) => (
                        <label key={status} className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={form.subjectStatus[subject.id] === status}
                            onChange={() => toggleSubjectStatus(subject.id, status)}
                          />
                          {status === "echec" ? "Échec" : status === "difficulte" ? "Difficultés" : "NE"}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">Compétences transversales</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {competenciesForDegree.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!form.competencies[c.id]}
                      onChange={() => toggleCompetency(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">Travail autonome (TA)</h2>
              <div className="space-y-2">
                {TA_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                    <span>{item.label}</span>
                    <div className="flex gap-3">
                      {(["force", "faiblesse"] as TaStatus[]).map((status) => (
                        <label key={status} className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={form.taStatus[item.key] === status}
                            onChange={() => setTaStatus(item.key, status)}
                          />
                          {status === "force" ? "Force" : "Faiblesse"}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <label className="mt-3 block text-xs font-medium text-gray-500">
                Si pas de consensus (texte manuel)
              </label>
              <textarea
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                rows={2}
                value={form.taManualText}
                onChange={(e) => setForm((prev) => ({ ...prev, taManualText: e.target.value }))}
              />
            </section>

            <section className="rounded-lg border bg-white p-4">
              <label className="text-xs font-medium text-gray-500">Cas (gravité)</label>
              <select
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={form.cas}
                onChange={(e) => setForm((prev) => ({ ...prev, cas: Number(e.target.value) as Cas }))}
              >
                {CAS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </section>

            <section className="grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Freins</label>
                <textarea
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  rows={3}
                  value={form.freins}
                  onChange={(e) => setForm((prev) => ({ ...prev, freins: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Forces</label>
                <textarea
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  rows={3}
                  value={form.forces}
                  onChange={(e) => setForm((prev) => ({ ...prev, forces: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Conseils</label>
                <textarea
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  rows={3}
                  value={form.conseils}
                  onChange={(e) => setForm((prev) => ({ ...prev, conseils: e.target.value }))}
                />
              </div>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.suiviNecessaire}
                  onChange={(e) => setForm((prev) => ({ ...prev, suiviNecessaire: e.target.checked }))}
                />
                Devra être vu par...
              </label>
              {form.suiviNecessaire && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    className="rounded border px-2 py-1.5 text-sm"
                    value={form.suiviContact1}
                    onChange={(e) => setForm((prev) => ({ ...prev, suiviContact1: e.target.value }))}
                  >
                    <option value="">Personne 1</option>
                    {resourcePersons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded border px-2 py-1.5 text-sm"
                    value={form.suiviContact2}
                    onChange={(e) => setForm((prev) => ({ ...prev, suiviContact2: e.target.value }))}
                  >
                    <option value="">Personne 2 (optionnel)</option>
                    {resourcePersons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="col-span-full rounded border px-2 py-1.5 text-sm"
                    rows={2}
                    placeholder="Raisons du rendez-vous"
                    value={form.suiviRaisons}
                    onChange={(e) => setForm((prev) => ({ ...prev, suiviRaisons: e.target.value }))}
                  />
                </div>
              )}
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-500">Statut</label>
                <select
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm sm:w-64"
                  value={form.statusId}
                  onChange={(e) => setForm((prev) => ({ ...prev, statusId: e.target.value }))}
                >
                  <option value="">—</option>
                  {taskStatuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="grid gap-4 rounded-lg border bg-white p-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Commentaire (bulletin)</h2>
                  <button
                    onClick={() => copyToClipboard(generatedComment)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Copier
                  </button>
                </div>
                <textarea
                  readOnly
                  className="h-48 w-full rounded border bg-gray-50 px-2 py-1.5 text-sm"
                  value={generatedComment}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Prompt IA (prêt à coller)</h2>
                  <button
                    onClick={() => copyToClipboard(aiPrompt)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Copier
                  </button>
                </div>
                <textarea
                  readOnly
                  className="h-48 w-full rounded border bg-gray-50 px-2 py-1.5 text-sm"
                  value={aiPrompt}
                />
              </div>
            </section>

            <div className="no-print flex items-center gap-3">
              <button
                onClick={handlePrevious}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                ← Élève précédent
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button onClick={handleNext} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
                Élève suivant →
              </button>
              {savedMessage && <span className="text-sm text-green-600">{savedMessage}</span>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addStudent,
  createClass,
  createCompetency,
  createResourcePerson,
  createSubject,
  createTaskStatus,
  deleteClass,
  deleteCompetency,
  deleteResourcePerson,
  deleteStudent,
  deleteSubject,
  deleteTaskStatus,
  importStudents,
  upsertTemplate,
} from "@/app/actions";
import { parseStudentsCsv } from "@/lib/csv";
import type {
  Cas,
  Competency,
  Degree,
  Period,
  ResourcePerson,
  SchoolClass,
  Sexe,
  Student,
  Subject,
  TaskStatus,
  Template,
} from "@/types/database";

const DEGREES: Degree[] = ["D1", "D2", "D3"];
const PERIODS: Period[] = ["P1", "P2", "P3"];
const CAS_LIST: Cas[] = [1, 2, 3];

type Tab = "classes" | "matieres" | "competences" | "personnes" | "statuts" | "templates";

const TABS: { id: Tab; label: string }[] = [
  { id: "classes", label: "Classes & élèves" },
  { id: "matieres", label: "Matières" },
  { id: "competences", label: "Compétences" },
  { id: "personnes", label: "Personnes ressources" },
  { id: "statuts", label: "Statuts" },
  { id: "templates", label: "Templates" },
];

export default function ReglagesClient({
  classes,
  students,
  subjects,
  competencies,
  resourcePersons,
  taskStatuses,
  templates,
}: {
  classes: SchoolClass[];
  students: Student[];
  subjects: Subject[];
  competencies: Competency[];
  resourcePersons: ResourcePerson[];
  taskStatuses: TaskStatus[];
  templates: Template[];
}) {
  const [tab, setTab] = useState<Tab>("classes");

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Réglages</h1>
      <div className="mb-6 flex flex-wrap gap-2 border-b pb-2 text-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded px-3 py-1.5 ${tab === t.id ? "bg-primary text-white" : "hover:bg-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "classes" && <ClassesTab classes={classes} students={students} />}
      {tab === "matieres" && <SubjectsTab subjects={subjects} />}
      {tab === "competences" && <CompetenciesTab competencies={competencies} />}
      {tab === "personnes" && <ResourcePersonsTab resourcePersons={resourcePersons} />}
      {tab === "statuts" && <TaskStatusesTab taskStatuses={taskStatuses} />}
      {tab === "templates" && <TemplatesTab templates={templates} />}
    </main>
  );
}

function ClassesTab({ classes, students }: { classes: SchoolClass[]; students: Student[] }) {
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassYear, setNewClassYear] = useState(1);
  const [studentClassId, setStudentClassId] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentSexe, setStudentSexe] = useState<Sexe>("X");

  const studentsByClass = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const list = map.get(s.class_id) ?? [];
      list.push(s);
      map.set(s.class_id, list);
    }
    return map;
  }, [students]);

  async function handleCsvImport(file: File) {
    setImportError(null);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseStudentsCsv(text);
      if (rows.length === 0) {
        setImportError("Aucune ligne valide trouvée dans le fichier.");
        return;
      }
      const result = await importStudents(rows);
      setImportResult(`${result.studentsCount} élève(s) importé(s) dans ${result.classesCount} classe(s).`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Erreur lors de l'import.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Import de la base d'élèves (CSV)</h2>
        <p className="mb-3 text-xs text-gray-500">
          Colonnes attendues : Nom famille, Prénom, Sexe, Classe, Année scolaire (export CSV de votre fichier
          Excel).
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCsvImport(file);
          }}
          className="text-sm"
        />
        {importResult && <p className="mt-2 text-sm text-green-600">{importResult}</p>}
        {importError && <p className="mt-2 text-sm text-red-600">{importError}</p>}
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Ajouter une classe</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newClassName.trim()) return;
            await createClass(newClassName.trim(), newClassYear);
            setNewClassName("");
          }}
        >
          <input
            className="rounded border px-2 py-1.5 text-sm"
            placeholder="Nom de la classe"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <select
            className="rounded border px-2 py-1.5 text-sm"
            value={newClassYear}
            onChange={(e) => setNewClassYear(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                {y}e année
              </option>
            ))}
          </select>
          <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm text-white">
            Ajouter
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Ajouter un élève</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!studentClassId || !studentLastName.trim() || !studentFirstName.trim()) return;
            await addStudent(studentClassId, studentLastName.trim(), studentFirstName.trim(), studentSexe);
            setStudentLastName("");
            setStudentFirstName("");
          }}
        >
          <select
            className="rounded border px-2 py-1.5 text-sm"
            value={studentClassId}
            onChange={(e) => setStudentClassId(e.target.value)}
          >
            <option value="">Classe</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.year}e)
              </option>
            ))}
          </select>
          <input
            className="rounded border px-2 py-1.5 text-sm"
            placeholder="Nom"
            value={studentLastName}
            onChange={(e) => setStudentLastName(e.target.value)}
          />
          <input
            className="rounded border px-2 py-1.5 text-sm"
            placeholder="Prénom"
            value={studentFirstName}
            onChange={(e) => setStudentFirstName(e.target.value)}
          />
          <select
            className="rounded border px-2 py-1.5 text-sm"
            value={studentSexe}
            onChange={(e) => setStudentSexe(e.target.value as Sexe)}
          >
            <option value="F">Féminin</option>
            <option value="M">Masculin</option>
            <option value="X">Non-défini</option>
          </select>
          <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm text-white">
            Ajouter
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {classes.map((c) => (
          <div key={c.id} className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {c.name} — {c.year}e année
              </h3>
              <button
                onClick={() => deleteClass(c.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Supprimer la classe
              </button>
            </div>
            <ul className="space-y-1 text-sm">
              {(studentsByClass.get(c.id) ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span>
                    {s.last_name} {s.first_name}
                  </span>
                  <button
                    onClick={() => deleteStudent(s.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
              {(studentsByClass.get(c.id) ?? []).length === 0 && (
                <li className="text-gray-400">Aucun élève.</li>
              )}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function SubjectsTab({ subjects }: { subjects: Subject[] }) {
  const [degree, setDegree] = useState<Degree>("D1");
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {DEGREES.map((d) => (
          <button
            key={d}
            onClick={() => setDegree(d)}
            className={`rounded px-3 py-1.5 text-sm ${degree === d ? "bg-primary text-white" : "border"}`}
          >
            {d}
          </button>
        ))}
      </div>
      <form
        className="flex gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await createSubject(degree, name.trim());
          setName("");
        }}
      >
        <input
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Nouvelle matière"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm text-white">
          Ajouter
        </button>
      </form>
      <ul className="space-y-1 text-sm">
        {subjects
          .filter((s) => s.degree === degree)
          .map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
              {s.name}
              <button onClick={() => deleteSubject(s.id)} className="text-xs text-red-600 hover:underline">
                Supprimer
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

function CompetenciesTab({ competencies }: { competencies: Competency[] }) {
  const [degree, setDegree] = useState<Degree>("D1");
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {DEGREES.map((d) => (
          <button
            key={d}
            onClick={() => setDegree(d)}
            className={`rounded px-3 py-1.5 text-sm ${degree === d ? "bg-primary text-white" : "border"}`}
          >
            {d}
          </button>
        ))}
      </div>
      <form
        className="flex gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await createCompetency(degree, name.trim());
          setName("");
        }}
      >
        <input
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Nouvelle compétence"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm text-white">
          Ajouter
        </button>
      </form>
      <ul className="space-y-1 text-sm">
        {competencies
          .filter((c) => c.degree === degree)
          .map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
              {c.name}
              <button onClick={() => deleteCompetency(c.id)} className="text-xs text-red-600 hover:underline">
                Supprimer
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

function ResourcePersonsTab({ resourcePersons }: { resourcePersons: ResourcePerson[] }) {
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <form
        className="flex gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await createResourcePerson(name.trim());
          setName("");
        }}
      >
        <input
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Nom ou rôle (ex: Logopède, Julie Moens)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm text-white">
          Ajouter
        </button>
      </form>
      <ul className="space-y-1 text-sm">
        {resourcePersons.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
            {p.name}
            <button onClick={() => deleteResourcePerson(p.id)} className="text-xs text-red-600 hover:underline">
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskStatusesTab({ taskStatuses }: { taskStatuses: TaskStatus[] }) {
  const [label, setLabel] = useState("");

  return (
    <div className="space-y-4">
      <form
        className="flex gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!label.trim()) return;
          await createTaskStatus(label.trim());
          setLabel("");
        }}
      >
        <input
          className="flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Nouveau statut"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm text-white">
          Ajouter
        </button>
      </form>
      <ul className="space-y-1 text-sm">
        {taskStatuses.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
            {s.label}
            <button onClick={() => deleteTaskStatus(s.id)} className="text-xs text-red-600 hover:underline">
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplatesTab({ templates }: { templates: Template[] }) {
  const [cas, setCas] = useState<Cas>(1);
  const [degree, setDegree] = useState<Degree>("D1");
  const [period, setPeriod] = useState<Period>("P1");

  const [body, setBody] = useState("");

  useEffect(() => {
    const current = templates.find((t) => t.cas === cas && t.degree === degree && t.period === period);
    setBody(current?.body ?? "");
  }, [cas, degree, period, templates]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Balises disponibles : {"{{prenom}}"} {"{{nom}}"} {"{{il_elle}}"} {"{{son_sa}}"} {"{{le_la}}"}{" "}
        {"{{matieres_echec}}"} {"{{matieres_difficulte}}"} {"{{matieres_ne}}"} {"{{competences}}"}{" "}
        {"{{ta_forces}}"} {"{{ta_faiblesses}}"} {"{{ta_manuel}}"} {"{{freins}}"} {"{{forces}}"} {"{{conseils}}"}{" "}
        {"{{suivi}}"} — blocs conditionnels : {"{{#if variable}}...{{/if}}"}
      </p>
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={cas}
          onChange={(e) => setCas(Number(e.target.value) as Cas)}
        >
          {CAS_LIST.map((c) => (
            <option key={c} value={c}>
              Cas {c}
            </option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={degree}
          onChange={(e) => setDegree(e.target.value as Degree)}
        >
          {DEGREES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-1.5 text-sm"
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
      <textarea
        className="w-full rounded border px-3 py-2 text-sm"
        rows={8}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        onClick={async () => {
          await upsertTemplate(cas, degree, period, body);
        }}
        className="rounded bg-primary px-4 py-2 text-sm text-white"
      >
        Enregistrer le template
      </button>
    </div>
  );
}

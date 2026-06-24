"use client";

import { useMemo, useState } from "react";
import { joinWithEt } from "@/lib/template";
import type {
  Competency,
  Period,
  ResourcePerson,
  SchoolClass,
  Student,
  StudentEncoding,
  Subject,
  TaskStatus,
} from "@/types/database";

const PERIODS: Period[] = ["P1", "P2", "P3"];

const CAS_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-red-100 text-red-700",
};

function csvEscape(value: string): string {
  if (/[",;\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EleveTable({
  classes,
  students,
  encodings,
  subjects,
  competencies,
  resourcePersons,
  taskStatuses,
}: {
  classes: SchoolClass[];
  students: Student[];
  encodings: StudentEncoding[];
  subjects: Subject[];
  competencies: Competency[];
  resourcePersons: ResourcePerson[];
  taskStatuses: TaskStatus[];
}) {
  const [year, setYear] = useState<number | "">("");
  const [classId, setClassId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("P1");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects) map.set(s.id, s.name);
    return map;
  }, [subjects]);

  const competencyNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of competencies) map.set(c.id, c.name);
    return map;
  }, [competencies]);

  const resourcePersonNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of resourcePersons) map.set(p.id, p.name);
    return map;
  }, [resourcePersons]);

  const statusLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of taskStatuses) map.set(s.id, s.label);
    return map;
  }, [taskStatuses]);

  const encodingByStudent = useMemo(() => {
    const map = new Map<string, StudentEncoding>();
    for (const e of encodings) {
      if (e.period === period) map.set(e.student_id, e);
    }
    return map;
  }, [encodings, period]);

  const classesForYear = useMemo(() => classes.filter((c) => !year || c.year === year), [classes, year]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const cls = classes.find((c) => c.id === s.class_id);
        if (year && cls?.year !== year) return false;
        if (classId && s.class_id !== classId) return false;
        return true;
      })
      .sort((a, b) => a.last_name.localeCompare(b.last_name));
  }, [students, classes, year, classId]);

  function classLabel(classIdValue: string) {
    return classes.find((c) => c.id === classIdValue)?.name ?? "";
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === filteredStudents.length ? new Set() : new Set(filteredStudents.map((s) => s.id))
    );
  }

  function encodingDetailLines(student: Student, enc: StudentEncoding | undefined): string[] {
    if (!enc) return ["Aucune donnée encodée pour cette période."];

    const subjectsByStatus = (status: string) =>
      joinWithEt(
        Object.entries(enc.subject_status)
          .filter(([, s]) => s === status)
          .map(([id]) => subjectNameById.get(id) ?? "")
      );

    const competenciesAcquired = joinWithEt(
      Object.entries(enc.competencies)
        .filter(([, acquired]) => acquired)
        .map(([id]) => competencyNameById.get(id) ?? "")
    );

    const taByStatus = (status: string) =>
      joinWithEt(
        Object.entries(enc.ta_status)
          .filter(([, s]) => s === status)
          .map(([key]) => key)
      );

    const contact1 = enc.suivi_contact_1 ? resourcePersonNameById.get(enc.suivi_contact_1) ?? "" : "";
    const contact2 = enc.suivi_contact_2 ? resourcePersonNameById.get(enc.suivi_contact_2) ?? "" : "";

    return [
      `Élève : ${student.last_name} ${student.first_name}`,
      `Classe : ${classLabel(student.class_id)}`,
      `Période : ${enc.period}`,
      `Cas : Cas ${enc.cas}`,
      `Matières en échec : ${subjectsByStatus("echec") || "—"}`,
      `Matières en difficulté : ${subjectsByStatus("difficulte") || "—"}`,
      `Matières non évaluées : ${subjectsByStatus("ne") || "—"}`,
      `Compétences transversales acquises : ${competenciesAcquired || "—"}`,
      `TA — forces : ${taByStatus("force") || "—"}`,
      `TA — faiblesses : ${taByStatus("faiblesse") || "—"}`,
      `TA — texte manuel : ${enc.ta_manual_text || "—"}`,
      `Freins : ${enc.freins || "—"}`,
      `Forces : ${enc.forces || "—"}`,
      `Conseils : ${enc.conseils || "—"}`,
      `Remarques : ${enc.remarques || "—"}`,
      `Suivi nécessaire : ${enc.suivi_necessaire ? "Oui" : "Non"}`,
      `Raisons du suivi : ${enc.suivi_raisons || "—"}`,
      `Contacts du suivi : ${joinWithEt([contact1, contact2].filter(Boolean)) || "—"}`,
      `Statut de la tâche : ${enc.status_id ? statusLabelById.get(enc.status_id) ?? "—" : "—"}`,
      `Commentaire généré : ${enc.generated_comment || "—"}`,
    ];
  }

  function exportPdf(student: Student, enc: StudentEncoding | undefined) {
    const lines = encodingDetailLines(student, enc);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${student.last_name} ${student.first_name}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; }
            h1 { font-size: 1.2rem; margin-bottom: 1rem; }
            p { margin: 0.4rem 0; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <h1>Données encodées — ${student.last_name} ${student.first_name}</h1>
          ${lines.map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("\n")}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  function csvRows(targetStudents: Student[]): string {
    const header = ["Nom", "Prénom", "Classe", "Cas", "Période", "Statut de l'encodage"];
    const rows = targetStudents.map((s) => {
      const enc = encodingByStudent.get(s.id);
      return [
        s.last_name,
        s.first_name,
        classLabel(s.class_id),
        enc ? `Cas ${enc.cas}` : "",
        period,
        enc ? "Enregistré" : "Non enregistré",
      ];
    });
    return [header, ...rows].map((row) => row.map(csvEscape).join(";")).join("\n");
  }

  function exportCsv(targetStudents: Student[], filename: string) {
    downloadBlob(filename, csvRows(targetStudents), "text/csv;charset=utf-8");
  }

  const viewingStudent = viewingStudentId ? students.find((s) => s.id === viewingStudentId) ?? null : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-800">Données encodées</h1>

      <div className="no-print mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Année</label>
          <select
            className="mt-1 rounded border px-2 py-1.5 text-sm"
            value={year}
            onChange={(e) => {
              setYear(e.target.value ? Number(e.target.value) : "");
              setClassId("");
            }}
          >
            <option value="">Toutes</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                {y}e année
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Classe</label>
          <select
            className="mt-1 rounded border px-2 py-1.5 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Toutes</option>
            {classesForYear.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Période</label>
          <select
            className="mt-1 rounded border px-2 py-1.5 text-sm"
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
        {selectedIds.size > 0 && (
          <button
            onClick={() =>
              exportCsv(
                filteredStudents.filter((s) => selectedIds.has(s.id)),
                `donnees-encodees-${period}.csv`
              )
            }
            className="rounded border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5"
          >
            Exporter la sélection ({selectedIds.size}) — .csv
          </button>
        )}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-indigo-50 text-left text-xs uppercase text-indigo-600">
            <th className="py-2 px-2">
              <input
                type="checkbox"
                checked={filteredStudents.length > 0 && selectedIds.size === filteredStudents.length}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="py-2 px-2">Élève</th>
            <th className="py-2 px-2">Classe</th>
            <th className="py-2 px-2">Cas</th>
            <th className="py-2 px-2">Période</th>
            <th className="py-2 px-2">Statut de l'encodage</th>
            <th className="py-2 px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s) => {
            const enc = encodingByStudent.get(s.id);
            return (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleSelected(s.id)}
                  />
                </td>
                <td className="py-2 px-2">
                  {s.last_name} {s.first_name}
                </td>
                <td className="py-2 px-2">{classLabel(s.class_id)}</td>
                <td className="py-2 px-2">
                  {enc ? (
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${CAS_COLORS[enc.cas]}`}>
                      Cas {enc.cas}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 px-2">{period}</td>
                <td className="py-2 px-2">
                  {enc ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Enregistré
                    </span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      Non enregistré
                    </span>
                  )}
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Voir le détail"
                      aria-label="Voir le détail"
                      onClick={() => setViewingStudentId(s.id)}
                      className="rounded border px-2 py-1 hover:bg-gray-50"
                    >
                      👁️
                    </button>
                    <a
                      href={`/notes?studentId=${s.id}&period=${period}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Modifier"
                      aria-label="Modifier"
                      className="rounded border px-2 py-1 hover:bg-gray-50"
                    >
                      ✏️
                    </a>
                    <button
                      type="button"
                      title="Exporter en PDF"
                      aria-label="Exporter en PDF"
                      onClick={() => exportPdf(s, enc)}
                      className="rounded border px-2 py-1 hover:bg-gray-50"
                    >
                      📄
                    </button>
                    <button
                      type="button"
                      title="Exporter en Excel (.csv)"
                      aria-label="Exporter en Excel"
                      onClick={() => exportCsv([s], `${s.last_name}-${s.first_name}-${period}.csv`)}
                      className="rounded border px-2 py-1 hover:bg-gray-50"
                    >
                      📊
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {filteredStudents.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-center text-gray-400">
                Aucun élève trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {viewingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewingStudentId(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                {viewingStudent.last_name} {viewingStudent.first_name} — {period}
              </h2>
              <button
                onClick={() => setViewingStudentId(null)}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              {encodingDetailLines(viewingStudent, encodingByStudent.get(viewingStudent.id)).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

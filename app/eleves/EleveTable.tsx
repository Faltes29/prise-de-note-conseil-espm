"use client";

import { useMemo, useState } from "react";
import { joinWithEt } from "@/lib/template";
import type { Period, SchoolClass, Student, StudentEncoding, Subject, TaskStatus } from "@/types/database";

const PERIODS: Period[] = ["P1", "P2", "P3"];

export default function EleveTable({
  classes,
  students,
  encodings,
  subjects,
  taskStatuses,
}: {
  classes: SchoolClass[];
  students: Student[];
  encodings: StudentEncoding[];
  subjects: Subject[];
  taskStatuses: TaskStatus[];
}) {
  const [year, setYear] = useState<number | "">("");
  const [classId, setClassId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("P1");

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects) map.set(s.id, s.name);
    return map;
  }, [subjects]);

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
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
        <button onClick={() => window.print()} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
          Exporter / Imprimer
        </button>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-indigo-50 text-left text-xs uppercase text-indigo-600">
            <th className="py-2 px-2">Élève</th>
            <th className="py-2 px-2">Classe</th>
            <th className="py-2 px-2">Cas</th>
            <th className="py-2 px-2">Échecs</th>
            <th className="py-2 px-2">Statut</th>
            <th className="py-2 px-2">Suivi</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s) => {
            const enc = encodingByStudent.get(s.id);
            const echecs = enc
              ? joinWithEt(
                  Object.entries(enc.subject_status)
                    .filter(([, status]) => status === "echec")
                    .map(([subjectId]) => subjectNameById.get(subjectId) ?? "")
                )
              : "";
            const casColors: Record<number, string> = {
              1: "bg-green-100 text-green-700",
              2: "bg-amber-100 text-amber-700",
              3: "bg-red-100 text-red-700",
            };
            return (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-2">
                  {s.last_name} {s.first_name}
                </td>
                <td className="py-2 px-2">{classLabel(s.class_id)}</td>
                <td className="py-2 px-2">
                  {enc ? (
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${casColors[enc.cas]}`}>
                      Cas {enc.cas}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 px-2">{echecs || "—"}</td>
                <td className="py-2 px-2">{enc?.status_id ? statusLabelById.get(enc.status_id) ?? "—" : "—"}</td>
                <td className="py-2 px-2">
                  {enc?.suivi_necessaire ? (
                    <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Oui</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
          {filteredStudents.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-400">
                Aucun élève trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

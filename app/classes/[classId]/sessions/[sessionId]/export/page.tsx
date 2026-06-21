import { createClient } from "@/lib/supabase/server";
import PrintButton from "./PrintButton";
import type {
  CouncilSession,
  Decision,
  Note,
  NoteCategory,
  Profile,
  SchoolClass,
  Student,
  Subject,
} from "@/types/database";

const categoryLabels: Record<NoteCategory, string> = {
  matiere: "Matière",
  comportement: "Comportement",
  general: "Général",
};

export default async function ExportPage({
  params,
}: {
  params: { classId: string; sessionId: string };
}) {
  const supabase = createClient();

  const [{ data: schoolClass }, { data: session }, { data: students }, { data: subjects }] =
    await Promise.all([
      supabase.from("classes").select("*").eq("id", params.classId).single<SchoolClass>(),
      supabase
        .from("council_sessions")
        .select("*")
        .eq("id", params.sessionId)
        .single<CouncilSession>(),
      supabase
        .from("students")
        .select("*")
        .eq("class_id", params.classId)
        .order("last_name")
        .returns<Student[]>(),
      supabase.from("subjects").select("*").returns<Subject[]>(),
    ]);

  if (!schoolClass || !session) {
    return <p className="p-8 text-gray-500">Conseil de classe introuvable ou accès non autorisé.</p>;
  }

  const studentIds = (students ?? []).map((s) => s.id);
  const [{ data: notes }, { data: decisions }] = await Promise.all([
    supabase
      .from("notes")
      .select("*")
      .eq("session_id", session.id)
      .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"])
      .returns<Note[]>(),
    supabase
      .from("decisions")
      .select("*")
      .eq("session_id", session.id)
      .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"])
      .returns<Decision[]>(),
  ]);

  const subjectNames = Object.fromEntries((subjects ?? []).map((s) => [s.id, s.name]));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-8 print:px-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Conseil de classe — {schoolClass.name} — {new Date(session.session_date).toLocaleDateString("fr-FR")}
        </h1>
        <PrintButton />
      </div>

      {(students ?? []).map((student) => {
        const studentNotes = (notes ?? []).filter((n) => n.student_id === student.id);
        const studentDecisions = (decisions ?? []).filter((d) => d.student_id === student.id);

        return (
          <section key={student.id} className="break-inside-avoid border-b pb-4">
            <h2 className="font-medium">
              {student.first_name} {student.last_name}
            </h2>

            <h3 className="mt-2 text-xs font-semibold uppercase text-gray-500">Notes</h3>
            {studentNotes.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune note.</p>
            ) : (
              <ul className="ml-4 list-disc text-sm">
                {studentNotes.map((n) => (
                  <li key={n.id}>
                    <span className="text-gray-500">
                      [{categoryLabels[n.category]}
                      {n.subject_id ? ` — ${subjectNames[n.subject_id]}` : ""}]
                    </span>{" "}
                    {n.content}
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-2 text-xs font-semibold uppercase text-gray-500">Décisions</h3>
            {studentDecisions.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune décision.</p>
            ) : (
              <ul className="ml-4 list-disc text-sm">
                {studentDecisions.map((d) => (
                  <li key={d.id}>
                    {d.decision_text} — <span className="text-gray-500">{d.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import StudentCard from "./StudentCard";
import type {
  CouncilSession,
  Decision,
  Note,
  Profile,
  SchoolClass,
  SessionStatus,
  Student,
  Subject,
  Vote,
} from "@/types/database";
import { updateSessionStatus } from "@/app/actions";

const statusLabels: Record<SessionStatus, string> = {
  preparation: "Préparation",
  en_cours: "En cours",
  cloturee: "Clôturé",
};

export default async function SessionPage({
  params,
}: {
  params: { classId: string; sessionId: string };
}) {
  const supabase = createClient();

  const [{ data: userData }, { data: schoolClass }, { data: session }, { data: students }, { data: subjects }] =
    await Promise.all([
      supabase.auth.getUser(),
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
      supabase.from("subjects").select("*").order("name").returns<Subject[]>(),
    ]);

  if (!schoolClass || !session) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-gray-500">Conseil de classe introuvable ou accès non autorisé.</p>
        </main>
      </>
    );
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

  const decisionIds = (decisions ?? []).map((d) => d.id);
  const { data: votes } = await supabase
    .from("votes")
    .select("*")
    .in("decision_id", decisionIds.length ? decisionIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<Vote[]>();

  const authorIds = Array.from(
    new Set([...(notes ?? []).map((n) => n.author_id), ...(decisions ?? []).map((d) => d.author_id)])
  );
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("*").in("id", authorIds).returns<Profile[]>()
    : { data: [] as Profile[] };
  const authorNames = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name]));

  let profile: Profile | null = null;
  if (userData.user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single<Profile>();
    profile = data ?? null;
  }
  const canDecide = profile?.role === "direction" || profile?.role === "admin";

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/classes/${schoolClass.id}`} className="text-sm text-gray-500 hover:underline">
              &larr; {schoolClass.name}
            </Link>
            <h1 className="text-2xl font-semibold">
              Conseil de classe — {new Date(session.session_date).toLocaleDateString("fr-FR")}
            </h1>
          </div>
          <div className="no-print flex items-center gap-2">
            <select
              defaultValue={session.status}
              onChange={(e) =>
                updateSessionStatus(schoolClass.id, session.id, e.target.value as SessionStatus)
              }
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="preparation">Préparation</option>
              <option value="en_cours">En cours</option>
              <option value="cloturee">Clôturé</option>
            </select>
            <Link
              href={`/classes/${schoolClass.id}/sessions/${session.id}/export`}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Export PDF
            </Link>
          </div>
        </div>
        <p className="text-sm text-gray-500">Statut : {statusLabels[session.status]}</p>

        <div className="space-y-4">
          {(students ?? []).map((student) => (
            <StudentCard
              key={student.id}
              classId={schoolClass.id}
              sessionId={session.id}
              studentId={student.id}
              studentName={`${student.first_name} ${student.last_name}`}
              subjects={subjects ?? []}
              notes={(notes ?? []).filter((n) => n.student_id === student.id)}
              decisions={(decisions ?? []).filter((d) => d.student_id === student.id)}
              votes={(votes ?? []).filter((v) =>
                (decisions ?? [])
                  .filter((d) => d.student_id === student.id)
                  .map((d) => d.id)
                  .includes(v.decision_id)
              )}
              authorNames={authorNames}
              currentUserId={userData.user?.id ?? ""}
              canDecide={canDecide}
            />
          ))}
        </div>
      </main>
    </>
  );
}

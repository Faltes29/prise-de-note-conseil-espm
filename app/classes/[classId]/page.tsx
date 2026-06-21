import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import NewSessionForm from "./NewSessionForm";
import NewStudentForm from "./NewStudentForm";
import type { CouncilSession, Profile, SchoolClass, Student } from "@/types/database";

const statusLabels: Record<string, string> = {
  preparation: "Préparation",
  en_cours: "En cours",
  cloturee: "Clôturé",
};

export default async function ClassPage({ params }: { params: { classId: string } }) {
  const supabase = createClient();

  const [{ data: schoolClass }, { data: students }, { data: sessions }, { data: userData }] =
    await Promise.all([
      supabase.from("classes").select("*").eq("id", params.classId).single<SchoolClass>(),
      supabase
        .from("students")
        .select("*")
        .eq("class_id", params.classId)
        .order("last_name")
        .returns<Student[]>(),
      supabase
        .from("council_sessions")
        .select("*")
        .eq("class_id", params.classId)
        .order("session_date", { ascending: false })
        .returns<CouncilSession[]>(),
      supabase.auth.getUser(),
    ]);

  let profile: Profile | null = null;
  if (userData.user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single<Profile>();
    profile = data ?? null;
  }

  const canManage = profile?.role === "direction" || profile?.role === "admin";

  if (!schoolClass) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-gray-500">Classe introuvable ou accès non autorisé.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">{schoolClass.name}</h1>
          <p className="text-sm text-gray-500">{schoolClass.school_year}</p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Conseils de classe</h2>
            <NewSessionForm classId={schoolClass.id} />
          </div>

          {!sessions || sessions.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun conseil de classe pour l'instant.</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-white">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-3">
                  <Link
                    href={`/classes/${schoolClass.id}/sessions/${s.id}`}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {new Date(s.session_date).toLocaleDateString("fr-FR")}
                  </Link>
                  <span className="text-xs text-gray-500">{statusLabels[s.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Élèves</h2>
            {canManage && <NewStudentForm classId={schoolClass.id} />}
          </div>

          {!students || students.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun élève dans cette classe.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((st) => (
                <li key={st.id} className="rounded border bg-white px-3 py-2 text-sm">
                  {st.first_name} {st.last_name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

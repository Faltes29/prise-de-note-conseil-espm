import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { AssignTeacherForm, NewClassForm, NewSubjectForm, RoleSelect } from "./AdminForms";
import type { ClassTeacher, Profile, SchoolClass, Subject } from "@/types/database";

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: classes }, { data: subjects }, { data: profiles }, { data: assignments }] =
    await Promise.all([
      supabase.from("classes").select("*").order("name").returns<SchoolClass[]>(),
      supabase.from("subjects").select("*").order("name").returns<Subject[]>(),
      supabase.from("profiles").select("*").order("full_name").returns<Profile[]>(),
      supabase.from("class_teachers").select("*").returns<ClassTeacher[]>(),
    ]);

  const teachers = (profiles ?? []).filter((p) => p.role === "enseignant");
  const classNames = Object.fromEntries((classes ?? []).map((c) => [c.id, c.name]));
  const subjectNames = Object.fromEntries((subjects ?? []).map((s) => [s.id, s.name]));
  const profileNames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        <h1 className="text-2xl font-semibold">Administration</h1>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Classes</h2>
          <NewClassForm />
          <ul className="grid gap-2 sm:grid-cols-2">
            {(classes ?? []).map((c) => (
              <li key={c.id} className="rounded border bg-white px-3 py-2 text-sm">
                {c.name} — {c.school_year}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Matières</h2>
          <NewSubjectForm />
          <ul className="flex flex-wrap gap-2">
            {(subjects ?? []).map((s) => (
              <li key={s.id} className="rounded border bg-white px-2 py-1 text-xs">
                {s.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Affectation des enseignants</h2>
          <AssignTeacherForm classes={classes ?? []} teachers={teachers} subjects={subjects ?? []} />
          <ul className="space-y-1">
            {(assignments ?? []).map((a) => (
              <li key={a.id} className="rounded border bg-white px-3 py-2 text-sm">
                {profileNames[a.teacher_id]} — {classNames[a.class_id]}
                {a.subject_id ? ` (${subjectNames[a.subject_id]})` : ""}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Utilisateurs</h2>
          <ul className="space-y-1">
            {(profiles ?? []).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm"
              >
                <span>{p.full_name}</span>
                <RoleSelect profile={p} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

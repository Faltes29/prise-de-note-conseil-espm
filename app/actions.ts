"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Cas, Degree, Period, Sexe } from "@/types/database";

async function requireUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Non authentifié");
  return { supabase, userId: data.user.id };
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

// --- Encodage élève ---------------------------------------------------------

export async function saveEncoding(params: {
  studentId: string;
  period: Period;
  cas: Cas;
  subjectStatus: Record<string, string>;
  competencies: Record<string, boolean>;
  taStatus: Record<string, string>;
  taManualText: string | null;
  freins: string | null;
  forces: string | null;
  conseils: string | null;
  suiviNecessaire: boolean;
  suiviRaisons: string | null;
  suiviContact1: string | null;
  suiviContact2: string | null;
  statusId: string | null;
  generatedComment: string | null;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("student_encodings").upsert(
    {
      student_id: params.studentId,
      period: params.period,
      cas: params.cas,
      subject_status: params.subjectStatus,
      competencies: params.competencies,
      ta_status: params.taStatus,
      ta_manual_text: params.taManualText,
      freins: params.freins,
      forces: params.forces,
      conseils: params.conseils,
      suivi_necessaire: params.suiviNecessaire,
      suivi_raisons: params.suiviRaisons,
      suivi_contact_1: params.suiviContact1,
      suivi_contact_2: params.suiviContact2,
      status_id: params.statusId,
      generated_comment: params.generatedComment,
      created_by: userId,
    },
    { onConflict: "student_id,period" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  revalidatePath("/eleves");
}

// --- Classes -----------------------------------------------------------------

export async function createClass(name: string, year: number) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("classes").insert({ name, year });
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

export async function deleteClass(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

// --- Élèves ------------------------------------------------------------------

export async function addStudent(classId: string, lastName: string, firstName: string, sexe: Sexe) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("students").upsert(
    {
      class_id: classId,
      last_name: lastName,
      first_name: firstName,
      full_name: `${firstName} ${lastName}`,
      sexe,
    },
    { onConflict: "class_id,last_name,first_name" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

export async function deleteStudent(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

export interface ImportStudentRow {
  className: string;
  year: number;
  lastName: string;
  firstName: string;
  sexe: Sexe;
}

export async function importStudents(rows: ImportStudentRow[]) {
  const { supabase } = await requireUser();

  const uniqueClasses = new Map<string, { name: string; year: number }>();
  for (const row of rows) {
    uniqueClasses.set(`${row.className}__${row.year}`, { name: row.className, year: row.year });
  }

  const classIdByKey = new Map<string, string>();
  for (const { name, year } of uniqueClasses.values()) {
    const { data: existing } = await supabase
      .from("classes")
      .select("id")
      .eq("name", name)
      .eq("year", year)
      .maybeSingle();

    if (existing) {
      classIdByKey.set(`${name}__${year}`, existing.id as string);
      continue;
    }

    const { data: created, error } = await supabase
      .from("classes")
      .insert({ name, year })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    classIdByKey.set(`${name}__${year}`, created.id as string);
  }

  const studentRows = rows.map((row) => ({
    class_id: classIdByKey.get(`${row.className}__${row.year}`)!,
    last_name: row.lastName,
    first_name: row.firstName,
    full_name: `${row.firstName} ${row.lastName}`,
    sexe: row.sexe,
  }));

  const { error } = await supabase
    .from("students")
    .upsert(studentRows, { onConflict: "class_id,last_name,first_name" });
  if (error) throw new Error(error.message);

  revalidatePath("/reglages");
  revalidatePath("/notes");
  revalidatePath("/eleves");
  return { classesCount: uniqueClasses.size, studentsCount: studentRows.length };
}

// --- Matières ------------------------------------------------------------------

export async function createSubject(degree: Degree, name: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("subjects").insert({ degree, name });
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

export async function deleteSubject(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

// --- Compétences transversales ------------------------------------------------

export async function createCompetency(degree: Degree, name: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("competencies").insert({ degree, name });
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

export async function deleteCompetency(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("competencies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

// --- Personnes ressources ------------------------------------------------------

export async function createResourcePerson(name: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("resource_persons").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

export async function deleteResourcePerson(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("resource_persons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

// --- Statuts de tâche -----------------------------------------------------------

export async function createTaskStatus(label: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("task_statuses").insert({ label });
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

export async function deleteTaskStatus(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("task_statuses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

// --- Templates ------------------------------------------------------------------

export async function upsertTemplate(cas: Cas, degree: Degree, period: Period, body: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("templates")
    .upsert({ cas, degree, period, body }, { onConflict: "cas,degree,period" });
  if (error) throw new Error(error.message);
  revalidatePath("/reglages");
  revalidatePath("/notes");
}

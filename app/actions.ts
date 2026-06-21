"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DecisionStatus, NoteCategory, SessionStatus, VoteValue } from "@/types/database";

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

export async function createClass(name: string, schoolYear: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("classes").insert({ name, school_year: schoolYear });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createSubject(name: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("subjects").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateUserRole(profileId: string, role: "enseignant" | "direction" | "admin") {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function addStudent(classId: string, firstName: string, lastName: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("students")
    .insert({ class_id: classId, first_name: firstName, last_name: lastName });
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${classId}`);
}

export async function assignTeacher(classId: string, teacherId: string, subjectId: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("class_teachers")
    .insert({ class_id: classId, teacher_id: teacherId, subject_id: subjectId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createSession(classId: string, sessionDate: string) {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("council_sessions")
    .insert({ class_id: classId, session_date: sessionDate, created_by: userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${classId}`);
  return data.id as string;
}

export async function updateSessionStatus(classId: string, sessionId: string, status: SessionStatus) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("council_sessions")
    .update({ status })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${classId}/sessions/${sessionId}`);
}

export async function addNote(params: {
  classId: string;
  sessionId: string;
  studentId: string;
  category: NoteCategory;
  subjectId: string | null;
  content: string;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("notes").insert({
    session_id: params.sessionId,
    student_id: params.studentId,
    category: params.category,
    subject_id: params.subjectId,
    content: params.content,
    author_id: userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${params.classId}/sessions/${params.sessionId}`);
}

export async function deleteNote(classId: string, sessionId: string, noteId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${classId}/sessions/${sessionId}`);
}

export async function addDecision(params: {
  classId: string;
  sessionId: string;
  studentId: string;
  decisionText: string;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("decisions").insert({
    session_id: params.sessionId,
    student_id: params.studentId,
    decision_text: params.decisionText,
    author_id: userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${params.classId}/sessions/${params.sessionId}`);
}

export async function updateDecisionStatus(
  classId: string,
  sessionId: string,
  decisionId: string,
  status: DecisionStatus
) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("decisions").update({ status }).eq("id", decisionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${classId}/sessions/${sessionId}`);
}

export async function castVote(
  classId: string,
  sessionId: string,
  decisionId: string,
  value: VoteValue
) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("votes")
    .upsert(
      { decision_id: decisionId, voter_id: userId, value },
      { onConflict: "decision_id,voter_id" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/classes/${classId}/sessions/${sessionId}`);
}

import { createClient } from "@/lib/supabase/server";
import EleveTable from "./EleveTable";
import type { SchoolClass, Student, StudentEncoding, Subject, TaskStatus } from "@/types/database";

export default async function ElevesPage() {
  const supabase = createClient();

  const [
    { data: classes },
    { data: students },
    { data: encodings },
    { data: subjects },
    { data: taskStatuses },
  ] = await Promise.all([
    supabase.from("classes").select("*").order("year").order("name"),
    supabase.from("students").select("*").order("last_name"),
    supabase.from("student_encodings").select("*"),
    supabase.from("subjects").select("*"),
    supabase.from("task_statuses").select("*").order("position"),
  ]);

  return (
    <EleveTable
      classes={(classes ?? []) as SchoolClass[]}
      students={(students ?? []) as Student[]}
      encodings={(encodings ?? []) as StudentEncoding[]}
      subjects={(subjects ?? []) as Subject[]}
      taskStatuses={(taskStatuses ?? []) as TaskStatus[]}
    />
  );
}

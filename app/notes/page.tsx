import { createClient } from "@/lib/supabase/server";
import NotesForm from "./NotesForm";
import type {
  Competency,
  ResourcePerson,
  SchoolClass,
  Student,
  StudentEncoding,
  Subject,
  Template,
  TaskStatus,
} from "@/types/database";

export default async function NotesPage() {
  const supabase = createClient();

  const [
    { data: classes },
    { data: students },
    { data: subjects },
    { data: competencies },
    { data: resourcePersons },
    { data: taskStatuses },
    { data: templates },
    { data: encodings },
  ] = await Promise.all([
    supabase.from("classes").select("*").order("year").order("name"),
    supabase.from("students").select("*").order("last_name"),
    supabase.from("subjects").select("*").order("position"),
    supabase.from("competencies").select("*").order("position"),
    supabase.from("resource_persons").select("*").order("position"),
    supabase.from("task_statuses").select("*").order("position"),
    supabase.from("templates").select("*"),
    supabase.from("student_encodings").select("*"),
  ]);

  return (
    <NotesForm
      classes={(classes ?? []) as SchoolClass[]}
      students={(students ?? []) as Student[]}
      subjects={(subjects ?? []) as Subject[]}
      competencies={(competencies ?? []) as Competency[]}
      resourcePersons={(resourcePersons ?? []) as ResourcePerson[]}
      taskStatuses={(taskStatuses ?? []) as TaskStatus[]}
      templates={(templates ?? []) as Template[]}
      encodings={(encodings ?? []) as StudentEncoding[]}
    />
  );
}

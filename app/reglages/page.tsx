import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReglagesClient from "./ReglagesClient";
import type {
  Competency,
  Profile,
  ResourcePerson,
  SchoolClass,
  Student,
  Subject,
  TaskStatus,
  Template,
} from "@/types/database";

export default async function ReglagesPage() {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const [
    { data: profile },
    { data: classes },
    { data: students },
    { data: subjects },
    { data: competencies },
    { data: resourcePersons },
    { data: taskStatuses },
    { data: templates },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userData.user.id).single<Profile>(),
    supabase.from("classes").select("*").order("year").order("name"),
    supabase.from("students").select("*").order("last_name"),
    supabase.from("subjects").select("*").order("position"),
    supabase.from("competencies").select("*").order("position"),
    supabase.from("resource_persons").select("*").order("position"),
    supabase.from("task_statuses").select("*").order("position"),
    supabase.from("templates").select("*"),
  ]);
  if (!profile?.is_admin) redirect("/notes");

  return (
    <ReglagesClient
      classes={(classes ?? []) as SchoolClass[]}
      students={(students ?? []) as Student[]}
      subjects={(subjects ?? []) as Subject[]}
      competencies={(competencies ?? []) as Competency[]}
      resourcePersons={(resourcePersons ?? []) as ResourcePerson[]}
      taskStatuses={(taskStatuses ?? []) as TaskStatus[]}
      templates={(templates ?? []) as Template[]}
    />
  );
}

export type Role = "enseignant" | "direction" | "admin";
export type SessionStatus = "preparation" | "en_cours" | "cloturee";
export type NoteCategory = "matiere" | "comportement" | "general";
export type DecisionStatus = "proposee" | "adoptee" | "rejetee";
export type VoteValue = "pour" | "contre" | "abstention";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  school_year: string;
  created_at: string;
}

export interface ClassTeacher {
  id: string;
  class_id: string;
  teacher_id: string;
  subject_id: string | null;
}

export interface Student {
  id: string;
  class_id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface CouncilSession {
  id: string;
  class_id: string;
  session_date: string;
  status: SessionStatus;
  created_by: string;
  created_at: string;
}

export interface Note {
  id: string;
  session_id: string;
  student_id: string;
  subject_id: string | null;
  author_id: string;
  category: NoteCategory;
  content: string;
  created_at: string;
}

export interface Decision {
  id: string;
  session_id: string;
  student_id: string;
  decision_text: string;
  status: DecisionStatus;
  author_id: string;
  created_at: string;
}

export interface Vote {
  id: string;
  decision_id: string;
  voter_id: string;
  value: VoteValue;
  created_at: string;
}

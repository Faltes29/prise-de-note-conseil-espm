export type Degree = "D1" | "D2" | "D3";
export type Period = "P1" | "P2" | "P3";
export type Cas = 1 | 2 | 3;
export type Sexe = "F" | "M" | "X";
export type SubjectStatus = "echec" | "difficulte" | "ne";
export type TaStatus = "force" | "faiblesse";

export const TA_ITEMS = [
  { key: "travaux_pertinents", label: "Proposer des travaux pertinents" },
  { key: "reussir", label: "Réussir ce qu'il se propose de faire" },
  { key: "autoevaluation", label: "S'autoévaluer de manière pertinente" },
  { key: "conseils", label: "Prendre les conseils pour progresser" },
  { key: "planifier", label: "Planifier son travail" },
] as const;

export type TaItemKey = (typeof TA_ITEMS)[number]["key"];

export interface Profile {
  id: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  year: number;
  created_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  last_name: string;
  first_name: string;
  full_name: string;
  sexe: Sexe;
  created_at: string;
}

export interface Subject {
  id: string;
  degree: Degree;
  name: string;
  position: number;
}

export interface Competency {
  id: string;
  degree: Degree;
  name: string;
  position: number;
}

export interface ResourcePerson {
  id: string;
  name: string;
  position: number;
}

export interface TaskStatus {
  id: string;
  label: string;
  position: number;
}

export interface Template {
  id: string;
  cas: Cas;
  degree: Degree;
  period: Period;
  body: string;
}

export interface StudentEncoding {
  id: string;
  student_id: string;
  period: Period;
  cas: Cas;
  subject_status: Record<string, SubjectStatus>;
  competencies: Record<string, boolean>;
  ta_status: Record<string, TaStatus>;
  ta_manual_text: string | null;
  freins: string | null;
  forces: string | null;
  conseils: string | null;
  remarques: string | null;
  suivi_necessaire: boolean;
  suivi_raisons: string | null;
  suivi_contact_1: string | null;
  suivi_contact_2: string | null;
  status_id: string | null;
  generated_comment: string | null;
  created_by: string | null;
  updated_at: string;
}

export function degreeForYear(year: number): Degree {
  if (year <= 2) return "D1";
  if (year <= 4) return "D2";
  return "D3";
}

export function genreLabel(sexe: Sexe): "Féminin" | "Masculin" | "Non-défini" {
  if (sexe === "F") return "Féminin";
  if (sexe === "M") return "Masculin";
  return "Non-défini";
}

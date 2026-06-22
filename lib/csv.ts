import type { ImportStudentRow } from "@/app/actions";
import type { Sexe } from "@/types/database";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === "," || char === ";") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeSexe(value: string): Sexe {
  const v = value.trim().toUpperCase();
  if (v.startsWith("F")) return "F";
  if (v.startsWith("M") || v.startsWith("G")) return "M";
  return "X";
}

function parseYear(value: string): number {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

// La grille horaire encode l'année d'études en tête du nom de classe
// (ex: "1A", "5C") ; la colonne "Année scolaire" contient souvent
// l'année calendaire ("2025-2026"), pas l'année d'études.
function yearFromClassName(className: string): number {
  const match = className.match(/^\d+/);
  const year = match ? Number(match[0]) : 0;
  return year >= 1 && year <= 6 ? year : 0;
}

export function parseStudentsCsv(text: string): ImportStudentRow[] {
  const cleanText = text.replace(/^﻿/, "");
  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const indexOf = (...names: string[]) => headers.findIndex((h) => names.includes(h));

  const idxClasse = indexOf("classe", "nom de classe");
  const idxNom = indexOf("nom famille", "nom");
  const idxPrenom = indexOf("prénom", "prenom");
  const idxSexe = indexOf("sexe");
  const idxAnnee = indexOf("année scolaire", "annee scolaire", "année", "annee");

  const rows: ImportStudentRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const lastName = idxNom >= 0 ? cells[idxNom] : "";
    const firstName = idxPrenom >= 0 ? cells[idxPrenom] : "";
    const className = idxClasse >= 0 ? cells[idxClasse] : "";
    const sexe = idxSexe >= 0 ? normalizeSexe(cells[idxSexe] ?? "") : "X";
    const year = yearFromClassName(className) || (idxAnnee >= 0 ? parseYear(cells[idxAnnee] ?? "") : 0);

    if (!lastName || !firstName || !className || !year) continue;

    rows.push({ className, year, lastName, firstName, sexe });
  }

  return rows;
}

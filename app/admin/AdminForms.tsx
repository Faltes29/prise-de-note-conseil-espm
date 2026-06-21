"use client";

import { useState } from "react";
import { assignTeacher, createClass, createSubject, updateUserRole } from "@/app/actions";
import type { Profile, SchoolClass, Subject } from "@/types/database";

export function NewClassForm() {
  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createClass(name, schoolYear);
    setName("");
    setSchoolYear("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <input
        placeholder="Nom de la classe"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      />
      <input
        placeholder="Année scolaire (ex: 2025-2026)"
        required
        value={schoolYear}
        onChange={(e) => setSchoolYear(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      />
      <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white">
        Créer
      </button>
    </form>
  );
}

export function NewSubjectForm() {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createSubject(name);
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <input
        placeholder="Nom de la matière"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      />
      <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white">
        Ajouter
      </button>
    </form>
  );
}

export function AssignTeacherForm({
  classes,
  teachers,
  subjects,
}: {
  classes: SchoolClass[];
  teachers: Profile[];
  subjects: Subject[];
}) {
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await assignTeacher(classId, teacherId, subjectId || null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <select
        required
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        <option value="">Classe</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        required
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        <option value="">Enseignant</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.full_name}
          </option>
        ))}
      </select>
      <select
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        <option value="">Matière (optionnel)</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white">
        Assigner
      </button>
    </form>
  );
}

export function RoleSelect({ profile }: { profile: Profile }) {
  const [role, setRole] = useState(profile.role);

  return (
    <select
      value={role}
      onChange={(e) => {
        const value = e.target.value as Profile["role"];
        setRole(value);
        updateUserRole(profile.id, value);
      }}
      className="rounded border px-2 py-1 text-xs"
    >
      <option value="enseignant">Enseignant</option>
      <option value="direction">Direction</option>
      <option value="admin">Admin</option>
    </select>
  );
}

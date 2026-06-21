"use client";

import { useState } from "react";
import { addStudent } from "@/app/actions";

export default function NewStudentForm({ classId }: { classId: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await addStudent(classId, firstName, lastName);
      setFirstName("");
      setLastName("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <input
        placeholder="Prénom"
        required
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      />
      <input
        placeholder="Nom"
        required
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Ajouter
      </button>
    </form>
  );
}

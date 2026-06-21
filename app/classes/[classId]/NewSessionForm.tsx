"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/app/actions";

export default function NewSessionForm({ classId }: { classId: string }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const sessionId = await createSession(classId, date);
      router.push(`/classes/${classId}/sessions/${sessionId}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="block text-xs font-medium text-gray-600" htmlFor="session-date">
          Date du conseil
        </label>
        <input
          id="session-date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Nouveau conseil
      </button>
    </form>
  );
}

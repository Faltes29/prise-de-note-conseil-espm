import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import type { SchoolClass } from "@/types/database";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .order("name")
    .returns<SchoolClass[]>();

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Mes classes</h1>

        {!classes || classes.length === 0 ? (
          <p className="text-gray-500">
            Aucune classe ne vous est encore assignée. Contactez la direction.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/classes/${c.id}`}
                  className="block rounded-lg border bg-white p-4 shadow-sm hover:border-primary"
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.school_year}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

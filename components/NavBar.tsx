import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import type { Profile } from "@/types/database";

export default async function NavBar() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single<Profile>();

  return (
    <header className="no-print border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-semibold">
            Conseil de classe
          </Link>
          {(profile?.role === "direction" || profile?.role === "admin") && (
            <Link href="/admin" className="text-gray-600 hover:text-primary">
              Administration
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>
            {profile?.full_name} ({profile?.role})
          </span>
          <form action={signOut}>
            <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

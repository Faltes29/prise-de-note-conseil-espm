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
    <header className="no-print bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/notes" className="font-semibold tracking-tight">
            🎓 Bulletin ESPM
          </Link>
          <Link href="/notes" className="text-indigo-100 hover:text-white">
            Prise de notes
          </Link>
          <Link href="/eleves" className="text-indigo-100 hover:text-white">
            Données encodées
          </Link>
          {profile?.is_admin && (
            <Link href="/reglages" className="text-indigo-100 hover:text-white">
              Réglages
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm text-indigo-100">
          <span>{profile?.full_name}</span>
          <form action={signOut}>
            <button className="rounded border border-white/30 px-2 py-1 text-xs text-white hover:bg-white/10">
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

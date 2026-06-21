-- Schéma pour l'outil de prise de notes de conseil de classe

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('enseignant', 'direction', 'admin')),
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school_year text not null,
  created_at timestamptz not null default now()
);

create table public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  unique (class_id, teacher_id, subject_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  created_at timestamptz not null default now()
);

create table public.council_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  session_date date not null,
  status text not null default 'preparation' check (status in ('preparation', 'en_cours', 'cloturee')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.council_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  author_id uuid not null references public.profiles (id),
  category text not null check (category in ('matiere', 'comportement', 'general')),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.council_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  decision_text text not null,
  status text not null default 'proposee' check (status in ('proposee', 'adoptee', 'rejetee')),
  author_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions (id) on delete cascade,
  voter_id uuid not null references public.profiles (id),
  value text not null check (value in ('pour', 'contre', 'abstention')),
  created_at timestamptz not null default now(),
  unique (decision_id, voter_id)
);

create index on public.class_teachers (teacher_id);
create index on public.students (class_id);
create index on public.council_sessions (class_id);
create index on public.notes (session_id, student_id);
create index on public.decisions (session_id, student_id);
create index on public.votes (decision_id);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer to avoid recursive RLS lookups)
-- ---------------------------------------------------------------------------

create or replace function public.current_role_is(target_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any (target_roles)
  );
$$;

create or replace function public.is_assigned_to_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.class_teachers
    where class_id = target_class_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.can_view_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_assigned_to_class(target_class_id)
    or public.current_role_is(array['direction', 'admin']);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;
alter table public.students enable row level security;
alter table public.council_sessions enable row level security;
alter table public.notes enable row level security;
alter table public.decisions enable row level security;
alter table public.votes enable row level security;

-- profiles --------------------------------------------------------------

create policy "Lecture de son propre profil" on public.profiles
  for select using (id = auth.uid() or public.current_role_is(array['direction', 'admin']));

create policy "Mise a jour de son propre profil" on public.profiles
  for update using (id = auth.uid());

create policy "Admin gere les profils" on public.profiles
  for all using (public.current_role_is(array['admin']));

-- subjects ----------------------------------------------------------------

create policy "Tout utilisateur connecte lit les matieres" on public.subjects
  for select using (auth.uid() is not null);

create policy "Direction et admin gerent les matieres" on public.subjects
  for all using (public.current_role_is(array['direction', 'admin']));

-- classes -------------------------------------------------------------------

create policy "Lecture des classes assignees" on public.classes
  for select using (public.can_view_class(id));

create policy "Direction et admin gerent les classes" on public.classes
  for all using (public.current_role_is(array['direction', 'admin']));

-- class_teachers --------------------------------------------------------

create policy "Lecture des affectations visibles" on public.class_teachers
  for select using (public.can_view_class(class_id));

create policy "Direction et admin gerent les affectations" on public.class_teachers
  for all using (public.current_role_is(array['direction', 'admin']));

-- students ------------------------------------------------------------------

create policy "Lecture des eleves de classes visibles" on public.students
  for select using (public.can_view_class(class_id));

create policy "Direction et admin gerent les eleves" on public.students
  for all using (public.current_role_is(array['direction', 'admin']));

-- council_sessions -------------------------------------------------------

create policy "Lecture des sessions visibles" on public.council_sessions
  for select using (public.can_view_class(class_id));

create policy "Creation de session par enseignant assigne ou direction" on public.council_sessions
  for insert with check (public.can_view_class(class_id));

create policy "Mise a jour de session par enseignant assigne ou direction" on public.council_sessions
  for update using (public.can_view_class(class_id));

create policy "Direction et admin suppriment les sessions" on public.council_sessions
  for delete using (public.current_role_is(array['direction', 'admin']));

-- notes -----------------------------------------------------------------

create policy "Lecture des notes des sessions visibles" on public.notes
  for select using (
    exists (
      select 1 from public.council_sessions cs
      where cs.id = notes.session_id and public.can_view_class(cs.class_id)
    )
  );

create policy "Ecriture de notes par auteur sur sessions visibles" on public.notes
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.council_sessions cs
      where cs.id = notes.session_id and public.can_view_class(cs.class_id)
    )
  );

create policy "Modification et suppression de ses propres notes" on public.notes
  for update using (author_id = auth.uid());

create policy "Suppression de ses propres notes" on public.notes
  for delete using (author_id = auth.uid() or public.current_role_is(array['direction', 'admin']));

-- decisions ---------------------------------------------------------------

create policy "Lecture des decisions des sessions visibles" on public.decisions
  for select using (
    exists (
      select 1 from public.council_sessions cs
      where cs.id = decisions.session_id and public.can_view_class(cs.class_id)
    )
  );

create policy "Creation de decisions sur sessions visibles" on public.decisions
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.council_sessions cs
      where cs.id = decisions.session_id and public.can_view_class(cs.class_id)
    )
  );

create policy "Mise a jour des decisions par auteur ou direction" on public.decisions
  for update using (
    author_id = auth.uid() or public.current_role_is(array['direction', 'admin'])
  );

-- votes -------------------------------------------------------------------

create policy "Lecture des votes des decisions visibles" on public.votes
  for select using (
    exists (
      select 1 from public.decisions d
      join public.council_sessions cs on cs.id = d.session_id
      where d.id = votes.decision_id and public.can_view_class(cs.class_id)
    )
  );

create policy "Vote par les enseignants assignes" on public.votes
  for insert with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.decisions d
      join public.council_sessions cs on cs.id = d.session_id
      where d.id = votes.decision_id and public.can_view_class(cs.class_id)
    )
  );

create policy "Modification de son propre vote" on public.votes
  for update using (voter_id = auth.uid());

create policy "Suppression de son propre vote" on public.votes
  for delete using (voter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'enseignant')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

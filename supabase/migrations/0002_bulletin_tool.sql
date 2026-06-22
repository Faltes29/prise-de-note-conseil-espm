-- Remplacement du schéma "conseil de classe" (rôles/votes) par l'outil
-- de génération de commentaires de bulletin.

-- ---------------------------------------------------------------------------
-- Nettoyage de l'ancien schéma (migration 0001)
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.can_view_class(uuid);
drop function if exists public.is_assigned_to_class(uuid);
drop function if exists public.current_role_is(text[]);

drop table if exists public.votes;
drop table if exists public.decisions;
drop table if exists public.notes;
drop table if exists public.council_sessions;
drop table if exists public.class_teachers;
drop table if exists public.students;
drop table if exists public.classes;
drop table if exists public.subjects;
drop table if exists public.profiles;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year smallint not null check (year between 1 and 6),
  created_at timestamptz not null default now(),
  unique (name, year)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  last_name text not null,
  first_name text not null,
  full_name text not null,
  sexe text not null default 'X' check (sexe in ('F', 'M', 'X')),
  created_at timestamptz not null default now(),
  unique (class_id, last_name, first_name)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  degree text not null check (degree in ('D1', 'D2', 'D3')),
  name text not null,
  position int not null default 0,
  unique (degree, name)
);

create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  degree text not null check (degree in ('D1', 'D2', 'D3')),
  name text not null,
  position int not null default 0,
  unique (degree, name)
);

create table public.resource_persons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position int not null default 0
);

create table public.task_statuses (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  position int not null default 0
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  cas smallint not null check (cas in (1, 2, 3)),
  degree text not null check (degree in ('D1', 'D2', 'D3')),
  period text not null check (period in ('P1', 'P2', 'P3')),
  body text not null,
  unique (cas, degree, period)
);

create table public.student_encodings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  period text not null check (period in ('P1', 'P2', 'P3')),
  cas smallint not null default 1 check (cas in (1, 2, 3)),
  subject_status jsonb not null default '{}'::jsonb,
  competencies jsonb not null default '{}'::jsonb,
  ta_status jsonb not null default '{}'::jsonb,
  ta_manual_text text,
  freins text,
  forces text,
  conseils text,
  suivi_necessaire boolean not null default false,
  suivi_raisons text,
  suivi_contact_1 uuid references public.resource_persons (id) on delete set null,
  suivi_contact_2 uuid references public.resource_persons (id) on delete set null,
  status_id uuid references public.task_statuses (id) on delete set null,
  generated_comment text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (student_id, period)
);

create index on public.students (class_id);
create index on public.subjects (degree);
create index on public.competencies (degree);
create index on public.templates (cas, degree, period);
create index on public.student_encodings (student_id, period);

-- ---------------------------------------------------------------------------
-- Row Level Security — outil mono-établissement, tout utilisateur connecté
-- (enseignant, direction...) a accès à l'ensemble des données.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.competencies enable row level security;
alter table public.resource_persons enable row level security;
alter table public.task_statuses enable row level security;
alter table public.templates enable row level security;
alter table public.student_encodings enable row level security;

create policy "Lecture de son profil" on public.profiles
  for select using (auth.uid() is not null);

create policy "Mise a jour de son propre profil" on public.profiles
  for update using (id = auth.uid());

create policy "Acces complet aux classes" on public.classes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Acces complet aux eleves" on public.students
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Acces complet aux matieres" on public.subjects
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Acces complet aux competences" on public.competencies
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Acces complet aux personnes ressources" on public.resource_persons
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Acces complet aux statuts" on public.task_statuses
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Acces complet aux templates" on public.templates
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Acces complet aux encodages" on public.student_encodings
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

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
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Mise à jour automatique de updated_at sur student_encodings
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger student_encodings_set_updated_at
  before update on public.student_encodings
  for each row execute function public.set_updated_at();

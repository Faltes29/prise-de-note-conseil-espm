-- Ajoute un rôle administrateur, dont l'accès à la page "Réglages" est réservé.
-- Pour promouvoir un compte, passer sa colonne is_admin à true depuis l'éditeur
-- de table Supabase (table public.profiles) — aucune interface n'est prévue
-- dans l'application elle-même.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Les tables de paramétrage restent lisibles par tous les enseignants
-- connectés, mais leur modification est réservée aux administrateurs.

drop policy if exists "Acces complet aux classes" on public.classes;
create policy "Lecture des classes" on public.classes
  for select using (auth.uid() is not null);
create policy "Modification des classes (admin)" on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Acces complet aux eleves" on public.students;
create policy "Lecture des eleves" on public.students
  for select using (auth.uid() is not null);
create policy "Modification des eleves (admin)" on public.students
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Acces complet aux matieres" on public.subjects;
create policy "Lecture des matieres" on public.subjects
  for select using (auth.uid() is not null);
create policy "Modification des matieres (admin)" on public.subjects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Acces complet aux competences" on public.competencies;
create policy "Lecture des competences" on public.competencies
  for select using (auth.uid() is not null);
create policy "Modification des competences (admin)" on public.competencies
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Acces complet aux personnes ressources" on public.resource_persons;
create policy "Lecture des personnes ressources" on public.resource_persons
  for select using (auth.uid() is not null);
create policy "Modification des personnes ressources (admin)" on public.resource_persons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Acces complet aux statuts" on public.task_statuses;
create policy "Lecture des statuts" on public.task_statuses
  for select using (auth.uid() is not null);
create policy "Modification des statuts (admin)" on public.task_statuses
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Acces complet aux templates" on public.templates;
create policy "Lecture des templates" on public.templates
  for select using (auth.uid() is not null);
create policy "Modification des templates (admin)" on public.templates
  for all using (public.is_admin()) with check (public.is_admin());

-- student_encodings reste modifiable par tous les enseignants connectés
-- (encodage des bulletins, hors périmètre "Réglages").

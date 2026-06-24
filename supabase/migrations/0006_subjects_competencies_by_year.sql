-- Différencie les matières et compétences transversales par année d'études
-- (1 à 6) plutôt que par degré (D1/D2/D3), pour permettre un encodage plus
-- précis dans les réglages. Les lignes existantes sont dupliquées sur les
-- deux années couvertes par leur ancien degré, afin de conserver les
-- options disponibles dans la prise de notes.

alter table public.subjects add column year smallint;
alter table public.competencies add column year smallint;

update public.subjects set year = case degree when 'D1' then 1 when 'D2' then 3 when 'D3' then 5 end;
update public.competencies set year = case degree when 'D1' then 1 when 'D2' then 3 when 'D3' then 5 end;

alter table public.subjects drop constraint subjects_degree_name_key;
alter table public.competencies drop constraint competencies_degree_name_key;

insert into public.subjects (degree, name, position, year)
select degree, name, position, year + 1 from public.subjects where year in (1, 3, 5);

insert into public.competencies (degree, name, position, year)
select degree, name, position, year + 1 from public.competencies where year in (1, 3, 5);

drop index if exists subjects_degree_idx;
drop index if exists competencies_degree_idx;

alter table public.subjects drop column degree;
alter table public.competencies drop column degree;

alter table public.subjects alter column year set not null;
alter table public.competencies alter column year set not null;

alter table public.subjects add constraint subjects_year_check check (year between 1 and 6);
alter table public.competencies add constraint competencies_year_check check (year between 1 and 6);

alter table public.subjects add constraint subjects_year_name_key unique (year, name);
alter table public.competencies add constraint competencies_year_name_key unique (year, name);

create index on public.subjects (year);
create index on public.competencies (year);

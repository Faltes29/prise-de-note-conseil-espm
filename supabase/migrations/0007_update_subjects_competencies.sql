-- Remplace les matières et compétences transversales par les listes
-- officielles ESPM (1re-2e, 3e-4e, 5e-6e).

delete from public.subjects;
delete from public.competencies;

insert into public.subjects (year, name, position)
select y, name, position from unnest(array[1, 2]) y, (values
  ('Art', 1),
  ('Citoyenneté', 2),
  ('Culture antique', 3),
  ('Education physique', 4),
  ('Français', 5),
  ('Histoire-Géographie', 6),
  ('Mathématique', 7),
  ('Néerlandais', 8),
  ('Sciences', 9),
  ('Sciences sociales', 10),
  ('Education à la technologie', 11)
) as d1(name, position)
union all
select y, name, position from unnest(array[3, 4]) y, (values
  ('Anglais', 1),
  ('Art', 2),
  ('Biologie', 3),
  ('Chimie', 4),
  ('Citoyenneté', 5),
  ('Communication', 6),
  ('Culture antique', 7),
  ('Education physique', 8),
  ('Espagnol', 9),
  ('Français', 10),
  ('Géographie', 11),
  ('Physique', 12),
  ('Histoire', 13),
  ('Mathématique', 14),
  ('Néerlandais', 15),
  ('Sciences', 16),
  ('Sciences économiques', 17),
  ('Sciences sociales', 18)
) as d2(name, position)
union all
select y, name, position from unnest(array[5, 6]) y, (values
  ('Anglais', 1),
  ('Art', 2),
  ('Biologie', 3),
  ('Chimie', 4),
  ('Citoyenneté', 5),
  ('Communication', 6),
  ('Culture antique', 7),
  ('Education physique', 8),
  ('Espagnol', 9),
  ('Français', 10),
  ('Géographie', 11),
  ('Physique', 12),
  ('Histoire', 13),
  ('Mathématique', 14),
  ('Néerlandais', 15),
  ('Sciences', 16),
  ('Sciences économiques', 17),
  ('Sciences sociales', 18),
  ('Option sciences', 19)
) as d3(name, position);

insert into public.competencies (year, name, position)
select y, name, position from unnest(array[1, 2]) y, (values
  ('Application', 1),
  ('Autonomie', 2),
  ('Communication', 3),
  ('Consignes', 4),
  ('Justification', 5),
  ('Recherche', 6),
  ('Restitution', 7),
  ('Sélection d''information', 8),
  ('Transfert', 9)
) as d1(name, position)
union all
select y, name, position from unnest(array[3, 4, 5, 6]) y, (values
  ('Application', 1),
  ('Autonomie', 2),
  ('Communication', 3),
  ('Consignes', 4),
  ('Justification', 5),
  ('Recherche', 6),
  ('Restitution', 7),
  ('Sélection d''information', 8),
  ('Transfert', 9),
  ('Synthèse', 10),
  ('Argumentation', 11)
) as d2(name, position);

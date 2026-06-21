-- Données de référence facultatives, exécutées après les migrations.

insert into public.subjects (name) values
  ('Français'),
  ('Mathématiques'),
  ('Histoire-Géographie'),
  ('Sciences'),
  ('Langues vivantes'),
  ('Éducation physique et sportive'),
  ('Arts')
on conflict (name) do nothing;

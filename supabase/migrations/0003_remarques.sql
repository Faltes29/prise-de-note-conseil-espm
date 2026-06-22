-- Ajoute un champ libre "Remarques supplémentaires" à l'encodage d'un élève.

alter table public.student_encodings
  add column if not exists remarques text;

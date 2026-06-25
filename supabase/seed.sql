-- Données par défaut pour l'outil de bulletin. Tout est modifiable ensuite
-- depuis la page "Réglages" de l'application.

-- Matières par année d'études -------------------------------------------------

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
) as d3(name, position)
on conflict (year, name) do nothing;

-- Compétences transversales par année d'études --------------------------------

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
) as d2(name, position)
on conflict (year, name) do nothing;

-- Personnes ressources --------------------------------------------------------

insert into public.resource_persons (name, position) values
  ('Educateur·trice', 1),
  ('Logopède', 2),
  ('Assistant social', 3),
  ('Julie Moens', 4),
  ('Amelle Belguenani', 5)
on conflict (name) do nothing;

-- Statuts de tâche ------------------------------------------------------------

insert into public.task_statuses (label, position) values
  ('To-Do', 1),
  ('En cours', 2),
  ('A faire', 3),
  ('Fait', 4)
on conflict (label) do nothing;

-- Templates de commentaire par cas / degré / période -------------------------
-- Balises disponibles : {{prenom}} {{nom}} {{il_elle}} {{son_sa}} {{le_la}}
-- {{matieres_echec}} {{matieres_difficulte}} {{matieres_ne}} {{competences}}
-- {{ta_forces}} {{ta_faiblesses}} {{ta_manuel}} {{freins}} {{forces}}
-- {{conseils}} {{remarques}} {{suivi}} — et blocs conditionnels
-- {{#if variable}}...{{/if}}

insert into public.templates (cas, degree, period, body)
select 1, d, p,
  '{{prenom}} a fourni un travail satisfaisant ce trimestre. {{#if competences}}Sur le plan des compétences transversales, une attention reste à porter sur : {{competences}}. {{/if}}{{#if forces}}{{forces}} {{/if}}{{#if conseils}}{{conseils}}{{/if}}'
from unnest(array['D1', 'D2', 'D3']) d, unnest(array['P1', 'P2', 'P3']) p
on conflict (cas, degree, period) do nothing;

insert into public.templates (cas, degree, period, body)
select 2, d, p,
  '{{prenom}} rencontre des difficultés ce trimestre. {{#if matieres_difficulte}}{{il_elle}} doit progresser en : {{matieres_difficulte}}. {{/if}}{{#if matieres_echec}}{{il_elle}} est en échec en : {{matieres_echec}}. {{/if}}{{#if competences}}Sur le plan transversal, {{il_elle}} doit encore travailler : {{competences}}. {{/if}}{{#if freins}}{{freins}} {{/if}}{{#if forces}}{{forces}} {{/if}}{{#if conseils}}{{conseils}}{{/if}}'
from unnest(array['D1', 'D2', 'D3']) d, unnest(array['P1', 'P2', 'P3']) p
on conflict (cas, degree, period) do nothing;

insert into public.templates (cas, degree, period, body)
select 3, d, p,
  'La situation de {{prenom}} est préoccupante ce trimestre. {{#if matieres_echec}}{{il_elle}} est en échec dans : {{matieres_echec}}. {{/if}}{{#if matieres_difficulte}}{{il_elle}} rencontre également des difficultés en : {{matieres_difficulte}}. {{/if}}{{#if competences}}Sur le plan des compétences transversales : {{competences}}. {{/if}}{{#if freins}}{{freins}} {{/if}}{{#if conseils}}{{conseils}}{{/if}}{{#if suivi}}{{suivi}}{{/if}}'
from unnest(array['D1', 'D2', 'D3']) d, unnest(array['P1', 'P2', 'P3']) p
on conflict (cas, degree, period) do nothing;

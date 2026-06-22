-- Données par défaut pour l'outil de bulletin. Tout est modifiable ensuite
-- depuis la page "Réglages" de l'application.

-- Matières par degré -------------------------------------------------------

insert into public.subjects (degree, name, position) values
  ('D1', 'Art', 1),
  ('D1', 'Citoyenneté', 2),
  ('D1', 'EPS', 3),
  ('D1', 'Français', 4),
  ('D1', 'Mathématiques', 5),
  ('D1', 'Néerlandais', 6),
  ('D1', 'Sciences', 7),
  ('D2', 'Anglais', 1),
  ('D2', 'Biologie', 2),
  ('D2', 'Chimie', 3),
  ('D2', 'EPS', 4),
  ('D2', 'Espagnol', 5),
  ('D2', 'Français', 6),
  ('D2', 'Géographie', 7),
  ('D2', 'Histoire', 8),
  ('D2', 'Mathématiques', 9),
  ('D2', 'Néerlandais', 10),
  ('D2', 'Physique', 11),
  ('D3', 'Anglais', 1),
  ('D3', 'Biologie', 2),
  ('D3', 'Chimie', 3),
  ('D3', 'EPS', 4),
  ('D3', 'Espagnol', 5),
  ('D3', 'Français', 6),
  ('D3', 'Géographie', 7),
  ('D3', 'Histoire', 8),
  ('D3', 'Mathématiques', 9),
  ('D3', 'Néerlandais', 10),
  ('D3', 'Physique', 11)
on conflict (degree, name) do nothing;

-- Compétences transversales par degré ---------------------------------------

insert into public.competencies (degree, name, position) values
  ('D1', 'Application', 1),
  ('D1', 'Autonomie', 2),
  ('D1', 'Communication', 3),
  ('D1', 'Consignes', 4),
  ('D1', 'Justification', 5),
  ('D1', 'Recherche', 6),
  ('D1', 'Restitution', 7),
  ('D1', 'Sélection d''information', 8),
  ('D1', 'Transfert', 9),
  ('D2', 'Application', 1),
  ('D2', 'Argumentation', 2),
  ('D2', 'Autonomie', 3),
  ('D2', 'Communication', 4),
  ('D2', 'Consignes', 5),
  ('D2', 'Justification', 6),
  ('D2', 'Recherche', 7),
  ('D2', 'Restitution', 8),
  ('D2', 'Sélection d''information', 9),
  ('D2', 'Synthèse', 10),
  ('D2', 'Transfert', 11),
  ('D3', 'Application', 1),
  ('D3', 'Argumentation', 2),
  ('D3', 'Autonomie', 3),
  ('D3', 'Communication', 4),
  ('D3', 'Consignes', 5),
  ('D3', 'Justification', 6),
  ('D3', 'Recherche', 7),
  ('D3', 'Restitution', 8),
  ('D3', 'Sélection d''information', 9),
  ('D3', 'Synthèse', 10),
  ('D3', 'Transfert', 11)
on conflict (degree, name) do nothing;

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
-- {{conseils}} {{suivi}} — et blocs conditionnels {{#if variable}}...{{/if}}

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

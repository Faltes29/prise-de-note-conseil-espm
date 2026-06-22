# Bulletin ESPM

Outil de prise de notes pendant les conseils de classe de l'ESPM. Pour chaque
élève discuté, l'enseignant coche les matières en échec/difficulté, les
compétences transversales problématiques, les forces/faiblesses en travail
autonome (TA). L'outil génère automatiquement le texte du bulletin (via des
templates configurables) ainsi qu'un prompt prêt à coller dans une IA pour
correction grammaticale.

## Stack

- Next.js 14 (App Router, Server Actions) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security)

## Pages

- `/notes` — page principale de prise de notes : sélection année → classe →
  élève, encodage des matières/compétences/TA, choix du cas, champs libres,
  génération automatique du commentaire et du prompt IA, navigation entre
  élèves avec enregistrement automatique.
- `/eleves` — vue synthèse par classe/période : statut de chaque élève,
  export/impression.
- `/reglages` — configuration : classes, import CSV de la base d'élèves,
  matières et compétences par degré, personnes ressources, statuts, et
  templates de commentaire par cas/degré/période.

Tout utilisateur Supabase Auth authentifié a accès à l'ensemble de l'outil
(pas de gestion de rôles : usage mono-établissement pendant les conseils).

## Mise en place de Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Appliquez le schéma, dans l'ordre, via l'éditeur SQL du dashboard Supabase :
   - `supabase/migrations/0001_init.sql` (si ce n'est pas déjà fait)
   - `supabase/migrations/0002_bulletin_tool.sql` (remplace le schéma par celui
     de l'outil de bulletin — supprime les anciennes tables votes/décisions)
   - `supabase/seed.sql` (matières, compétences, personnes ressources,
     statuts et templates par défaut)
3. Récupérez `Project URL` et `anon public key` dans
   *Project Settings > API* et reportez-les dans `.env.local` (voir
   `.env.example`).
4. Créez votre compte (via la page `/login` après avoir activé "Email" dans
   *Authentication > Providers*, ou via *Authentication > Users > Add user*
   dans le dashboard).

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseignez les valeurs Supabase
npm run dev
```

L'application est servie sur http://localhost:3000.

## Schéma de données

- `profiles` — utilisateurs applicatifs (liés à `auth.users`).
- `classes`, `students` — classes (nom + année 1-6) et élèves (nom, prénom,
  sexe).
- `subjects`, `competencies` — matières et compétences transversales,
  propres à chaque degré (D1 = années 1-2, D2 = années 3-4, D3 = années 5-6).
- `resource_persons` — personnes/rôles pour le suivi ("Devra être vu par...").
- `task_statuses` — statuts d'avancement de l'encodage (To-Do, Fait, ...).
- `templates` — texte du bulletin par cas (1/2/3) × degré × période
  (P1/P2/P3), avec balises `{{variable}}` et blocs `{{#if variable}}...{{/if}}`.
- `student_encodings` — l'encodage d'un élève pour une période donnée :
  matières (échec/difficulté/NE), compétences cochées, TA (force/faiblesse),
  champs libres (freins/forces/conseils), suivi, statut, et le commentaire
  généré.

Toutes les tables sont protégées par des politiques RLS limitées à
`auth.uid() is not null` (accès complet pour tout utilisateur connecté).

## Génération du commentaire et du prompt IA

Le texte du bulletin est assemblé côté client (`lib/template.ts`) à partir du
template correspondant au cas/degré/période sélectionnés, en remplaçant les
balises par les données encodées (listes jointes avec virgules + "et" pour le
dernier élément, accords de genre via `{{il_elle}}`/`{{son_sa}}`/`{{le_la}}`).
Le prompt IA (zone "Prompt IA") encapsule ce texte avec des instructions de
correction grammaticale strictes (pas de reformulation, respect du ton et de
l'ordre, accords de genre, règles de ponctuation des énumérations).

## Import de la base d'élèves

Depuis `/reglages`, onglet "Classes & élèves", chargez un export CSV de votre
fichier Excel avec les colonnes `Nom famille`, `Prénom`, `Sexe`, `Classe`,
`Année scolaire`. Les classes manquantes sont créées automatiquement ; un
réimport ne crée pas de doublons (les élèves sont identifiés par
classe + nom + prénom).

## Export

La page `/eleves` propose une vue tableau filtrable (année, classe, période)
avec un bouton « Exporter / Imprimer » qui s'appuie sur la fonction
d'impression du navigateur (sélectionnez « Enregistrer au format PDF »).

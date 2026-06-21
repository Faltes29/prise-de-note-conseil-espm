# Conseil de classe

Outil de prise de notes pour les conseils de classe : gestion des classes et
des élèves, prise de notes par les enseignants (matière, comportement,
général), propositions de décisions, votes, et export PDF pour la séance.

## Stack

- Next.js 14 (App Router, Server Actions) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security)

## Rôles

- **enseignant** : voit et édite les notes des classes qui lui sont assignées,
  propose des décisions, vote.
- **direction** : voit et gère toutes les classes, élèves, sessions,
  affectations ; tranche le statut des décisions.
- **admin** : comme direction, plus gestion des rôles utilisateurs.

Un profil est créé automatiquement (rôle `enseignant` par défaut) à
l'inscription d'un utilisateur Supabase Auth, via le trigger
`handle_new_user`. Passez un utilisateur en `direction`/`admin` depuis la page
`/admin` (avec un premier compte admin créé manuellement dans Supabase, voir
plus bas).

## Mise en place de Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Appliquez le schéma :
   ```bash
   npx supabase login
   npx supabase link --project-ref <votre-ref-projet>
   npx supabase db push
   ```
   ou collez le contenu de `supabase/migrations/0001_init.sql` (puis
   `supabase/seed.sql` si besoin) dans l'éditeur SQL du dashboard Supabase.
3. Récupérez `Project URL` et `anon public key` dans
   *Project Settings > API* et reportez-les dans `.env.local` (voir
   `.env.example`).
4. Créez votre premier compte (via la page `/login` après avoir activé
   "Email" dans *Authentication > Providers*, ou via *Authentication > Users
   > Add user* dans le dashboard), puis passez son rôle à `admin` directement
   en base :
   ```sql
   update public.profiles set role = 'admin' where id = '<uuid-utilisateur>';
   ```

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseignez les valeurs Supabase
npm run dev
```

L'application est servie sur http://localhost:3000.

## Schéma de données

- `profiles` — utilisateurs applicatifs (liés à `auth.users`), avec rôle.
- `classes`, `students` — classes et élèves.
- `subjects` — matières.
- `class_teachers` — affectation des enseignants aux classes (par matière).
- `council_sessions` — une séance de conseil de classe par classe/date.
- `notes` — notes prises pendant une séance, par élève/catégorie/auteur.
- `decisions`, `votes` — décisions proposées pendant une séance et votes des
  participants.

Toutes les tables sont protégées par des politiques RLS : un enseignant ne
voit que les classes qui lui sont assignées (table `class_teachers`) ; la
direction et les admins voient tout.

## Export PDF

La page `/classes/[classId]/sessions/[sessionId]/export` propose une vue
imprimable de la séance (notes + décisions par élève). Utilisez le bouton
« Imprimer / Enregistrer en PDF », qui s'appuie sur la fonction d'impression
du navigateur (sélectionnez « Enregistrer au format PDF » comme imprimante).

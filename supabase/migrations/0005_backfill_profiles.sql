-- Recrée les profils manquants pour les comptes existants. La migration
-- 0002 avait recréé la table public.profiles, ce qui a effacé les profils
-- des comptes créés avant cette date ; le trigger handle_new_user ne se
-- déclenche que sur une nouvelle inscription, pas rétroactivement.

insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', u.email)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Capitaine — schéma Supabase
-- À coller dans : Supabase → SQL Editor → New query → Run
--
-- Modèle : un seul document partagé (une ligne JSON) que les deux comptes
-- lisent et écrivent. L'accès est restreint à une liste d'emails autorisés.

-- 1. Table du document partagé
create table if not exists public.household (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Sécurité au niveau des lignes
alter table public.household enable row level security;

-- 3. Liste des comptes autorisés (Julien + Auriane)
create or replace function public.is_member() returns boolean
language sql stable as $$
  select (auth.jwt() ->> 'email') in (
    'julien.chamboeuf@gmail.com',
    'plague.auriane@gmail.com'
  )
$$;

-- 4. Politiques : seuls les membres peuvent lire/écrire
drop policy if exists "members select" on public.household;
create policy "members select" on public.household
  for select using (public.is_member());

drop policy if exists "members insert" on public.household;
create policy "members insert" on public.household
  for insert with check (public.is_member());

drop policy if exists "members update" on public.household;
create policy "members update" on public.household
  for update using (public.is_member()) with check (public.is_member());

-- 5. Activer le temps réel (pour que les changements de l'un apparaissent chez l'autre)
alter publication supabase_realtime add table public.household;

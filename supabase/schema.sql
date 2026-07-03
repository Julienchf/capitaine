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

-- 3. Liste des comptes autorisés — remplace par les emails réels
create or replace function public.is_member() returns boolean
language sql stable as $$
  select (auth.jwt() ->> 'email') in (
    'proprietaire-1@exemple.com',
    'proprietaire-2@exemple.com'
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

-- 6. Lien de partage public (fiche en lecture seule pour la dogsitter)
create table if not exists public.shares (
  id uuid primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.shares enable row level security;

-- Lecture publique : quiconque possède le lien (l'id UUID, non devinable) peut lire.
drop policy if exists "public read shares" on public.shares;
create policy "public read shares" on public.shares
  for select using (true);

-- Écriture (créer / mettre à jour / supprimer) réservée aux membres.
drop policy if exists "members write shares" on public.shares;
create policy "members write shares" on public.shares
  for all using (public.is_member()) with check (public.is_member());

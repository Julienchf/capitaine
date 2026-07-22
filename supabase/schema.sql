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

-- 7. Historique de versions (filet de sécurité anti-perte de données)
-- À chaque sauvegarde, l'app dépose ici un instantané horodaté et ne garde
-- que les plus récents. Permet de restaurer une version antérieure d'un clic.
create table if not exists public.household_history (
  id bigint generated always as identity primary key,
  household_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists household_history_by_time
  on public.household_history (household_id, created_at desc);

alter table public.household_history enable row level security;

drop policy if exists "members read history" on public.household_history;
create policy "members read history" on public.household_history
  for select using (public.is_member());

drop policy if exists "members insert history" on public.household_history;
create policy "members insert history" on public.household_history
  for insert with check (public.is_member());

drop policy if exists "members delete history" on public.household_history;
create policy "members delete history" on public.household_history
  for delete using (public.is_member());

-- 8. Stockage des pièces jointes (factures, ordonnances, photos)
-- Les fichiers vivent dans Storage ; le document ne garde qu'un lien léger.
insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', true)
  on conflict (id) do nothing;

-- Lecture publique (les URL sont aléatoires et non devinables — comme le lien de partage).
drop policy if exists "public read attachments" on storage.objects;
create policy "public read attachments" on storage.objects
  for select using (bucket_id = 'attachments');

-- Écriture réservée aux membres connectés.
drop policy if exists "members upload attachments" on storage.objects;
create policy "members upload attachments" on storage.objects
  for insert with check (bucket_id = 'attachments' and public.is_member());

drop policy if exists "members update attachments" on storage.objects;
create policy "members update attachments" on storage.objects
  for update using (bucket_id = 'attachments' and public.is_member());

drop policy if exists "members delete attachments" on storage.objects;
create policy "members delete attachments" on storage.objects
  for delete using (bucket_id = 'attachments' and public.is_member());

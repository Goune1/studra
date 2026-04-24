-- Ajout is_public aux tables existantes
alter table public.decks add column if not exists is_public boolean not null default false;
alter table public.fiches add column if not exists is_public boolean not null default false;

-- Schémas explicatifs
create table public.schemas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  source_content text not null,
  generated_data jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Frises chronologiques
create table public.timelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  source_content text not null,
  generated_data jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.schemas enable row level security;
alter table public.timelines enable row level security;

create policy "Users can CRUD own schemas" on public.schemas for all using (auth.uid() = user_id);
create policy "Pro users can view public schemas" on public.schemas for select using (
  is_public = true
  and exists (select 1 from public.profiles where id = auth.uid() and plan = 'pro')
);

create policy "Users can CRUD own timelines" on public.timelines for all using (auth.uid() = user_id);
create policy "Pro users can view public timelines" on public.timelines for select using (
  is_public = true
  and exists (select 1 from public.profiles where id = auth.uid() and plan = 'pro')
);

create policy "Pro users can view public decks" on public.decks for select using (
  is_public = true
  and exists (select 1 from public.profiles where id = auth.uid() and plan = 'pro')
);
create policy "Pro users can view public fiches" on public.fiches for select using (
  is_public = true
  and exists (select 1 from public.profiles where id = auth.uid() and plan = 'pro')
);
create policy "Pro users can view public flashcards" on public.flashcards for select using (
  deck_id in (select id from public.decks where is_public = true)
  and exists (select 1 from public.profiles where id = auth.uid() and plan = 'pro')
);

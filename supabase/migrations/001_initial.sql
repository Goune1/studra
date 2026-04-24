-- Profils utilisateurs (étend auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  lemon_squeezy_customer_id text,
  lemon_squeezy_subscription_id text,
  generations_used_this_month int not null default 0,
  generations_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Decks de flashcards
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  source_content text not null,
  card_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Flashcards individuelles
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.decks(id) on delete cascade not null,
  question text not null,
  answer text not null,
  difficulty int default 0,
  times_reviewed int default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Fiches de révision
create table public.fiches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  source_content text not null,
  generated_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.fiches enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can CRUD own decks" on public.decks for all using (auth.uid() = user_id);
create policy "Users can CRUD own flashcards" on public.flashcards for all using (
  deck_id in (select id from public.decks where user_id = auth.uid())
);
create policy "Users can CRUD own fiches" on public.fiches for all using (auth.uid() = user_id);

-- Trigger pour créer un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table pronote_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instance_url text not null,
  username text not null,
  account_kind text not null default 'student',
  refresh_token text not null,
  device_uuid text not null,
  raw_data jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un seul compte Pronote par utilisateur Studra
create unique index pronote_connections_user_id_idx on pronote_connections(user_id);

-- RLS : chaque utilisateur n'accede qu'a sa propre connexion
alter table pronote_connections enable row level security;

create policy "Users can manage their own pronote connection"
  on pronote_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.tage_mage_goals (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  target_score int check (target_score between 0 and 600),
  exam_date date,
  weekly_minutes int check (weekly_minutes between 15 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tage_mage_diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_version int not null,
  answers jsonb not null,
  section_results jsonb not null,
  correct_count int not null check (correct_count between 0 and 24),
  total_questions int not null default 24,
  duration_seconds int not null check (duration_seconds >= 0),
  completed_at timestamptz not null default now()
);

alter table public.tage_mage_goals enable row level security;
alter table public.tage_mage_diagnostic_attempts enable row level security;

create policy "Users can view own TAGE MAGE goals"
  on public.tage_mage_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own TAGE MAGE goals"
  on public.tage_mage_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own TAGE MAGE goals"
  on public.tage_mage_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view own TAGE MAGE diagnostic attempts"
  on public.tage_mage_diagnostic_attempts for select
  using (auth.uid() = user_id);

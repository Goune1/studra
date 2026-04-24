-- ── Feynman sessions ──────────────────────────────────────────────
create table public.feynman_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_title text not null,
  source_content text not null,
  messages jsonb not null default '[]',
  diagnosis jsonb,
  created_at timestamptz not null default now()
);

-- ── Free recall sessions ───────────────────────────────────────────
create table public.free_recall_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_title text not null,
  source_content text not null,
  duration_seconds int not null,
  user_text text not null default '',
  evaluation jsonb,
  score int,
  created_at timestamptz not null default now()
);

-- ── Exam templates (uploaded annales) ────────────────────────────
create table public.exam_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  source_text text not null,
  detected_style jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Generated past exams (from templates + course content) ───────
create table public.generated_past_exams (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.exam_templates(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  source_content text not null,
  questions_json jsonb not null default '[]',
  answers_json jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ── Study plans ───────────────────────────────────────────────────
create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  exam_date date not null,
  available_minutes_per_day int not null default 60,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ── Study plan tasks ──────────────────────────────────────────────
create table public.study_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.study_plans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  scheduled_date date not null,
  task_type text not null, -- 'flashcards' | 'fiche' | 'exam' | 'review' | 'general_review'
  content_ref uuid,
  content_title text not null,
  duration_minutes int not null default 20,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────
alter table public.feynman_sessions enable row level security;
alter table public.free_recall_sessions enable row level security;
alter table public.exam_templates enable row level security;
alter table public.generated_past_exams enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_plan_tasks enable row level security;

create policy "Users can CRUD own feynman sessions"
  on public.feynman_sessions for all using (auth.uid() = user_id);

create policy "Users can CRUD own free recall sessions"
  on public.free_recall_sessions for all using (auth.uid() = user_id);

create policy "Users can CRUD own exam templates"
  on public.exam_templates for all using (auth.uid() = user_id);

create policy "Users can CRUD own generated past exams"
  on public.generated_past_exams for all using (auth.uid() = user_id);

create policy "Users can CRUD own study plans"
  on public.study_plans for all using (auth.uid() = user_id);

create policy "Users can CRUD own study plan tasks"
  on public.study_plan_tasks for all using (auth.uid() = user_id);

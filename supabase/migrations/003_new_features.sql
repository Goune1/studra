-- Exams table
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  source_content text not null,
  questions jsonb not null default '[]',
  language text not null default 'fr',
  created_at timestamptz not null default now()
);

-- Exam sessions (one per attempt)
create table public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  answers jsonb not null default '[]',
  score int not null default 0,
  total_questions int not null default 0,
  completed_at timestamptz not null default now()
);

-- Flashcard reviews for lacune detection
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid references public.flashcards(id) on delete cascade not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  knew boolean not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.exams enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.flashcard_reviews enable row level security;

create policy "Users can CRUD own exams" on public.exams for all using (auth.uid() = user_id);
create policy "Users can CRUD own exam sessions" on public.exam_sessions for all using (auth.uid() = user_id);
create policy "Users can CRUD own flashcard reviews" on public.flashcard_reviews for all using (auth.uid() = user_id);

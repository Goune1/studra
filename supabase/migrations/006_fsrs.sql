-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006 : FSRS (Free Spaced Repetition Scheduler)
-- Ajoute les colonnes FSRS sur flashcards, enrichit flashcard_reviews,
-- crée user_fsrs_settings.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Nouvelles colonnes FSRS sur flashcards ────────────────────────────────
alter table public.flashcards
  add column if not exists fsrs_difficulty     real,
  add column if not exists fsrs_stability      real,
  add column if not exists fsrs_due            timestamptz,
  add column if not exists fsrs_last_review    timestamptz,
  add column if not exists fsrs_state          smallint  not null default 0,
  add column if not exists fsrs_reps           integer   not null default 0,
  add column if not exists fsrs_lapses         integer   not null default 0,
  add column if not exists fsrs_elapsed_days   integer   not null default 0,
  add column if not exists fsrs_scheduled_days integer   not null default 0,
  add column if not exists fsrs_learning_steps integer   not null default 0;

-- Index pour les requêtes "cartes dues" (filtre par deck_id, suit la RLS)
create index if not exists idx_flashcards_fsrs_due
  on public.flashcards (deck_id, fsrs_due nulls first);

create index if not exists idx_flashcards_fsrs_state
  on public.flashcards (deck_id, fsrs_state);

-- ── 2. Enrichissement de flashcard_reviews ───────────────────────────────────
-- Option A : on garde l'existant et on ajoute les colonnes FSRS.
-- `knew` reste renseigné pour la compatibilité avec l'analyse des lacunes.
alter table public.flashcard_reviews
  add column if not exists rating              smallint,
  add column if not exists state_before        smallint,
  add column if not exists elapsed_days        integer,
  add column if not exists scheduled_days      integer,
  add column if not exists review_duration_ms  integer;

-- Backfill : knew=true → rating=3 (Good), knew=false → rating=1 (Again)
update public.flashcard_reviews
  set rating = case when knew then 3 else 1 end
  where rating is null;

-- ── 3. Table user_fsrs_settings ──────────────────────────────────────────────
create table if not exists public.user_fsrs_settings (
  user_id                           uuid        primary key
                                                references auth.users(id) on delete cascade,
  w                                 jsonb,           -- 21 floats ; null = paramètres par défaut
  desired_retention                 real        not null default 0.9
                                                check (desired_retention between 0.7 and 0.98),
  maximum_interval                  integer     not null default 36500,
  last_optimization_at              timestamptz,
  review_count_at_last_optimization integer     not null default 0,
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now()
);

alter table public.user_fsrs_settings enable row level security;

create policy "Users can manage own fsrs settings"
  on public.user_fsrs_settings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

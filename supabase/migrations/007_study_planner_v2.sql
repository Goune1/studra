-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007 : Study Planner v2
-- - Enrichit study_plans (mastery_levels, strategy_notes, completed_at, updated_at)
-- - Enrichit study_plan_tasks en "sessions" avec lifecycle (status, started_at),
--   content_refs jsonb (multi-sources), session_position, rationale, updated_at
-- - Ajoute indexes composites et durcit les policies RLS (with check)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. study_plans ───────────────────────────────────────────────────────────
alter table public.study_plans
  add column if not exists mastery_levels jsonb       not null default '{}'::jsonb,
  add column if not exists strategy_notes text,
  add column if not exists completed_at   timestamptz,
  add column if not exists updated_at     timestamptz not null default now();

-- ── 2. study_plan_tasks (treated as "sessions") ──────────────────────────────
alter table public.study_plan_tasks
  add column if not exists status           text        not null default 'pending',
  add column if not exists content_refs     jsonb       not null default '[]'::jsonb,
  add column if not exists session_position int         not null default 0,
  add column if not exists rationale        text,
  add column if not exists started_at       timestamptz,
  add column if not exists updated_at       timestamptz not null default now();

alter table public.study_plan_tasks
  drop constraint if exists study_plan_tasks_status_check;
alter table public.study_plan_tasks
  add  constraint study_plan_tasks_status_check
  check (status in ('pending','in_progress','completed','postponed','skipped'));

-- ── 3. Backfill ──────────────────────────────────────────────────────────────
-- status : completed si completed_at renseigné
update public.study_plan_tasks
   set status = 'completed'
 where completed_at is not null
   and status = 'pending';

-- content_refs : migrer l'ancien content_ref mono-item en tableau.
-- Pour les sessions de révision, on devine le type réel en regardant si
-- content_ref correspond à un deck (sinon fiche par défaut).
update public.study_plan_tasks t
   set content_refs = jsonb_build_array(
         jsonb_build_object(
           'id',    t.content_ref::text,
           'title', t.content_title,
           'type',  case
                      when t.task_type = 'flashcards' then 'deck'
                      when t.task_type = 'fiche' then 'fiche'
                      when exists (select 1 from public.decks d where d.id = t.content_ref) then 'deck'
                      else 'fiche'
                    end
         )
       )
 where t.content_ref is not null
   and t.content_refs = '[]'::jsonb;

-- ── 4. Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_study_plan_tasks_plan_date
  on public.study_plan_tasks (plan_id, scheduled_date, session_position);

create index if not exists idx_study_plan_tasks_user_date_status
  on public.study_plan_tasks (user_id, scheduled_date, status);

create index if not exists idx_study_plans_user_status
  on public.study_plans (user_id, status);

-- ── 5. RLS durcie (with check) ───────────────────────────────────────────────
drop policy if exists "Users can CRUD own study plans" on public.study_plans;
create policy "Users can CRUD own study plans"
  on public.study_plans for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can CRUD own study plan tasks" on public.study_plan_tasks;
create policy "Users can CRUD own study plan tasks"
  on public.study_plan_tasks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

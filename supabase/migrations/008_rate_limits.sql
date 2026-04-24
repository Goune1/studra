-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008 : Rate limiting
-- Table + atomic function pour limiter les endpoints sensibles (register,
-- génération IA, extraction PDF/YouTube, Socrate). Pas de dépendance externe.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.api_rate_limits (
  identifier      text        not null,
  endpoint        text        not null,
  window_start    timestamptz not null,
  hit_count       integer     not null default 0,
  primary key (identifier, endpoint, window_start)
);

create index if not exists api_rate_limits_window_idx
  on public.api_rate_limits (window_start);

alter table public.api_rate_limits enable row level security;
-- Aucune policy : seul le service_role (via la fonction security definer) écrit.

-- Fonction atomique : renvoie true si l'appel est dans le quota, sinon false.
create or replace function public.check_rate_limit(
  p_identifier     text,
  p_endpoint       text,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count        integer;
begin
  v_window_start := date_trunc('second', now())
                  - (extract(epoch from now())::bigint % p_window_seconds) * interval '1 second';

  insert into public.api_rate_limits as r (identifier, endpoint, window_start, hit_count)
  values (p_identifier, p_endpoint, v_window_start, 1)
  on conflict (identifier, endpoint, window_start)
    do update set hit_count = r.hit_count + 1
  returning hit_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer) to authenticated, anon, service_role;

-- Purge des fenêtres > 24h (à brancher sur pg_cron si dispo).
create or replace function public.purge_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.api_rate_limits
  where window_start < now() - interval '24 hours';
$$;

revoke all on function public.purge_rate_limits() from public;
grant execute on function public.purge_rate_limits() to service_role;

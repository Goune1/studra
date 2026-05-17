-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009 : Module email marketing admin
-- Ajoute marketing_consent sur profiles + table des campagnes email.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Consentement marketing sur les profils (opt-in explicite, défaut false)
alter table public.profiles
  add column if not exists marketing_consent boolean not null default false;

-- 2. Table des campagnes email marketing
create table public.marketing_email_campaigns (
  id                uuid        primary key default gen_random_uuid(),
  created_by        uuid        references auth.users(id) not null,
  subject           text        not null default '',
  html_body         text        not null default '',
  -- Historique user/assistant pour itération conversationnelle avec OpenAI
  -- Format : [{"role":"user","content":"..."},{"role":"assistant","content":"..."}]
  prompt_history    jsonb       not null default '[]'::jsonb,
  status            text        not null default 'draft'
                    check (status in ('draft', 'sending', 'sent', 'failed')),
  -- Format : {"mode":"all"|"plan"|"custom_ids","plan":"free"|"pro"|null,"ids":[]|null}
  recipient_filter  jsonb       not null default '{"mode":"all"}'::jsonb,
  recipient_count   integer,
  sent_count        integer     not null default 0,
  failed_count      integer     not null default 0,
  -- Log des erreurs d'envoi : [{"email":"...","error":"..."}]
  error_log         jsonb       not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  sent_at           timestamptz
);

-- RLS : aucune policy = accès uniquement via service_role key (utilisé dans les routes /api/admin/emails/*)
-- Les routes API vérifient l'admin via ADMIN_EMAIL env var avant toute opération.
alter table public.marketing_email_campaigns enable row level security;

-- Index pour les requêtes fréquentes
create index on public.marketing_email_campaigns (created_by);
create index on public.marketing_email_campaigns (status);
create index on public.marketing_email_campaigns (created_at desc);
create index on public.marketing_email_campaigns (sent_at desc) where sent_at is not null;

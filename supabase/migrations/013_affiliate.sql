-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 013: système d'affiliation complet
-- ─────────────────────────────────────────────────────────────────────────────

-- Configuration globale du programme (singleton, id = 1)
create table public.affiliate_settings (
  id        int primary key default 1 check (id = 1),
  minimum_payout_threshold numeric(10,2) not null default 10.00,
  default_commission_rate  numeric(5,2)  not null default 20.00,
  updated_at timestamptz not null default now()
);

insert into public.affiliate_settings (id, minimum_payout_threshold, default_commission_rate)
values (1, 10.00, 20.00);

-- Profils affiliés
create table public.affiliates (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete cascade not null unique,
  referral_code       text not null unique,
  commission_rate     numeric(5,2) not null default 20.00,
  status              text not null default 'active' check (status in ('active', 'suspended')),
  -- identité
  first_name          text not null,
  last_name           text not null,
  contact_email       text not null,
  -- moyen de paiement
  payment_method      text check (payment_method in ('paypal', 'bank_transfer')),
  paypal_email        text,
  iban                text,
  bic                 text,
  account_holder_name text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Clics sur les liens de parrainage
create table public.affiliate_clicks (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete cascade not null,
  visitor_id   text,
  ip_hash      text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

-- Relation permanente utilisateur → affilié (first-touch, non modifiable)
create table public.affiliate_referrals (
  id               uuid primary key default gen_random_uuid(),
  affiliate_id     uuid references public.affiliates(id) on delete restrict not null,
  referred_user_id uuid references public.profiles(id) on delete restrict not null unique,
  created_at       timestamptz not null default now()
);

-- Versements aux affiliés (créé avant commissions pour éviter la dépendance circulaire)
create table public.affiliate_payouts (
  id               uuid primary key default gen_random_uuid(),
  affiliate_id     uuid references public.affiliates(id) on delete restrict not null,
  amount           numeric(10,2) not null,
  payment_method   text not null check (payment_method in ('paypal', 'bank_transfer', 'other')),
  payment_reference text,
  status           text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- Commissions générées à chaque paiement Stripe
create table public.affiliate_commissions (
  id                    uuid primary key default gen_random_uuid(),
  affiliate_id          uuid references public.affiliates(id) on delete restrict not null,
  referred_user_id      uuid references public.profiles(id) on delete restrict not null,
  stripe_invoice_id     text not null unique, -- clé d'idempotence
  stripe_subscription_id text,
  amount_revenue        numeric(10,2) not null,
  amount_commission     numeric(10,2) not null,
  status                text not null default 'pending'
    check (status in ('pending', 'approved', 'payable', 'paid', 'cancelled', 'refunded')),
  payout_id             uuid references public.affiliate_payouts(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Index ──────────────────────────────────────────────────────────────────────
create index on public.affiliates (referral_code);
create index on public.affiliates (status);
create index on public.affiliate_clicks (affiliate_id);
create index on public.affiliate_clicks (created_at);
create index on public.affiliate_referrals (affiliate_id);
create index on public.affiliate_referrals (referred_user_id);
create index on public.affiliate_commissions (affiliate_id);
create index on public.affiliate_commissions (referred_user_id);
create index on public.affiliate_commissions (status);
create index on public.affiliate_commissions (payout_id);
create index on public.affiliate_payouts (affiliate_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.affiliates          enable row level security;
alter table public.affiliate_clicks    enable row level security;
alter table public.affiliate_referrals enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_payouts   enable row level security;
alter table public.affiliate_settings  enable row level security;

-- affiliate_settings : lecture publique (pas de données sensibles)
create policy "Public can read settings"
  on public.affiliate_settings for select using (true);

-- affiliates : chaque affilié voit et modifie son propre profil
create policy "Affiliates can view own profile"
  on public.affiliates for select using (auth.uid() = user_id);

create policy "Affiliates can update own profile"
  on public.affiliates for update using (auth.uid() = user_id);

create policy "Authenticated users can insert own affiliate"
  on public.affiliates for insert with check (auth.uid() = user_id);

-- affiliate_clicks : l'affilié voit ses propres clics
create policy "Affiliates can view own clicks"
  on public.affiliate_clicks for select
  using (affiliate_id in (select id from public.affiliates where user_id = auth.uid()));

-- affiliate_referrals : l'affilié voit ses propres referrals
create policy "Affiliates can view own referrals"
  on public.affiliate_referrals for select
  using (affiliate_id in (select id from public.affiliates where user_id = auth.uid()));

-- affiliate_commissions : l'affilié voit ses propres commissions
create policy "Affiliates can view own commissions"
  on public.affiliate_commissions for select
  using (affiliate_id in (select id from public.affiliates where user_id = auth.uid()));

-- affiliate_payouts : l'affilié voit ses propres paiements
create policy "Affiliates can view own payouts"
  on public.affiliate_payouts for select
  using (affiliate_id in (select id from public.affiliates where user_id = auth.uid()));

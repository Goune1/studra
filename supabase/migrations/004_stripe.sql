-- Migrate from LemonSqueezy columns to Stripe columns
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table public.profiles
  drop column if exists lemon_squeezy_customer_id,
  drop column if exists lemon_squeezy_subscription_id;

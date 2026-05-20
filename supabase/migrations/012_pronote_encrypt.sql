-- V-04: store encrypted Pronote raw_data as text after application backfill.
-- Order:
-- 1. Deploy code that can read legacy plaintext and encrypted values.
-- 2. Run `npx tsx scripts/encrypt-pronote-backfill.ts`.
-- 3. Apply this migration.

alter table public.pronote_connections
  alter column raw_data type text
  using (
    case
      when raw_data is null then null
      when jsonb_typeof(raw_data) = 'string' then raw_data #>> '{}'
      else raw_data::text
    end
  );

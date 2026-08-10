-- Persist the interface locale selected by an authenticated user.
-- Nullable keeps Accept-Language and NEXT_LOCALE effective until the first choice.
alter table public.profiles
  add column if not exists preferred_locale text
  check (preferred_locale is null or preferred_locale in ('fr', 'en', 'es', 'pt', 'de', 'it'));

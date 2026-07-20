-- =================================================================
-- 0002_rls_policies.sql
-- Row-level security. Each user can only see/modify their own rows.
-- The service role key bypasses RLS — only used by trusted server
-- code (cron, AI proxy) that has already authorised the caller.
-- =================================================================

alter table public.profiles         enable row level security;
alter table public.watchlist        enable row level security;
alter table public.alerts           enable row level security;
alter table public.holdings         enable row level security;
alter table public.futures_positions enable row level security;
alter table public.notes            enable row level security;
alter table public.ai_usage         enable row level security;

-- ----- PROFILES -----
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ----- WATCHLIST -----
drop policy if exists "watchlist_all_own" on public.watchlist;
create policy "watchlist_all_own" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- ALERTS -----
drop policy if exists "alerts_all_own" on public.alerts;
create policy "alerts_all_own" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- HOLDINGS -----
drop policy if exists "holdings_all_own" on public.holdings;
create policy "holdings_all_own" on public.holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- FUTURES -----
drop policy if exists "futures_all_own" on public.futures_positions;
create policy "futures_all_own" on public.futures_positions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- NOTES -----
drop policy if exists "notes_all_own" on public.notes;
create policy "notes_all_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- AI USAGE (read-only for the user) -----
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using (auth.uid() = user_id);

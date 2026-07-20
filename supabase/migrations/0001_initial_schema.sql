-- =================================================================
-- 0001_initial_schema.sql
-- Initial tables for CryptoWatch Pro. Run via the Supabase SQL
-- editor, or `supabase db push` from the CLI. Idempotent.
-- =================================================================

-- ----- USERS -----
-- Supabase's auth.users is the source of truth. We mirror a tiny
-- profile row keyed by the auth user id for public fields only
-- (display name, preferences). The id is FK'd to auth.users so
-- the row is auto-deleted when the auth user is removed.

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  email_alerts  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----- WATCHLIST -----
create table if not exists public.watchlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  symbol      text not null,                    -- e.g. "BTCUSDT"
  market_type text not null default 'spot'      -- 'spot' | 'futures'
                check (market_type in ('spot','futures')),
  note        text,
  created_at  timestamptz not null default now(),
  unique (user_id, symbol, market_type)
);
create index if not exists watchlist_user_id_idx on public.watchlist (user_id);

-- ----- ALERTS -----
create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  symbol        text not null,
  market_type   text not null default 'spot'
                  check (market_type in ('spot','futures')),
  condition     text not null                   -- 'above' | 'below' | 'pct_change'
                  check (condition in ('above','below','pct_change')),
  threshold     numeric(20, 8) not null,
  pct_window    text,                           -- for pct_change: '1h' | '24h' | '7d'
  active        boolean not null default true,
  triggered_at  timestamptz,
  triggered_price numeric(20, 8),
  delivery      text not null default 'toast+email'
                  check (delivery in ('toast','email','toast+email')),
  created_at    timestamptz not null default now()
);
create index if not exists alerts_user_id_idx   on public.alerts (user_id);
create index if not exists alerts_active_idx    on public.alerts (active) where active = true;

-- ----- PORTFOLIO HOLDINGS -----
create table if not exists public.holdings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  symbol        text not null,                  -- e.g. "BTC"
  amount        numeric(28, 12) not null check (amount >= 0),
  cost_basis    numeric(20, 8) not null,        -- avg cost per unit in quote currency
  quote_currency text not null default 'USDT',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists holdings_user_id_idx on public.holdings (user_id);

-- ----- FUTURES POSITIONS -----
create table if not exists public.futures_positions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  symbol          text not null,
  side            text not null check (side in ('long','short')),
  leverage        numeric(8, 2) not null check (leverage > 0),
  entry_price     numeric(20, 8) not null,
  mark_price      numeric(20, 8),
  size            numeric(28, 12) not null,         -- in base asset
  margin          numeric(20, 8),
  liquidation     numeric(20, 8),
  closed          boolean not null default false,
  closed_at       timestamptz,
  close_price     numeric(20, 8),
  realized_pnl    numeric(20, 8),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists futures_user_id_idx   on public.futures_positions (user_id);
create index if not exists futures_open_idx      on public.futures_positions (user_id) where closed = false;

-- ----- NOTES (TRADE JOURNAL) -----
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  symbol      text not null,                       -- e.g. "BTCUSDT"
  title       text,
  body        text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists notes_user_id_idx   on public.notes (user_id);
create index if not exists notes_symbol_idx    on public.notes (user_id, symbol);
create index if not exists notes_tags_gin      on public.notes using gin (tags);

-- ----- AI USAGE (rate limit + cost visibility) -----
create table if not exists public.ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  symbol      text not null,
  tokens_in   integer,
  tokens_out  integer,
  cost_usd    numeric(10, 6),
  created_at  timestamptz not null default now()
);
create index if not exists ai_usage_user_day_idx
  on public.ai_usage (user_id, created_at desc);

-- =================================================================
-- updated_at trigger
-- =================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_profiles_updated_at   on public.profiles;
drop trigger if exists trg_holdings_updated_at   on public.holdings;
drop trigger if exists trg_futures_updated_at    on public.futures_positions;
drop trigger if exists trg_notes_updated_at      on public.notes;
create trigger trg_profiles_updated_at   before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_holdings_updated_at   before update on public.holdings
  for each row execute function public.touch_updated_at();
create trigger trg_futures_updated_at    before update on public.futures_positions
  for each row execute function public.touch_updated_at();
create trigger trg_notes_updated_at      before update on public.notes
  for each row execute function public.touch_updated_at();

-- =================================================================
-- Auto-create a profile row when a new auth user signs up.
-- =================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

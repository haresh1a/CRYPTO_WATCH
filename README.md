# CryptoWatch Pro

A production-grade crypto market terminal — spot + futures, charts, alerts, portfolio, journal, and AI insights. Upgraded from a single-file prototype into a real Next.js 14 app with a Supabase backend, Vercel hosting, and the things that prototype was missing: auth, persistence, proper API proxying, and a sane place to put the LLM key.

![CryptoWatch Pro screenshot](docs/screenshot.png)

## Features

- **Live markets** — Binance spot + USD-M futures tickers, gainers / losers / watchlist tabs, search.
- **Charts** — TradingView Lightweight Charts. Candles, Heikin Ashi, line; 1m → 1D; MA, EMA, VWAP, Bollinger overlays.
- **Order book + recent trades** — polled every few seconds through our own proxy.
- **Price alerts** — DB-backed, server-checked every 5 min via Vercel Cron, toast + email delivery.
- **Portfolio tracker** — manual holdings, live value, P&L.
- **Futures tracker** — long/short, leverage, est. liquidation, open + closed positions.
- **Notes** — per-asset trade journal with tags.
- **AI insight** — `/api/ai-insight` proxies to Anthropic server-side; the API key never leaves the server. Per-user rate limit.
- **Global market header** — CoinGecko totals, BTC dominance, Fear & Greed index.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router) + React 18 | Server components, route handlers, easy Vercel deploy |
| Styling | Tailwind CSS 3 | Fast dark theme with WCAG-AA-verified contrast |
| Charts | `lightweight-charts` | Same as the prototype, well-maintained |
| Backend | Next.js API routes | One runtime, no extra service |
| DB + Auth | Supabase (Postgres) | Free tier covers most use cases; RLS for safety |
| AI | Anthropic Claude | Server-side only via `/api/ai-insight` |
| Email | Resend | Free tier, single env var |
| Cron | Vercel Cron | Built into the host; we just expose `/api/check-alerts` |
| Tests | Vitest + happy-dom | Matches the Next.js dev loop |

## Quickstart (local)

```bash
git clone https://github.com/sigma-code-op/CRYPTO_WATCH.git
cd CRYPTO_WATCH
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

You need Node 18.17 or newer.

### 1. Create the Supabase project

1. Make a free project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run the files in `supabase/migrations/` in order:
   - `0001_initial_schema.sql` — tables, triggers, auto-profile on signup.
   - `0002_rls_policies.sql` — row-level security.
3. In **Authentication → Providers**, enable:
   - **Email** (built-in).
   - **Google** (optional — set the OAuth client id + secret; set the redirect URL to `${NEXT_PUBLIC_APP_URL}/auth/callback`).
4. In **Settings → API**, copy the **Project URL**, **anon key**, and **service_role key** into `.env.local`.

### 2. Get an Anthropic key (optional but recommended)

1. Sign up at [console.anthropic.com](https://console.anthropic.com).
2. Create an API key. Set it in `.env.local` as `ANTHROPIC_API_KEY`. The model defaults to `claude-3-5-sonnet-latest`; override with `ANTHROPIC_MODEL`.
3. If you skip this, the AI panel falls back to a heuristic summary.

### 3. Email (optional — only if you want email alerts)

1. Sign up at [resend.com](https://resend.com) and verify a sending domain.
2. Create an API key, set `RESEND_API_KEY` and `ALERT_FROM_EMAIL`.

### 4. Run it

```bash
npm run dev
# open http://localhost:3000
```

## Deploying to Vercel

1. Push to a new GitHub repo (don't commit `.env.local`).
2. Import the repo at [vercel.com](https://vercel.com).
3. In **Project Settings → Environment Variables**, add every var from `.env.example` (Production + Preview scopes).
4. Deploy. The `vercel.json` cron entry is already in this repo; Vercel will register `/api/check-alerts` to run every 5 minutes on the Pro-plan free allowance.

## Architecture notes

### Why proxy Binance / CoinGecko?

Calling them from the browser means:
- CORS or region-block failures outside Binance-friendly networks.
- Rate-limit failures when the user's tab polls every 5s.
- No way to cache.

So every request from the browser hits our own API route, which fetches + caches and returns JSON. See `lib/binance.ts` and `lib/coingecko.ts` for the in-memory TTL caches (6s for spot ticker, 5s for futures, 60s for CoinGecko, 5m for fear & greed).

### Auth + data

- Supabase Auth issues session cookies via `@supabase/ssr`. `middleware.ts` refreshes the session on every request.
- All user tables have `user_id uuid references auth.users` and a corresponding RLS policy. Guests (no session) fall back to `localStorage` for watchlist / notes — see `lib/guest-storage.ts`.
- The `auth-gated` routes (`/portfolio`, `/futures`, `/notes`) are blocked by middleware and the page server component, in case middleware is misconfigured.

### AI proxy

`/api/ai-insight` is the only place that touches `ANTHROPIC_API_KEY`. The browser posts `{ symbol, market }`, the route:
1. Authenticates the user.
2. Rate-limits to 30 req/min/user.
3. Fetches fresh ticker + 60×1h candles from Binance (cached).
4. Calls Claude with a structured prompt that returns a fixed JSON schema.
5. Logs usage to `ai_usage` for cost visibility.
6. Returns the parsed insight or a deterministic fallback if the model is unavailable.

### Alerts

`/api/check-alerts` runs every 5 minutes. It pulls all active, un-triggered alerts, groups them by symbol, fetches one ticker per group, and updates the rows that hit. Email delivery goes through Resend. Toast delivery is handled client-side by polling `/api/alerts` (toast on newly triggered entries) — serverless functions can't push to a specific browser tab without a Realtime channel.

## Project structure

```
app/
  api/            # Route handlers (server-only, never inlined to the client)
    markets/      # ticker, klines, orderbook, trades, coins, symbols
    watchlist/    # GET/POST + DELETE by id
    alerts/       # GET/POST + PATCH/DELETE by id
    check-alerts/ # Vercel Cron target
    portfolio/    # GET/POST + PATCH/DELETE
    futures/      # GET/POST + PATCH/DELETE
    notes/        # GET/POST + PATCH/DELETE
    ai-insight/   # POST — Anthropic proxy
    auth/         # Google OAuth + sign-out
  auth/callback/  # OAuth redirect handler
  login/          # Sign-in / sign-up / magic link
  portfolio/      # Auth-gated
  futures/        # Auth-gated
  notes/          # Auth-gated
  layout.tsx
  page.tsx        # Main terminal
components/       # All UI components, with their own error boundaries
hooks/            # SWR-backed data hooks
lib/              # Server + shared utilities
supabase/migrations/   # SQL migrations
tests/            # Vitest unit + route tests
public/           # Static assets
```

## Accessibility

- Every interactive surface has a focus ring.
- All text colors verified ≥ 4.5:1 against their backgrounds (see `tailwind.config.ts` palette).
- `prefers-reduced-motion` is respected by the chart library defaults.
- Tables use `role="table"` semantics via `<table>`; the market list uses `role="button"` for keyboard activation.
- Tested at 375px (mobile), 768px (tablet), 1440px (desktop).

## Non-functional checklist

- [x] All third-party APIs proxied.
- [x] User data in DB; guest fallback to localStorage.
- [x] AI key server-side, rate-limited per user.
- [x] Real-time price alerts (Vercel Cron + email + toast).
- [x] Modular code (no 2,700-line file).
- [x] Per-component error boundaries + loading skeletons.
- [x] Auth-gated portfolio / futures / notes.
- [x] `.env.example` lists every variable.
- [x] Tests for lib + API routes.
- [x] WCAG AA contrast.
- [x] Responsive 375/768/1440.
- [x] Open Graph + favicon + meta tags.
- [x] `rel="noopener noreferrer"` on every external link.
- [x] Security headers in `next.config.mjs`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest one-shot |
| `npm run test:watch` | Vitest watch mode |

## License

MIT — see `LICENSE`.

## Disclaimer

Not financial advice. The terminal tracks markets and your positions; it does not place trades. You are responsible for your own trading decisions. Crypto is volatile. Don't trade with money you can't afford to lose.

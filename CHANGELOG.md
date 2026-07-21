# Changelog

All notable changes to CryptoWatch Pro are documented here.

## 1.1.0 — 2026-07-22

Next.js 15 upgrade + Sentry error monitoring + CI/CD env var expansion.

### Changed
- **Next.js 14 → 15** (`next@15.2.4`, `eslint-config-next@15.2.4`).
  - `cookies()` in `lib/supabase/server.ts` is now `await cookies()` (Next 15 async API).
  - `getServerSupabase()` is now `async`; all 15 callsites updated.
  - Dynamic route `params` is now `Promise<{ id }>`; awaited in all 5 route handlers.
- **SECURITY.md** updated: Next 15 CVE status changed from pending to resolved.

### Added
- **Sentry error monitoring** (`@sentry/nextjs@^8.53.0`).
  - `sentry.client.config.ts` — browser config with replays.
  - `sentry.server.config.ts` — server config.
  - `instrumentation.ts` — Next.js 15 register hook for server startup.
  - `next.config.mjs` wrapped with `withSentryConfig`.
  - `ErrorBoundary` forwards errors to Sentry.
  - `app/error.tsx` captures errors via Sentry.
  - `lib/errors.ts` sends unhandled API errors to Sentry.
- **GitHub Actions** workflow now passes `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `RESEND_API_KEY`, `ALERT_FROM_EMAIL`, and `CRON_SECRET` as build env vars.
- `.env.example` now includes `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_ORG` / `SENTRY_PROJECT`.

## 1.0.0 — 2026-07-12

Initial production release.

### Added
- Next.js 14 App Router scaffold.
- Supabase schema (`profiles`, `watchlist`, `alerts`, `holdings`, `futures_positions`, `notes`, `ai_usage`) with RLS.
- API routes: markets (ticker, klines, orderbook, trades, coins, symbols), watchlist, alerts, portfolio, futures, notes, ai-insight, check-alerts (Vercel Cron), auth (Google, sign-out, callback).
- Components: MarketTable, ChartPanel, OrderBook, RecentTrades, AlertsPanel, PortfolioTracker, FuturesTracker, NotesPanel, AIInsightPanel, GlobalMarketHeader, Header, ErrorBoundary, Toast, LoadingSkeleton.
- Hooks: useMarkets, useWatchlist, useAlerts, useUserData, useAuth, useWebSocket.
- Login + auth-gated portfolio / futures / notes pages.
- Vitest tests for lib + API routes.
- `.env.example`, `LICENSE`, `vercel.json`, OG meta tags, favicon, robots.txt, sitemap.

# Changelog

All notable changes to CryptoWatch Pro are documented here.

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

# AGENTS.md

Project-specific instructions for any AI coding agent working in this repo. Universal agent rules (avoid fabrication, validate, don't game verification, etc.) are inherited from your global `AGENTS.md` / `CLAUDE.md`.

This file is the de-facto standard (OpenAI, Google, Cursor, Codex, Aider all read it). Symlink it to `CLAUDE.md` if you want Claude Code to pick it up automatically.

## What this is

**CryptoWatch Pro** — a full-stack crypto market terminal.

- **Frontend**: Next.js 14 App Router, React 18, Tailwind CSS 3, TradingView Lightweight Charts
- **Backend**: Next.js API routes (server-side only)
- **Database**: Supabase Postgres with RLS
- **Auth**: Supabase Auth (email + Google OAuth)
- **AI**: Anthropic Claude (server-side proxy at `/api/ai-insight`)
- **Hosting**: Vercel + Vercel Cron

## Quick commands

```bash
npm install          # install deps
npm run dev          # localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm test             # vitest
npm run lint         # next lint
```

## Project layout (do not reorganize without good reason)

```
app/                 # App Router. api/ for route handlers.
  api/markets/       # ticker, klines, orderbook, trades, coins, symbols, quote
  api/watchlist/     # CRUD
  api/alerts/        # CRUD + /api/check-alerts (cron target)
  api/portfolio/     # CRUD
  api/futures/       # CRUD
  api/notes/         # CRUD
  api/ai-insight/    # Anthropic proxy (rate-limited, server-side)
  api/auth/          # Google OAuth + sign-out
  api/health/        # status pill
  auth/callback/     # OAuth callback handler
  login/             # sign-in / sign-up / magic link
  portfolio/         # auth-gated
  futures/           # auth-gated
  notes/             # auth-gated
  legal/             # terms / privacy / disclaimer / cookies
components/          # one component per file, error-boundary wrapped
hooks/               # SWR data hooks
lib/                 # server + shared utilities
  supabase/          # client, server, middleware helpers
  binance.ts         # Binance REST client (server-side only)
  coingecko.ts       # CoinGecko client (server-side only)
  fear-greed.ts      # alternative.me
  ai.ts              # Anthropic proxy
  email.ts           # Resend
  cache.ts           # TTL + SWR cache
  rate-limit.ts      # in-memory bucket
  errors.ts          # ApiError + handler
  format.ts          # number/date/symbol formatting
  auth.ts            # requireUser(), getCurrentUser()
  guest-storage.ts   # localStorage fallback (client only)
supabase/
  migrations/        # *.sql files; run in order
tests/               # vitest, mirror lib/ structure
public/              # static assets
```

## Hard rules

### 1. Server-side only
The browser must NEVER call Binance, CoinGecko, alternative.me, or Anthropic directly. Every external call goes through `app/api/*` and is server-side. See the architecture note in the README for the why.

### 2. Auth is server-side
Every mutating route must call `requireUser()` from `lib/auth.ts`. Never trust the client to "be logged in." Middleware gates `/portfolio`, `/futures`, `/notes`, but the route's own server component is the second check.

### 3. RLS is the security boundary
All user tables have RLS policies (see `supabase/migrations/0002_rls_policies.sql`). Don't use the service-role key from the client. Use it only in trusted server code (cron, AI proxy) that has already authorised the caller.

### 4. AI key never reaches the browser
`ANTHROPIC_API_KEY` is read only inside `app/api/ai-insight/route.ts`. If you find yourself wanting to use it from a client component, stop and add a server route instead.

### 5. Validate every input
Use `zod` schemas at the boundary of every API route. Reject with `errors.badRequest` on parse failure. See `app/api/alerts/route.ts` for the pattern.

### 6. Cache at the right TTL
- Spot ticker: 6s
- Futures ticker: 5s
- CoinGecko global: 60s
- Fear & Greed: 5 min
- AI insight (per symbol): 5 min
- Live quote: 1s

These are in `lib/binance.ts`, `lib/coingecko.ts`, `lib/fear-greed.ts`, `lib/ai.ts`. Don't bypass the cache unless you have a documented reason.

## Coding conventions

- **TypeScript strict** — no `any` unless wrapped in a comment explaining why.
- **React 18, server components by default** — only add `"use client"` when you need state, effects, or browser APIs.
- **Tailwind** — use the design tokens (`bg-bg-panel`, `text-fg-secondary`, etc.) defined in `tailwind.config.ts`. Don't hardcode hex.
- **Imports** — `@/...` alias, not relative paths beyond one level.
- **Error handling** — use the `handle()` wrapper from `lib/api.ts` for route handlers. Throw `ApiError` (or use `errors.*`) for known cases; let unexpected ones hit the 500 path.
- **Naming** — camelCase for vars/functions, PascalCase for components, kebab-case for files.
- **One component per file**, file name matches component name.

## Accessibility

- All text meets WCAG AA (4.5:1 for body, 3:1 for large). Verified palette in `tailwind.config.ts`.
- Every interactive element is keyboard-reachable with a visible focus ring.
- Form inputs have `<label>`, not just placeholders.
- `aria-live` regions for toasts and dynamic status.
- See `components/Footer.tsx` for the pattern of "everything external is `rel="noopener noreferrer"`."

## When you change something, also update

- **API change** → update the README's API section + add a test in `tests/api/`.
- **Env var** → update `.env.example` and the README's "Configuration" table.
- **DB schema** → add a new file in `supabase/migrations/` (don't edit history). Update `SECURITY.md` if it touches RLS or secrets.
- **Dependency** → update `package.json` AND verify `npm run typecheck && npm test` still pass. Don't bump major versions casually — see SECURITY.md.
- **User-facing copy** → keep the voice consistent: direct, no marketing-speak, acknowledges the user knows what they're doing.

## Before declaring done

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (or new tests added)
- [ ] `npm run build` succeeds
- [ ] For UI changes: tested at 375 / 768 / 1440
- [ ] For new env vars: added to `.env.example`
- [ ] For new endpoints: added a smoke test in `tests/api/`
- [ ] For security-sensitive changes: flagged in commit message + run security-auditor agent

## Commit style

```
<scope>: <one-line summary>

<body explaining why, not what>
```

Scope: `api`, `ui`, `db`, `auth`, `ai`, `docs`, `deps`, `chore`, `test`. No "feat:" prefix — the scope implies it.

## Out of scope (do not implement without a separate decision)

- Real trading (placing exchange orders). This app is tracking only.
- Exchange API key custody. We never hold keys.
- Social features (follow, share, comments).
- Mobile native apps.

## Where to ask for help

- For UI / design review: invoke the `ux-reviewer` agent.
- For a security review of an auth or data-handling change: `security-auditor`.
- For test coverage: `test-writer`.
- For doc / README work: `docs-writer`.
- For prompt / system-prompt work: `prompt-engineer`.
- For performance issues: `perf-auditor`.
- For a11y audit: `accessibility-auditor`.
- For multi-step / multi-agent work: `task-planner` first.

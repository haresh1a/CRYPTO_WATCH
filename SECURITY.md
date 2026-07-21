# Security

## Production dependencies — current status

Last audited: 2026-07-22.

| Package | Pinned | Known issues | Action |
| --- | --- | --- | --- |
| `next` | 15.2.4 | None at this pin (CVE backlog from 14.x resolved) | ✅ Upgraded from 14.x |
| `react` / `react-dom` | 18.3.1 | None | OK |
| `@supabase/ssr` | 0.5.x | None | OK |
| `@supabase/supabase-js` | 2.45.x | None | OK |
| `lightweight-charts` | 4.2.x | None | OK |
| `swr` | 2.2.x | None | OK |
| `zod` | 3.23.x | None | OK |
| `resend` | 4.0.x | None | OK |
| `@sentry/nextjs` | ^8.53.0 | None | ✅ New — error monitoring |

## Dev dependencies — current status

| Package | Pinned | Known issues | Action |
| --- | --- | --- | --- |
| `happy-dom` | 16.8.1 | None at this pin | OK (16.8.1 fixes the RCE issue in < 20.8.8) |
| `vitest` | 2.1.x | None at this pin | OK |
| `esbuild` (via vite/vitest) | 0.24.x | Dev-only request forgery | Dev-only, never runs in production |
| `glob` (via eslint) | 10.x | Dev-only command injection | Dev-only |
| `postcss` (via Next) | < 8.5.10 | XSS in CSS stringification | Server-rendered CSS; we don't accept user-authored CSS |

## Code-level security

- **Auth gates** — `middleware.ts` redirects unauthenticated requests for `/portfolio`, `/futures`, `/notes`. The corresponding server components call `requireUser()` as a second check. Guests can browse the market terminal without an account.
- **Database access** — Every user-data table has RLS policies (`supabase/migrations/0002_rls_policies.sql`) that scope reads/writes to `auth.uid()`. The service-role key bypasses RLS; it is **only** used in trusted server code (cron, AI proxy) that has already authorised the caller.
- **AI key** — `ANTHROPIC_API_KEY` is read **only** inside `app/api/ai-insight/route.ts`. The browser never sees it. Per-user rate limit: 30 req/min.
- **Cron** — `/api/check-alerts` requires `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron includes the secret automatically when `CRON_SECRET` is set in the project's env vars.
- **Error monitoring** — `@sentry/nextjs` captures unhandled exceptions from the browser, API routes, and server components. Configured via `sentry.client.config.ts`, `sentry.server.config.ts`, and `instrumentation.ts`. DSN is set via `NEXT_PUBLIC_SENTRY_DSN` (client) or `SENTRY_DSN` (server).
- **External links** — All `<a target="_blank">` use `rel="noopener noreferrer"`.
- **HTTP headers** — `next.config.mjs` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a locked-down `Permissions-Policy`.
- **XSS** — React auto-escapes strings. We don't use `dangerouslySetInnerHTML` anywhere. The AI model response is parsed as JSON only after stripping markdown fences.
- **CSRF** — All mutating endpoints are JSON POSTs; cookies are Supabase session cookies bound to the same origin, and the auth flow uses OAuth state. No form-based auth endpoints accept cross-origin form posts.

## Recommended follow-ups

1. **Set a Content-Security-Policy** header in `next.config.mjs` once you know which third-party origins you'll need to allow (currently none, since we proxy everything).
2. **Add rate limit on auth endpoints** — Supabase has built-in limits but you may want a stricter custom limit on `/login` if you ever expose it.
3. **Rotate keys if you ever committed them** — `.gitignore` excludes `.env.local` but double-check `git log -p | grep -i "sk-ant"` shows nothing.
4. **Configure Sentry releases** — set `SENTRY_ORG` and `SENTRY_PROJECT` env vars in CI to enable source map upload for readable stack traces.

## Reporting a vulnerability

Email the maintainer (see `package.json` author) or open a private security advisory on GitHub.

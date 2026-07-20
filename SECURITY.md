# Security

## Production dependencies — current status

Last audited: 2026-07-13.

| Package | Pinned | Known issues | Action |
| --- | --- | --- | --- |
| `next` | 14.2.35 | Several CVEs only fully fixed in 15.x+ | Acceptable for prototype; plan a Next 15 upgrade before going public |
| `react` / `react-dom` | 18.3.1 | None | OK |
| `@supabase/ssr` | 0.5.x | None | OK |
| `@supabase/supabase-js` | 2.45.x | None | OK |
| `lightweight-charts` | 4.2.x | None | OK |
| `swr` | 2.2.x | None | OK |
| `zod` | 3.23.x | None | OK |
| `resend` | 4.0.x | None | OK |

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
- **External links** — All `<a target="_blank">` use `rel="noopener noreferrer"`.
- **HTTP headers** — `next.config.mjs` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a locked-down `Permissions-Policy`.
- **XSS** — React auto-escapes strings. We don't use `dangerouslySetInnerHTML` anywhere. The AI model response is parsed as JSON only after stripping markdown fences.
- **CSRF** — All mutating endpoints are JSON POSTs; cookies are Supabase session cookies bound to the same origin, and the auth flow uses OAuth state. No form-based auth endpoints accept cross-origin form posts.

## Recommended follow-ups

1. **Next 15 upgrade** — the cleanest fix for the remaining `next` advisories. It's a non-breaking migration for the App Router code we have, but you should:
   - Bump `next` to `15.x` and `eslint-config-next` to `15.x`.
   - Update `cookies()` / `headers()` callsites to `await cookies()` / `await headers()` (the new async API).
   - Add `await` to `params` in any dynamic route segments (we don't have any yet).
2. **Add Sentry** for error reporting — currently errors only `console.error`.
3. **Add rate limit on auth endpoints** — Supabase has built-in limits but you may want a stricter custom limit on `/login` if you ever expose it.
4. **CSP** — set a Content-Security-Policy header in `next.config.mjs` once you know which third-party origins you'll need to allow (currently none, since we proxy everything).
5. **Rotate keys if you ever committed them** — `.gitignore` excludes `.env.local` but double-check `git log -p | grep -i "sk-ant"` shows nothing.

## Reporting a vulnerability

Email the maintainer (see `package.json` author) or open a private security advisory on GitHub.

// Sentry server-side configuration.
// Captures errors from API routes, server components, and middleware.
// The DSN is read from the server-only SENTRY_DSN env var, with a
// fallback to NEXT_PUBLIC_SENTRY_DSN for convenience.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV !== undefined,
  });
}

// Sentry client-side (browser) configuration.
// Captures front-end errors, with performance tracing and session replays.
// Initialisation is lazy — Sentry won't start sending until the DSN is set.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    // Adjust sampling based on traffic — 0.1 = sample 10% of traces
    tracesSampleRate: 0.1,
    // Session replays: sample 10% of sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Attach local dev errors too so you catch them before deploy
    enabled: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV !== undefined,
  });
}

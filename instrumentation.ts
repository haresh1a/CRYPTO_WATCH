// Next.js 15 instrumentation hook.
// Called once during server startup. Used here to register Sentry's
// global error handlers so unhandled rejections and uncaught
// exceptions on the server are captured.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (dsn) {
      Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        enabled: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV !== undefined,
      });
    }
  }
}

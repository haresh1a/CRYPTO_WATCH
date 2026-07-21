"use client";

import { useEffect } from "react";
import Link from "next/link";

// Global error page for the root layout. Catches errors that fall
// through all other error boundaries and sends them to Sentry.

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[GlobalError]", error);
    // Forward to Sentry
    import("@sentry/nextjs").then(
      (Sentry) => Sentry.captureException(error),
      () => { /* Sentry not available */ },
    );
  }, [error]);
  return (
    <div role="alert" className="panel p-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-danger">Something went wrong</h1>
      <p className="text-fg-secondary text-sm mt-2">{error.message}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={reset} className="btn-primary text-sm">Try again</button>
        <Link href="/" className="btn text-sm">Go home</Link>
      </div>
    </div>
  );
}

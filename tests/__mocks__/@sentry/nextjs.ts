// No-op stub for @sentry/nextjs used in the Vitest test environment.
// Sentry is only available at runtime inside Next.js (via its webpack plugin).
// This file is aliased by vitest.config.ts so tests never hit the real package.

export const captureException = () => {};
export const captureMessage = () => {};
export const init = () => {};
export const withSentryConfig = (config: unknown) => config;
export const withScope = (_fn: unknown) => {};

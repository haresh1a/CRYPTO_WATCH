// Polyfill crypto.randomUUID for the test environment.
import "@testing-library/jest-dom/vitest";

// Stub fetch globally — individual tests override with vi.fn.
if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = (() => Promise.reject(new Error("fetch not stubbed"))) as typeof fetch;
}

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Mock @sentry/nextjs globally so Vitest never tries to resolve it from disk.
    // Sentry is only available at runtime inside Next.js (via its webpack plugin);
    // lib/errors.ts uses a dynamic import that we stub here to prevent test failures.
    server: {
      deps: {
        inline: [],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Provide a lightweight no-op stub for Sentry in the test environment.
      "@sentry/nextjs": path.resolve(__dirname, "tests/__mocks__/@sentry/nextjs.ts"),
    },
  },
});

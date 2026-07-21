import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output bundles only the necessary node_modules so the
  // deployment package is ~80 MB instead of 500 MB (no full node_modules copy).
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "cryptoicons.org" },
      { protocol: "https", hostname: "s2.coinmarketcap.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// Wrap with Sentry for error monitoring and performance tracing.
// Source map upload is disabled — Azure Free tier has limited disk space.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  silent: true,
  widenClientFileUpload: false,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  sourcemaps: {
    disable: true,
  },
});

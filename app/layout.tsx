import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cryptowatch.example";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "CryptoWatch Pro — Live Crypto Market Terminal",
    template: "%s · CryptoWatch Pro",
  },
  description:
    "Production-grade crypto market terminal: spot, futures, charts, alerts, portfolio, journal, AI insights. Powered by Binance + CoinGecko, secured with Supabase auth.",
  applicationName: "CryptoWatch Pro",
  keywords: [
    "crypto", "bitcoin", "ethereum", "trading", "charts", "alerts",
    "portfolio", "futures", "binance", "coingecko", "ai",
  ],
  authors: [{ name: "CryptoWatch Pro contributors" }],
  creator: "CryptoWatch Pro",
  publisher: "CryptoWatch Pro",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "CryptoWatch Pro",
    title: "CryptoWatch Pro — Live Crypto Market Terminal",
    description: "Spot, futures, charts, alerts, portfolio, journal, AI insights.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CryptoWatch Pro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoWatch Pro",
    description: "Live crypto market terminal — spot, futures, charts, alerts, portfolio, AI.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0e17",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ToastProvider>
          <ErrorBoundary label="App shell">
            <Header />
            <main className="max-w-[1600px] mx-auto px-3 lg:px-6 py-4">
              {children}
            </main>
            <Footer />
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}

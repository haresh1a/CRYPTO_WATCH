import Link from "next/link";

export const metadata = { title: "Cookie policy" };

export default function CookiesPage() {
  return (
    <article className="max-w-3xl mx-auto panel p-6 lg:p-8 space-y-4 text-sm text-fg-secondary">
      <header>
        <Link href="/" className="text-fg-muted hover:text-fg text-xs">← Back to markets</Link>
        <h1 className="text-2xl font-semibold text-fg mt-2">Cookie policy</h1>
      </header>

      <p>
        CryptoWatch Pro uses a minimal set of cookies. We do not use advertising cookies, third-party tracking cookies, or analytics cookies.
      </p>

      <section>
        <h2 className="text-base font-medium text-fg">What we set</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-fg">Session cookie</strong> — issued by Supabase when you sign in. Stores an opaque session token. HttpOnly, Secure (in production), SameSite=Lax. Lifetime: ~1 hour, refreshed on activity.</li>
          <li><strong className="text-fg">Theme preference</strong> (optional) — remembers dark/light. Lifetime: 1 year.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">What we do not set</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No Google Analytics, no Plausible, no Hotjar.</li>
          <li>No Meta, TikTok, or LinkedIn pixels.</li>
          <li>No advertising cookies or cross-site identifiers.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Local storage (guests only)</h2>
        <p>
          If you use the site without signing in, we store your watchlist, notes, and draft holdings in your browser&apos;s localStorage so they persist between visits. This data never leaves your device and is cleared when you sign in and claim the data, or when you clear your browser storage.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Manage cookies</h2>
        <p>
          You can block or delete cookies in your browser settings. Blocking the session cookie will sign you out and prevent sign-in.
        </p>
      </section>
    </article>
  );
}

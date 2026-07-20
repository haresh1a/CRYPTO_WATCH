"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { classNames } from "@/lib/format";

const NAV = [
  { href: "/",          label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/futures",   label: "Futures" },
  { href: "/notes",     label: "Notes" },
];

export function Header() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-bg-base/95 backdrop-blur border-b border-border">
      <div className="max-w-[1600px] mx-auto px-3 lg:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-fg">
          <span className="inline-block w-6 h-6 rounded-md bg-gradient-to-br from-brand to-success" aria-hidden />
          <span>CryptoWatch Pro</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1 ml-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={classNames(
                "tab",
                pathname === n.href && "tab-active",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {loading ? (
          <div className="skeleton w-20 h-8" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-secondary hidden sm:inline">{user.email}</span>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="btn text-xs">Sign out</button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn-primary text-xs">Sign in</Link>
        )}
      </div>

      {/* Mobile nav */}
      <nav aria-label="Primary mobile" className="md:hidden border-t border-border">
        <div className="flex overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={classNames(
                "tab flex-shrink-0 rounded-none border-b-2",
                pathname === n.href ? "border-brand tab-active" : "border-transparent",
              )}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

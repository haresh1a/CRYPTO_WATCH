// Next.js middleware that refreshes the Supabase session cookie
// on every request. Required by @supabase/ssr — without this the
// server client can't read the session on the first request after
// a token refresh.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

const AUTH_GATED_PREFIXES = ["/portfolio", "/futures", "/notes"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return res;

  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (n: string) => req.cookies.get(n)?.value,
      set: (n: string, v: string, o: CookieOptions) => res.cookies.set({ name: n, value: v, ...o }),
      remove: (n: string, o: CookieOptions) => res.cookies.set({ name: n, value: "", ...o }),
    },
  });

  // Refresh the session if needed.
  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;
  const needsAuth = AUTH_GATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (needsAuth && !session) {
    const redirect = new URL("/login", req.url);
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  return res;
}

export const config = {
  matcher: [
    // Run on every route EXCEPT static files, _next assets, and the
    // /api/check-alerts cron endpoint (Vercel cron auth is its own
    // concern — handled inside the route via CRON_SECRET).
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/check-alerts).*)",
  ],
};

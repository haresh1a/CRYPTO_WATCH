// OAuth sign-in entry point. Forwards the user to Supabase's hosted
// auth UI which handles email/password, magic link, and Google
// (if enabled in the dashboard). We bounce them back to /auth/callback
// to complete the session cookie handshake.

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = getServerSupabase();
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.json({ error: { code: "auth", message: error?.message ?? "oauth failed" } }, { status: 400 });
  }

  return NextResponse.redirect(data.url);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
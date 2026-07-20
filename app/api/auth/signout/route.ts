// Sign-out endpoint. Clears the session cookies and redirects home.

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
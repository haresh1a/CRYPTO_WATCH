// Browser-side Supabase client. Uses the anon key, RLS is enforced
// for every read/write. Imports the singleton from @supabase/ssr
// so session cookies are handled by Next's middleware.

"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}

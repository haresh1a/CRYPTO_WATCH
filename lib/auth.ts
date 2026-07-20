// Server-side helper that resolves the current user from the
// Supabase session cookie. Returns null if the caller is anonymous.

import { getServerSupabase } from "./supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) {
    const { errors } = await import("./errors");
    throw errors.unauthorized();
  }
  return u;
}

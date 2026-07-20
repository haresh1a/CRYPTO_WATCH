"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

type Mode = "signin" | "signup" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/";
  const initialError = sp.get("error");
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getBrowserSupabase();
    try {
      if (mode === "magic") {
        const { error: e1 } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (e1) throw e1;
        toast({ title: "Check your email for the magic link", variant: "success" });
        return;
      }
      if (mode === "signup") {
        const { error: e2 } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (e2) throw e2;
        toast({ title: "Check your email to confirm", variant: "success" });
        return;
      }
      const { error: e3 } = await supabase.auth.signInWithPassword({ email, password });
      if (e3) throw e3;
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const oauthGoogle = () => {
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="panel p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-fg">Sign in to CryptoWatch Pro</h1>
          <p className="text-fg-muted text-sm mt-1">Save your watchlist, alerts, portfolio, and notes.</p>
        </div>

        <button
          onClick={oauthGoogle}
          className="btn w-full text-sm"
          aria-label="Sign in with Google"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <span className="flex-1 h-px bg-border" />
          <span>or</span>
          <span className="flex-1 h-px bg-border" />
        </div>

        <div role="tablist" aria-label="Auth method" className="grid grid-cols-3 gap-1 panel p-1">
          {(["signin","signup","magic"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`tab text-xs ${mode === m ? "tab-active" : ""}`}
            >
              {m === "signin" ? "Sign in" : m === "signup" ? "Sign up" : "Magic link"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-2 text-sm">
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {mode !== "magic" && (
            <label className="grid gap-1">
              <span className="text-fg-muted text-xs">Password</span>
              <input
                className="input"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? 8 : 1}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <button type="submit" className="btn-primary w-full text-sm" disabled={loading} aria-busy={loading}>
            {loading ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a link"}
          </button>
        </form>

        <p className="text-xs text-fg-muted text-center">
          By continuing you accept the <Link href="#" className="text-fg-secondary hover:text-fg">terms</Link> and <Link href="#" className="text-fg-secondary hover:text-fg">privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}

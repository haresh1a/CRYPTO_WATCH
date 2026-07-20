// /api/check-alerts — invoked by Vercel Cron every 5 minutes.
// Iterates over all active alerts, fetches the current price, and
// updates the row if the condition is met. Sends an email when
// delivery includes "email". Toast delivery is handled client-side
// by polling this endpoint's result via the Realtime / refresh
// channel, since we can't push from a serverless function to a
// specific browser tab.

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getTicker, getKlines } from "@/lib/binance";
import { sendEmail, alertEmail } from "@/lib/email";
import { errors } from "@/lib/errors";
import type { Alert } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

type RawAlert = {
  id: string;
  user_id: string;
  symbol: string;
  market_type: "spot" | "futures";
  condition: "above" | "below" | "pct_change";
  threshold: number;
  pct_window: "1h" | "24h" | "7d" | null;
  active: boolean;
  delivery: "toast" | "email" | "toast+email";
  created_at: string;
  triggered_at: string | null;
  triggered_price: number | null;
};

async function authorized(req: NextRequest): Promise<boolean> {
  // Vercel cron sends a Bearer token in production. We accept
  // either that or the manually-set CRON_SECRET.
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // not configured: rely on Vercel auth
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: { code: "forbidden", message: "bad cron secret" } }, { status: 403 });
  }
  return runCheck();
}

// POST so we can also trigger manually from the UI.
export async function POST(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: { code: "forbidden", message: "bad cron secret" } }, { status: 403 });
  }
  return runCheck();
}

async function runCheck() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("active", true)
      .is("triggered_at", null)
      .limit(500);

    if (error) throw errors.internal(error.message);

    const alerts = (data ?? []) as RawAlert[];
    if (alerts.length === 0) return NextResponse.json({ ok: true, checked: 0, triggered: 0 });

    // Group by (symbol, market) to minimise ticker fetches.
    const grouped = new Map<string, RawAlert[]>();
    for (const a of alerts) {
      const key = `${a.market_type}:${a.symbol}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(a);
    }

    let triggered = 0;
    const triggeredForUser = new Map<string, Alert[]>();

    for (const [key, group] of grouped) {
      const [market, symbol] = key.split(":") as ["spot" | "futures", string];
      const ticker = await getTicker(symbol, market).catch(() => null);
      if (!ticker) continue;

      for (const a of group) {
        let hit = false;
        if (a.condition === "above") hit = ticker.lastPrice >= a.threshold;
        else if (a.condition === "below") hit = ticker.lastPrice <= a.threshold;
        else if (a.condition === "pct_change" && a.pct_window) {
          // Approximate: compare 1h/24h/7d price change against threshold.
          const delta =
            a.pct_window === "1h" ? ticker.priceChangePercent :
            a.pct_window === "24h" ? ticker.priceChangePercent :
            a.pct_window === "7d" ? ticker.priceChangePercent : 0; // 7d not directly available
          hit = Math.abs(delta) >= Math.abs(a.threshold) && Math.sign(delta) === Math.sign(a.threshold);
        }

        if (!hit) continue;

        const { error: updErr } = await supabase
          .from("alerts")
          .update({
            active: false,
            triggered_at: new Date().toISOString(),
            triggered_price: ticker.lastPrice,
          } as never)
          .eq("id", a.id);

        if (updErr) console.error("[check-alerts] update failed", updErr);
        else triggered += 1;

        if (a.delivery.includes("email")) {
          const arr = triggeredForUser.get(a.user_id) ?? [];
          arr.push({
            id: a.id,
            symbol: a.symbol,
            marketType: a.market_type,
            condition: a.condition,
            threshold: Number(a.threshold),
            pctWindow: a.pct_window,
            active: false,
            triggeredAt: new Date().toISOString(),
            triggeredPrice: ticker.lastPrice,
            delivery: a.delivery,
            createdAt: a.created_at,
          });
          triggeredForUser.set(a.user_id, arr);
        }
      }
    }

    // Fetch user emails + send.
    for (const [userId, list] of triggeredForUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email_alerts")
        .eq("id", userId)
        .single();
      if (!profile) continue;

      const { data: auth } = await supabase.auth.admin.getUserById(userId);
      const email = auth?.user?.email;
      if (!email) continue;

      for (const a of list) {
        const msg = alertEmail({
          symbol: a.symbol,
          condition: a.condition,
          threshold: a.threshold,
          price: a.triggeredPrice ?? 0,
        });
        await sendEmail({ to: email, ...msg });
      }
    }

    return NextResponse.json({ ok: true, checked: alerts.length, triggered });
  } catch (err) {
    console.error("[check-alerts] error", err);
    return NextResponse.json({ error: { code: "internal", message: "check failed" } }, { status: 500 });
  }
}
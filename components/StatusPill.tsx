"use client";

// Compact "all systems operational" status pill. Pings our
// /api/health endpoint (lightweight) on a 60s cadence. Designed
// to live in the footer without distracting from the main UI.

import { useEffect, useState } from "react";
import { classNames } from "@/lib/format";

type Status = "ok" | "degraded" | "down" | "loading";

const COLORS: Record<Status, string> = {
  ok:       "bg-success",
  degraded: "bg-warning",
  down:     "bg-danger",
  loading:  "bg-fg-muted",
};

const LABELS: Record<Status, string> = {
  ok:       "All systems operational",
  degraded: "Partial outage",
  down:     "Major outage",
  loading:  "Checking…",
};

export function StatusPill() {
  const [status, setStatus] = useState<Status>("loading");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const ms = Math.round(performance.now() - t0);
        if (cancelled) return;
        setLatency(ms);
        setStatus(res.ok ? "ok" : "degraded");
      } catch {
        if (cancelled) return;
        setStatus("down");
        setLatency(null);
      }
    };
    ping();
    const id = setInterval(ping, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-2 text-xs text-fg-secondary"
      role="status"
      aria-live="polite"
      aria-label={LABELS[status]}
    >
      <span className="relative inline-flex h-2 w-2">
        <span
          className={classNames(
            "absolute inset-0 rounded-full opacity-60 animate-ping",
            COLORS[status],
          )}
          aria-hidden
        />
        <span className={classNames("relative inline-block h-2 w-2 rounded-full", COLORS[status])} aria-hidden />
      </span>
      <span>{LABELS[status]}</span>
      {latency != null && status === "ok" && (
        <span className="text-fg-muted tabular-nums">· {latency}ms</span>
      )}
    </span>
  );
}

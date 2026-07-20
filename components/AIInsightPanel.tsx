"use client";

import { useState } from "react";
import { useToast } from "./Toast";
import { ErrorBoundary } from "./ErrorBoundary";
import { classNames, formatRelative } from "@/lib/format";
import type { AIInsight } from "@/types";

type Props = { symbol: string; market: "spot" | "futures" };

export function AIInsightPanel({ symbol, market }: Props) {
  const [data, setData] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol, market }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("Sign in to use AI insights");
        if (res.status === 429) throw new Error(body?.error?.message ?? "Rate limited — slow down");
        throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
      }
      const json = (await res.json()) as AIInsight;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      toast({ title: "AI insight failed", description: err instanceof Error ? err.message : "Try again", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary label="AI insight">
      <section aria-label="AI market insight" className="panel">
        <header className="px-3 py-2 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg">AI Insight</h2>
          <button className="btn text-xs" onClick={fetchInsight} disabled={loading} aria-busy={loading}>
            {loading ? "Thinking…" : data ? "Refresh" : "Generate"}
          </button>
        </header>

        <div className="p-3 text-sm space-y-2">
          {!data && !error && !loading && (
            <p className="text-fg-muted text-xs">
              Click <strong>Generate</strong> to ask our model for a structured read on {symbol} based on the last hour of price action. The API key never leaves our server.
            </p>
          )}

          {error && <p role="alert" className="text-danger text-xs">{error}</p>}

          {data && (
            <>
              <div className="flex items-center gap-2">
                <span className={classNames(
                  "pill",
                  data.sentiment === "bullish" && "bg-success/15 text-success",
                  data.sentiment === "bearish" && "bg-danger/15 text-danger",
                  data.sentiment === "neutral" && "bg-bg-hover text-fg-secondary",
                )}>
                  {data.sentiment}
                </span>
                <span className="text-xs text-fg-muted">confidence {(data.confidence * 100).toFixed(0)}%</span>
                <span className="text-xs text-fg-muted ml-auto">{formatRelative(data.generatedAt)}</span>
              </div>
              <p className="text-fg">{data.summary}</p>
              <ul className="list-disc pl-5 space-y-1 text-fg-secondary text-xs">
                {data.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
}

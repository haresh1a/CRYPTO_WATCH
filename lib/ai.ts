// Server-side Anthropic client. We never expose ANTHROPIC_API_KEY
// to the browser — the /api/ai-insight route calls this directly
// after auth + rate-limit checks. Model is configurable via env.

import { cached } from "./cache";
import type { AIInsight, Candle, Ticker } from "@/types";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 20_000;

type Msg = { role: "user" | "assistant"; content: string };

type AnthropicResponse = {
  content: Array<{ type: "text"; text: string }>;
  usage?: { input_tokens: number; output_tokens: number };
};

// Build a compact, deterministic summary of the asset's recent state
// to send to the model. We deliberately truncate to keep the prompt
// small and the response cheap.
function buildPrompt(symbol: string, ticker: Ticker, candles: Candle[]): { system: string; user: string } {
  const recent = candles.slice(-30); // last 30 candles
  const closes = recent.map((c) => c.close);
  const first = closes[0] ?? ticker.lastPrice;
  const last = closes[closes.length - 1] ?? ticker.lastPrice;
  const changePct = first ? ((last - first) / first) * 100 : 0;

  const system = `You are a concise crypto market analyst. You produce structured JSON only — no prose, no markdown fences, no commentary. The schema is:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": number between 0 and 1,
  "summary": one sentence, <= 25 words,
  "bullets": array of exactly 4 short strings, each <= 15 words
}
Do not invent data. If the data is insufficient, lower confidence and say so in summary.`;

  const user = `Symbol: ${symbol}
Last price: ${ticker.lastPrice}
24h change: ${ticker.priceChangePercent.toFixed(2)}%
24h high/low: ${ticker.highPrice} / ${ticker.lowPrice}
24h volume (base): ${ticker.volume.toFixed(0)}

Last ${recent.length} candles (open, high, low, close, volume):
${recent.map((c) => `${c.open.toFixed(4)},${c.high.toFixed(4)},${c.low.toFixed(4)},${c.close.toFixed(4)},${c.volume.toFixed(0)}`).join("\n")}

Window change: ${changePct.toFixed(2)}%

Respond with the JSON object only.`;

  return { system, user };
}

function safeParse(raw: string): Omit<AIInsight, "symbol" | "generatedAt"> | null {
  // Models sometimes wrap JSON in fences. Strip them.
  const stripped = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const obj = JSON.parse(stripped);
    if (typeof obj !== "object" || obj === null) return null;
    const sentiment = ["bullish", "bearish", "neutral"].includes(obj.sentiment) ? obj.sentiment : "neutral";
    const confidence = Math.max(0, Math.min(1, Number(obj.confidence) || 0.3));
    const summary = String(obj.summary ?? "").slice(0, 240);
    const bullets = Array.isArray(obj.bullets) ? obj.bullets.slice(0, 6).map((b: unknown) => String(b).slice(0, 120)) : [];
    return { sentiment, confidence, summary, bullets };
  } catch {
    return null;
  }
}

export async function generateInsight(opts: {
  symbol: string;
  ticker: Ticker;
  candles: Candle[];
}): Promise<AIInsight> {
  const key = `ai:${opts.symbol}:${Math.floor(Date.now() / 5 * 60_000)}`; // 5 min window
  return cached(key, 5 * 60_000, async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return fallbackInsight(opts.symbol, opts.ticker);
    }
    const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
    const { system, user } = buildPrompt(opts.symbol, opts.ticker, opts.candles);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 400,
          system,
          messages: [{ role: "user", content: user }] satisfies Msg[],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[ai] anthropic non-2xx", res.status, body.slice(0, 200));
        return fallbackInsight(opts.symbol, opts.ticker);
      }
      const json = (await res.json()) as AnthropicResponse;
      const text = json.content?.[0]?.text ?? "";
      const parsed = safeParse(text);
      if (!parsed) return fallbackInsight(opts.symbol, opts.ticker);
      return {
        symbol: opts.symbol,
        generatedAt: new Date().toISOString(),
        ...parsed,
      };
    } catch (err) {
      console.error("[ai] error", err);
      return fallbackInsight(opts.symbol, opts.ticker);
    } finally {
      clearTimeout(t);
    }
  });
}

// Deterministic fallback used when the model is unavailable or
// rate-limited. Keeps the UI populated without faking analysis.
function fallbackInsight(symbol: string, ticker: Ticker): AIInsight {
  const direction: "bullish" | "bearish" | "neutral" =
    ticker.priceChangePercent > 1 ? "bullish" :
    ticker.priceChangePercent < -1 ? "bearish" : "neutral";
  return {
    symbol,
    generatedAt: new Date().toISOString(),
    sentiment: direction,
    confidence: 0.4,
    summary: `Heuristic view on ${symbol} based on 24h change of ${ticker.priceChangePercent.toFixed(2)}%.`,
    bullets: [
      `24h change: ${ticker.priceChangePercent.toFixed(2)}%`,
      `24h high: ${ticker.highPrice}`,
      `24h low: ${ticker.lowPrice}`,
      "AI model unavailable — showing heuristic only.",
    ],
  };
}

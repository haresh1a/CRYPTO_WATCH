// alternative.me fear & greed index, server-side, cached 5 min.

import { swr } from "./cache";

const URL = "https://api.alternative.me/fng/?limit=30&format=json";
const TIMEOUT_MS = 6_000;

export type FearGreed = {
  value: number;
  classification: string;
  timestamp: number;
  history: Array<{ value: number; classification: string; timestamp: number }>;
};

type RawFng = {
  data: Array<{ value: string; value_classification: string; timestamp: string }>;
};

export async function getFearGreed(): Promise<FearGreed> {
  return swr("fng", 5 * 60_000, async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(URL, { signal: ctrl.signal, next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`fng ${res.status}`);
      const raw = (await res.json()) as RawFng;
      const data = raw.data ?? [];
      const latest = data[0];
      return {
        value: Number(latest?.value ?? 50),
        classification: latest?.value_classification ?? "Neutral",
        timestamp: Number(latest?.timestamp ?? Math.floor(Date.now() / 1000)),
        history: data.map((d) => ({
          value: Number(d.value),
          classification: d.value_classification,
          timestamp: Number(d.timestamp),
        })),
      };
    } finally {
      clearTimeout(t);
    }
  });
}

"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { guestWatchlist } from "@/lib/guest-storage";
import type { WatchItem } from "@/types";

const jsonFetcher = async (url: string) => {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to load watchlist");
  return res.json();
};

export function useWatchlist(userId: string | null) {
  const isAuthed = !!userId;
  const key = isAuthed ? "/api/watchlist" : null;
  const { data, mutate, error, isLoading } = useSWR<{ items: WatchItem[] }>(key, jsonFetcher, {
    revalidateOnFocus: false,
  });

  // For the guest, hydrate from localStorage on mount.
  const guestItems = useMemo(() => (typeof window === "undefined" ? [] : guestWatchlist.list()), []);

  const add = useCallback(async (input: { symbol: string; marketType: "spot" | "futures"; note?: string | null }) => {
    if (isAuthed) {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      await mutate();
    } else {
      const items = guestWatchlist.list();
      const next: WatchItem = {
        id: crypto.randomUUID(),
        symbol: input.symbol.toUpperCase(),
        marketType: input.marketType,
        note: input.note ?? null,
        createdAt: new Date().toISOString(),
      };
      const filtered = items.filter((i) => !(i.symbol === next.symbol && i.marketType === next.marketType));
      guestWatchlist.save([next, ...filtered]);
      await mutate();
    }
  }, [isAuthed, mutate]);

  const remove = useCallback(async (id: string) => {
    if (isAuthed) {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      await mutate();
    } else {
      const items = guestWatchlist.list().filter((i) => i.id !== id);
      guestWatchlist.save(items);
      await mutate();
    }
  }, [isAuthed, mutate]);

  const items: WatchItem[] = isAuthed ? (data?.items ?? []) : guestItems;
  return { items, add, remove, refresh: mutate, error, isLoading };
}

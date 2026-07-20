// Guest-mode fallback storage. When the user isn't signed in we
// persist watchlist / notes / portfolio to localStorage. The
// shapes are intentionally identical to the server responses so
// the UI can render either source with the same components.

"use client";

import type { Holding, Note, WatchItem } from "@/types";

const KEYS = {
  watchlist: "cw.guest.watchlist",
  notes:     "cw.guest.notes",
  holdings:  "cw.guest.holdings",
  alerts:    "cw.guest.alerts",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded — silently drop. The user will notice on refresh.
  }
}

export const guestWatchlist = {
  list: () => read<WatchItem[]>(KEYS.watchlist, []),
  save: (items: WatchItem[]) => write(KEYS.watchlist, items),
};

export const guestNotes = {
  list: () => read<Note[]>(KEYS.notes, []),
  save: (items: Note[]) => write(KEYS.notes, items),
};

export const guestHoldings = {
  list: () => read<Holding[]>(KEYS.holdings, []),
  save: (items: Holding[]) => write(KEYS.holdings, items),
};

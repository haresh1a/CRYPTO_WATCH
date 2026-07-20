"use client";

// Minimal WebSocket helper. The browser never talks to Binance
// directly in this app — but the auth-protected pages can use this
// to stream user-specific data (alert fires) over a self-hosted
// ws connection, or a Supabase Realtime channel.

import { useEffect, useRef } from "react";

export function useWebSocket(url: string | null, onMessage: (data: unknown) => void) {
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    if (!url) return;
    const ws = new WebSocket(url);
    ws.onmessage = (e) => {
      try { onMessageRef.current(JSON.parse(e.data)); }
      catch { onMessageRef.current(e.data); }
    };
    return () => { ws.close(); };
  }, [url]);
}

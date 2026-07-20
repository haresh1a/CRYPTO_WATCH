"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { Alert } from "@/types";

const jsonFetcher = async (url: string) => {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to load alerts");
  }
  return res.json();
};

export function useAlerts(userId: string | null) {
  const key = userId ? "/api/alerts" : null;
  const { data, mutate, error, isLoading } = useSWR<{ items: Alert[] }>(key, jsonFetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000,
  });

  const add = useCallback(async (input: Omit<Alert, "id" | "active" | "triggeredAt" | "triggeredPrice" | "createdAt">) => {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? "Failed to create alert");
    }
    await mutate();
  }, [mutate]);

  const setActive = useCallback(async (id: string, active: boolean) => {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active }),
    });
    await mutate();
  }, [mutate]);

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    await mutate();
  }, [mutate]);

  return { alerts: data?.items ?? [], add, setActive, remove, refresh: mutate, error, isLoading };
}

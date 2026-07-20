"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { FuturesPosition, Holding, Note } from "@/types";

const jsonFetcher = async (url: string) => {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Request failed");
  }
  return res.json();
};

export function usePortfolio(userId: string | null) {
  const key = userId ? "/api/portfolio" : null;
  const { data, mutate, error, isLoading } = useSWR<{ items: Holding[] }>(key, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const add = useCallback(async (input: Omit<Holding, "id" | "createdAt" | "updatedAt">) => {
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    await mutate();
  }, [mutate]);
  const update = useCallback(async (id: string, patch: Partial<Holding>) => {
    await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    await mutate();
  }, [mutate]);
  const remove = useCallback(async (id: string) => {
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    await mutate();
  }, [mutate]);
  return { items: data?.items ?? [], add, update, remove, refresh: mutate, error, isLoading };
}

export function useFutures(userId: string | null) {
  const key = userId ? "/api/futures" : null;
  const { data, mutate, error, isLoading } = useSWR<{ items: FuturesPosition[] }>(key, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const add = useCallback(async (input: Omit<FuturesPosition, "id" | "createdAt" | "updatedAt" | "markPrice" | "closed" | "closedAt" | "closePrice" | "realizedPnl" | "liquidation" | "margin"> & { liquidation?: number; margin?: number }) => {
    await fetch("/api/futures", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    await mutate();
  }, [mutate]);
  const update = useCallback(async (id: string, patch: { markPrice?: number; closePrice?: number; close?: boolean; notes?: string | null }) => {
    await fetch(`/api/futures/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    await mutate();
  }, [mutate]);
  const remove = useCallback(async (id: string) => {
    await fetch(`/api/futures/${id}`, { method: "DELETE" });
    await mutate();
  }, [mutate]);
  return { items: data?.items ?? [], add, update, remove, refresh: mutate, error, isLoading };
}

export function useNotes(userId: string | null, symbol?: string) {
  const sp = symbol ? `?symbol=${encodeURIComponent(symbol.toUpperCase())}` : "";
  const key = userId ? `/api/notes${sp}` : null;
  const { data, mutate, error, isLoading } = useSWR<{ items: Note[] }>(key, jsonFetcher, { revalidateOnFocus: false });
  const add = useCallback(async (input: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    await mutate();
  }, [mutate]);
  const update = useCallback(async (id: string, patch: Partial<Note>) => {
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    await mutate();
  }, [mutate]);
  const remove = useCallback(async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await mutate();
  }, [mutate]);
  return { items: data?.items ?? [], add, update, remove, refresh: mutate, error, isLoading };
}

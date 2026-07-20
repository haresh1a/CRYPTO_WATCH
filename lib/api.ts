// Shared helpers for App Router route handlers. Centralises the
// "try { run } catch { format error }" pattern and exposes typed
// JSON helpers.

import { NextResponse } from "next/server";
import { errorResponse } from "./errors";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export function withCache(init: ResponseInit & { maxAge?: number } = {}): ResponseInit {
  const { maxAge = 0, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (maxAge > 0) {
    headers.set("cache-control", `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
  } else {
    headers.set("cache-control", "no-store");
  }
  return { ...rest, headers };
}

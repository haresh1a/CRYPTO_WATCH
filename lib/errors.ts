// Typed error helpers. Every API route should `throw new ApiError(...)`
// for known failure cases and let the global handler turn it into a
// clean JSON response. Anything else is treated as a 500.

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const errors = {
  badRequest:    (msg = "Bad request", details?: unknown)    => new ApiError(400, "bad_request", msg, details),
  unauthorized:  (msg = "Sign in required")                   => new ApiError(401, "unauthorized", msg),
  forbidden:     (msg = "Forbidden")                          => new ApiError(403, "forbidden", msg),
  notFound:      (msg = "Not found")                          => new ApiError(404, "not_found", msg),
  rateLimited:   (msg = "Too many requests", details?: unknown) => new ApiError(429, "rate_limited", msg, details),
  upstream:      (msg = "Upstream service failed", details?: unknown) => new ApiError(502, "upstream_error", msg, details),
  internal:      (msg = "Internal error")                     => new ApiError(500, "internal", msg),
};

export type ApiErrorResponse = {
  error: { code: string; message: string; details?: unknown };
};

export function errorResponse(err: unknown): { status: number; body: ApiErrorResponse } {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, details: err.details } },
    };
  }
  // Don't leak internal error messages to the client.
  console.error("[api] unhandled", err);
  return {
    status: 500,
    body: { error: { code: "internal", message: "Internal error" } },
  };
}

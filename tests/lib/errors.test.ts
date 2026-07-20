import { describe, it, expect } from "vitest";
import { ApiError, errors, errorResponse } from "@/lib/errors";

describe("errors", () => {
  it("errors factory throws the right status + code", () => {
    try { throw errors.badRequest("nope", { x: 1 }); }
    catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.status).toBe(400);
      expect(err.code).toBe("bad_request");
      expect(err.message).toBe("nope");
      expect(err.details).toEqual({ x: 1 });
    }
  });

  it("errorResponse formats ApiError", () => {
    const out = errorResponse(errors.notFound("missing"));
    expect(out.status).toBe(404);
    expect(out.body).toEqual({ error: { code: "not_found", message: "missing" } });
  });

  it("errorResponse hides internals from the client", () => {
    const out = errorResponse(new Error("db password leaked"));
    expect(out.status).toBe(500);
    expect(out.body.error.code).toBe("internal");
    expect(out.body.error.message).toBe("Internal error");
  });
});

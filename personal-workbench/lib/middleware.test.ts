import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "../middleware";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("deployment password gate", () => {
  it("allows local development without a configured password", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_PASSWORD", "");

    expect(middleware(new NextRequest("http://localhost/")).status).toBe(200);
  });

  it("denies production requests when APP_PASSWORD is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_PASSWORD", "");

    const response = middleware(new NextRequest("https://example.test/"));
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("Basic");
  });

  it("protects the data export route with the same gate", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_PASSWORD", "correct horse");

    const response = middleware(new NextRequest("https://example.test/api/export"));
    expect(response.status).toBe(401);
  });

  it("rejects incorrect credentials", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_PASSWORD", "correct horse");

    const request = new NextRequest("https://example.test/", {
      headers: { authorization: `Basic ${btoa("user:wrong")}` },
    });
    expect(middleware(request).status).toBe(401);
  });

  it("accepts the configured password", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_PASSWORD", "correct horse");

    const request = new NextRequest("https://example.test/", {
      headers: { authorization: `Basic ${btoa("any-user:correct horse")}` },
    });
    expect(middleware(request).status).toBe(200);
  });
});

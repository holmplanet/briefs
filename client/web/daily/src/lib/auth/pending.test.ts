import { describe, expect, it } from "vitest";

import { buildPendingOtpRedirect } from "./pending";

describe("Better Auth pending OTP redirect", () => {
  it("does not put email or OAuth parameters in the URL", () => {
    const url = new URL(buildPendingOtpRedirect("/"), "https://briefs.example.com");

    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("otp")).toBe("sent");
    expect(url.searchParams.get("next")).toBe("/");
    expect(url.searchParams.has("email")).toBe(false);
    expect(url.searchParams.has("client_id")).toBe(false);
    expect(url.searchParams.has("code_challenge")).toBe(false);
  });
});

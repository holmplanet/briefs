import { afterEach, describe, expect, it } from "vitest";

import { getBriefsHealthUrls } from "./briefs-api-urls";

describe("briefs health checks", () => {
  afterEach(() => {
    delete process.env.API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("uses the Vercel API health route when the API base is an origin", () => {
    process.env.API_URL = "https://briefs.example.com";

    expect(getBriefsHealthUrls("https://briefs.example.com")).toEqual([
      "https://briefs.example.com/health",
      "https://briefs.example.com/api/health",
    ]);
  });

});

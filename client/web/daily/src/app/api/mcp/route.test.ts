import { afterEach, describe, expect, it } from "vitest";

import { getMcpResourceMetadataUrl } from "../../../lib/mcp-resource";

const originalAppUrl = process.env.APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
});

describe("MCP resource metadata URL", () => {
  it("uses the configured public app URL when the request is proxied internally", () => {
    process.env.APP_URL = "https://briefs.example.com";

    expect(getMcpResourceMetadataUrl(new Request("http://localhost:3000/mcp")))
      .toBe("https://briefs.example.com/.well-known/oauth-protected-resource");
  });

  it("keeps the API route metadata path distinct", () => {
    process.env.APP_URL = "https://briefs.example.com";

    expect(getMcpResourceMetadataUrl(new Request("http://localhost:3000/api/mcp")))
      .toBe("https://briefs.example.com/api/mcp/.well-known/oauth-protected-resource");
  });
});

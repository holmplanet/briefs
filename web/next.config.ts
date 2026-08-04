import type { NextConfig } from "next";
import path from "node:path";

const briefApiUrl = process.env.BRIEF_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${briefApiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

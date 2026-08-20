import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@briefs/mcp", "@briefs/shared", "@briefs/system", "@briefs/web-shared"],
  outputFileTracingIncludes: {
    "/*": ["../../../db/migrations/**/*"],
  },
};

export default nextConfig;

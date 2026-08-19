import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@briefs/mcp", "@briefs/shared", "@briefs/system", "@briefs/web-shared"],
};

export default nextConfig;

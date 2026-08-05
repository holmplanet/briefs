import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@briefs/shared", "@briefs/web-shared"],
};

export default nextConfig;

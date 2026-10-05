import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint removed
  // Required for Docker: bundles a self-contained server in .next/standalone/
  output: "standalone",
};

export default nextConfig;

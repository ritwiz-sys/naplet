import type { NextConfig } from "next";

const appRoot = __dirname;

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: appRoot,
  },
  outputFileTracingRoot: appRoot,
};

export default nextConfig;

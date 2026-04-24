import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow HMR over the LAN IP reported by `next dev`.
  allowedDevOrigins: ["10.198.210.0"],
};

export default nextConfig;

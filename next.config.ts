import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  // Allow HMR over the LAN IP reported by `next dev`.
  allowedDevOrigins: ["10.198.210.0"],
};

export default nextConfig;

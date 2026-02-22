import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hyparquet", "hyparquet-compressors"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;

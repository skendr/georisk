import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hyparquet", "hyparquet-compressors"],
};

export default nextConfig;

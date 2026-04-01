import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['rimraf', 'fstream'],
};

export default nextConfig;

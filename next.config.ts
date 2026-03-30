import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@chenglou/pretext"],
  output: "export",
  basePath: "/pretext-demo",
  images: { unoptimized: true },
};

export default nextConfig;

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  transpilePackages: ["@chenglou/pretext"],
  output: "export",
  basePath: isProd ? "/pretext-demo" : "",
  images: { unoptimized: true },
};

export default nextConfig;

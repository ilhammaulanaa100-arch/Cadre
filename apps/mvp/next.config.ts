import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  transpilePackages: [
    "@mockup-3d/catalog",
    "@mockup-3d/contracts",
    "@mockup-3d/render-scene",
    "@mockup-3d/scene-domain",
  ],
};

export default nextConfig;

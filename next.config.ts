import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**.wyze.com" },
      { protocol: "https", hostname: "**.shopify.com" },
    ],
  },
};

export default nextConfig;

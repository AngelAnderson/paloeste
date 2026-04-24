import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/vitrina/luis-david-refrigeration/:path*",
        destination: "/vitrina/luis-david-refrigeracion/:path*",
        permanent: true,
      },
      {
        source: "/negocio/luis-david-refrigeration/:path*",
        destination: "/negocio/luis-david-refrigeracion/:path*",
        permanent: true,
      },
      {
        source: "/api/vitrina/stats/luis-david-refrigeration",
        destination: "/api/vitrina/stats/luis-david-refrigeracion",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

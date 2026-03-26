import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth-service/:path*",
        destination: "http://localhost:5004/api/v1/:path*",
      },
      {
        source: "/api/main-service/:path*",
        destination: "http://localhost:5001/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;

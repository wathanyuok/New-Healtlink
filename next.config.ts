import type { NextConfig } from "next";

const AUTH_API = process.env.AUTH_API_URL || "http://localhost:5004";
const MAIN_API = process.env.MAIN_API_URL || "http://localhost:5001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth-service/:path*",
        destination: `${AUTH_API}/api/v1/:path*`,
      },
      {
        source: "/api/main-service/:path*",
        destination: `${MAIN_API}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

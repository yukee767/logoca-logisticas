/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // esmExternals: true
  },
  async rewrites() {
    return [
      {
        source: "/api/nest/:path*",
        destination: `${process.env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:3001"}/:path*`,
      },
      {
        source: "/api/fastapi/:path*",
        destination: `${process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"}/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_NEST_API_URL: process.env.NEXT_PUBLIC_NEST_API_URL,
    NEXT_PUBLIC_FASTAPI_URL: process.env.NEXT_PUBLIC_FASTAPI_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

module.exports = nextConfig;

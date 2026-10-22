import type { NextConfig } from "next";

const API_ORIGIN =
  process.env.API_ORIGIN || "http://localhost:5000";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_SOCKET_ORIGIN: process.env.NEXT_PUBLIC_SOCKET_URL || API_ORIGIN },
  async rewrites() {
    return [
      { source: "/socket.io/:path*", destination: `${API_ORIGIN}/socket.io/:path*` },
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "png.pngtree.com",
      },
    ],
  },
};

export default nextConfig;
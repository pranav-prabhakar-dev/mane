/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow phone / LAN devices to hit the dev server. Next blocks
  // cross-origin dev requests by default in 15+/16.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;

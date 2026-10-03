import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/grocery',
        destination: '/cakes-and-bakes',
        permanent: true,
      },
      {
        source: '/grocery/:path*',
        destination: '/cakes-and-bakes',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['bullmq', 'ioredis', '@prisma/client', 'prisma'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@/backend'] = path.resolve(__dirname, '../backend');
    config.resolve.alias['@/frontend'] = path.resolve(__dirname, '.');
    config.resolve.alias['@'] = path.resolve(__dirname, '.');
    config.externals = config.externals || [];
    config.externals.push({
      '@valkey/valkey-glide': 'commonjs @valkey/valkey-glide',
    });
    return config;
  },
};

module.exports = nextConfig;

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['bullmq', 'ioredis', '@prisma/client', 'prisma'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
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

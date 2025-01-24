import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "pino-pretty": false,
      punycode: require.resolve("punycode"),
    };
    return config;
  },
};

export default nextConfig;

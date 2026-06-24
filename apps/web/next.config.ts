import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  transpilePackages: ["@k187/shared", "@k187/db", "@k187/ai"],
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  webpack: (config) => {
    // Resolve ".js" imports in TS source to the actual .ts files.
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default config;

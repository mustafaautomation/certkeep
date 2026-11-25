import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sessions, tenant rows, and the in-memory vault are request-time data.
  // Cache Components stays off so those routes render on each request.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

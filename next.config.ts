// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import path from "node:path";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const REPO_PATH = "/penner-and-daughters";

const nextConfig: NextConfig = {
  // The parent studio folder has its own lockfile; pin the root to this project.
  turbopack: { root: path.resolve(__dirname) },
  // GitHub Pages serves this at github.io/penner-and-daughters/, not the domain root, and it's a plain
  // static file host (no Node server), so export a static build and prefix every path to match.
  // The prefix is production-only so `npm run dev` still serves from localhost root.
  output: "export",
  basePath: isProd ? REPO_PATH : undefined,
  assetPrefix: isProd ? `${REPO_PATH}/` : undefined,
  // GitHub Pages only auto-serves index.html for a directory request, so routes are directories.
  trailingSlash: true,
  // next/link and next/font add basePath on their own; raw URLs (img/video src, fetch, GLBs) don't,
  // so src/lib/base-path.ts reads this and every public/ URL goes through withBase().
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? REPO_PATH : "",
  },

  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  compiler: {
    removeConsole: isProd,
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "@react-three/fiber", "@react-three/drei"],
  },
};

export default nextConfig;

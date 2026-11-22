import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Case-study bodies (4.5): content/case-studies/*.mdx, imported by app/work/[slug]/page.tsx.
// Not pages (pageExtensions unchanged). Components come from mdx-components.tsx.
const withMDX = createMDX({});

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // CLAUDE.md §6: AVIF first, WebP as the fallback (Next serves only WebP by default).
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      // Shaders import as strings (types/glsl.d.ts).
      "*.glsl": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  // The same for webpack builds (npm run analyze uses --webpack).
  webpack: (config: { module: { rules: unknown[] } }) => {
    config.module.rules.push({ test: /\.glsl$/, type: "asset/source" });
    return config;
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site deployed to Cloudflare Pages.
  output: 'export',
  // Pin the workspace root (a parent-dir lockfile otherwise confuses inference).
  turbopack: { root: import.meta.dirname },
  // Static export cannot run the Image Optimization API; images are pre-optimized
  // to WebP at build time (see scripts/optimize-images.mjs) and served as-is.
  images: {
    unoptimized: true,
  },
  // Cleaner static hosting: /about -> /about/index.html
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;

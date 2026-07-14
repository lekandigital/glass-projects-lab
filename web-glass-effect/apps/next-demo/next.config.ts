import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@creatorem/web-glass-effect'],
  // All routes are static; export to a plain out/ folder so the demo deploys as a
  // static site without a Next runtime (added for catalog deploy).
  output: 'export',
};

export default nextConfig;

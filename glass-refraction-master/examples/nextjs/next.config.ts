import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The demo is a single static route; export to out/ so it deploys as a plain
  // static site with no Next runtime.
  output: 'export',
};

export default nextConfig;

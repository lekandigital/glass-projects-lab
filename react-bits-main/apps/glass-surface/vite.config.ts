import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * react-bits is a copy-into-your-tree registry, not an npm package. @lib/* resolves to the
 * react-bits checkout above when it's there (edits hot-reload), and to the vendored copies
 * when it isn't — which is the case on Vercel, where only this folder is uploaded.
 * `npm run check:vendor` fails the build if they've drifted.
 */
const pick = (upstream: string, vendored: string) =>
  fs.existsSync(path.resolve(__dirname, upstream))
    ? path.resolve(__dirname, upstream)
    : path.resolve(__dirname, vendored);

const GLASS_SURFACE = pick('../../src/ts-default/Components/GlassSurface/GlassSurface.tsx', 'src/vendor/GlassSurface.tsx');
const LIQUID_ETHER = pick('../../src/ts-default/Backgrounds/LiquidEther/LiquidEther.tsx', 'src/vendor/LiquidEther.tsx');

const local = (pkg: string) => path.resolve(__dirname, 'node_modules', pkg);

export default defineConfig(() => {
  console.log(`[glass-surface] GlassSurface ← ${path.relative(__dirname, GLASS_SURFACE)}`);

  return {
    plugins: [react()],
    resolve: {
      // The upstream files sit outside this project's resolution scope, so the bare imports
      // they make have to be pinned here or Rollup can't find `three` at all.
      alias: [
        { find: /^@lib\/GlassSurface$/, replacement: GLASS_SURFACE },
        { find: /^@lib\/LiquidEther$/, replacement: LIQUID_ETHER },
        { find: /^three$/, replacement: local('three') },
        { find: /^react$/, replacement: local('react') },
        { find: /^react-dom$/, replacement: local('react-dom') }
      ],
      dedupe: ['three', 'react', 'react-dom']
    },
    server: { fs: { allow: [__dirname, path.resolve(__dirname, '../..')] } },
    build: { chunkSizeWarningLimit: 1500 }
  };
});

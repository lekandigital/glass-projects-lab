import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * react-bits is a copy-into-your-tree registry, not an npm package, so there is no
 * published dependency to fall back on. @lib/FluidGlass resolves to the react-bits
 * checkout above when it's there (edits hot-reload), and to the vendored copy when it
 * isn't — which is the case on Vercel, where only this folder is uploaded.
 * `npm run check:vendor` fails the build if the two have drifted.
 */
const UPSTREAM = path.resolve(__dirname, '../../src/ts-default/Components/FluidGlass/FluidGlass.tsx');
const VENDORED = path.resolve(__dirname, 'src/vendor/FluidGlass.tsx');
const LIB = fs.existsSync(UPSTREAM) ? UPSTREAM : VENDORED;

const local = (pkg: string) => path.resolve(__dirname, 'node_modules', pkg);

export default defineConfig(() => {
  console.log(`[fluid-glass] FluidGlass ← ${path.relative(__dirname, LIB)}`);

  return {
    plugins: [react()],
    resolve: {
      // When LIB is the sibling checkout it sits outside this project's resolution scope,
      // so its bare imports have to be pinned here or Rollup can't find `three` at all.
      alias: [
        { find: /^@lib\/FluidGlass$/, replacement: LIB },
        { find: /^three$/, replacement: local('three') },
        { find: /^@react-three\/fiber$/, replacement: local('@react-three/fiber') },
        { find: /^@react-three\/drei$/, replacement: local('@react-three/drei') },
        { find: /^maath$/, replacement: local('maath') },
        { find: /^react$/, replacement: local('react') },
        { find: /^react-dom$/, replacement: local('react-dom') }
      ],
      dedupe: ['three', '@react-three/fiber', '@react-three/drei', 'react', 'react-dom']
    },
    server: { fs: { allow: [__dirname, path.resolve(__dirname, '../..')] } },
    build: { chunkSizeWarningLimit: 1500 }
  };
});

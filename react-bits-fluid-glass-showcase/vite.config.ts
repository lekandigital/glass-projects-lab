import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * react-bits ships no npm package — components are copied into your tree — so the
 * "published dependency" the deploy falls back to is the vendored copy in src/vendor.
 * When the react-bits checkout is a sibling, @lib/FluidGlass resolves to *its* source
 * instead, so upstream edits hot-reload. `npm run check:vendor` fails the build if the
 * two have drifted, which is what keeps the fallback honest.
 */
const UPSTREAM = path.resolve(__dirname, '../react-bits-main/src/ts-default/Components/FluidGlass/FluidGlass.tsx');
const VENDORED = path.resolve(__dirname, 'src/vendor/FluidGlass.tsx');
const LIB = fs.existsSync(UPSTREAM) ? UPSTREAM : VENDORED;

const local = (pkg: string) => path.resolve(__dirname, 'node_modules', pkg);

export default defineConfig(() => {
  console.log(`[fluid-glass-showcase] FluidGlass ← ${path.relative(__dirname, LIB)}`);

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^@lib\/FluidGlass\?raw$/, replacement: `${LIB}?raw` },
        { find: /^@lib\/FluidGlass$/, replacement: LIB },
        // Pinned because when LIB is the sibling checkout it sits outside this project's
        // node_modules resolution scope, and a second copy of three/fiber would break the
        // `instanceof` checks r3f relies on.
        { find: /^three$/, replacement: local('three') },
        { find: /^@react-three\/fiber$/, replacement: local('@react-three/fiber') },
        { find: /^@react-three\/drei$/, replacement: local('@react-three/drei') },
        { find: /^maath$/, replacement: local('maath') },
        { find: /^react$/, replacement: local('react') },
        { find: /^react-dom$/, replacement: local('react-dom') }
      ],
      dedupe: ['three', '@react-three/fiber', '@react-three/drei', 'react', 'react-dom']
    },
    server: { fs: { allow: [__dirname, path.resolve(__dirname, '../react-bits-main')] } },
    build: { chunkSizeWarningLimit: 1500 }
  };
});

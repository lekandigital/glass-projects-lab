import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * react-bits ships no npm package — components are copied into your tree — so the
 * "published dependency" the deploy falls back to is the vendored copy in src/vendor.
 * When the react-bits checkout is a sibling, @lib/* resolves to *its* source instead, so
 * upstream edits hot-reload. `npm run check:vendor` fails the build if the two have
 * drifted, which is what keeps the fallback honest.
 */
const UP_DIR = path.resolve(__dirname, '../react-bits-main/src/ts-default/Components/GlassSurface');
const VENDOR_DIR = path.resolve(__dirname, 'src/vendor');
const DIR = fs.existsSync(path.join(UP_DIR, 'GlassSurface.tsx')) ? UP_DIR : VENDOR_DIR;

export default defineConfig(() => {
  console.log(`[glass-surface-showcase] GlassSurface ← ${path.relative(__dirname, DIR)}`);

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^@lib\/GlassSurface\.css\?raw$/, replacement: `${path.join(DIR, 'GlassSurface.css')}?raw` },
        { find: /^@lib\/GlassSurface\?raw$/, replacement: `${path.join(DIR, 'GlassSurface.tsx')}?raw` },
        { find: /^@lib\/GlassSurface$/, replacement: path.join(DIR, 'GlassSurface.tsx') },
        // When DIR is the sibling checkout it sits outside this project's resolution scope,
        // so React has to be pinned here or the component loads a second copy of it.
        { find: /^react$/, replacement: path.resolve(__dirname, 'node_modules/react') },
        { find: /^react-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-dom') }
      ],
      dedupe: ['react', 'react-dom']
    },
    server: { fs: { allow: [__dirname, path.resolve(__dirname, '../react-bits-main')] } }
  };
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'motion'],
  treeshake: true,
  minify: false,
});

import { defineConfig } from 'vite';
import typegpuPlugin from 'unplugin-typegpu/vite';

export default defineConfig(({ command }) => {
  return {
    plugins: [typegpuPlugin()],

    // Upstream builds for GitHub Pages under /html-in-canvas/Examples/webgpu-jelly-slider/.
    // Vercel serves this demo at the domain root, so emit relative asset URLs instead —
    // an absolute base here 404s every chunk and the slider never boots.
    base: command === 'build' ? './' : '/',

    // Added to resolve the top-level await build error
    build: {
      target: 'esnext'
    }
  };
});

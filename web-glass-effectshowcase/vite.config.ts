import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Locally, build against the library *source* in the sibling folder, so an edit
 * there shows up here on save.
 *
 * On Vercel only this folder is uploaded — the sibling doesn't exist — so the
 * alias falls away and the build resolves the published `@creatorem/web-glass-effect`
 * from node_modules. Published 0.1.0 and local 0.1.1 have an identical export surface.
 */
const source = fileURLToPath(
  new URL("../web-glass-effect/packages/web-glass-effect/src/index.ts", import.meta.url),
);
const alias: Record<string, string> = existsSync(source)
  ? { "@creatorem/web-glass-effect": source }
  : {};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias,
    // When the alias points at the library *source*, both the library and this
    // demo do bare `import ... from "motion"`. Without dedupe, Vite can load two
    // copies of motion, and the library's `value instanceof MotionValue` check
    // (liquid-lib.ts) then fails across the boundary — every prop is treated as a
    // raw number, dimensions become NaN, and the raster crashes. One motion, one
    // React, and the check holds. (On Vercel, npm already dedupes, so this is a
    // dev-only safety net.)
    dedupe: ["motion", "react", "react-dom"],
  },
  server: { port: 5191, open: true },
});

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Locally, build against the library *source* in the sibling folder, so an edit
 * there shows up here on save.
 *
 * On Vercel only this folder is uploaded — the sibling doesn't exist — so the
 * alias falls away and the build resolves the published `liquid-glass-web-react`
 * package from node_modules instead. Same version (0.1.1), same code.
 */
const source = fileURLToPath(new URL("../liquid-glass-web-react/src/index.ts", import.meta.url));
const alias = existsSync(source) ? { "liquid-glass-web-react": source } : {};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  server: { port: 5190, open: true },
});

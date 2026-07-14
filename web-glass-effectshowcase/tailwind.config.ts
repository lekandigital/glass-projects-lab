import type { Config } from "tailwindcss";

/**
 * The library's components emit Tailwind class names (`bg-white/5`, `rounded-full`,
 * `absolute`, …) but ship only `@tailwind` directives as their stylesheet — so the
 * *consumer's* Tailwind has to scan the library and generate them.
 *
 * Locally that means the aliased sibling source; on Vercel it means the published
 * bundle in node_modules. Both globs are listed; Tailwind skips ones that don't exist.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../web-glass-effect/packages/web-glass-effect/src/**/*.{ts,tsx}",
    "./node_modules/@creatorem/web-glass-effect/dist/*.{mjs,cjs,js}",
  ],
  theme: { extend: {} },
} satisfies Config;

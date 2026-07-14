import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/web-glass-effect/src/**/*.{ts,tsx}',
    '../../packages/web-glass-effect/dist/**/*.{js,mjs,cjs}'
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 18px 60px rgba(92, 164, 255, 0.34)',
      },
      backgroundImage: {
        noise: 'radial-gradient(circle at 0 0, rgba(255,255,255,0.14), transparent 38%), radial-gradient(circle at 100% 100%, rgba(111, 181, 255, 0.2), transparent 28%)',
      },
    },
  },
  plugins: [],
};

export default config;

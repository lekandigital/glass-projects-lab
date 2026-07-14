import { defineConfig, devices } from '@playwright/test';

// Points the same suite at the live deploy, which resolves FluidGlass from the vendored
// copy rather than the sibling checkout — the path Vercel actually builds.
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'https://glass-projects-lab-fluid-showcase.vercel.app',
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    }
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

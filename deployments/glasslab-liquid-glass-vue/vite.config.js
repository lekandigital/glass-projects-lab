import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig(async ({ command }) => {
  const plugins = [vue()]
  if (command === 'serve') {
    try {
      const vueDevTools = (await import('vite-plugin-vue-devtools')).default
      plugins.push(vueDevTools())
    } catch (e) {}
  }
  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})

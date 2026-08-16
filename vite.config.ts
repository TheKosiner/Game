import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    rollupOptions: {
      // Real static pages for the public sub-routes, so /pobierz/ and /logowanie/
      // return 200 with their own <title>/description instead of a SPA 404 redirect.
      input: {
        main:      resolve(__dirname, 'index.html'),
        pobierz:   resolve(__dirname, 'pobierz/index.html'),
        logowanie: resolve(__dirname, 'logowanie/index.html'),
      },
    },
  },
  define: {
    __BUILD_ID__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
    // Monotonic build number injected by CI (github.run_number); 0 in local/dev.
    __APP_BUILD__: JSON.stringify(Number(process.env.VITE_APP_BUILD ?? 0)),
  },
})

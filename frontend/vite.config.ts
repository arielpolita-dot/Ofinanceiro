import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8001,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: 'hidden',
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
})

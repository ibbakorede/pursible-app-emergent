import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  define: {
    'process.env': {},
  },
})

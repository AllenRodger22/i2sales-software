import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // fica estável no build
    },
  },
  build: {
    outDir: 'dist', // Vercel espera isso (ou configure no vercel.json)
  },
  server: {
    proxy: {
      // DEV ONLY: evita CORS no localhost
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}))

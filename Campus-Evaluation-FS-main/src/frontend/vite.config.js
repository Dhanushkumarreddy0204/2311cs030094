import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: [
        // Allow serving files from two levels up (logger package)
        '../..'
      ]
    }
  },
  resolve: {
    alias: {
      '@logger': path.resolve(__dirname, '../logger')
    }
  }
})

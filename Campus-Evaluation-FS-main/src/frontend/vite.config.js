import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        // Allow serving files from one level up to the project root
        '..'
      ]
    }
  },
  resolve: {
    alias: {
      '@logger': path.resolve(__dirname, '../logger')
    }
  }
})

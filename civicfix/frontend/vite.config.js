import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During development, requests to /api and /uploads are forwarded to the Flask server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/uploads': 'http://127.0.0.1:5000',
    },
  },
})

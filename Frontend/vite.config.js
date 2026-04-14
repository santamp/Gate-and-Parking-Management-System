import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Expose on all network interfaces so LAN devices can access the frontend
    host: '0.0.0.0',
    proxy: {
      // Proxy all /api requests to the backend — browser never makes a cross-origin call
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

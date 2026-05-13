import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'YOUR_REPO_NAME' with the actual name of your project on GitHub (e.g., 'adal-help')
export default defineConfig({
  plugins: [react()], // CRITICAL: This fixes the white screen
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist', // Ensures the output matches your deploy.yml path
  }
})
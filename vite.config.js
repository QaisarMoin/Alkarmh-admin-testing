import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://alkarahm.onrender.com', // Backend server
        // target: 'http://localhost:8080', // Backend server
        changeOrigin: true, }}}
})

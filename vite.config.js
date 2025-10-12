import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://alkarahm.onrender.com', // Backend server
        //target: 'http://localhost:4000', // Backend server
        changeOrigin: true, }}}
})

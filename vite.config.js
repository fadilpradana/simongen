import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // agar listen ke semua interface (0.0.0.0)
    port: 5173,              // port default, bisa diubah kalau perlu
    historyApiFallback: true // untuk mendukung SPA routing react-router-dom
  },
})

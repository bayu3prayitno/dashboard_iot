import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages menyajikan situs di /<nama-repo>/, jadi build perlu base ini.
  // Bisa ditimpa lewat env BASE_PATH (mis. '/' jika pakai domain sendiri).
  base: command === 'build' ? (process.env.BASE_PATH ?? '/dashboard_iot/') : '/',
  plugins: [react(), tailwindcss()],
}))

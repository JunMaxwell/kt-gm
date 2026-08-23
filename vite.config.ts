import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from the root of its own domain (kt.ydothien.work), so no base prefix.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

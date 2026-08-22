import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves a project site from /<repo>/, so built asset URLs need that
// prefix. The workflow passes it in; the literal is the fallback so a local build
// resolves too. `preview` opts in as well — otherwise it would serve from / and
// silently test a different base than the one that ships. Dev stays on /.
const base = (process.env.VITE_BASE || '/kt-gm').replace(/\/?$/, '/')

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? base : '/',
  plugins: [react(), tailwindcss()],
}))

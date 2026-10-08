import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/* Link previews need an absolute image URL. Netlify exposes the site address as URL at build time;
   other hosts can pass SITE_URL. Without either, the tag falls back to a relative path. */
const siteUrl = (): Plugin => ({
  name: 'site-url',
  transformIndexHtml(html) {
    const base = (process.env.SITE_URL || process.env.URL || '').replace(/\/+$/, '')
    return html.replace(/%SITE_URL%/g, base ? base + '/' : './')
  },
})

// relative base so the build works on any sub-path (e.g. GitHub Pages: /kotai-dex-prototype/)
export default defineConfig({ base: './', plugins: [react(), siteUrl()] })

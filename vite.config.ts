import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// relative base so the build works on any sub-path (e.g. GitHub Pages: /kotai-dex-prototype/)
export default defineConfig({ base: './', plugins: [react()] })

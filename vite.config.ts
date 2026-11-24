import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base relativa: el build funciona servido bajo cualquier subruta (GitHub Pages en
  // /ovni/, el preview local en /ovni/) sin atar el código al nombre del repo.
  // Es seguro porque la app no tiene router: siempre se carga desde index.html.
  base: './',
})

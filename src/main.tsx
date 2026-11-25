// Tipografía para baja visión servida con la app (sin depender de Google Fonts; OFL-1.1).
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { PreferenciasProvider } from './ui/preferencias'

createRoot(document.getElementById('root')!).render(
  <PreferenciasProvider>
    <App />
  </PreferenciasProvider>,
)

// Sin conexión (app instalada): service worker solo en producción. En desarrollo y en los
// e2e (vite dev) no se registra, para no servir copias antiguas mientras se trabaja.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Sin service worker la app funciona igual, solo que no sin conexión.
    })
  })
}

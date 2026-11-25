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

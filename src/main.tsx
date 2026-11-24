import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { PreferenciasProvider } from './ui/preferencias'

createRoot(document.getElementById('root')!).render(
  <PreferenciasProvider>
    <App />
  </PreferenciasProvider>,
)

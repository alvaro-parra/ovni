import { defineConfig } from '@playwright/test'

// E2e de la UI. Arranca el servidor de Vite y prueba los happy paths del juego.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  webServer: {
    command: 'npm run dev -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 414, height: 896 },
    trace: 'on-first-retry',
  },
})

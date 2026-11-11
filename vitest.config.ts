import { defineConfig } from 'vitest/config'

// Vitest solo ejecuta los tests unitarios del motor (tests/). Los e2e van en e2e/ con Playwright.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
})

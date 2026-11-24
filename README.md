# OVNI

Juego de cartas con baraja española (tipo "ochos locos") para 1 humano contra 1–3 bots.
Web app accesible (móvil primero), pensada para personas mayores con baja visión y niños
pre-lectores.

## Documentación

- [`REQUISITOS.md`](./REQUISITOS.md) — reglas del juego como requisitos funcionales.
- [`REQUISITOS-INTERFAZ.md`](./REQUISITOS-INTERFAZ.md) — requisitos de interfaz y accesibilidad.
- [`TRAZABILIDAD.md`](./TRAZABILIDAD.md) — mapa requisito ↔ test (verificado por `tests/coverage.test.ts`).
- [`LICENCIA-CARTAS.md`](./LICENCIA-CARTAS.md) — crédito de la baraja (Basquetteur, CC BY-SA 3.0).

## Estructura

- `src/cards.ts`, `src/engine.ts`, `src/match.ts` — **motor de juego** (lógica pura, sin UI).
- `src/ui/` — **web app** (React + Vite) cableada al motor.
- `tests/` — tests unitarios del motor (Vitest).
- `e2e/` — tests end-to-end de la UI (Playwright), happy paths.
- `public/cartas/` — imágenes de la baraja.

## Comandos

```bash
npm install
npm run dev        # arranca la web app (http://localhost:5173)
npm test           # tests unitarios del motor (77 tests)
npm run e2e        # tests e2e de la UI (Playwright)
npm run typecheck  # comprobación de tipos
npm run build      # build de producción
npm run demo       # simula una partida completa por terminal (CLI)
```

Parámetros de URL útiles para pruebas: `?seed=N` (partida reproducible), `?fast` (bots sin espera).

## Publicación

GitHub Pages se publica con el workflow [`.github/workflows/pages.yml`](./.github/workflows/pages.yml):
cada push a `main` ejecuta typecheck, tests y build, y despliega `dist/` con `actions/deploy-pages`.
Requiere **Settings → Pages → Source = "GitHub Actions"**. El build usa `base: './'`, así que
funciona bajo cualquier subruta (`/ovni/` en Pages y en el preview local).

import { test, expect, type Page } from '@playwright/test'

// Historias e2e centradas en happy paths. La URL usa ?fast para acelerar los bots
// y ?seed para una partida reproducible.

interface Snapshot {
  screen?: 'fin-ronda' | 'victoria'
  overlay?: 'roba2' | 'palo'
  estado?: string | null
  hasPlayable?: boolean
}

/** Lee el estado visible del DOM de una sola vez (un round-trip por iteración). */
function readState(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const q = (id: string) => document.querySelector(`[data-testid="${id}"]`)
    if (q('fin-ronda')) return { screen: 'fin-ronda' }
    if (q('victoria')) return { screen: 'victoria' }
    if (q('roba2-ok')) return { overlay: 'roba2' }
    if (q('palo-oros')) return { overlay: 'palo' }
    return {
      estado: q('estado')?.getAttribute('data-value') ?? null,
      hasPlayable: !!q('carta-jugable'),
    }
  })
}

/** Juega la ronda en curso automáticamente hasta que aparece el recuento o la victoria. */
async function playRoundToEnd(page: Page): Promise<'fin-ronda' | 'victoria'> {
  for (let i = 0; i < 4000; i++) {
    const s = await readState(page)
    if (s.screen) return s.screen
    if (s.overlay === 'roba2') {
      await page.getByTestId('roba2-ok').click().catch(() => {})
      continue
    }
    if (s.overlay === 'palo') {
      await page.getByTestId('palo-oros').click().catch(() => {})
      continue
    }
    if (s.estado === 'tu' && s.hasPlayable) {
      await page.getByTestId('carta-jugable').first().click().catch(() => {})
      continue
    }
    if (s.estado === 'robar') {
      await page.getByTestId('robar').click().catch(() => {})
      continue
    }
    // Turno de un bot o transición: espera breve.
    await page.waitForTimeout(8)
  }
  throw new Error('La ronda no terminó dentro del límite de pasos')
}

/** Lleva la partida hasta el final (pantalla de victoria). */
async function playToVictory(page: Page): Promise<void> {
  for (let round = 0; round < 120; round++) {
    const res = await playRoundToEnd(page)
    if (res === 'victoria') return
    await page.getByTestId('siguiente-ronda').click()
  }
  throw new Error('La partida no terminó dentro del límite de rondas')
}

async function empezarPartida(page: Page, rivales = 2) {
  await page.goto('/?seed=7&fast=1')
  await expect(page.getByTestId('jugar')).toBeVisible()
  await page.getByTestId(`rivales-${rivales}`).click()
  await page.getByTestId('jugar').click()
  await expect(page.getByTestId('mesa')).toBeVisible()
}

test.describe('OVNI · happy paths', () => {
  test('Historia 1 · Inicio: configurar rivales y avatar y empezar (R-CFG-1, R-CFG-2)', async ({
    page,
  }) => {
    await page.goto('/?seed=7&fast=1')
    await expect(page.getByTestId('jugar')).toBeVisible()

    await page.getByTestId('rivales-3').click()
    await expect(page.getByTestId('rivales-3')).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId('avatar-estrella').click()
    await expect(page.getByTestId('avatar-estrella')).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('jugar').click()
    await expect(page.getByTestId('mesa')).toBeVisible()
    // El banner de estado existe (turno del humano o de un bot).
    await expect(page.getByTestId('estado')).toBeVisible()
  })

  test('Historia 2 · Una ronda completa termina en el recuento (R-OBJ-1, R-OBJ-2)', async ({
    page,
  }) => {
    await empezarPartida(page, 2)
    const res = await playRoundToEnd(page)
    expect(res).toBe('fin-ronda')
    await expect(page.getByTestId('fin-ronda')).toBeVisible()
    // Hay alguien que gana la ronda (quien se queda sin cartas) y botón para seguir.
    await expect(page.getByText('Sin cartas')).toBeVisible()
    await expect(page.getByTestId('siguiente-ronda')).toBeVisible()
  })

  test('Historia 3 · Partida completa hasta un ganador (R-OBJ-3, R-OBJ-4, R-OBJ-5)', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await empezarPartida(page, 3)
    await playToVictory(page)
    await expect(page.getByTestId('victoria')).toBeVisible()
    const estado = await page.getByTestId('victoria').getAttribute('data-value')
    expect(['gana', 'empate', 'eliminado']).toContain(estado)
  })

  test('Historia 4 · Ver mi mano en grande y volver (R-UI accesibilidad)', async ({ page }) => {
    await empezarPartida(page, 2)
    await page.getByTestId('ver-mano').click()
    await expect(page.getByTestId('ver-mano-cerrar')).toBeVisible()
    await page.getByTestId('ver-mano-cerrar').click()
    await expect(page.getByTestId('mesa')).toBeVisible()
  })
  test('Historia 5 · Letra grande y contraste, desde inicio y desde la mesa (R-UI-A11Y-4)', async ({
    page,
  }) => {
    const vista = () =>
      page.evaluate(() => {
        const d = document.querySelector<HTMLElement>('[data-contraste]')!
        return { grande: d.dataset.grande, contraste: d.dataset.contraste }
      })
    await page.goto('/?seed=7&fast=1')
    await page.getByTestId('vista-grande').click()
    await expect(page.getByTestId('vista-grande')).toHaveAttribute('aria-pressed', 'true')
    expect(await vista()).toEqual({ grande: 'true', contraste: 'false' })

    await page.getByTestId('jugar').click()
    await page.getByTestId('abrir-vista').click()
    await page.getByTestId('vista-contraste').click()
    await page.getByTestId('cerrar-vista').click()
    expect(await vista()).toEqual({ grande: 'true', contraste: 'true' })

    // Se recuerda en el dispositivo.
    await page.reload()
    expect(await vista()).toEqual({ grande: 'true', contraste: 'true' })
  })

  test('Historia 7 · Ritmo: la jugada de un bot se ve volar a la mesa; la velocidad se puede cambiar', async ({
    page,
  }) => {
    // Sin ?fast: ritmo real.
    await page.goto('/?seed=7')
    await page.getByTestId('rivales-3').click()
    await page.getByTestId('jugar').click()
    await expect(page.getByTestId('estado')).toHaveAttribute('data-value', 'ia')
    // El bot piensa y después su carta vuela de su ficha a la pila.
    await expect(page.getByTestId('capa-vuelo')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('capa-vuelo')).toBeHidden({ timeout: 5000 })

    await page.getByTestId('abrir-vista').click()
    await page.getByTestId('velocidad-lenta').click()
    await expect(page.getByTestId('velocidad-lenta')).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('cerrar-vista').click()
    await page.reload()
    const guardado = await page.evaluate(() => localStorage.getItem('ovni.vista'))
    expect(JSON.parse(guardado!).velocidad).toBe('lenta')
  })

  test('Historia 9 · «¿Cómo se juega?» abre las reglas resumidas y se cierra', async ({ page }) => {
    await page.goto('/?seed=7&fast=1')
    await page.getByTestId('abrir-reglas').click()
    await expect(page.getByTestId('reglas')).toBeVisible()
    await expect(page.locator('[data-testid^="regla-"]')).toHaveCount(7)
    await expect(page.getByTestId('reglas-ok')).toBeInViewport()
    await page.getByTestId('reglas-ok').click()
    await expect(page.getByTestId('reglas')).toHaveCount(0)
    await expect(page.getByTestId('jugar')).toBeVisible()
  })

  test('Historia 10 · La casita pide confirmación antes de abandonar la partida', async ({ page }) => {
    await empezarPartida(page, 2)
    await page.getByTestId('salir').click()
    await page.getByTestId('seguir-jugando').click()
    await expect(page.getByTestId('mesa')).toBeVisible() // un toque sin querer no pierde nada
    await page.getByTestId('salir').click()
    await page.getByTestId('confirmar-salir').click()
    await expect(page.getByTestId('jugar')).toBeVisible()
  })

  test('Historia 11 · Si la página se recarga, se puede continuar la partida', async ({ page }) => {
    await empezarPartida(page, 2)
    // Estado estable: te toca a ti (con ?fast los bots juegan al instante).
    await expect(page.getByTestId('estado')).toHaveAttribute('data-value', /tu|robar/)
    const cartas = await page.getByTestId('mis-cartas').innerText()
    const mesa = await page.locator('[data-vuelo="pila"]').getAttribute('aria-label')

    await page.reload()
    await page.getByTestId('continuar').click()
    await expect(page.getByTestId('mesa')).toBeVisible()
    await expect(page.getByTestId('mis-cartas')).toHaveText(cartas)
    await expect(page.locator('[data-vuelo="pila"]')).toHaveAttribute('aria-label', mesa!)

    // Salir (confirmando) descarta la partida guardada.
    await page.getByTestId('salir').click()
    await page.getByTestId('confirmar-salir').click()
    await expect(page.getByTestId('continuar')).toHaveCount(0)
  })

  test('Historia 12 · Arrepentirse de la Sota: «Volver» (o Escape) la deja en la mano', async ({ page }) => {
    await page.goto('/?seed=1&fast=1')
    await page.getByTestId('rivales-3').click()
    await page.getByTestId('jugar').click()
    const sota = page.locator('[data-testid="carta-jugable"][aria-label^="Sota"]')
    // Juega (sin usar Sotas) hasta que tengas una Sota jugable.
    for (let i = 0; i < 300 && (await sota.count()) === 0; i++) {
      const s = await readState(page)
      if (s.screen) break
      if (s.overlay === 'roba2') await page.getByTestId('roba2-ok').click().catch(() => {})
      else if (s.estado === 'robar') await page.getByTestId('robar').click().catch(() => {})
      else if (s.estado === 'tu') await page.locator('[data-testid="carta-jugable"]:not([aria-label^="Sota"])').first().click({ timeout: 500 }).catch(() => {})
      else await page.waitForTimeout(20)
    }
    await expect(sota.first()).toBeVisible()
    const cartas = await page.getByTestId('mis-cartas').innerText()
    const mesa = await page.locator('[data-vuelo="pila"]').getAttribute('aria-label')

    await sota.first().click()
    await page.getByTestId('palo-volver').click()
    await expect(page.getByTestId('palo-oros')).toHaveCount(0)
    await expect(page.getByTestId('mis-cartas')).toHaveText(cartas)
    await expect(page.locator('[data-vuelo="pila"]')).toHaveAttribute('aria-label', mesa!)

    // Con teclado: el foco entra en el selector y Escape también cancela.
    await sota.first().click()
    await expect(page.locator('[role="dialog"][aria-label="Elige el palo"]')).toContainText('Elige el palo')
    expect(await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Elige el palo"]'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('palo-oros')).toHaveCount(0)
    await expect(page.getByTestId('mis-cartas')).toHaveText(cartas)
  })

  // Aviso del +2 en los casos límite del mazo (banco de pruebas: e2e/banco/roba2.html).
  for (const [caso, robadas, robo, consecuencia] of [
    ['normal', 2, 'Robas estas 2 cartas', 'Pierdes el turno'],
    ['rebaraje', 2, 'Robas estas 2 cartas', 'Pierdes el turno'],
    ['una', 1, 'Robas 1 carta: no quedaban más', 'Pierdes el turno'],
    ['ninguna', 0, 'No quedan cartas: no robas', 'Pierdes el turno'],
    ['ultima-carta', 2, 'Robas estas 2 cartas', 'fin de la ronda'],
  ] as const) {
    test(`Historia 8 · Aviso +2 «${caso}»: enseña las ${robadas} cartas robadas (R-DOS-1, R-DOS-4, R-MAZO-2)`, async ({
      page,
    }) => {
      await page.goto(`/e2e/banco/roba2.html?caso=${caso}`)
      const aviso = page.getByTestId('aviso-roba2')
      await expect(aviso).toHaveAttribute('data-robadas', String(robadas))
      await expect(page.getByTestId('cartas-robadas').locator('[aria-hidden="true"] img, img')).toHaveCount(robadas)
      await expect(page.getByTestId('roba2-robo')).toContainText(robo)
      await expect(page.getByTestId('roba2-consecuencia')).toContainText(consecuencia)
      await expect(page.getByTestId('roba2-rebaraje')).toHaveCount(caso === 'rebaraje' ? 1 : 0)
      await expect(page.getByTestId('roba2-ok')).toBeInViewport()
    })
  }

  for (const vp of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    test(`Historia 6 · ${vp.width}×${vp.height}: sin scroll horizontal y acción principal visible (R-UI-PLAT-1)`, async ({
      page,
    }) => {
      await page.setViewportSize(vp)
      await page.goto('/?seed=7&fast=1')
      await expect(page.getByTestId('jugar')).toBeInViewport()
      await page.getByTestId('jugar').click()
      await expect(page.getByTestId('mesa')).toBeVisible()
      const anchoDoc = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(anchoDoc).toBeLessThanOrEqual(vp.width)
      const res = await playRoundToEnd(page)
      expect(res).toBe('fin-ronda')
      await expect(page.getByTestId('siguiente-ronda')).toBeInViewport()
    })
  }
})

// Partidas completas a ritmo real (velocidad rápida) para detectar atascos.
// Uso: node robusto.mjs <url> <seedDesde> <seedHasta> <rivales> <limiteSegPorPartida> [WxH]
// Un solo navegador y UNA página a la vez (el sandbox tiene 2 GB): se cierra siempre.
import { chromium } from '@playwright/test'

const [url, desde, hasta, rivales, limiteS, tam = '390x844'] = process.argv.slice(2)
const [vw, vh] = tam.split('x').map(Number)
const b = await chromium.launch()
try {
  for (let seed = Number(desde); seed < Number(hasta); seed++) {
    const p = await b.newPage({ viewport: { width: vw, height: vh } })
    const errs = []
    p.on('pageerror', (e) => errs.push(e.message))
    await p.addInitScript(() => localStorage.setItem('ovni.vista', JSON.stringify({ velocidad: 'rapida' })))
    await p.goto(`${url}?seed=${seed}`)
    const t = (id) => p.locator(`[data-testid="${id}"]`)
    await t(`rivales-${rivales}`).click()
    await t('jugar').click()
    const t0 = Date.now()
    let ultimoCambio = Date.now()
    let prev = ''
    let rondas = 0
    let res = 'limite'
    while (Date.now() - t0 < Number(limiteS) * 1000) {
      const st = await p.evaluate(() => {
        const q = (id) => document.querySelector(`[data-testid="${id}"]`)
        return {
          vic: !!q('victoria'), fin: !!q('fin-ronda'), roba2: !!q('roba2-ok'), palo: !!q('palo-oros'),
          e: q('estado')?.getAttribute('data-value'),
          firma: (document.querySelector('[data-testid=mesa]')?.innerText ?? document.body.innerText).replace(/\s+/g, ''),
        }
      })
      if (st.firma !== prev) { prev = st.firma; ultimoCambio = Date.now() }
      if (Date.now() - ultimoCambio > 8000) { res = 'ATASCO'; break }
      if (st.vic) { res = 'victoria'; break }
      if (st.fin) { rondas++; await t('siguiente-ronda').click().catch(() => {}); continue }
      if (st.roba2) { await t('roba2-ok').click().catch(() => {}); continue }
      if (st.palo) { await t('palo-oros').click().catch(() => {}); continue }
      if (st.e === 'tu') await t('carta-jugable').first().click({ timeout: 300 }).catch(() => {})
      else if (st.e === 'robar') await t('robar').click({ timeout: 300 }).catch(() => {})
      await p.waitForTimeout(100)
    }
    console.log(JSON.stringify({ seed, res, rondas, s: Math.round((Date.now() - t0) / 1000), errs }))
    await p.close()
  }
} finally {
  await b.close()
}

// Prueba «mono»: toques aleatorios a ritmo real (cartas, mazo, menús, Escape, Tab, cambios de
// tamaño de pantalla) durante N segundos. Avisa de errores de la página y de ATASCO (nada cambia
// en 20 s; guarda captura en <dirCapturas>). Un navegador, una página.
// Uso: node mono.mjs <url> <segundos> <semilla> [dirCapturas]
import { chromium } from '@playwright/test'
const [url, segs, seed0, dir = '.'] = process.argv.slice(2)
const b = await chromium.launch()
let rng = Number(seed0) || 1
const rnd = () => ((rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648)
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
  await p.addInitScript(() => localStorage.setItem('ovni.vista', '{"velocidad":"rapida"}'))
  await p.goto(url + '?seed=' + seed0)
  const t0 = Date.now()
  let acciones = 0, partidas = 0, ultimo = '', quieto = Date.now(), atascos = 0
  const tams = [[390, 844], [844, 390], [360, 640], [1024, 768]]
  while (Date.now() - t0 < Number(segs) * 1000) {
    const r = rnd()
    try {
      if (r < 0.03) { const [w, h] = tams[Math.floor(rnd() * tams.length)]; await p.setViewportSize({ width: w, height: h }) }
      else if (r < 0.06) await p.keyboard.press('Escape')
      else if (r < 0.08) await p.keyboard.press('Tab')
      else {
        const els = await p.locator('button:visible').all()
        if (els.length) {
          // preferir lo que hace avanzar: más peso a cartas jugables, robar, vale, siguiente
          const pref = await p.locator('[data-testid=carta-jugable]:visible, [data-testid=robar][aria-disabled=false], [data-testid=roba2-ok], [data-testid=siguiente-ronda], [data-testid^=palo-]:visible, [data-testid=jugar-otra], [data-testid=jugar]').all()
          const pool = rnd() < 0.7 && pref.length ? pref : els
          const el = pool[Math.floor(rnd() * pool.length)]
          const id = await el.getAttribute('data-testid').catch(() => '')
          if (id === 'confirmar-salir' && rnd() < 0.7) { /* no salir casi nunca */ }
          else await el.click({ timeout: 400, force: false }).catch(() => {})
          if (id === 'jugar' || id === 'jugar-otra') partidas++
        }
      }
      acciones++
    } catch {}
    const estado = await p.evaluate(() => document.body.innerText.length + '|' + (document.querySelector('[data-testid=estado]')?.getAttribute('data-value') ?? '') + '|' + (document.querySelector('[data-testid=mis-cartas]')?.textContent ?? '') + '|' + document.querySelectorAll('[data-vuelo]').length).catch(() => '')
    if (estado !== ultimo) { ultimo = estado; quieto = Date.now() }
    else if (Date.now() - quieto > 20000) { atascos++; console.log('ATASCO? ' + estado); await p.screenshot({ path: `${dir}/atasco-${atascos}.png` }); quieto = Date.now() }
    await p.waitForTimeout(40 + rnd() * 260)
  }
  console.log(JSON.stringify({ acciones, partidas, atascos, errs: [...new Set(errs)].slice(0, 10) }))
} finally { await b.close() }

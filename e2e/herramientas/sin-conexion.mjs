// Comprueba que la app instalada funciona sin conexión (service worker).
// Uso: node sin-conexion.mjs <url-del-build>   (vite preview; en dev no hay service worker)
import { chromium } from '@playwright/test'

const [url] = process.argv.slice(2)
const b = await chromium.launch()
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(url)
  await p.evaluate(() => navigator.serviceWorker.ready)
  await p.waitForTimeout(500)
  const guardadas = await p.evaluate(async () => (await (await caches.open('ovni-v1')).keys()).length)
  console.log('ficheros en caché tras la primera visita:', guardadas)

  await ctx.setOffline(true)
  await p.reload()
  await p.locator('[data-testid=jugar]').waitFor({ timeout: 5000 })
  const fuente = await p.evaluate(async () => (await document.fonts.ready, document.fonts.check('700 20px "Atkinson Hyperlegible"')))
  await p.goto(url + '?fast&seed=7').catch(() => {})
  await p.locator('[data-testid=rivales-3]').click()
  await p.locator('[data-testid=jugar]').click()
  await p.locator('[data-testid=estado]').waitFor()
  await p.waitForTimeout(500)
  const imgs = await p.$$eval('[data-testid=mesa] img', (is) => is.map((i) => i.complete && i.naturalWidth > 0))
  console.log(`sin conexión: inicio OK · fuente ${fuente ? 'OK' : 'NO'} · imágenes de la mesa ${imgs.filter(Boolean).length}/${imgs.length}`, errs.length ? 'ERR ' + errs.join(' | ') : '')
} finally {
  await b.close()
}

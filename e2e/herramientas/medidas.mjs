// Mide el ancho (px reales) de las cartas de tu mano y de la carta de la mesa a varios
// tamaños, en tu primer turno. Uso: node medidas.mjs <url> <seed> <rivales> <WxH,...> [vistaJSON]
import { chromium } from '@playwright/test'

const [url, seed, rivales, tamanos, vista] = process.argv.slice(2)
const b = await chromium.launch()
try {
  for (const tam of tamanos.split(',')) {
    const [w, h] = tam.split('x').map(Number)
    const p = await b.newPage({ viewport: { width: w, height: h } })
    if (vista) await p.addInitScript((v) => localStorage.setItem('ovni.vista', v), vista)
    await p.goto(`${url}?fast&seed=${seed}`)
    await p.locator(`[data-testid=rivales-${rivales}]`).click()
    await p.locator('[data-testid=jugar]').click()
    if (await p.locator('[data-testid=roba2-ok]').count()) await p.locator('[data-testid=roba2-ok]').click()
    await p.locator('[data-testid=estado][data-value=tu], [data-testid=estado][data-value=robar]').first().waitFor()
    const m = await p.evaluate(() => {
      const anchos = [...document.querySelectorAll('[data-testid=zona-mano] [data-vuelo^=carta-]')].map((e) => Math.round(e.getBoundingClientRect().width))
      const pila = document.querySelector('[data-vuelo=pila]').getBoundingClientRect()
      const banner = document.querySelector('[data-testid=estado]').getBoundingClientRect()
      return { mano: anchos, pila: Math.round(pila.width), bannerAlto: Math.round(banner.height) }
    })
    console.log(tam.padEnd(9), `mano ${m.mano.length} cartas de ${Math.min(...m.mano)}–${Math.max(...m.mano)} px · mesa ${m.pila} px · banner ${m.bannerAlto} px`)
    await p.close()
  }
} finally {
  await b.close()
}

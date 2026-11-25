// Capturas del banco de la mesa con manos de varios tamaños. Uso (con vite dev en :5199):
// node banco-mesa.mjs <baseUrl> <salida.png> <WxH> <cartas:jugables,...>
import { chromium } from '@playwright/test'
const [base, salida, tam, casos] = process.argv.slice(2)
const [w, h] = tam.split('x').map(Number)
const b = await chromium.launch()
try {
  const fotos = []
  for (const caso of casos.split(',')) {
    const [c, j] = caso.split(':')
    const p = await b.newPage({ viewport: { width: w, height: h } })
    const errs = []
    p.on('pageerror', (e) => errs.push(e.message))
    await p.goto(`${base}e2e/banco/mesa.html?cartas=${c}&jugables=${j}`)
    await p.locator('[data-testid=zona-mano]').waitFor()
    await p.waitForTimeout(400)
    const m = await p.evaluate(() => {
      const z = document.querySelector('[data-testid=zona-mano]')
      const visibles = [...z.querySelectorAll('[data-vuelo^=carta-]')].filter((e) => { const r = e.getBoundingClientRect(); const R = z.getBoundingClientRect(); return r.bottom <= R.bottom + 2 && r.height > 0 })
      return `${visibles.length} cartas visibles de ${Math.round(visibles[0]?.getBoundingClientRect().width ?? 0)} px`
    })
    fotos.push({ png: (await p.screenshot()).toString('base64'), r: `${c} cartas, ${j} jugables · ${m}${errs.length ? ' · ERR' : ''}` })
    await p.close()
  }
  console.log(fotos.map((f) => f.r).join('\n'))
  const hoja = await b.newPage({ viewport: { width: 1400, height: 800 } })
  const celdas = fotos.map((f) => `<div><img style="width:100%;display:block" src="data:image/png;base64,${f.png}"><div>${f.r}</div></div>`).join('')
  await hoja.setContent(`<body style="margin:0;background:#222;color:#fff;font:14px sans-serif"><div style="display:grid;grid-template-columns:repeat(${Math.min(5, fotos.length)},1fr);gap:6px">${celdas}</div></body>`)
  await hoja.waitForTimeout(200)
  await hoja.screenshot({ path: salida, fullPage: true })
} finally {
  await b.close()
}

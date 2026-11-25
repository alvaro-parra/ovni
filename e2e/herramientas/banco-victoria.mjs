// Capturas de la pantalla final en sus 5 variantes (banco e2e/banco/victoria.html).
// Uso (con vite dev en :5199): node banco-victoria.mjs <baseUrl> <salida.png> [WxH]
import { chromium } from '@playwright/test'
const [base, salida, tam = '390x844'] = process.argv.slice(2)
const [vw, vh] = tam.split('x').map(Number)
const b = await chromium.launch()
try {
  const fotos = []
  for (const caso of ['gana', 'gana-menos', 'empate', 'eliminado', 'eliminado-menos']) {
    const p = await b.newPage({ viewport: { width: vw, height: vh } })
    const errs = []; p.on('pageerror', (e) => errs.push(e.message))
    await p.goto(`${base}e2e/banco/victoria.html?caso=${caso}`)
    await p.locator('[data-testid=victoria]').waitFor(); await p.waitForTimeout(300)
    fotos.push({ png: (await p.screenshot()).toString('base64'), r: caso + (errs.length ? ' ERR ' + errs.join('|') : '') })
    await p.close()
  }
  const hoja = await b.newPage({ viewport: { width: 1400, height: 800 } })
  await hoja.setContent('<body style="margin:0;background:#222;color:#fff;font:14px sans-serif"><div style="display:grid;grid-template-columns:repeat(' + (vw > vh ? 3 : 5) + ',1fr);gap:6px">' + fotos.map((f) => '<div><img style="width:100%" src="data:image/png;base64,' + f.png + '"><div>' + f.r + '</div></div>').join('') + '</div></body>')
  await hoja.waitForTimeout(200); await hoja.screenshot({ path: salida, fullPage: true })
} finally { await b.close() }

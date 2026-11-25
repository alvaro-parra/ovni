// Tira de fotogramas a ritmo real (sin ?fast): captura cada `paso` ms durante `ms` y monta
// una hoja de contactos con el estado de cada fotograma (turno, vuelo, aviso).
// Uso: node tira.mjs <url> <salida.png> <WxH> <seed> <rivales> <ms> <paso> [desde] [hasta]
// Juega por ti (primera carta jugable, roba si hace falta, Oros con la Sota).
import { chromium } from '@playwright/test'

const [url, salida, tam, seed, rivales, ms, paso, desde = '0', hasta = '999'] = process.argv.slice(2)
const [w, h] = tam.split('x').map(Number)
const b = await chromium.launch()
try {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  const t = (id) => p.locator(`[data-testid="${id}"]`)
  await p.goto(`${url}?seed=${seed}`)
  await t(`rivales-${rivales}`).click()
  await t('jugar').click()
  const fotos = []
  const t0 = Date.now()
  while (Date.now() - t0 < Number(ms)) {
    const st = await p.evaluate(() => {
      const q = (id) => document.querySelector(`[data-testid="${id}"]`)
      return {
        e: q('estado')?.getAttribute('data-value') ?? '', vuelo: !!q('capa-vuelo'),
        aviso: q('aviso')?.getAttribute('data-value') ?? '', roba2: !!q('roba2-ok'), palo: !!q('palo-oros'), fin: !!q('fin-ronda'),
      }
    })
    const i = fotos.length
    if (i >= Number(desde) && i <= Number(hasta)) {
      fotos.push({ png: (await p.screenshot()).toString('base64'), r: `#${i} ${Date.now() - t0}ms ${st.e}${st.vuelo ? ' VUELO' : ''}${st.aviso ? ' AVISO:' + st.aviso : ''}` })
    } else fotos.push(null)
    if (st.roba2) await t('roba2-ok').click().catch(() => {})
    else if (st.palo) await t('palo-oros').click().catch(() => {})
    else if (st.fin) await t('siguiente-ronda').click().catch(() => {})
    else if (st.e === 'tu' && !st.vuelo && !st.aviso) await t('carta-jugable').first().click({ timeout: 300 }).catch(() => {})
    else if (st.e === 'robar' && !st.vuelo) await t('robar').click({ timeout: 300 }).catch(() => {})
    await p.waitForTimeout(Number(paso))
  }
  const sel = fotos.filter(Boolean)
  console.log(`${fotos.length} fotogramas, ${sel.length} en la hoja`, errs.length ? 'ERR ' + errs.join(' | ') : 'sin errores')
  await p.close()
  const hoja = await b.newPage({ viewport: { width: 1400, height: 800 } })
  const cols = w > h ? 3 : 6
  const celdas = sel.map((f) => `<div><img style="width:100%;display:block" src="data:image/png;base64,${f.png}"><div>${f.r}</div></div>`).join('')
  await hoja.setContent(`<body style="margin:0;background:#222;color:#fff;font:13px sans-serif"><div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px">${celdas}</div></body>`)
  await hoja.waitForTimeout(200)
  await hoja.screenshot({ path: salida, fullPage: true })
} finally {
  await b.close()
}

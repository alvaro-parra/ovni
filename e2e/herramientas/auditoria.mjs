// Recorre una partida (?fast) capturando cada pantalla. Uso:
// node auditoria.mjs <baseUrl> <salida.png> <WxH> <seed> <rivales> [vistaJSON]
import { chromium } from '@playwright/test'

const [base, salida, tam, seed, rivales, vista] = process.argv.slice(2)
const [w, h] = tam.split('x').map(Number)
const b = await chromium.launch()
try {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  if (vista) await p.addInitScript((v) => localStorage.setItem('ovni.vista', v), vista)
  const fotos = []
  const foto = async (r) => fotos.push({ png: (await p.screenshot()).toString('base64'), r })
  const t = (id) => p.locator(`[data-testid="${id}"]`)
  await p.goto(`${base}?fast&seed=${seed}`)
  await foto('inicio')
  await t(`rivales-${rivales}`).click()
  await t('jugar').click()
  await p.waitForTimeout(300)
  await foto('mesa')
  const hecho = new Set()
  for (let i = 0; i < 6000; i++) {
    const st = await p.evaluate(() => {
      const q = (id) => document.querySelector(`[data-testid="${id}"]`)
      return {
        vic: !!q('victoria'), fin: !!q('fin-ronda'), roba2: !!q('roba2-ok'), palo: !!q('palo-oros'),
        e: q('estado')?.getAttribute('data-value'), n: Number(q('mis-cartas')?.textContent ?? 0),
      }
    })
    if (st.vic) { await foto('victoria'); break }
    if (st.fin) { if (!hecho.has('fin')) { hecho.add('fin'); await foto('fin de ronda') } await t('siguiente-ronda').click().catch(() => {}); continue }
    if (st.roba2) { if (!hecho.has('r2')) { hecho.add('r2'); await foto('aviso +2') } await t('roba2-ok').click().catch(() => {}); continue }
    if (st.palo) { if (!hecho.has('palo')) { hecho.add('palo'); await foto('elige palo') } await t('palo-oros').click().catch(() => {}); continue }
    if (st.n >= 8 && (st.e === 'tu' || st.e === 'robar') && !hecho.has('mano')) { hecho.add('mano'); await foto(`mano ${st.n} (${st.e})`) }
    if (st.e === 'tu') { await t('carta-jugable').first().click({ timeout: 300 }).catch(() => {}); continue }
    if (st.e === 'robar') { await t('robar').click({ timeout: 300 }).catch(() => {}); continue }
    await p.waitForTimeout(15)
  }
  console.log(fotos.map((f) => f.r).join(' | '), errs.length ? 'ERR ' + errs.join('|') : 'sin errores')
  await p.close()
  const hoja = await b.newPage({ viewport: { width: 1400, height: 800 } })
  const celdas = fotos.map((f) => `<div><img style="width:100%;display:block" src="data:image/png;base64,${f.png}"><div>${f.r}</div></div>`).join('')
  await hoja.setContent(`<body style="margin:0;background:#222;color:#fff;font:14px sans-serif"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;align-items:start">${celdas}</div></body>`)
  await hoja.waitForTimeout(200)
  await hoja.screenshot({ path: salida, fullPage: true })
} finally {
  await b.close()
}

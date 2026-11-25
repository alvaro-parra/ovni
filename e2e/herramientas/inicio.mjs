// Pantalla de inicio a varios tamaños, en una hoja de contactos (sin jugar).
// Uso: node inicio.mjs <url> <salida.png> <WxH,WxH,...> [vistaJSON] [estadoJSON]
//   estadoJSON: claves de localStorage a fijar, p. ej. '{"ovni.reglasVistas":"1"}'
import { chromium } from '@playwright/test'

const [url, salida, tams, vista, estado] = process.argv.slice(2)
const b = await chromium.launch()
try {
  const fotos = []
  for (const tam of tams.split(',')) {
    const [w, h] = tam.split('x').map(Number)
    const p = await b.newPage({ viewport: { width: w, height: h } })
    const errs = []
    p.on('pageerror', (e) => errs.push(e.message))
    await p.addInitScript(
      ([v, e]) => {
        if (v) localStorage.setItem('ovni.vista', v)
        for (const [k, x] of Object.entries(e ? JSON.parse(e) : {})) localStorage.setItem(k, String(x))
      },
      [vista ?? '', estado ?? ''],
    )
    await p.goto(url)
    await p.getByTestId('jugar').waitFor()
    await p.waitForTimeout(300)
    fotos.push({ png: (await p.screenshot()).toString('base64'), r: tam + (errs.length ? ' ERR ' + errs.join('|') : '') })
    await p.close()
  }
  const hoja = await b.newPage({ viewport: { width: 1400, height: 800 } })
  await hoja.setContent(
    '<body style="margin:0;background:#222;color:#fff;font:14px sans-serif"><div style="display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap">' +
      fotos.map((f) => '<div style="max-width:' + Math.floor(1380 / fotos.length) + 'px"><img style="width:100%" src="data:image/png;base64,' + f.png + '"><div>' + f.r + '</div></div>').join('') +
      '</div></body>',
  )
  await hoja.waitForTimeout(200)
  await hoja.screenshot({ path: salida, fullPage: true })
  console.log(fotos.map((f) => f.r).join(' | '))
} finally {
  await b.close()
}

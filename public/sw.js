// Service worker de OVNI: permite abrir y jugar sin conexión (p. ej. la app instalada en
// una tableta con wifi irregular). Escrito a mano, sin dependencias.
//
// - Página (navegación): RED PRIMERO. Con conexión siempre llega la última versión
//   publicada; sin conexión, la copia guardada.
// - assets/ (JS, CSS, fuentes; llevan hash en el nombre y nunca cambian): CACHÉ PRIMERO.
// - Cartas, iconos, manifiesto: se sirven de la caché y se actualizan en segundo plano.
// - Al instalarse precarga todo lo necesario, así funciona sin red desde la primera visita.
const CACHE = 'ovni-v1'
const BASE = new URL('./', self.location).href

const PALOS = ['oros', 'copas', 'espadas', 'bastos']
const VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]
const FIJOS = [
  'manifest.webmanifest',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/apple-touch-icon.png',
  'cartas/dorso.png',
  ...PALOS.flatMap((p) => VALORES.map((v) => `cartas/${p}_${v}.png`)),
]

async function precargar() {
  const cache = await caches.open(CACHE)
  const res = await fetch(BASE, { cache: 'no-cache' })
  const html = await res.clone().text()
  await cache.put(BASE, res)
  const urls = new Set(FIJOS)
  for (const m of html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)) urls.add(m[1])
  // Las fuentes las referencia el CSS (url(./fuente.woff2), relativo a assets/).
  for (const css of [...urls].filter((u) => u.endsWith('.css'))) {
    const texto = await (await fetch(BASE + css)).text()
    for (const m of texto.matchAll(/url\(\.\/([^)]+)\)/g)) urls.add('assets/' + m[1])
  }
  await cache.addAll([...urls].map((u) => BASE + u))
}

/**
 * Tras cada publicación, el JS y el CSS cambian de nombre (hash) y los viejos se quedarían en
 * la caché para siempre. Con la página nueva en la mano, se borran los de assets/ que ya no
 * usa (las fuentes no: las referencia el CSS y casi nunca cambian).
 */
async function podar(res) {
  try {
    const html = await res.text()
    const usados = new Set([...html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)].map((m) => BASE + m[1]))
    if (usados.size === 0) return // página rara: mejor no tocar nada
    const cache = await caches.open(CACHE)
    for (const req of await cache.keys()) {
      const u = req.url.split('?')[0]
      if (u.includes('/assets/') && /\.(js|css)$/.test(u) && !usados.has(u)) await cache.delete(req)
    }
  } catch {
    // sin poda esta vez; no afecta al funcionamiento
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(precargar().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || !url.href.startsWith(BASE)) return

  if (req.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          if (res.ok) {
            const cache = await caches.open(CACHE)
            await cache.put(BASE, res.clone())
            e.waitUntil(podar(res.clone()))
          }
          return res
        } catch {
          return (await caches.match(BASE, { ignoreVary: true })) ?? Response.error()
        }
      })(),
    )
    return
  }

  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      (async () => {
        // ignoreVary: las fuentes se piden en modo CORS (con Origin) y el servidor responde
        // con «Vary: Origin»; la copia precargada no llevaba Origin y no «coincidiría».
        const guardada = await caches.match(req, { ignoreVary: true })
        if (guardada) return guardada
        const res = await fetch(req)
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone())
        return res
      })(),
    )
    return
  }

  // Resto (cartas, iconos, manifiesto): de la caché si está, y se refresca por detrás.
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const guardada = await cache.match(req, { ignoreSearch: true, ignoreVary: true })
      const red = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => undefined)
      if (guardada) {
        e.waitUntil(red)
        return guardada
      }
      return (await red) ?? Response.error()
    })(),
  )
})

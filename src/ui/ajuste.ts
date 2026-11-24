// Cálculo del tamaño de carta que cabe en un hueco (R-UI-PLAT-1). Lógica pura, sin DOM.

/** Proporción alto/ancho de las cartas (260 × 401 px). */
export const PROPORCION_CARTA = 1.542

export interface Hueco {
  /** Ancho y alto disponibles, en px. */
  ancho: number
  alto: number
  /** Separación entre columnas y entre filas. */
  gapX: number
  gapY: number
  /** Espacio reservado encima de la primera fila (la carta jugable "sube" y lleva marca). */
  margenSup?: number
}

export interface Rejilla {
  cols: number
  filas: number
  /** Ancho de carta resultante (entero, en px). */
  w: number
}

/**
 * Elige el número de columnas que permite la carta más grande para `n` cartas en el hueco,
 * sin pasar de `maxW` ni bajar de `minW` (si ni con `minW` cabe, se devuelve `minW` y el
 * contenedor recortará o hará scroll). Ante empate se prefieren menos filas.
 */
export function ajustarRejilla(n: number, h: Hueco, maxW: number, minW = 36): Rejilla {
  if (n <= 0) return { cols: 1, filas: 0, w: maxW }
  const margenSup = h.margenSup ?? 0
  let mejor: Rejilla = { cols: n, filas: 1, w: 0 }
  for (let cols = 1; cols <= n; cols++) {
    const filas = Math.ceil(n / cols)
    const porAncho = (h.ancho - (cols - 1) * h.gapX) / cols
    const porAlto = (h.alto - margenSup - (filas - 1) * h.gapY) / filas / PROPORCION_CARTA
    const w = Math.floor(Math.min(maxW, porAncho, porAlto))
    if (w > mejor.w || (w === mejor.w && filas < mejor.filas)) mejor = { cols, filas, w }
  }
  return { ...mejor, w: Math.max(minW, mejor.w) }
}

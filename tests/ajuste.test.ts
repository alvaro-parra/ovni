import { describe, expect, it } from 'vitest'
import { ajustarRejilla, PROPORCION_CARTA } from '../src/ui/ajuste'

// Tests de la UI responsive (R-UI-PLAT-1). No son reglas del juego: no entran en TRAZABILIDAD.
describe('ajustarRejilla (R-UI-PLAT-1)', () => {
  const hueco = { ancho: 334, alto: 400, gapX: 8, gapY: 20, margenSup: 18 }

  it('respeta el tamaño máximo cuando sobra sitio', () => {
    expect(ajustarRejilla(3, { ...hueco, alto: 2000 }, 96).w).toBe(96)
  })

  it('el resultado cabe a lo ancho y a lo alto', () => {
    for (let n = 1; n <= 12; n++) {
      const r = ajustarRejilla(n, hueco, 200)
      expect(r.cols * r.filas).toBeGreaterThanOrEqual(n)
      expect(r.cols * r.w + (r.cols - 1) * hueco.gapX).toBeLessThanOrEqual(hueco.ancho)
      const alto = hueco.margenSup + r.filas * r.w * PROPORCION_CARTA + (r.filas - 1) * hueco.gapY
      expect(alto).toBeLessThanOrEqual(hueco.alto + 1)
    }
  })

  it('en un hueco bajo y ancho pone las cartas en una sola fila', () => {
    const r = ajustarRejilla(5, { ancho: 600, alto: 160, gapX: 6, gapY: 20 }, 200)
    expect(r.filas).toBe(1)
  })

  it('no baja del mínimo aunque no quepa', () => {
    expect(ajustarRejilla(12, { ancho: 50, alto: 50, gapX: 6, gapY: 6 }, 96, 36).w).toBe(36)
  })
})

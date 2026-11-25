import { describe, expect, it } from 'vitest'
import { ALTO_REF_MESA, ALTO_REF_PANTALLA, calcularEscala } from '../src/ui/Pantalla'

// UI responsive (R-UI-PLAT-1). No son reglas del juego: no entran en TRAZABILIDAD.
describe('calcularEscala (R-UI-PLAT-1)', () => {
  it('en móvil no reduce nunca: escala 1 y el marco mide lo que la pantalla', () => {
    expect(calcularEscala(320, 568, ALTO_REF_MESA)).toEqual({ s: 1, w: 320, h: 568, left: 0 })
  })

  it('en tablet y escritorio amplía y el marco llena el alto', () => {
    for (const [vw, vh] of [[768, 1024], [1440, 900], [1024, 768]]) {
      for (const ref of [ALTO_REF_MESA, ALTO_REF_PANTALLA]) {
        const e = calcularEscala(vw, vh, ref)
        expect(e.s).toBeGreaterThanOrEqual(1)
        expect(e.h * e.s).toBeCloseTo(vh)
        expect(e.w * e.s).toBeLessThanOrEqual(vw + 0.001)
        expect(e.left).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('limita el ancho de diseño y centra el marco en pantallas anchas', () => {
    const e = calcularEscala(1920, 1080, ALTO_REF_MESA)
    expect(e.w).toBe(560)
    expect(e.left).toBeCloseTo((1920 - 560 * e.s) / 2)
  })

  it('no pasa de la escala máxima', () => {
    expect(calcularEscala(3840, 2160, ALTO_REF_MESA).s).toBe(1.8)
  })

  it('modo grande: amplía ×1,25 si cabe, pero sin bajar de 320 px de ancho de diseño', () => {
    expect(calcularEscala(414, 896, ALTO_REF_MESA, 1.25).s).toBeCloseTo(1.2938, 3) // 414/320
    expect(calcularEscala(390, 844, ALTO_REF_MESA, 1.25).w).toBeCloseTo(320)
    const pequeno = calcularEscala(360, 640, ALTO_REF_MESA, 1.25)
    expect(pequeno.s).toBeCloseTo(1.125)
    expect(pequeno.w).toBeCloseTo(320)
    // En un móvil muy estrecho no amplía nada, pero tampoco reduce.
    expect(calcularEscala(320, 568, ALTO_REF_MESA, 1.25).s).toBe(1)
    // En escritorio el ×1,25 completo.
    const esc = calcularEscala(1440, 900, ALTO_REF_MESA, 1.25)
    expect(esc.s).toBeCloseTo(Math.min(1.8, (900 / 700) * 1.25))
  })
})

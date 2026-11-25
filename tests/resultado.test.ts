import { describe, expect, it } from 'vitest'
import { applyRoundResult, createMatch } from '../src/match'
import { estaFuera, ordenClasificacion, resumenFinal, textoEliminados } from '../src/ui/resultado'

// Mensajes de la pantalla final (UI). Se apoyan en R-OBJ-4 / R-OBJ-5 del motor.
describe('resumenFinal: mensaje de la pantalla final', () => {
  // Caso real reportado: Toby eliminado antes con 101; en la última ronda quedan Tú y Robi,
  // ambos pasan de 101 y ganas tú por tener menos (109 < 112).
  function partidaReportada() {
    let m = createMatch(['yo', 'toby', 'pixel', 'robi'], 0)
    m = applyRoundResult(m, { winnerId: 'robi', handPoints: { yo: 60, toby: 101, pixel: 110, robi: 0 } })
    m = applyRoundResult(m, { winnerId: null, handPoints: { yo: 49, robi: 112 } })
    return m
  }

  it('R-OBJ-5: ganas por menos puntos cuando todos pasan de 101 (no "único por debajo")', () => {
    const m = partidaReportada()
    expect(m.winners).toEqual(['yo'])
    expect(resumenFinal(m, 'yo')).toEqual({ estado: 'gana', motivo: 'menos-puntos' })
  })

  it('R-OBJ-5 visto por el que pierde', () => {
    expect(resumenFinal(partidaReportada(), 'robi')).toEqual({ estado: 'eliminado', motivo: 'menos-puntos' })
  })

  it('R-OBJ-4: el único por debajo de 101', () => {
    let m = createMatch(['yo', 'b'], 0)
    m = applyRoundResult(m, { winnerId: 'yo', handPoints: { yo: 0, b: 120 } })
    expect(resumenFinal(m, 'yo')).toEqual({ estado: 'gana', motivo: 'por-debajo' })
    expect(resumenFinal(m, 'b')).toEqual({ estado: 'eliminado', motivo: 'por-debajo' })
  })

  it('R-OBJ-5 con empate', () => {
    let m = createMatch(['yo', 'b'], 0)
    m = applyRoundResult(m, { winnerId: null, handPoints: { yo: 105, b: 105 } })
    expect(resumenFinal(m, 'yo')).toEqual({ estado: 'empate', motivo: 'menos-puntos' })
  })

  it('R-OBJ-5: quien pierde por tener más puntos cuenta como fuera aunque el motor no lo marque', () => {
    const m = partidaReportada() // Robi 112 pierde contra Tú 109 en la última ronda
    const robi = m.players.find((p) => p.id === 'robi')!
    expect(robi.eliminated).toBe(false) // así lo deja el motor
    expect(estaFuera(robi, m)).toBe(true)
    expect(estaFuera(m.players.find((p) => p.id === 'yo')!, m)).toBe(false) // gana
    expect(estaFuera(m.players.find((p) => p.id === 'toby')!, m)).toBe(true) // eliminado antes
  })

  it('la clasificación pone al ganador arriba aunque otro eliminado antes tenga menos puntos', () => {
    const m = partidaReportada()
    expect(ordenClasificacion(m.players, m.winners!).map((p) => p.id)).toEqual(['yo', 'toby', 'pixel', 'robi'])
  })
})

describe('textoEliminados: nota del fin de ronda', () => {
  it('nadie: sin nota', () => expect(textoEliminados([], false)).toBeNull())
  it('un rival', () => expect(textoEliminados(['Robi'], false)).toBe('Robi queda fuera: llega a 101 puntos o más'))
  it('varios rivales (CL-1)', () =>
    expect(textoEliminados(['Robi', 'Pixel', 'Toby'], false)).toBe('Robi, Pixel y Toby quedan fuera: llegan a 101 puntos o más'))
  it('tú solo', () => expect(textoEliminados([], true)).toBe('Quedas fuera: llegas a 101 puntos o más'))
  it('tú y otro', () => expect(textoEliminados(['Pixel'], true)).toBe('Quedáis fuera tú y Pixel: llegáis a 101 puntos o más'))
})

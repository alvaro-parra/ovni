import { describe, expect, it } from 'vitest'
import type { Card } from '../src/cards'
import { describeAndPlay } from '../src/ui/game'
import { textosRoba2 } from '../src/ui/textosRoba2'
import { C, mkRound } from './helpers'

// Lo que el aviso del +2 enseña (cartas robadas de verdad) en los casos límite del mazo.
// Se apoya en R-DOS-1, R-DOS-4 y R-MAZO-2 del motor; los tests de reglas están en engine.test.

const id = <T,>(xs: T[]) => xs // barajado identidad: resultados deterministas

/** p0 juega el 2 de oros sobre el 3 de oros; la víctima es p1 (sentido 1). */
function jugarDos(opts: { mazo: Card[]; descarte?: Card[]; rebarajeUsado?: boolean; manoP0?: Card[] }) {
  const r = mkRound([opts.manoP0 ?? [C('2', 'oros'), C('5', 'copas')], [C('7', 'bastos')], [C('4', 'espadas')]], {
    drawPile: opts.mazo,
    discardPile: opts.descarte ?? [C('3', 'oros')],
    reshuffleUsed: opts.rebarajeUsado ?? false,
  })
  return describeAndPlay(r, C('2', 'oros'), undefined, id)
}

describe('describeAndPlay: cartas que roba de verdad la víctima de un 2', () => {
  it('mazo con 5: roba 2 (las de arriba del mazo), sin rebaraje', () => {
    const res = jugarDos({ mazo: [C('as', 'copas'), C('4', 'oros'), C('5', 'oros'), C('6', 'oros'), C('7', 'oros')] })
    expect(res.roba2).toEqual({ victimaId: 'p1', cartas: [C('7', 'oros'), C('6', 'oros')], rebarajado: false, finRonda: false })
  })

  it('mazo con exactamente 2: roba las 2, sin rebaraje', () => {
    const res = jugarDos({ mazo: [C('4', 'oros'), C('5', 'oros')] })
    expect(res.roba2?.cartas).toHaveLength(2)
    expect(res.roba2?.rebarajado).toBe(false)
  })

  it('mazo con 1 y mesa rebarajable: roba 1 del mazo y otra tras rebarajar la mesa', () => {
    const res = jugarDos({ mazo: [C('4', 'oros')], descarte: [C('6', 'copas'), C('3', 'oros')] })
    expect(res.roba2?.cartas).toEqual([C('4', 'oros'), C('3', 'oros')])
    expect(res.roba2?.rebarajado).toBe(true)
    // La carta de arriba (el 2 jugado) sigue en la mesa.
    expect(res.next.discardPile).toEqual([C('2', 'oros')])
  })

  it('mazo con 1 y rebaraje ya usado en la ronda: solo roba 1', () => {
    const res = jugarDos({ mazo: [C('4', 'oros')], rebarajeUsado: true })
    expect(res.roba2?.cartas).toEqual([C('4', 'oros')])
    expect(res.roba2?.rebarajado).toBe(false)
  })

  it('mazo vacío y en la mesa solo 1 carta debajo del 2: rebaraja y roba 1', () => {
    const res = jugarDos({ mazo: [] })
    expect(res.roba2?.cartas).toEqual([C('3', 'oros')])
    expect(res.roba2?.rebarajado).toBe(true)
  })

  it('mazo vacío y rebaraje ya usado: no roba ninguna (pero pierde el turno)', () => {
    const res = jugarDos({ mazo: [], rebarajeUsado: true })
    expect(res.roba2?.cartas).toEqual([])
    expect(res.next.currentPlayerIndex).toBe(2) // se salta a p1
  })

  it('el 2 como última carta (R-DOS-4): roba igualmente, acaba la ronda y lo robado puntúa', () => {
    const res = jugarDos({ mazo: [C('rey', 'oros'), C('sota', 'copas')], manoP0: [C('2', 'oros')] })
    expect(res.roba2).toMatchObject({ finRonda: true, cartas: [C('sota', 'copas'), C('rey', 'oros')] })
    expect(res.next.phase).toBe('over')
    expect(res.next.result?.winnerId).toBe('p0')
    expect(res.next.result?.handPoints.p1).toBe(7 + 50 + 10) // 7 de bastos + sota + rey
  })
})

describe('textosRoba2: lo que dice el aviso en cada caso', () => {
  it('2 cartas, a ti', () => {
    const t = textosRoba2({ n: 2, rebarajado: false, finRonda: false }, null, 'Toby')
    expect(t.robo).toBe('Robas estas 2 cartas')
    expect(t.rebaraje).toBeNull()
    expect(t.consecuencia).toBe('Pierdes el turno')
  })

  it('1 carta con rebaraje, a un bot', () => {
    const t = textosRoba2({ n: 1, rebarajado: true, finRonda: false }, 'Robi', 'Toby')
    expect(t.robo).toBe('Robi roba 1 carta: no quedaban más')
    expect(t.rebaraje).not.toBeNull()
    expect(t.consecuencia).toBe('Robi pierde el turno')
  })

  it('0 cartas: no roba, pero pierde el turno', () => {
    const t = textosRoba2({ n: 0, rebarajado: false, finRonda: false }, null, 'Toby')
    expect(t.robo).toBe('No quedan cartas: no robas')
    expect(t.consecuencia).toBe('Pierdes el turno')
  })

  it('fin de ronda: dice que se acaba y que lo robado cuenta en tus puntos', () => {
    const t = textosRoba2({ n: 2, rebarajado: false, finRonda: true }, null, 'Toby')
    expect(t.consecuencia).toBe('Toby se queda sin cartas: fin de la ronda. Estas cartas cuentan en tus puntos')
    expect(t.resumen).toContain('Robas estas 2 cartas')
  })
})

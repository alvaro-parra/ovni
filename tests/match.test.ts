import { describe, it, expect } from 'vitest'
import { createMatch, applyRoundResult } from '../src/match'

const score = (m: ReturnType<typeof createMatch>, id: string) =>
  m.players.find((p) => p.id === id)!.score

const isElim = (m: ReturnType<typeof createMatch>, id: string) =>
  m.players.find((p) => p.id === id)!.eliminated

describe('nivel partida: puntuación, eliminación y victoria', () => {
  it('R-CFG-1: la partida admite de 2 a 4 jugadores', () => {
    expect(() => createMatch(['a'], 0)).toThrow()
    expect(() => createMatch(['a', 'b', 'c', 'd', 'e'], 0)).toThrow()
    expect(createMatch(['a', 'b'], 0).players.length).toBe(2)
    expect(createMatch(['a', 'b', 'c', 'd'], 0).players.length).toBe(4)
  })

  it('R-CFG-5: la mano inicial se fija por sorteo (índice inyectado)', () => {
    const m = createMatch(['a', 'b', 'c'], 2)
    expect(m.dealerIndex).toBe(2)
  })

  it('R-COMP-2 / R-PUNT-2: la puntuación se acumula entre rondas', () => {
    let m = createMatch(['a', 'b'], 0)
    m = applyRoundResult(m, { winnerId: 'b', handPoints: { a: 30, b: 0 } })
    expect(score(m, 'a')).toBe(30)
    expect(score(m, 'b')).toBe(0)
    m = applyRoundResult(m, { winnerId: 'b', handPoints: { a: 20, b: 0 } })
    expect(score(m, 'a')).toBe(50) // acumulado
  })

  it('R-OBJ-3 / R-PUNT-3: alcanzar 101+ elimina al jugador y el resto continúa', () => {
    let m = createMatch(['a', 'b', 'c'], 0)
    m = applyRoundResult(m, { winnerId: 'c', handPoints: { a: 101, b: 50, c: 0 } })
    expect(isElim(m, 'a')).toBe(true)
    expect(m.phase).toBe('playing')
    expect(m.players.filter((p) => !p.eliminated).length).toBe(2)
  })

  it('R-OBJ-4: cuando queda un único jugador por debajo de 101, gana', () => {
    let m = createMatch(['a', 'b'], 0)
    m = applyRoundResult(m, { winnerId: 'b', handPoints: { a: 101, b: 0 } })
    expect(m.phase).toBe('over')
    expect(m.winners).toEqual(['b'])
  })

  it('R-OBJ-5: si todos superan 101 en la misma ronda, gana el de menos puntos (empate: ambos)', () => {
    let m1 = createMatch(['a', 'b'], 0)
    m1 = applyRoundResult(m1, { winnerId: null, handPoints: { a: 110, b: 105 } })
    expect(m1.phase).toBe('over')
    expect(m1.winners).toEqual(['b']) // menos puntos

    let m2 = createMatch(['a', 'b'], 0)
    m2 = applyRoundResult(m2, { winnerId: null, handPoints: { a: 105, b: 105 } })
    expect(m2.phase).toBe('over')
    expect(new Set(m2.winners)).toEqual(new Set(['a', 'b'])) // empate: ambos ganan
  })

  it('CL-1: puede haber varias eliminaciones en la misma ronda', () => {
    let m = createMatch(['a', 'b', 'c'], 0)
    m = applyRoundResult(m, { winnerId: 'c', handPoints: { a: 101, b: 150, c: 0 } })
    expect(isElim(m, 'a')).toBe(true)
    expect(isElim(m, 'b')).toBe(true)
    expect(m.phase).toBe('over')
    expect(m.winners).toEqual(['c'])
  })

  it('R-CFG-4: la posición de mano rota en sentido antihorario cada ronda', () => {
    let m = createMatch(['a', 'b', 'c'], 0)
    m = applyRoundResult(m, { winnerId: 'a', handPoints: { a: 0, b: 10, c: 10 } })
    expect(m.phase).toBe('playing')
    expect(m.dealerIndex).toBe(1) // rotó +1 (antihorario)
  })
})

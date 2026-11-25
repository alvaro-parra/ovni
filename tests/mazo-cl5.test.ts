import { describe, expect, it } from 'vitest'
import { createDeck, handPoints, type Card } from '../src/cards'
import { createRound, drawCard, getPlayableCards, isPlayable } from '../src/engine'
import { C } from './helpers'

// CL-5: el primer jugador no tiene jugada y roba las 19 cartas del mazo sin encontrar ninguna
// jugable. El mazo queda vacío y en el descarte solo está la carta activa: la rebaraja no aporta
// cartas y la ronda termina por R-MAZO-3 (sin ganador, todos cuentan su mano).
//
// Con 4 jugadores y carta inicial normal (aquí el 5 de oros, sin efectos de R-INI-1) el reparto
// queda determinado: de las 39 cartas restantes, 15 sirven sobre el 5 de oros (9 oros, 3 cincos y
// 3 sotas) y van a los otros tres jugadores (3 × 5); las 24 inservibles se reparten entre el
// primer jugador (5) y el mazo (19).

const igual = (a: Card, b: Card) => a.rank === b.rank && a.suit === b.suit

function barajaAtascada(): { deck: Card[]; manoPrimero: Card[]; mazo: Card[] } {
  const flip = C('5', 'oros')
  const resto = createDeck().filter((c) => !igual(c, flip))
  const sirven = resto.filter((c) => isPlayable(c, flip.suit, flip.rank))
  const noSirven = resto.filter((c) => !isPlayable(c, flip.suit, flip.rank))
  const manoPrimero = noSirven.slice(0, 5)
  const mazo = noSirven.slice(5)

  // createRound roba con pop() desde el final: primero 5 vueltas de reparto empezando por el
  // jugador siguiente a la mano (mano = 0 → orden 1, 2, 3, 0), luego la carta inicial y el resto
  // queda como mazo. Construimos la secuencia de robos y la invertimos.
  const robos: Card[] = []
  const otros = sirven.slice()
  for (let r = 0; r < 5; r++) {
    robos.push(manoPrimero[r]) // p1
    robos.push(otros.pop()!, otros.pop()!, otros.pop()!) // p2, p3, p0
  }
  robos.push(flip)
  const deck = [...mazo, ...robos.reverse()]
  return { deck, manoPrimero, mazo }
}

describe('CL-5: mazo agotado con solo la carta activa en el descarte', () => {
  it('el primer jugador roba todo el mazo sin jugada y la ronda termina sin ganador (R-MAZO-3)', () => {
    const { deck, mazo } = barajaAtascada()
    expect(deck).toHaveLength(40)

    let s = createRound({ playerIds: ['p0', 'p1', 'p2', 'p3'], deck, dealerIndex: 0 })

    // Comprobaciones previas: el reparto es el que creemos (si no, el fallo está en la baraja).
    expect(s.discardPile).toEqual([C('5', 'oros')])
    expect(s.currentPlayerIndex).toBe(1)
    expect(getPlayableCards(s)).toEqual([])
    expect(s.drawPile).toHaveLength(19)
    expect(s.drawPile.some((c) => isPlayable(c, s.activeSuit, s.activeRank))).toBe(false)
    expect(new Set(s.drawPile.map((c) => `${c.rank}-${c.suit}`))).toEqual(new Set(mazo.map((c) => `${c.rank}-${c.suit}`)))

    // Roba las 19, una por toque, sin encontrar jugada.
    for (let i = 0; i < 19; i++) {
      s = drawCard(s)
      expect(s.phase).toBe('playing')
      expect(s.currentPlayerIndex).toBe(1)
    }
    expect(s.drawPile).toHaveLength(0)
    expect(s.discardPile).toHaveLength(1)

    // Ni puede jugar ni hay nada que rebarajar: fin de la ronda.
    s = drawCard(s)
    expect(s.phase).toBe('over')
    expect(s.result?.winnerId).toBeNull()
    expect(s.players[1].hand).toHaveLength(24)
    for (const p of s.players) expect(s.result?.handPoints[p.id]).toBe(handPoints(p.hand))
    expect(s.players.map((p) => p.hand.length)).toEqual([5, 24, 5, 5])
  })
})

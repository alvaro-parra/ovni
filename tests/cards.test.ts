import { describe, it, expect } from 'vitest'
import { createDeck, cardPoints, cardKey } from '../src/cards'

describe('baraja española y puntos', () => {
  it('R-COMP-1: baraja de 40 cartas, 4 palos, 10 valores, sin 8 ni 9', () => {
    const deck = createDeck()
    expect(deck.length).toBe(40)

    const suits = new Set(deck.map((c) => c.suit))
    expect(suits).toEqual(new Set(['oros', 'copas', 'espadas', 'bastos']))
    for (const suit of suits) {
      expect(deck.filter((c) => c.suit === suit).length).toBe(10)
    }

    const ranks = new Set(deck.map((c) => c.rank))
    expect(ranks.size).toBe(10)
    expect(ranks.has('8' as never)).toBe(false)
    expect(ranks.has('9' as never)).toBe(false)

    // todas las cartas son únicas
    expect(new Set(deck.map(cardKey)).size).toBe(40)
  })

  it('R-PUNT-1 / R-SOTA-3: tabla de valores de puntuación', () => {
    expect(cardPoints('as')).toBe(1)
    expect(cardPoints('2')).toBe(20)
    expect(cardPoints('3')).toBe(3)
    expect(cardPoints('4')).toBe(4)
    expect(cardPoints('5')).toBe(5)
    expect(cardPoints('6')).toBe(6)
    expect(cardPoints('7')).toBe(7)
    expect(cardPoints('sota')).toBe(50) // R-SOTA-3
    expect(cardPoints('caballo')).toBe(10)
    expect(cardPoints('rey')).toBe(10)
  })
})

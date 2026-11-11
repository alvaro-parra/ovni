import type { Card, Rank, Suit } from '../src/cards'
import type { RoundState } from '../src/engine'

/** Atajo para construir una carta. */
export const C = (rank: Rank, suit: Suit): Card => ({ rank, suit })

/**
 * Construye un RoundState para tests, partiendo de las manos de cada jugador
 * y permitiendo sobreescribir cualquier campo.
 */
export function mkRound(
  hands: Card[][],
  overrides: Partial<RoundState> = {},
): RoundState {
  const players = hands.map((hand, i) => ({ id: `p${i}`, hand }))
  const base: RoundState = {
    players,
    drawPile: [],
    discardPile: [C('3', 'oros')],
    activeSuit: 'oros',
    activeRank: '3',
    currentPlayerIndex: 0,
    direction: 1,
    reshuffleUsed: false,
    phase: 'playing',
    result: null,
  }
  return { ...base, ...overrides }
}

/**
 * Construye una baraja controlada para `createRound`. Las cartas se roban desde
 * el final del array: primero se reparten 5*n (fillers), luego se voltea `flip`,
 * y el resto queda como mazo de robo.
 */
export function deckFor(
  n: number,
  flip: Card,
  leftoverCount = 6,
): Card[] {
  const leftover = Array.from({ length: leftoverCount }, () => C('4', 'copas'))
  const dealt = Array.from({ length: 5 * n }, () => C('3', 'oros'))
  return [...leftover, flip, ...dealt]
}

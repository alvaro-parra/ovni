// Baraja española de 40 cartas y valores de puntuación (REQUISITOS.md §3, §9).

export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos'
export type Rank =
  | 'as'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | 'sota'
  | 'caballo'
  | 'rey'

export interface Card {
  suit: Suit
  rank: Rank
}

export const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos']

// Baraja española: sin 8 ni 9 (R-COMP-1).
export const RANKS: Rank[] = [
  'as',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  'sota',
  'caballo',
  'rey',
]

// Valores de puntuación de cada carta (R-PUNT-1).
const POINTS: Record<Rank, number> = {
  as: 1,
  '2': 20,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  sota: 50,
  caballo: 10,
  rey: 10,
}

/** Devuelve los puntos de penalización de una carta (R-PUNT-1). */
export function cardPoints(rank: Rank): number {
  return POINTS[rank]
}

/** Suma de puntos de una mano de cartas (R-OBJ-2, R-PUNT-1). */
export function handPoints(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + cardPoints(c.rank), 0)
}

/** Crea la baraja española completa de 40 cartas (R-COMP-1). */
export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  return deck
}

/** Identificador textual único de una carta (p. ej. "as-oros"). */
export function cardKey(card: Card): string {
  return `${card.rank}-${card.suit}`
}

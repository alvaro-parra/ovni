// Mapeos entre el motor (Rank/Suit) y los assets del diseño, y utilidades de baraja.
import type { Card, Rank, Suit } from '../cards'
import { createDeck } from '../cards'

export const PROPORCION = 1.542

/** Rank del motor → valor numérico del diseño (1 As, 10 Sota, 11 Caballo, 12 Rey). */
const RANK_TO_V: Record<Rank, string> = {
  as: '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  sota: '10',
  caballo: '11',
  rey: '12',
}

/** Valor numérico para ordenar la mano (As=1 … Rey=12). */
const RANK_VNUM: Record<Rank, number> = {
  as: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  sota: 10,
  caballo: 11,
  rey: 12,
}

export function rankToV(rank: Rank): string {
  return RANK_TO_V[rank]
}

export function rankVnum(rank: Rank): number {
  return RANK_VNUM[rank]
}

export function cardImg(suit: Suit, rank: Rank): string {
  return `${import.meta.env.BASE_URL}cartas/${suit}_${RANK_TO_V[rank]}.png`
}

export function dorsoImg(): string {
  return `${import.meta.env.BASE_URL}cartas/dorso.png`
}

export const SUIT_COLOR: Record<Suit, string> = {
  oros: '#8A5A00',
  copas: '#B8202A',
  espadas: '#1F4FA0',
  bastos: '#2F6B2F',
}

export const SUIT_NAME: Record<Suit, string> = {
  oros: 'Oros',
  copas: 'Copas',
  espadas: 'Espadas',
  bastos: 'Bastos',
}

export const SUIT_ORDER: Record<Suit, number> = {
  oros: 0,
  copas: 1,
  espadas: 2,
  bastos: 3,
}

export const RANK_NAME: Record<Rank, string> = {
  as: 'As',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  sota: 'Sota',
  caballo: 'Caballo',
  rey: 'Rey',
}

export function cardLabel(card: Card): string {
  return `${RANK_NAME[card.rank]} de ${SUIT_NAME[card.suit]}`
}

/** Generador pseudoaleatorio determinista (mulberry32) para barajar reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Devuelve una función de barajado Fisher-Yates usando el RNG dado. */
export function makeShuffle(rng: () => number) {
  return <T,>(cards: T[]): T[] => {
    const a = cards.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}

/** Baraja española barajada con el RNG dado. */
export function shuffledDeck(rng: () => number): Card[] {
  return makeShuffle(rng)(createDeck())
}

/**
 * Descarga en segundo plano todas las imágenes de la baraja (~0,8 MB) para que ninguna
 * carta aparezca en blanco a mitad de partida mientras se carga su imagen.
 */
export function precargarCartas(): void {
  if (typeof Image === 'undefined') return
  const urls = [dorsoImg(), ...createDeck().map((c) => cardImg(c.suit, c.rank))]
  for (const url of urls) {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
  }
}

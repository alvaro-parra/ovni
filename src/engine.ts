// Motor de una ronda de OVNI: estado de juego y reglas de turno (REQUISITOS.md §6–§9).
//
// Convenciones:
// - `drawPile`: se roba desde el FINAL del array (pop).
// - `discardPile`: la carta superior es el último elemento.
// - `direction`: +1 avanza al siguiente índice (sentido antihorario por defecto,
//   R-CFG-3); -1 lo invierte (R-AS-1).

import { Card, Rank, Suit, handPoints } from './cards'

export type Direction = 1 | -1

export interface RoundPlayer {
  id: string
  hand: Card[]
}

export interface RoundResult {
  /** Ganador de la ronda (mano vacía), o null si terminó por agotarse el mazo (R-MAZO-3). */
  winnerId: string | null
  /** Puntos de la mano restante de cada jugador al terminar la ronda (R-OBJ-2). */
  handPoints: Record<string, number>
}

export interface RoundState {
  players: RoundPlayer[]
  drawPile: Card[]
  discardPile: Card[]
  /** Palo a seguir. Normalmente el de la carta superior; lo fija la sota (R-SOTA-2). */
  activeSuit: Suit
  /** Número a seguir. Para una sota es 'sota' (solo otra sota coincide por número). */
  activeRank: Rank
  currentPlayerIndex: number
  direction: Direction
  /** Si ya se usó la única rebaraja permitida en la ronda (R-MAZO-2). */
  reshuffleUsed: boolean
  phase: 'playing' | 'over'
  result: RoundResult | null
}

export type Shuffle = (cards: Card[]) => Card[]

const identity: Shuffle = (cards) => cards

function step(index: number, dir: Direction, n: number): number {
  return (index + dir + n) % n
}

function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit
}

/** Una carta es jugable si es una sota, o coincide en palo o en número (R-JUEGO-2, R-JUEGO-3). */
export function isPlayable(card: Card, activeSuit: Suit, activeRank: Rank): boolean {
  return card.rank === 'sota' || card.suit === activeSuit || card.rank === activeRank
}

/** Cartas jugables del jugador en turno. */
export function getPlayableCards(state: RoundState): Card[] {
  const player = state.players[state.currentPlayerIndex]
  return player.hand.filter((c) => isPlayable(c, state.activeSuit, state.activeRank))
}

function endRound(state: RoundState, winnerId: string | null): void {
  const points: Record<string, number> = {}
  for (const p of state.players) points[p.id] = handPoints(p.hand)
  state.phase = 'over'
  state.result = { winnerId, handPoints: points }
}

/** Intenta rebarajar la pila de descarte (salvo la superior) para reponer el mazo (R-MAZO-2). */
function tryReshuffle(state: RoundState, shuffle: Shuffle): boolean {
  if (state.reshuffleUsed) return false
  if (state.discardPile.length <= 1) return false
  const top = state.discardPile[state.discardPile.length - 1]
  const rest = state.discardPile.slice(0, -1)
  state.drawPile = shuffle(rest.slice())
  state.discardPile = [top]
  state.reshuffleUsed = true
  return true
}

/** Roba `count` cartas para un jugador, rebarajando si hace falta y hay margen. */
function forceDraw(
  state: RoundState,
  playerIndex: number,
  count: number,
  shuffle: Shuffle,
): void {
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0 && !tryReshuffle(state, shuffle)) break
    const card = state.drawPile.pop()
    if (!card) break
    state.players[playerIndex].hand.push(card)
  }
}

export interface CreateRoundOptions {
  playerIds: string[]
  /** Baraja ya barajada; se reparte y roba desde el final. */
  deck: Card[]
  dealerIndex: number
}

/** Prepara una ronda: reparte 5 cartas, voltea la carta inicial y aplica sus efectos (§4, §8). */
export function createRound(opts: CreateRoundOptions): RoundState {
  const n = opts.playerIds.length
  if (n < 2 || n > 4) throw new Error('OVNI admite de 2 a 4 jugadores (R-CFG-1)')

  const deck = opts.deck.slice()
  const players: RoundPlayer[] = opts.playerIds.map((id) => ({ id, hand: [] }))

  // Reparto de 5 cartas (R-CFG-2), empezando por el jugador siguiente a la mano.
  const first = step(opts.dealerIndex, 1, n)
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < n; k++) {
      const pi = (first + k) % n
      players[pi].hand.push(deck.pop()!)
    }
  }

  // Carta inicial (R-CFG-7).
  const flip = deck.pop()!
  const state: RoundState = {
    players,
    drawPile: deck,
    discardPile: [flip],
    activeSuit: flip.suit,
    activeRank: flip.rank,
    currentPlayerIndex: first,
    direction: 1,
    reshuffleUsed: false,
    phase: 'playing',
    result: null,
  }

  applyInitialEffects(state, opts.dealerIndex, flip)
  return state
}

/** Aplica los efectos de la carta inicial como si la hubiera jugado la mano (R-INI-1). */
function applyInitialEffects(state: RoundState, dealerIndex: number, flip: Card): void {
  const n = state.players.length
  const first = step(dealerIndex, 1, n)

  if (flip.rank === '2') {
    // R-INI-1a: el primer jugador roba 2 y pierde turno.
    forceDraw(state, first, 2, identity)
    state.currentPlayerIndex = n === 2 ? dealerIndex : step(first, 1, n)
  } else if (flip.rank === 'as') {
    // R-INI-1b: con 2 jugadores empieza la mano; con 3+ invierte el sentido.
    if (n >= 3) {
      state.direction = -1
      state.currentPlayerIndex = step(dealerIndex, -1, n)
    } else {
      state.currentPlayerIndex = dealerIndex
    }
  }
  // R-INI-1c: la sota inicial ya deja activeSuit = su palo y activeRank = 'sota';
  // no actúa como comodín, empieza el primer jugador con normalidad.
}

/** Juega una carta del jugador en turno, aplicando sus efectos (§6, §7). */
export function playCard(
  state: RoundState,
  card: Card,
  chosenSuit?: Suit,
  shuffle: Shuffle = identity,
): RoundState {
  if (state.phase !== 'playing') throw new Error('La ronda ya ha terminado')

  const s: RoundState = structuredClone(state)
  const pIdx = s.currentPlayerIndex
  const player = s.players[pIdx]
  const n = s.players.length

  const handIdx = player.hand.findIndex((c) => sameCard(c, card))
  if (handIdx === -1) throw new Error('La carta no está en la mano del jugador')
  if (!isPlayable(card, s.activeSuit, s.activeRank)) {
    throw new Error('Carta no jugable: debe coincidir en número o palo (R-JUEGO-2)')
  }
  if (card.rank === 'sota' && !chosenSuit) {
    throw new Error('La sota debe declarar un palo (R-SOTA-2)')
  }

  // Mover la carta al descarte y actualizar lo que hay que seguir.
  player.hand.splice(handIdx, 1)
  s.discardPile.push(card)
  s.activeRank = card.rank
  s.activeSuit = card.rank === 'sota' ? chosenSuit! : card.suit

  const emptied = player.hand.length === 0

  if (card.rank === '2') {
    // R-DOS-1: el siguiente roba 2 y pierde turno (incondicional, R-DOS-2).
    const nextIdx = step(pIdx, s.direction, n)
    forceDraw(s, nextIdx, 2, shuffle)
    if (emptied) {
      // R-DOS-4 / CL-2: aun ganando, el siguiente roba 2 antes de contar.
      endRound(s, player.id)
      return s
    }
    // R-DOS-3: con 2 jugadores vuelve a quien lo jugó; con 3+ se salta al afectado.
    s.currentPlayerIndex = n === 2 ? pIdx : step(nextIdx, s.direction, n)
  } else if (card.rank === 'as') {
    if (emptied) {
      endRound(s, player.id)
      return s
    }
    if (n === 2) {
      // R-AS-2: repite turno.
      s.currentPlayerIndex = pIdx
    } else {
      // R-AS-1: invierte el sentido.
      s.direction = (s.direction * -1) as Direction
      s.currentPlayerIndex = step(pIdx, s.direction, n)
    }
  } else {
    // Sota (ya fijó el palo) o carta normal: turno al siguiente (R-JUEGO-6).
    if (emptied) {
      endRound(s, player.id)
      return s
    }
    s.currentPlayerIndex = step(pIdx, s.direction, n)
  }

  return s
}

/**
 * Roba una carta para el jugador en turno cuando NO tiene jugada (R-JUEGO-5).
 * Lanza si el jugador tiene alguna carta jugable (jugar es obligatorio, R-JUEGO-4).
 * Si el mazo está vacío rebaraja una vez (R-MAZO-2); si tampoco puede, termina la ronda (R-MAZO-3).
 */
export function drawCard(state: RoundState, shuffle: Shuffle = identity): RoundState {
  if (state.phase !== 'playing') throw new Error('La ronda ya ha terminado')
  if (getPlayableCards(state).length > 0) {
    throw new Error('Jugar es obligatorio: no se puede robar con jugada disponible (R-JUEGO-4)')
  }

  const s: RoundState = structuredClone(state)

  if (s.drawPile.length === 0 && !tryReshuffle(s, shuffle)) {
    // R-MAZO-3: mazo agotado por segunda vez y sin jugada posible.
    endRound(s, null)
    return s
  }

  const card = s.drawPile.pop()!
  s.players[s.currentPlayerIndex].hand.push(card)
  return s
}

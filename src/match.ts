// Nivel partida de OVNI: puntuación acumulada, eliminación y victoria (REQUISITOS.md §5, §9).

import type { RoundResult } from './engine'

export interface MatchPlayer {
  id: string
  /** Puntuación acumulada entre rondas (R-PUNT-2). */
  score: number
  /** Eliminado al alcanzar 101+ (R-OBJ-3). */
  eliminated: boolean
}

export interface MatchState {
  players: MatchPlayer[]
  /** Posición de la mano/dealer; rota en sentido antihorario cada ronda (R-CFG-4). */
  dealerIndex: number
  phase: 'playing' | 'over'
  /** Ganador(es) de la partida una vez terminada (R-OBJ-4, R-OBJ-5). */
  winners: string[] | null
}

const ELIM_THRESHOLD = 101

function step(index: number, n: number): number {
  return (index + 1) % n
}

/** Crea una partida. La mano inicial (`firstDealerIndex`) se decide por sorteo (R-CFG-5). */
export function createMatch(playerIds: string[], firstDealerIndex: number): MatchState {
  const n = playerIds.length
  if (n < 2 || n > 4) throw new Error('OVNI admite de 2 a 4 jugadores (R-CFG-1)')
  return {
    players: playerIds.map((id) => ({ id, score: 0, eliminated: false })),
    dealerIndex: firstDealerIndex,
    phase: 'playing',
    winners: null,
  }
}

/** Siguiente mano: rota en sentido antihorario saltando a jugadores eliminados (R-CFG-4). */
function nextDealer(match: MatchState): number {
  const n = match.players.length
  let i = step(match.dealerIndex, n)
  while (match.players[i].eliminated) i = step(i, n)
  return i
}

/**
 * Aplica el resultado de una ronda: suma puntos, elimina a quien llega a 101+ y
 * resuelve la victoria o rota la mano para seguir jugando (§5).
 */
export function applyRoundResult(match: MatchState, result: RoundResult): MatchState {
  const m: MatchState = structuredClone(match)

  // Sumar puntos de la ronda a los jugadores activos (R-PUNT-2).
  for (const p of m.players) {
    if (p.eliminated) continue
    p.score += result.handPoints[p.id] ?? 0
  }

  const active = m.players.filter((p) => !p.eliminated)
  const stillUnder = active.filter((p) => p.score < ELIM_THRESHOLD)

  if (stillUnder.length === 0) {
    // R-OBJ-5: todos superan 101 en la misma ronda → gana el de menos puntos
    // (empate: todos los que igualan el mínimo).
    const min = Math.min(...active.map((p) => p.score))
    m.winners = active.filter((p) => p.score === min).map((p) => p.id)
    m.phase = 'over'
    return m
  }

  // Eliminar a los que alcanzan 101+ (R-OBJ-3); el resto continúa.
  for (const p of active) {
    if (p.score >= ELIM_THRESHOLD) p.eliminated = true
  }

  const remaining = m.players.filter((p) => !p.eliminated)
  if (remaining.length === 1) {
    // R-OBJ-4: queda un único jugador por debajo de 101 → gana.
    m.winners = [remaining[0].id]
    m.phase = 'over'
    return m
  }

  // Sigue la partida: rota la mano (R-CFG-4).
  m.dealerIndex = nextDealer(m)
  return m
}

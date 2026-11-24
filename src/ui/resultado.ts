// Cómo se decidió la partida, para elegir el mensaje de la pantalla final. Lógica pura.
import type { MatchState } from '../match'

export type EstadoFinal = 'gana' | 'empate' | 'eliminado'

export interface ResumenFinal {
  estado: EstadoFinal
  /**
   * 'por-debajo': el ganador es el único que quedó por debajo de 101 (R-OBJ-4).
   * 'menos-puntos': todos los que quedaban pasaron de 101 en la misma ronda y gana quien
   * tiene menos puntos (R-OBJ-5).
   */
  motivo: 'por-debajo' | 'menos-puntos'
}

const UMBRAL = 101

export function resumenFinal(match: MatchState, humanId: string): ResumenFinal {
  const winners = match.winners ?? []
  const humanWins = winners.includes(humanId)
  const estado: EstadoFinal = humanWins ? (winners.length > 1 ? 'empate' : 'gana') : 'eliminado'
  const scoreGanador = Math.min(
    ...winners.map((id) => match.players.find((p) => p.id === id)?.score ?? 0),
  )
  return { estado, motivo: scoreGanador >= UMBRAL ? 'menos-puntos' : 'por-debajo' }
}

/** Orden de la clasificación final: ganadores arriba; el resto, de menos a más puntos. */
export function ordenClasificacion<T extends { id: string; score: number }>(
  players: T[],
  winners: string[],
): T[] {
  return [...players].sort(
    (a, b) =>
      Number(winners.includes(b.id)) - Number(winners.includes(a.id)) || a.score - b.score,
  )
}

// Pista al tocar una carta que no se puede jugar (R-UI-A11Y-7: respuesta a cada acción).
// Lógica pura. Los números son los que se ven en las cartas (As = 1, Sota = 10…).
import type { Rank, Suit } from '../cards'
import { rankToV, SUIT_NAME } from './deck'

export type MotivoPista =
  | { tipo: 'no-vale'; palo: Suit; numero: Rank }
  | { tipo: 'espera'; quien: string }
  /** Tocar el mazo teniendo jugada: jugar es obligatorio (R-JUEGO-4). */
  | { tipo: 'tienes-jugada' }

export function textoPista(m: MotivoPista): string {
  if (m.tipo === 'espera') return `Espera: ahora juega ${m.quien}`
  if (m.tipo === 'tienes-jugada') return 'Tienes jugada: echa una carta con ✓'
  // Tras una Sota solo vale el palo pedido u otra Sota (R-SOTA-2).
  const otra = m.numero === 'sota' ? 'una Sota' : `un ${rankToV(m.numero)}`
  return `Esa no vale: necesitas ${SUIT_NAME[m.palo]} o ${otra}`
}

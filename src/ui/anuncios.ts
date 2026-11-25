// Frases para lectores de pantalla sobre lo que pasa en la mesa (lo que se ve volar).
// Lógica pura: quien juega/roba y qué carta.
import type { Card } from '../cards'
import { cardLabel } from './deck'

/** «el 5 de Copas», «la Sota de Oros». */
export function conArticulo(carta: Card): string {
  return `${carta.rank === 'sota' ? 'la' : 'el'} ${cardLabel(carta)}`
}

/**
 * @param quien null si eres tú
 * @param quedan cartas que le quedan tras jugar (si es 1, se avisa: está a punto de ganar la
 *   ronda; a la vista lo dice la pastilla «¡1!» de su ficha)
 */
export function anuncioJuega(quien: string | null, carta: Card, quedan?: number): string {
  const base = quien === null ? `Juegas ${conArticulo(carta)}` : `${quien} juega ${conArticulo(carta)}`
  if (quedan !== 1) return base
  return `${base}. ${quien === null ? 'Te queda' : 'Le queda'} 1 carta`
}

export function anuncioRoba(quien: string | null, n: number, cartas: Card[] = []): string {
  if (quien === null) {
    // Tus cartas sí se pueden decir: las ves en tu mano.
    return cartas.length === 1
      ? `Robas ${conArticulo(cartas[0])}`
      : `Robas ${cartas.map(conArticulo).join(' y ')}`
  }
  return `${quien} roba ${n} ${n === 1 ? 'carta' : 'cartas'}`
}

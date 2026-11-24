// Ritmo de la partida: cuánto dura cada fase de una jugada (ms). Lógica pura.
//
// Una jugada de bot se ve en fases para que se entienda qué pasa:
//   pensar (el bot se resalta) → vuelo (la carta va de su ficha a la mesa) → aviso si
//   hay efecto especial (+2, cambio de sentido, vuelve a jugar, palo) → siguiente turno.
// Si el bot no puede jugar, roba de una vez todas las que necesita (se ven volar del mazo
// a su ficha) y después juega.
import { FACTOR_VELOCIDAD, type Velocidad } from './preferencias'

export interface Duraciones {
  /** Pausa con el bot resaltado antes de jugar. */
  pensar: number
  /** Vuelo de la carta jugada por un bot hasta la mesa. */
  vueloBot: number
  /** Vuelo de la carta jugada por el jugador (más corto: la acción la ha hecho él). */
  vueloHumano: number
  /** Primera carta robada; cada carta extra suma `roboExtra`. */
  robo: number
  roboExtra: number
  /** Aviso grande de efecto especial (se puede cerrar antes tocándolo). */
  aviso: number
  /** Aviso de «sin cartas» antes de pasar al recuento. */
  finRonda: number
  /** Si hay animaciones de vuelo (no con ?fast ni con movimiento reducido). */
  animar: boolean
}

const BASE = {
  pensar: 900,
  vueloBot: 650,
  vueloHumano: 380,
  robo: 520,
  roboExtra: 220,
  aviso: 1700,
  finRonda: 2000,
}

/** Duraciones para la velocidad elegida. `rapidoTests` (?fast) lo deja todo a 0. */
export function duraciones(
  velocidad: Velocidad,
  opciones: { rapidoTests?: boolean; movimientoReducido?: boolean } = {},
): Duraciones {
  if (opciones.rapidoTests) {
    return { pensar: 0, vueloBot: 0, vueloHumano: 0, robo: 0, roboExtra: 0, aviso: 0, finRonda: 0, animar: false }
  }
  const f = FACTOR_VELOCIDAD[velocidad]
  const r = (ms: number) => Math.round(ms * f)
  return {
    pensar: r(BASE.pensar),
    vueloBot: r(BASE.vueloBot),
    vueloHumano: r(BASE.vueloHumano),
    robo: r(BASE.robo),
    roboExtra: r(BASE.roboExtra),
    aviso: r(BASE.aviso),
    finRonda: r(BASE.finRonda),
    animar: !opciones.movimientoReducido,
  }
}

/** Duración total de robar `n` cartas (máximo 6 vuelos visibles). */
export function duracionRobo(d: Duraciones, n: number): number {
  return d.robo + d.roboExtra * Math.max(0, Math.min(n, 6) - 1)
}

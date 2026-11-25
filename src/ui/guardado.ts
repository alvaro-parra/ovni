// Partida en curso guardada en el dispositivo, para poder seguirla si el navegador recarga
// la página (en el móvil pasa al bloquear la pantalla o cambiar de app). Lógica pura: el
// almacenamiento se inyecta para poder testearlo.
import type { RoundState } from '../engine'
import type { MatchState } from '../match'
import type { PlayerCfg } from './game'

const CLAVE = 'ovni.partida'
const VERSION = 1

export interface PartidaGuardada {
  v: typeof VERSION
  players: PlayerCfg[]
  match: MatchState
  round: RoundState
  roundNumber: number
  /** Pantalla en la que estaba: la mesa o el recuento de fin de ronda. */
  screen: 'mesa' | 'finRonda'
  lastResult: RoundState['result']
}

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function almacen(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function guardarPartida(p: Omit<PartidaGuardada, 'v'>, a: Almacen | null = almacen()): void {
  try {
    a?.setItem(CLAVE, JSON.stringify({ v: VERSION, ...p }))
  } catch {
    // Sin espacio o sin permiso: la partida sigue, solo que no se podrá recuperar.
  }
}

export function borrarPartida(a: Almacen | null = almacen()): void {
  try {
    a?.removeItem(CLAVE)
  } catch {
    // nada que hacer
  }
}

/** Devuelve la partida guardada si existe y tiene la forma esperada; si no, null. */
export function leerPartida(a: Almacen | null = almacen()): PartidaGuardada | null {
  try {
    const raw = a?.getItem(CLAVE)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<PartidaGuardada>
    const valida =
      p.v === VERSION &&
      Array.isArray(p.players) &&
      p.players.length >= 2 &&
      Array.isArray(p.match?.players) &&
      // En el recuento la partida puede haber terminado (falta ver el resultado).
      (p.match?.phase === 'playing' || p.screen === 'finRonda') &&
      Array.isArray(p.round?.players) &&
      Array.isArray(p.round?.drawPile) &&
      Array.isArray(p.round?.discardPile) &&
      typeof p.roundNumber === 'number' &&
      (p.screen === 'mesa' || p.screen === 'finRonda')
    return valida ? (p as PartidaGuardada) : null
  } catch {
    return null
  }
}

// Partidas jugadas y ganadas en este dispositivo (motivación en el inicio). Lógica pura con
// almacenamiento inyectable; tolerante a que no haya almacenamiento.
const CLAVE = 'ovni.estadisticas'

export interface Estadisticas {
  jugadas: number
  ganadas: number
}

type Almacen = Pick<Storage, 'getItem' | 'setItem'>

function almacen(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function leerEstadisticas(a: Almacen | null = almacen()): Estadisticas {
  try {
    const e = JSON.parse(a?.getItem(CLAVE) ?? 'null') as Partial<Estadisticas> | null
    const n = (x: unknown) => (typeof x === 'number' && x >= 0 ? Math.floor(x) : 0)
    return { jugadas: n(e?.jugadas), ganadas: n(e?.ganadas) }
  } catch {
    return { jugadas: 0, ganadas: 0 }
  }
}

/** Anota una partida terminada; `gane` incluye el empate (también ganas). */
export function anotarPartida(gane: boolean, a: Almacen | null = almacen()): Estadisticas {
  const e = leerEstadisticas(a)
  const nueva = { jugadas: e.jugadas + 1, ganadas: e.ganadas + (gane ? 1 : 0) }
  try {
    a?.setItem(CLAVE, JSON.stringify(nueva))
  } catch {
    // sin almacenamiento: no se cuenta
  }
  return nueva
}

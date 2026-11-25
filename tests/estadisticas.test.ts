import { describe, expect, it } from 'vitest'
import { anotarPartida, leerEstadisticas } from '../src/ui/estadisticas'

// Contador de partidas (UI).
function almacenFalso() {
  const d = new Map<string, string>()
  return { getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => void d.set(k, v) }
}

describe('estadísticas', () => {
  it('empieza en cero y cuenta jugadas y ganadas', () => {
    const a = almacenFalso()
    expect(leerEstadisticas(a)).toEqual({ jugadas: 0, ganadas: 0 })
    anotarPartida(true, a)
    anotarPartida(false, a)
    expect(leerEstadisticas(a)).toEqual({ jugadas: 2, ganadas: 1 })
  })

  it('datos corruptos o sin almacenamiento: cero, sin fallar', () => {
    const a = almacenFalso()
    a.setItem('ovni.estadisticas', '{roto')
    expect(leerEstadisticas(a)).toEqual({ jugadas: 0, ganadas: 0 })
    expect(leerEstadisticas(null)).toEqual({ jugadas: 0, ganadas: 0 })
    expect(() => anotarPartida(true, null)).not.toThrow()
  })
})

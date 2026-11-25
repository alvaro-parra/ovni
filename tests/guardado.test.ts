import { describe, expect, it } from 'vitest'
import { createMatch } from '../src/match'
import { borrarPartida, guardarPartida, leerPartida } from '../src/ui/guardado'
import { C, mkRound } from './helpers'

// Partida guardada en el dispositivo (UI). No son reglas del juego.
function almacenFalso() {
  const datos = new Map<string, string>()
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    datos,
  }
}

const partida = () => ({
  players: [
    { id: 'yo', name: 'Tú', avatar: 'sol' as const, isBot: false },
    { id: 'robi', name: 'Robi', avatar: 'robi' as const, isBot: true },
  ],
  match: createMatch(['yo', 'robi'], 0),
  round: mkRound([[C('3', 'oros')], [C('5', 'copas')]]),
  roundNumber: 2,
  screen: 'mesa' as const,
  lastResult: null,
})

describe('partida guardada', () => {
  it('se guarda y se recupera igual', () => {
    const a = almacenFalso()
    guardarPartida(partida(), a)
    expect(leerPartida(a)).toEqual({ v: 1, ...partida() })
  })

  it('borrar la deja sin partida que continuar', () => {
    const a = almacenFalso()
    guardarPartida(partida(), a)
    borrarPartida(a)
    expect(leerPartida(a)).toBeNull()
  })

  it('ignora datos corruptos o de otra versión, sin romper', () => {
    const a = almacenFalso()
    a.setItem('ovni.partida', '{no es json')
    expect(leerPartida(a)).toBeNull()
    a.setItem('ovni.partida', JSON.stringify({ v: 99, ...partida() }))
    expect(leerPartida(a)).toBeNull()
  })

  it('una partida terminada solo se recupera si falta ver el resultado (recuento)', () => {
    const a = almacenFalso()
    const terminada = { ...partida(), match: { ...partida().match, phase: 'over' as const, winners: ['yo'] } }
    guardarPartida(terminada, a)
    expect(leerPartida(a)).toBeNull()
    guardarPartida({ ...terminada, screen: 'finRonda' }, a)
    expect(leerPartida(a)?.screen).toBe('finRonda')
  })

  it('sin almacenamiento disponible no falla', () => {
    expect(() => guardarPartida(partida(), null)).not.toThrow()
    expect(leerPartida(null)).toBeNull()
  })
})

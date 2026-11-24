import { describe, expect, it } from 'vitest'
import { createRound } from '../src/engine'
import { avisoInicial } from '../src/ui/game'
import { duraciones, duracionRobo } from '../src/ui/ritmo'
import { C, deckFor } from './helpers'

// Ritmo y avisos de la UI. No son reglas del juego: no entran en TRAZABILIDAD.
describe('ritmo de la partida', () => {
  it('?fast (e2e) lo deja todo a 0 y sin animaciones', () => {
    const d = duraciones('lenta', { rapidoTests: true })
    expect(Object.values(d).filter((v) => typeof v === 'number').every((v) => v === 0)).toBe(true)
    expect(d.animar).toBe(false)
  })

  it('despacio > normal > rápido', () => {
    const [l, n, r] = (['lenta', 'normal', 'rapida'] as const).map((v) => duraciones(v))
    expect(l.pensar).toBeGreaterThan(n.pensar)
    expect(n.pensar).toBeGreaterThan(r.pensar)
    expect(l.aviso).toBeGreaterThan(r.aviso)
  })

  it('una jugada de bot a velocidad normal dura entre 1 y 2,5 s (antes 0,85 s)', () => {
    const d = duraciones('normal')
    expect(d.pensar + d.vueloBot).toBeGreaterThanOrEqual(1000)
    expect(d.pensar + d.vueloBot).toBeLessThanOrEqual(2500)
  })

  it('movimiento reducido: mantiene las pausas pero sin vuelos', () => {
    const d = duraciones('normal', { movimientoReducido: true })
    expect(d.animar).toBe(false)
    expect(d.pensar).toBeGreaterThan(0)
  })

  it('robar varias cartas dura más que una, con tope visual', () => {
    const d = duraciones('normal')
    expect(duracionRobo(d, 3)).toBeGreaterThan(duracionRobo(d, 1))
    expect(duracionRobo(d, 20)).toBe(duracionRobo(d, 6))
  })
})

describe('avisoInicial: efectos de la carta volteada (R-INI-1)', () => {
  it('2 inicial: aviso de +2 para el primer jugador', () => {
    const r = createRound({ playerIds: ['p0', 'p1', 'p2'], deck: deckFor(3, C('2', 'oros')), dealerIndex: 0 })
    expect(avisoInicial(r, 'p0')).toEqual({ tipo: 'roba2', actorId: 'p0', victimaId: 'p1' })
  })

  it('as inicial: cambio de sentido con 3+, vuelve a jugar la mano con 2', () => {
    const r3 = createRound({ playerIds: ['p0', 'p1', 'p2'], deck: deckFor(3, C('as', 'oros')), dealerIndex: 0 })
    expect(avisoInicial(r3, 'p0')?.tipo).toBe('sentido')
    const r2 = createRound({ playerIds: ['p0', 'p1'], deck: deckFor(2, C('as', 'oros')), dealerIndex: 0 })
    expect(avisoInicial(r2, 'p0')).toEqual({ tipo: 'repite', actorId: 'p0' })
  })

  it('carta normal o sota inicial: sin aviso', () => {
    const r = createRound({ playerIds: ['p0', 'p1'], deck: deckFor(2, C('5', 'copas')), dealerIndex: 0 })
    expect(avisoInicial(r, 'p0')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { drawCard } from '../src/engine'
import { avisoRebaraje } from '../src/ui/game'
import { C, mkRound } from './helpers'

// Cuándo avisa la mesa de que se rebarajó la pila al robar (R-MAZO-2).
describe('avisoRebaraje', () => {
  const sinJugada = [C('4', 'copas')] // sobre el 3 de oros no vale

  it('mazo vacío y mesa con cartas: rebaraja, roba y avisa', () => {
    const r = mkRound([sinJugada, [C('7', 'bastos')]], { drawPile: [], discardPile: [C('6', 'espadas'), C('3', 'oros')] })
    const n = drawCard(r)
    expect(n.reshuffleUsed).toBe(true)
    expect(avisoRebaraje(r, n, 'p0')).toEqual({ tipo: 'rebaraje', actorId: 'p0' })
  })

  it('robo normal (queda mazo): sin aviso', () => {
    const r = mkRound([sinJugada, [C('7', 'bastos')]], { drawPile: [C('6', 'espadas')] })
    expect(avisoRebaraje(r, drawCard(r), 'p0')).toBeNull()
  })

  it('rebaraje ya usado: sin aviso (y la ronda termina por R-MAZO-3)', () => {
    const r = mkRound([sinJugada, [C('7', 'bastos')]], { drawPile: [], discardPile: [C('6', 'espadas'), C('3', 'oros')], reshuffleUsed: true })
    const n = drawCard(r)
    expect(n.phase).toBe('over')
    expect(avisoRebaraje(r, n, 'p0')).toBeNull()
  })

  it('CL-5: en la mesa solo la carta activa: no hay nada que barajar, sin aviso', () => {
    const r = mkRound([sinJugada, [C('7', 'bastos')]], { drawPile: [], discardPile: [C('3', 'oros')] })
    const n = drawCard(r)
    expect(n.phase).toBe('over')
    expect(avisoRebaraje(r, n, 'p0')).toBeNull()
  })
})

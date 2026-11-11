import { describe, it, expect } from 'vitest'
import {
  isPlayable,
  getPlayableCards,
  playCard,
  drawCard,
  createRound,
} from '../src/engine'
import { C, mkRound, deckFor } from './helpers'

describe('reglas de juego de la ronda', () => {
  it('R-JUEGO-2: una carta es jugable si coincide en número o en palo', () => {
    expect(isPlayable(C('5', 'copas'), 'oros', '5')).toBe(true) // por número
    expect(isPlayable(C('5', 'copas'), 'copas', '3')).toBe(true) // por palo
    expect(isPlayable(C('5', 'copas'), 'oros', '3')).toBe(false) // ninguno
  })

  it('R-JUEGO-3 / R-SOTA-1: la sota se puede jugar siempre', () => {
    expect(isPlayable(C('sota', 'bastos'), 'oros', '7')).toBe(true)
  })

  it('R-JUEGO-1 / R-JUEGO-4: jugar es obligatorio; no se roba teniendo jugada ni se juega carta inválida', () => {
    // p0 tiene un 3 jugable (coincide con activeRank '3')
    const state = mkRound([[C('3', 'copas'), C('rey', 'bastos')]], {
      activeSuit: 'oros',
      activeRank: '3',
    })
    expect(() => drawCard(state)).toThrow() // no puede robar si tiene jugada
    expect(() => playCard(state, C('rey', 'bastos'))).toThrow() // carta no jugable
  })

  it('R-JUEGO-5 / R-MAZO-1 / CL-4: roba hasta encontrar una carta jugable y luego debe jugarla', () => {
    const state = mkRound([[C('rey', 'copas')]], {
      activeSuit: 'bastos',
      activeRank: '4',
      // se roba desde el final: primero 6-copas (no jugable), luego 5-bastos (jugable por palo)
      drawPile: [C('5', 'bastos'), C('6', 'copas')],
    })
    expect(getPlayableCards(state).length).toBe(0)

    const s1 = drawCard(state) // roba 6-copas
    expect(s1.players[0].hand.length).toBe(2)
    expect(s1.drawPile.length).toBe(1) // R-MAZO-1: robó del mazo
    expect(getPlayableCards(s1).length).toBe(0) // sigue sin jugable

    const s2 = drawCard(s1) // roba 5-bastos (jugable)
    expect(getPlayableCards(s2).length).toBe(1)
    expect(() => drawCard(s2)).toThrow() // ya tiene jugada: debe jugar
  })

  it('R-JUEGO-6: tras jugar, el turno pasa al siguiente jugador', () => {
    const state = mkRound([[C('3', 'copas'), C('rey', 'oros')], [C('7', 'bastos')]], {
      activeSuit: 'oros',
      activeRank: '3',
      currentPlayerIndex: 0,
    })
    const s = playCard(state, C('3', 'copas'))
    expect(s.currentPlayerIndex).toBe(1)
    expect(s.activeSuit).toBe('copas')
    expect(s.activeRank).toBe('3')
  })

  it('R-AS-1: con 3+ jugadores el as invierte el sentido del juego', () => {
    const state = mkRound(
      [[C('as', 'oros'), C('rey', 'bastos')], [C('7', 'copas')], [C('4', 'espadas')]],
      { activeSuit: 'oros', activeRank: '7', currentPlayerIndex: 0, direction: 1 },
    )
    const s = playCard(state, C('as', 'oros'))
    expect(s.direction).toBe(-1)
    expect(s.currentPlayerIndex).toBe(2) // step(0, -1) con 3 jugadores
  })

  it('R-AS-2: con 2 jugadores el as hace repetir turno', () => {
    const state = mkRound([[C('as', 'oros'), C('rey', 'bastos')], [C('7', 'copas')]], {
      activeSuit: 'oros',
      activeRank: '7',
      currentPlayerIndex: 0,
    })
    const s = playCard(state, C('as', 'oros'))
    expect(s.currentPlayerIndex).toBe(0)
  })

  it('R-AS-3: el as también es carta normal de su palo', () => {
    expect(isPlayable(C('as', 'oros'), 'oros', '7')).toBe(true)
  })

  it('R-DOS-1: el siguiente jugador roba 2 y pierde el turno', () => {
    const state = mkRound(
      [[C('2', 'oros'), C('rey', 'bastos')], [C('7', 'copas')], [C('4', 'espadas')]],
      {
        activeSuit: 'oros',
        activeRank: '7',
        currentPlayerIndex: 0,
        direction: 1,
        drawPile: [C('3', 'oros'), C('3', 'copas'), C('3', 'espadas')],
      },
    )
    const s = playCard(state, C('2', 'oros'))
    expect(s.players[1].hand.length).toBe(3) // robó 2
    expect(s.currentPlayerIndex).toBe(2) // se salta a p1
    expect(s.drawPile.length).toBe(1)
  })

  it('R-DOS-2: el 2 no se encadena ni se responde (aunque el afectado tenga otro 2)', () => {
    const state = mkRound(
      [[C('2', 'oros'), C('rey', 'bastos')], [C('2', 'copas')], [C('4', 'espadas')]],
      {
        activeSuit: 'oros',
        activeRank: '7',
        currentPlayerIndex: 0,
        direction: 1,
        drawPile: [C('3', 'oros'), C('3', 'copas')],
      },
    )
    const s = playCard(state, C('2', 'oros'))
    expect(s.players[1].hand.length).toBe(3) // robó 2 igualmente
    expect(s.currentPlayerIndex).toBe(2) // pierde turno igualmente
  })

  it('R-DOS-3: con 2 jugadores, tras robar 2 vuelve a jugar quien puso el 2', () => {
    const state = mkRound([[C('2', 'oros'), C('rey', 'bastos')], [C('7', 'copas')]], {
      activeSuit: 'oros',
      activeRank: '7',
      currentPlayerIndex: 0,
      drawPile: [C('3', 'oros'), C('3', 'copas')],
    })
    const s = playCard(state, C('2', 'oros'))
    expect(s.players[1].hand.length).toBe(3)
    expect(s.currentPlayerIndex).toBe(0)
  })

  it('R-DOS-4 / CL-2: ganar jugando un 2 hace que el siguiente robe 2 antes de contar', () => {
    const state = mkRound([[C('2', 'oros')], [C('7', 'copas')]], {
      activeSuit: 'oros',
      activeRank: '7',
      currentPlayerIndex: 0,
      drawPile: [C('3', 'oros'), C('3', 'copas')],
    })
    const s = playCard(state, C('2', 'oros'))
    expect(s.phase).toBe('over')
    expect(s.result?.winnerId).toBe('p0')
    expect(s.players[1].hand.length).toBe(3) // robó 2 antes del recuento
    expect(s.result?.handPoints['p0']).toBe(0)
    expect(s.result?.handPoints['p1']).toBe(7 + 3 + 3)
  })

  it('R-DOS-5: el 2 también es carta normal de su palo', () => {
    expect(isPlayable(C('2', 'oros'), 'oros', '7')).toBe(true)
  })

  it('R-SOTA-2: la sota decide el palo a seguir', () => {
    const state = mkRound([[C('sota', 'bastos'), C('rey', 'oros')], [C('7', 'copas')]], {
      activeSuit: 'oros',
      activeRank: '7',
      currentPlayerIndex: 0,
    })
    expect(() => playCard(state, C('sota', 'bastos'))).toThrow() // falta elegir palo
    const s = playCard(state, C('sota', 'bastos'), 'copas')
    expect(s.activeSuit).toBe('copas')
    expect(s.activeRank).toBe('sota')
    expect(isPlayable(C('4', 'copas'), s.activeSuit, s.activeRank)).toBe(true)
    expect(isPlayable(C('sota', 'oros'), s.activeSuit, s.activeRank)).toBe(true)
    expect(isPlayable(C('4', 'oros'), s.activeSuit, s.activeRank)).toBe(false)
  })

  it('R-INI-1 / R-CFG-2 / R-CFG-3 / R-CFG-6 / R-CFG-7: reparto y carta inicial', () => {
    const deck = deckFor(2, C('7', 'espadas'))
    const r = createRound({ playerIds: ['p0', 'p1'], deck, dealerIndex: 0 })
    expect(r.players[0].hand.length).toBe(5) // R-CFG-2
    expect(r.players[1].hand.length).toBe(5)
    expect(r.discardPile[r.discardPile.length - 1]).toEqual(C('7', 'espadas')) // R-CFG-7
    expect(r.direction).toBe(1) // R-CFG-3: antihorario por defecto
    expect(r.currentPlayerIndex).toBe(1) // R-CFG-6: siguiente a la mano
  })

  it('R-INI-1a: si la carta inicial es un 2, el primer jugador roba 2 y pierde turno', () => {
    const deck = deckFor(2, C('2', 'oros'))
    const r = createRound({ playerIds: ['p0', 'p1'], deck, dealerIndex: 0 })
    expect(r.players[1].hand.length).toBe(7) // 5 + 2
    expect(r.currentPlayerIndex).toBe(0) // con 2 jugadores vuelve a la mano
  })

  it('R-INI-1b / CL-3: as inicial — con 2 jugadores empieza la mano; con 3+ invierte sentido', () => {
    const r2 = createRound({
      playerIds: ['p0', 'p1'],
      deck: deckFor(2, C('as', 'oros')),
      dealerIndex: 0,
    })
    expect(r2.currentPlayerIndex).toBe(0) // la mano (dealer) empieza

    const r3 = createRound({
      playerIds: ['p0', 'p1', 'p2'],
      deck: deckFor(3, C('as', 'oros')),
      dealerIndex: 0,
    })
    expect(r3.direction).toBe(-1)
    expect(r3.currentPlayerIndex).toBe(2) // step(0, -1) con 3 jugadores
  })

  it('R-INI-1c: la sota inicial fija su palo y NO actúa como comodín', () => {
    const r = createRound({
      playerIds: ['p0', 'p1'],
      deck: deckFor(2, C('sota', 'bastos')),
      dealerIndex: 0,
    })
    expect(r.activeSuit).toBe('bastos')
    expect(r.activeRank).toBe('sota')
    expect(r.currentPlayerIndex).toBe(1) // primer jugador normal, sin robar ni elegir
    expect(r.players[1].hand.length).toBe(5)
  })

  it('R-MAZO-2: al agotarse el mazo se rebaraja la pila de descarte una sola vez', () => {
    const state = mkRound([[C('rey', 'oros')]], {
      activeSuit: 'bastos',
      activeRank: '4',
      drawPile: [],
      // la superior (activa) es 4-bastos; bajo ella quedan las que se rebarajan
      discardPile: [C('6', 'copas'), C('7', 'copas'), C('4', 'bastos')],
      reshuffleUsed: false,
    })
    const s = drawCard(state)
    expect(s.reshuffleUsed).toBe(true)
    expect(s.players[0].hand).toContainEqual(C('7', 'copas')) // robó tras rebarajar
    expect(s.discardPile.length).toBe(1) // solo queda la carta superior
    expect(s.drawPile.length).toBe(1) // tenía 2, robó 1
  })

  it('R-MAZO-3: si el mazo se agota por segunda vez, la ronda termina y todos cuentan sus manos', () => {
    const state = mkRound([[C('rey', 'oros')], [C('caballo', 'espadas')]], {
      activeSuit: 'bastos',
      activeRank: '4',
      drawPile: [],
      discardPile: [C('4', 'bastos')], // solo la superior: no se puede rebarajar
      reshuffleUsed: true,
    })
    const s = drawCard(state)
    expect(s.phase).toBe('over')
    expect(s.result?.winnerId).toBe(null) // nadie gana la ronda
    expect(s.result?.handPoints['p0']).toBe(10) // rey
    expect(s.result?.handPoints['p1']).toBe(10) // caballo
  })

  it('R-OBJ-1 / R-OBJ-2: quedarse sin cartas gana la ronda y el resto cuenta sus puntos', () => {
    const state = mkRound([[C('3', 'copas')], [C('7', 'oros'), C('sota', 'bastos')]], {
      activeSuit: 'oros',
      activeRank: '3',
      currentPlayerIndex: 0,
    })
    const s = playCard(state, C('3', 'copas'))
    expect(s.phase).toBe('over')
    expect(s.result?.winnerId).toBe('p0')
    expect(s.result?.handPoints['p0']).toBe(0) // ganador suma 0
    expect(s.result?.handPoints['p1']).toBe(57) // 7 + 50
  })
})

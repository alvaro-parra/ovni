import { describe, expect, it } from 'vitest'
import { textoPista } from '../src/ui/pistas'

// Pista al tocar una carta no jugable (UI). Refleja R-JUEGO-2 y R-SOTA-2.
describe('textoPista', () => {
  it('carta que no coincide: dice el palo y el número que valen', () => {
    expect(textoPista({ tipo: 'no-vale', palo: 'oros', numero: '5' })).toBe('Esa no vale: necesitas Oros o un 5')
    expect(textoPista({ tipo: 'no-vale', palo: 'copas', numero: 'as' })).toBe('Esa no vale: necesitas Copas o un 1')
  })

  it('tras una Sota: el palo pedido o otra Sota', () => {
    expect(textoPista({ tipo: 'no-vale', palo: 'bastos', numero: 'sota' })).toBe('Esa no vale: necesitas Bastos o una Sota')
  })

  it('fuera de tu turno: a quién le toca', () => {
    expect(textoPista({ tipo: 'espera', quien: 'Robi' })).toBe('Espera: ahora juega Robi')
  })
})

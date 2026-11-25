import { describe, expect, it } from 'vitest'
import { anuncioJuega, anuncioRoba } from '../src/ui/anuncios'
import { C } from './helpers'

// Anuncios para lectores de pantalla (UI).
describe('anuncios', () => {
  it('jugadas: de un bot y tuyas', () => {
    expect(anuncioJuega('Robi', C('5', 'copas'))).toBe('Robi juega el 5 de Copas')
    expect(anuncioJuega(null, C('sota', 'oros'))).toBe('Juegas la Sota de Oros')
  })

  it('jugada que deja a alguien con 1 carta: se avisa', () => {
    expect(anuncioJuega('Toby', C('3', 'espadas'), 1)).toBe('Toby juega el 3 de Espadas. Le queda 1 carta')
    expect(anuncioJuega(null, C('4', 'oros'), 1)).toBe('Juegas el 4 de Oros. Te queda 1 carta')
    expect(anuncioJuega('Toby', C('3', 'espadas'), 2)).toBe('Toby juega el 3 de Espadas')
    expect(anuncioJuega('Toby', C('3', 'espadas'), 0)).toBe('Toby juega el 3 de Espadas')
  })

  it('robos: de un bot solo cuántas; tuyos, cuáles', () => {
    expect(anuncioRoba('Pixel', 3)).toBe('Pixel roba 3 cartas')
    expect(anuncioRoba('Pixel', 1)).toBe('Pixel roba 1 carta')
    expect(anuncioRoba(null, 2, [C('7', 'oros'), C('rey', 'bastos')])).toBe('Robas el 7 de Oros y el Rey de Bastos')
  })
})

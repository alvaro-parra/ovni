import { describe, expect, it } from 'vitest'
import { anuncioJuega, anuncioRoba } from '../src/ui/anuncios'
import { C } from './helpers'

// Anuncios para lectores de pantalla (UI).
describe('anuncios', () => {
  it('jugadas: de un bot y tuyas', () => {
    expect(anuncioJuega('Robi', C('5', 'copas'))).toBe('Robi juega el 5 de Copas')
    expect(anuncioJuega(null, C('sota', 'oros'))).toBe('Juegas la Sota de Oros')
  })

  it('robos: de un bot solo cuántas; tuyos, cuáles', () => {
    expect(anuncioRoba('Pixel', 3)).toBe('Pixel roba 3 cartas')
    expect(anuncioRoba('Pixel', 1)).toBe('Pixel roba 1 carta')
    expect(anuncioRoba(null, 2, [C('7', 'oros'), C('rey', 'bastos')])).toBe('Robas el 7 de Oros y el Rey de Bastos')
  })
})

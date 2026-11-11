import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Patrón de ID de requisito: R-XXX-n (opcional sufijo de letra) o CL-n.
const ID_RE = /\b(?:R-[A-Z]+-\d+[a-z]?|CL-\d+)\b/g

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

function ids(text: string): Set<string> {
  return new Set(text.match(ID_RE) ?? [])
}

describe('trazabilidad requisitos ↔ tests', () => {
  const required = ids(readFileSync(join(root, 'REQUISITOS.md'), 'utf8'))

  const testText = readdirSync(here)
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => readFileSync(join(here, f), 'utf8'))
    .join('\n')
  const referenced = ids(testText)

  it('hay requisitos detectados en REQUISITOS.md', () => {
    expect(required.size).toBeGreaterThan(0)
  })

  for (const id of [...required].sort()) {
    it(`${id}: tiene al menos un test que lo verifica`, () => {
      expect(
        referenced.has(id),
        `El requisito ${id} no está referenciado por ningún test`,
      ).toBe(true)
    })
  }
})

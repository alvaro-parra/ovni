// Banco de pruebas del aviso del +2: lo pinta con los datos de cada caso límite, que en una
// partida real son muy difíciles de provocar. Uso: /e2e/banco/roba2.html?caso=<nombre>
import { createRoot } from 'react-dom/client'
import type { Card } from '../../src/cards'
import { PreferenciasProvider } from '../../src/ui/preferencias'
import { ALTO_REF_MESA, estiloTablero, Pantalla } from '../../src/ui/Pantalla'
import { AvisoRoba2, type DatosAvisoRoba2 } from '../../src/ui/Roba2'

const C = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit })
const base = { byName: 'Toby', byAvatar: 'toby' as const, card: C('2', 'espadas') }

export const CASOS: Record<string, DatosAvisoRoba2> = {
  normal: { ...base, cartas: [C('7', 'copas'), C('rey', 'oros')], rebarajado: false, finRonda: false },
  rebaraje: { ...base, cartas: [C('4', 'bastos'), C('as', 'copas')], rebarajado: true, finRonda: false },
  una: { ...base, cartas: [C('5', 'oros')], rebarajado: false, finRonda: false },
  'una-rebaraje': { ...base, cartas: [C('3', 'copas')], rebarajado: true, finRonda: false },
  ninguna: { ...base, cartas: [], rebarajado: false, finRonda: false },
  'ultima-carta': { ...base, cartas: [C('sota', 'copas'), C('caballo', 'bastos')], rebarajado: false, finRonda: true },
  'ultima-carta-ninguna': { ...base, cartas: [], rebarajado: false, finRonda: true },
}

const caso = new URLSearchParams(location.search).get('caso') ?? 'normal'
createRoot(document.getElementById('root')!).render(
  <PreferenciasProvider>
    <Pantalla altoRef={ALTO_REF_MESA}>
      <div style={estiloTablero({ overflowY: 'hidden' })}>
        <AvisoRoba2 datos={CASOS[caso]} onOk={() => {}} />
      </div>
    </Pantalla>
  </PreferenciasProvider>,
)

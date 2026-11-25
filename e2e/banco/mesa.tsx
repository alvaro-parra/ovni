// Banco de pruebas de la mesa: pinta la Mesa real con una mano del tamaño pedido, para
// revisar los modos de mano (grande ≤6, dividido, rejilla, «+N» con >12) sin tener que
// llegar a ellos jugando. Uso: /e2e/banco/mesa.html?cartas=13&jugables=0
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import { createRoot } from 'react-dom/client'
import { createDeck, type Card } from '../../src/cards'
import { createMatch } from '../../src/match'
import type { RoundState } from '../../src/engine'
import { duraciones } from '../../src/ui/ritmo'
import { HUMAN_ID, type Ovni, type PlayerCfg } from '../../src/ui/game'
import { Mesa } from '../../src/ui/Mesa'
import { ALTO_REF_MESA, Pantalla } from '../../src/ui/Pantalla'
import { PreferenciasProvider } from '../../src/ui/preferencias'

const q = new URLSearchParams(location.search)
const nCartas = Number(q.get('cartas') ?? 8)
const nJugables = Number(q.get('jugables') ?? 2)

// Mesa: 3 de Oros. Jugables: oros (o 3 de otro palo); no jugables: copas/espadas/bastos sin 3 ni sotas.
const baraja = createDeck()
const top: Card = { rank: '3', suit: 'oros' }
const jugables = baraja.filter((c) => (c.suit === 'oros' && c.rank !== '3' && c.rank !== 'sota')).slice(0, nJugables)
const noJugables = baraja.filter((c) => c.suit !== 'oros' && c.rank !== '3' && c.rank !== 'sota').slice(0, nCartas - jugables.length)
const mano = [...jugables, ...noJugables]

const players: PlayerCfg[] = [
  { id: HUMAN_ID, name: 'Tú', avatar: 'sol', isBot: false },
  { id: 'robi', name: 'Robi', avatar: 'robi', isBot: true },
  { id: 'pixel', name: 'Pixel', avatar: 'pixel', isBot: true },
]
const round: RoundState = {
  players: [
    { id: HUMAN_ID, hand: mano },
    { id: 'robi', hand: baraja.slice(0, 4) },
    { id: 'pixel', hand: baraja.slice(4, 9) },
  ],
  drawPile: baraja.slice(10, 22),
  discardPile: [top],
  activeSuit: 'oros',
  activeRank: '3',
  currentPlayerIndex: 0,
  direction: 1,
  reshuffleUsed: false,
  phase: 'playing',
  result: null,
}
const nada = () => {}
const game = {
  screen: 'mesa', players, match: createMatch(players.map((p) => p.id), 0), round, roundNumber: 2,
  overlay: null, jugada: null, aviso: null, robosRecientes: {}, dur: duraciones('normal', { rapidoTests: true }),
  cerrarAviso: nada, lastResult: null, nRivals: 2, humanAvatar: 'sol', setNRivals: nada, setHumanAvatar: nada,
  startGame: nada, playHuman: nada, chooseSuit: nada, cancelarSota: nada, drawHuman: nada, dismissRoba2: nada,
  openVerMano: nada, openVista: nada, openSalir: nada, closeOverlay: nada, nextRound: nada, restart: nada,
  partidaGuardada: null, continuarPartida: nada,
} satisfies Ovni

createRoot(document.getElementById('root')!).render(
  <PreferenciasProvider>
    <Pantalla altoRef={ALTO_REF_MESA} admiteApaisada>
      <Mesa game={game} />
    </Pantalla>
  </PreferenciasProvider>,
)

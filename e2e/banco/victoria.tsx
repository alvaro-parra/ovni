// Banco de pruebas de la pantalla final con partidas construidas con el motor real.
// Uso: /e2e/banco/victoria.html?caso=gana|gana-menos|empate|eliminado|eliminado-menos
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import { createRoot } from 'react-dom/client'
import { applyRoundResult, createMatch, type MatchState } from '../../src/match'
import { duraciones } from '../../src/ui/ritmo'
import { HUMAN_ID, type Ovni, type PlayerCfg } from '../../src/ui/game'
import { Victoria } from '../../src/ui/Victoria'
import { ALTO_REF_PANTALLA, Pantalla } from '../../src/ui/Pantalla'
import { PreferenciasProvider } from '../../src/ui/preferencias'

const players: PlayerCfg[] = [
  { id: HUMAN_ID, name: 'Tú', avatar: 'sol', isBot: false },
  { id: 'robi', name: 'Robi', avatar: 'robi', isBot: true },
  { id: 'pixel', name: 'Pixel', avatar: 'pixel', isBot: true },
]
const ids = players.map((p) => p.id)
const ronda = (m: MatchState, puntos: Record<string, number>, ganador: string | null) =>
  applyRoundResult(m, { winnerId: ganador, handPoints: puntos })

const CASOS: Record<string, () => MatchState> = {
  gana: () => ronda(ronda(createMatch(ids, 0), { yo: 20, robi: 110, pixel: 40 }, null), { yo: 0, pixel: 70 }, HUMAN_ID),
  'gana-menos': () => ronda(ronda(createMatch(ids, 0), { yo: 60, robi: 105, pixel: 50 }, null), { yo: 45, pixel: 60 }, null),
  empate: () => ronda(ronda(createMatch(ids, 0), { yo: 60, robi: 120, pixel: 60 }, null), { yo: 50, pixel: 50 }, null),
  eliminado: () => ronda(createMatch(ids, 0), { yo: 130, robi: 0, pixel: 115 }, 'robi'),
  'eliminado-menos': () => ronda(ronda(createMatch(ids, 0), { yo: 70, robi: 60, pixel: 120 }, null), { yo: 50, robi: 45 }, null),
}

const caso = new URLSearchParams(location.search).get('caso') ?? 'gana'
const match = CASOS[caso]()
const nada = () => {}
const game = {
  screen: 'victoria', players, match, round: null, roundNumber: 3,
  overlay: null, jugada: null, aviso: null, robosRecientes: {}, dur: duraciones('normal', { rapidoTests: true }),
  cerrarAviso: nada, lastResult: null, nRivals: 2, humanAvatar: 'sol', setNRivals: nada, setHumanAvatar: nada,
  startGame: nada, playHuman: nada, chooseSuit: nada, cancelarSota: nada, drawHuman: nada, dismissRoba2: nada,
  openVerMano: nada, openVista: nada, openSalir: nada, openReglas: nada, closeOverlay: nada, nextRound: nada, restart: nada,
  partidaGuardada: null, continuarPartida: nada,
} satisfies Ovni

createRoot(document.getElementById('root')!).render(
  <PreferenciasProvider>
    <Pantalla altoRef={ALTO_REF_PANTALLA}>
      <Victoria game={game} />
    </Pantalla>
  </PreferenciasProvider>,
)

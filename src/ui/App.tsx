// Router de pantallas de OVNI.
import { useOvni } from './game'
import { Main } from './Main'
import { Mesa } from './Mesa'
import { FinRonda } from './FinRonda'
import { Victoria } from './Victoria'
import { ALTO_REF_MESA, ALTO_REF_PANTALLA, Pantalla } from './Pantalla'

export function App() {
  const game = useOvni()

  return (
    <Pantalla altoRef={game.screen === 'mesa' ? ALTO_REF_MESA : ALTO_REF_PANTALLA}>
      {game.screen === 'inicio' && <Main game={game} />}
      {game.screen === 'mesa' && game.round && <Mesa game={game} />}
      {game.screen === 'finRonda' && <FinRonda game={game} />}
      {game.screen === 'victoria' && <Victoria game={game} />}
    </Pantalla>
  )
}

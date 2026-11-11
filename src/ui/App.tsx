// Router de pantallas de OVNI.
import { useOvni } from './game'
import { Main } from './Main'
import { Mesa } from './Mesa'
import { FinRonda } from './FinRonda'
import { Victoria } from './Victoria'

export function App() {
  const game = useOvni()

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F3A24',
        padding: 12,
        boxSizing: 'border-box',
      }}
    >
      {game.screen === 'inicio' && <Main game={game} />}
      {game.screen === 'mesa' && game.round && <Mesa game={game} />}
      {game.screen === 'finRonda' && <FinRonda game={game} />}
      {game.screen === 'victoria' && <Victoria game={game} />}
    </div>
  )
}

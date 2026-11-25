// Router de pantallas de OVNI.
import { useEffect } from 'react'
import { useOvni } from './game'
import { precargarCartas } from './deck'
import { Main } from './Main'
import { Mesa } from './Mesa'
import { FinRonda } from './FinRonda'
import { Victoria } from './Victoria'
import { ALTO_REF_MESA, ALTO_REF_PANTALLA, Pantalla } from './Pantalla'

export function App() {
  const game = useOvni()

  // Tras pintar la primera pantalla, precarga la baraja (no compite con la carga inicial).
  useEffect(() => {
    const t = setTimeout(precargarCartas, 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <Pantalla altoRef={game.screen === 'mesa' ? ALTO_REF_MESA : ALTO_REF_PANTALLA} admiteApaisada={game.screen === 'mesa'}>
      {game.screen === 'inicio' && <Main game={game} />}
      {game.screen === 'mesa' && game.round && <Mesa game={game} />}
      {game.screen === 'finRonda' && <FinRonda game={game} />}
      {game.screen === 'victoria' && <Victoria game={game} />}
    </Pantalla>
  )
}

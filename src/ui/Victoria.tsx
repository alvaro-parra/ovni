// Pantalla 8/9 · Final de partida (portado de Victoria.dc.html): gana / empate / eliminado.
import { useEffect, useRef } from 'react'
import type { Ovni } from './game'
import { HUMAN_ID } from './game'
import { Avatar } from './Avatar'
import { Svg } from './dc'
import { ALTO_REF_PANTALLA, Tablero, useEscala } from './Pantalla'
import { estaFuera, ordenClasificacion, resumenFinal } from './resultado'
import { anotarPartida } from './estadisticas'

// Partidas ya anotadas (por si la pantalla se vuelve a montar): cada una cuenta una vez.
const anotadas = new WeakSet<object>()

const CONFETI_COLORES = ['#FFD23F', '#FF8A8A', '#8EC1FF', '#FFF8E7', '#B6E58A']

export function Victoria({ game }: { game: Ovni }) {
  const { apaisada } = useEscala(ALTO_REF_PANTALLA, true)
  const match = game.match!
  const winners = match.winners ?? []
  // El motivo distingue R-OBJ-4 (único por debajo de 101) de R-OBJ-5 (todos pasan de 101
  // en la misma ronda y gana quien tiene menos puntos): cada caso lleva su propio mensaje.
  const { estado, motivo } = resumenFinal(match, HUMAN_ID)
  useEffect(() => {
    if (anotadas.has(match)) return
    anotadas.add(match)
    anotarPartida(estado !== 'eliminado')
  }, [match, estado])
  const fiesta = estado !== 'eliminado'

  const human = match.players.find((p) => p.id === HUMAN_ID)!
  const tabla = ordenClasificacion(match.players, winners)
    .map((p) => {
      const cfg = game.players.find((c) => c.id === p.id)!
      return {
        cfg,
        puntos: p.score,
        corona: winners.includes(p.id),
        fuera: estaFuera(p, match),
      }
    })

  // Al ganar, el confeti cae un par de veces (quieto si se pide reducir movimiento).
  const refConfeti = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = refConfeti.current
    if (!el || !game.dur.animar) return
    const anims = [...el.children].map((c, i) =>
      (c as HTMLElement).animate(
        [
          { transform: `translateY(-80px) rotate(0deg)`, opacity: 1 },
          { transform: `translateY(260px) rotate(${360 + i * 40}deg)`, opacity: 0 },
        ],
        { duration: 2200 + (i % 5) * 300, delay: (i % 7) * 180, iterations: 2, easing: 'ease-in' },
      ),
    )
    return () => anims.forEach((a) => a.cancel())
  }, [game.dur.animar])

  const confeti = Array.from({ length: 22 }, (_, i) => ({
    x: ((i * 53) % 370) + 6,
    y: ((i * 37) % 260) + 8,
    w: 8 + (i % 3) * 3,
    h: 14 - (i % 3) * 2,
    c: CONFETI_COLORES[i % CONFETI_COLORES.length],
    r: (i * 47) % 180,
  }))

  const otrosGanadores = winners.filter((id) => id !== HUMAN_ID).map((id) => game.players.find((p) => p.id === id)?.name)

  return (
    <Tablero
      data-testid="victoria"
      data-value={estado}
      padding="28px 18px 24px"
      gap={16}
      alignItems="center"
      pieEnFila={apaisada}
      pie={
        <>
          <button
            data-testid="jugar-otra"
            onClick={game.startGame}
            style={{ height: 74, boxSizing: 'border-box', borderRadius: 22, background: '#FFD23F', color: '#1A1A1A', border: '4px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 28, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Svg markup={`<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12 a8 8 0 1 1 -2.3 -5.7"></path><path d="M20 4 V9 H15"></path></svg>`} />
            <span>{estado === 'eliminado' ? 'Nueva partida' : 'Jugar otra vez'}</span>
          </button>
          <button
            data-testid="inicio"
            onClick={game.restart}
            style={{ height: 60, boxSizing: 'border-box', borderRadius: 20, background: 'var(--panel)', color: '#FFF8E7', border: '3px solid var(--borde)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 22, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 L12 3.5 L21 11"></path><path d="M5.5 9.5 V20.5 H18.5 V9.5"></path><path d="M10 20.5 V15 H14 V20.5"></path></svg>`} />
            <span>Inicio</span>
          </button>
        </>
      }
    >
      {fiesta && (
        <div ref={refConfeti} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 320, overflow: 'hidden', pointerEvents: 'none' }}>
          {confeti.map((k, i) => (
            <div key={i} style={{ position: 'absolute', left: `${((i * 37) % 94) + 3}%`, top: k.y, width: k.w, height: k.h, background: k.c, transform: `rotate(${k.r}deg)`, borderRadius: 2 }} />
          ))}
        </div>
      )}

      {/* Apaisado: el resultado a la izquierda y la clasificación a la derecha. */}
      <div style={apaisada ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center', width: '100%', flex: 1 } : { display: 'contents' }}>
      <div style={apaisada ? { display: 'flex', flexDirection: 'column', alignItems: 'center' } : { display: 'contents' }}>
      {estado === 'gana' && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: apaisada ? 4 : 10, marginTop: apaisada ? 0 : 18 }}>
          <Corona w={apaisada ? 72 : 120} />
          <div style={{ position: 'relative' }}>
            <Avatar quien={game.humanAvatar} w={apaisada ? 72 : 104} />
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: apaisada ? 34 : 46, lineHeight: 1.05, fontWeight: 700, textAlign: 'center' }}>¡Has ganado!</h1>
          <p style={{ margin: 0, fontSize: apaisada ? 17 : 20, color: 'var(--texto-2)', textAlign: 'center' }}>
            {motivo === 'por-debajo' ? 'Eres el único por debajo de 101' : 'Todos pasasteis de 101, pero tú tienes menos puntos'}
          </p>
        </div>
      )}

      {estado === 'empate' && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: apaisada ? 0 : 40 }}>
          <Avatar quien={game.humanAvatar} w={apaisada ? 72 : 96} />
          <h1 style={{ margin: '6px 0 0', fontSize: apaisada ? 34 : 46, lineHeight: 1.05, fontWeight: 700 }}>¡Empate!</h1>
          <p style={{ margin: 0, fontSize: apaisada ? 17 : 20, color: 'var(--texto-2)', textAlign: 'center' }}>
            Tú {otrosGanadores.length ? `y ${otrosGanadores.join(', ')} ` : ''}tenéis los puntos más bajos: ganáis
          </p>
        </div>
      )}

      {estado === 'eliminado' && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: apaisada ? 6 : 12, marginTop: apaisada ? 0 : 50 }}>
          <div style={{ position: 'relative' }}>
            <Avatar quien={game.humanAvatar} w={apaisada ? 80 : 120} apagado />
            <span style={{ position: 'absolute', right: -10, bottom: -6, width: 52, height: 52, borderRadius: '50%', background: '#FFE1E1', border: '4px solid #8E0F18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8E0F18" stroke-width="3.6" stroke-linecap="round"><path d="M6 6 L18 18"></path><path d="M18 6 L6 18"></path></svg>`} />
            </span>
          </div>
          <h1 style={{ margin: '8px 0 0', fontSize: apaisada ? 34 : 44, lineHeight: 1.05, fontWeight: 700 }}>Eliminado</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: apaisada ? 20 : 24, fontWeight: 700, color: '#FF8A8A' }}>
            <span>{human.score} puntos (101 o más)</span>
          </div>
          <p style={{ margin: 0, fontSize: apaisada ? 17 : 20, color: 'var(--texto-2)', textAlign: 'center' }}>
            {motivo === 'por-debajo' ? 'Ganó quien quedó por debajo de 101' : 'Todos pasaron de 101: gana quien tiene menos puntos'}
          </p>
        </div>
      )}

      </div>
      <section aria-label="Clasificación final" style={{ position: 'relative', width: '100%', background: 'var(--panel)', borderRadius: 20, padding: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        {tabla.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '4px 8px', borderRadius: 14, background: f.corona ? '#FFD23F' : 'transparent', color: f.corona ? '#1A1A1A' : f.fuera ? 'var(--texto-apagado)' : '#FFF8E7' }}>
            <Avatar quien={f.cfg.avatar} w={40} apagado={f.fuera} />
            <span style={{ fontSize: 21, fontWeight: 700, flex: 1 }}>{f.cfg.name}</span>
            {f.corona && <Svg ariaLabel="Ganador" markup={`<svg width="24" height="22" viewBox="0 0 24 22" role="img" aria-label="Ganador"><path d="M2 8 L7 12 L12 3 L17 12 L22 8 L20 20 H4 Z" fill="#1A1A1A"></path></svg>`} />}
            {f.fuera && <Svg ariaLabel="Eliminado" markup={`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF8A8A" stroke-width="3.4" stroke-linecap="round" role="img" aria-label="Eliminado"><path d="M6 6 L18 18"></path><path d="M18 6 L6 18"></path></svg>`} />}
            <span style={{ fontSize: 24, fontWeight: 700, minWidth: 48, textAlign: 'right' }}>{f.puntos}</span>
          </div>
        ))}
      </section>
      </div>

    </Tablero>
  )
}

function Corona({ w }: { w: number }) {
  return (
    <Svg markup={`<svg width="${w}" height="${w}" viewBox="0 0 24 24"><path d="M7.5 3.5 H16.5 V10 a4.5 4.5 0 0 1 -9 0 Z" fill="#FFD23F" stroke="#1A1A1A" stroke-width="1.2" stroke-linejoin="round"></path><path d="M7.5 5.5 H4 a3.5 3.5 0 0 0 4 4.5 M16.5 5.5 H20 a3.5 3.5 0 0 1 -4 4.5" fill="none" stroke="#FFD23F" stroke-width="1.6"></path><path d="M12 14.5 V18" stroke="#FFD23F" stroke-width="1.8"></path><path d="M7.5 21 H16.5 L15.5 18 H8.5 Z" fill="#FFD23F" stroke="#1A1A1A" stroke-width="1.2" stroke-linejoin="round"></path></svg>`} />
  )
}

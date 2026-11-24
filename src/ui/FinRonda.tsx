// Pantalla 7 · Fin de ronda (portado de FinRonda.dc.html): recuento y barra hacia 101.
import type { Ovni } from './game'
import { Avatar } from './Avatar'
import { CartaDe } from './Carta'
import { Svg } from './dc'
import { Tablero } from './Pantalla'

export function FinRonda({ game }: { game: Ovni }) {
  const match = game.match!
  const round = game.round!
  const result = game.lastResult!

  const rows = match.players.map((p) => {
    const inRound = round.players.find((rp) => rp.id === p.id)
    const cfg = game.players.find((c) => c.id === p.id)!
    const cards = inRound ? inRound.hand : []
    const suma = result.handPoints[p.id] ?? 0
    const total = p.score
    const elim = p.eliminated
    const color = total >= 90 ? '#FF8A8A' : total >= 70 ? '#FFB347' : '#8FE3A6'
    return {
      cfg,
      cards,
      sinCartas: !!inRound && cards.length === 0,
      suma,
      total,
      ganador: result.winnerId === p.id,
      elim,
      aviso: total >= 70 && !elim,
      color,
      sumaColor: suma === 0 ? '#8FE3A6' : '#FFF8E7',
      pct: Math.min(100, Math.round((total / 101) * 100)),
    }
  })

  return (
    <Tablero
      data-testid="fin-ronda"
      padding="22px 16px 22px"
      gap={12}
      pie={
        <button
          data-testid="siguiente-ronda"
          onClick={game.nextRound}
          style={{ height: 74, boxSizing: 'border-box', borderRadius: 22, background: '#FFD23F', color: '#1A1A1A', border: '4px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 28, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span>{match.phase === 'over' ? 'Ver resultado' : 'Siguiente ronda'}</span>
          <Svg markup={`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 H20"></path><path d="M14 6 L20 12 L14 18"></path></svg>`} />
        </button>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 52, height: 52, borderRadius: 16, background: '#FFD23F', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Svg markup={`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 V4"></path><path d="M5 4 H18 L15.5 8 L18 12 H5"></path></svg>`} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.05, fontWeight: 700 }}>Fin de ronda</h1>
          <span style={{ fontSize: 19, color: '#CFE8D8' }}>Ronda {game.roundNumber} · puntos que suma cada uno</span>
        </div>
      </div>

      {rows.map((p, idx) => (
        <div
          key={idx}
          style={{
            position: 'relative',
            background: p.ganador ? '#174B30' : '#0F3A24',
            border: `${p.ganador || p.elim ? 4 : 2}px ${p.elim ? 'dashed' : 'solid'} ${p.ganador ? '#FFD23F' : p.elim ? '#FF8A8A' : '#2F6E4A'}`,
            borderRadius: 18,
            padding: '10px 12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar quien={p.cfg.avatar} w={48} apagado={p.elim} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 21, fontWeight: 700 }}>{p.cfg.name}</span>
                {p.ganador && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFD23F', color: '#1A1A1A', borderRadius: 999, padding: '1px 10px 1px 6px', fontSize: 16, fontWeight: 700 }}>
                    <Svg markup={`<svg width="18" height="18" viewBox="0 0 24 24"><path d="M2.5 7.5 L7.5 12 L12 4 L16.5 12 L21.5 7.5 L19.5 20 H4.5 Z" fill="#1A1A1A"></path></svg>`} />
                    <span>Gana</span>
                  </span>
                )}
                {p.elim && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFE1E1', color: '#8E0F18', borderRadius: 999, padding: '1px 10px 1px 6px', fontSize: 16, fontWeight: 700 }}>
                    <Svg markup={`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E0F18" stroke-width="3.4" stroke-linecap="round"><path d="M6 6 L18 18"></path><path d="M18 6 L6 18"></path></svg>`} />
                    <span>Eliminado</span>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 44, flexWrap: 'wrap' }}>
                {p.sinCartas && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, color: '#CFE8D8' }}>
                    <Svg markup={`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FE3A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`} />
                    <span>Sin cartas</span>
                  </span>
                )}
                {p.cards.map((c, k) => (
                  <CartaDe key={k} card={c} w={30} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: p.sumaColor, flex: 'none' }}>+{p.suma}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 64, fontSize: 22, fontWeight: 700, color: p.color }}>
              {p.aviso && (
                <Svg markup={`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L22 20.5 H2 Z"></path><path d="M12 10 V14"></path><path d="M12 17.2 V17.4"></path></svg>`} />
              )}
              <span>{p.total}</span>
            </span>
            <div style={{ flex: 1, height: 14, borderRadius: 8, background: '#2C5E43', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${p.pct}%`, background: p.color, borderRadius: 8 }} />
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 17, fontWeight: 700, color: '#FFD0D0' }}>
              <Svg markup={`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD0D0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 V4"></path><path d="M5 4 H18 L15.5 8 L18 12 H5"></path></svg>`} />
              <span>101</span>
            </span>
          </div>
        </div>
      ))}

    </Tablero>
  )
}

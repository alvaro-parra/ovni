// Pantalla 2 · Mesa de juego (portado de Mesa.dc.html) + overlays.
import type { Card, Suit } from '../cards'
import { isPlayable, type RoundState } from '../engine'
import type { MatchState } from '../match'
import { HUMAN_ID, type Ovni, type PlayerCfg } from './game'
import { Avatar, type AvatarKind } from './Avatar'
import { Palo } from './Palo'
import { Carta, CartaDe } from './Carta'
import { Svg } from './dc'
import {
  cardLabel,
  rankVnum,
  SUIT_COLOR,
  SUIT_NAME,
  SUIT_ORDER,
} from './deck'

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos']

interface HandItem {
  card: Card
  est: 'jugable' | 'apagada' | 'espera'
}

function buildHand(
  cards: Card[],
  humanTurn: boolean,
  activeSuit: Suit,
  activeRank: RoundState['activeRank'],
): HandItem[] {
  const items = cards.map<HandItem>((card) => ({
    card,
    est: !humanTurn
      ? 'espera'
      : isPlayable(card, activeSuit, activeRank)
        ? 'jugable'
        : 'apagada',
  }))
  const especial = (c: Card) => c.rank === '2' || c.rank === 'sota'
  const porPaloValor = (a: HandItem, b: HandItem) =>
    SUIT_ORDER[a.card.suit] - SUIT_ORDER[b.card.suit] ||
    rankVnum(a.card.rank) - rankVnum(b.card.rank)
  const normales = items.filter((i) => !especial(i.card)).sort(porPaloValor)
  const doses = items.filter((i) => i.card.rank === '2').sort(porPaloValor)
  const sotas = items.filter((i) => i.card.rank === 'sota').sort(porPaloValor)
  return [...normales, ...doses, ...sotas]
}

const headBtn = {
  width: 52,
  height: 52,
  boxSizing: 'border-box' as const,
  borderRadius: 16,
  border: '2px solid #3C7A57',
  background: '#0F3A24',
  color: '#FFF8E7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
}

export function Mesa({ game }: { game: Ovni }) {
  const round = game.round!
  const match = game.match!
  const players = game.players

  const curId = round.players[round.currentPlayerIndex].id
  const humanTurn = curId === HUMAN_ID && round.phase === 'playing'
  const human = round.players.find((p) => p.id === HUMAN_ID)!
  const hand = buildHand(human.hand, humanTurn, round.activeSuit, round.activeRank)
  const jugables = hand.filter((i) => i.est === 'jugable')
  const hayJugable = jugables.length > 0
  const n = hand.length
  const modo = n <= 6 ? 'grande' : hayJugable ? 'dividido' : 'rejilla'

  const estado: 'tu' | 'robar' | 'ia' = humanTurn
    ? hayJugable
      ? 'tu'
      : 'robar'
    : 'ia'

  const top = round.discardPile[round.discardPile.length - 1]
  const invertido = round.direction === -1
  const forzado = round.activeRank === 'sota'
  const curPlayer = players.find((p) => p.id === curId)

  const scoreOf = (id: string) => match.players.find((p) => p.id === id)?.score ?? 0
  const humanScore = scoreOf(HUMAN_ID)
  const colorPuntos = (pts: number) =>
    pts >= 90 ? '#FF8A8A' : pts >= 70 ? '#FFB347' : '#8FE3A6'

  const rivales = round.players
    .map((rp, idx) => ({ rp, idx }))
    .filter(({ rp }) => rp.id !== HUMAN_ID)

  return (
    <div
      data-testid="mesa"
      style={{
        width: 390,
        height: 844,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        background: '#1D5A3A',
        boxShadow: 'inset 0 0 0 8px #5A3A1E',
        fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
        color: '#FFF8E7',
        padding: '16px 16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button aria-label="Salir al inicio" onClick={game.restart} style={headBtn}>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 L12 3.5 L21 11"></path><path d="M5.5 9.5 V20.5 H18.5 V9.5"></path><path d="M10 20.5 V15 H14 V20.5"></path></svg>`} />
        </button>
        <div
          aria-label={`Ronda ${game.roundNumber}. Sentido de juego: ${invertido ? 'horario' : 'antihorario'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 52,
            boxSizing: 'border-box',
            background: invertido ? '#FFD23F' : '#0F3A24',
            color: invertido ? '#1A1A1A' : '#FFF8E7',
            border: `2px solid ${invertido ? '#1A1A1A' : '#0F3A24'}`,
            borderRadius: 999,
            padding: '0 16px 0 10px',
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          <Svg
            style={{ transform: `scaleX(${invertido ? -1 : 1})` }}
            markup={`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4.5 A9 9 0 1 0 12 3"></path><path d="M12 0.5 L12 5.5 L7 3"></path></svg>`}
          />
          <span>Ronda {game.roundNumber}</span>
        </div>
        {/* Hueco del ancho de un botón para mantener centrado el indicador de ronda.
            Aquí iba el botón de sonido, retirado hasta decidir Q3 (R-UI-A11Y-10). */}
        <div aria-hidden="true" style={{ width: headBtn.width, flexShrink: 0 }} />
      </div>

      {/* Rivales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${rivales.length}, minmax(0, 1fr))`,
          gap: 8,
        }}
      >
        {rivales.map(({ rp, idx }) => {
          const cfg = players.find((p) => p.id === rp.id)!
          const pts = scoreOf(rp.id)
          const activo = idx === round.currentPlayerIndex && round.phase === 'playing'
          const color = colorPuntos(pts)
          return (
            <div
              key={rp.id}
              aria-label={`${cfg.name}: ${rp.hand.length} cartas, ${pts} puntos${activo ? ', está jugando' : ''}`}
              style={{
                position: 'relative',
                boxSizing: 'border-box',
                height: 66,
                background: '#0F3A24',
                border: `${activo ? 4 : 2}px solid ${activo ? '#FFD23F' : '#2F6E4A'}`,
                borderRadius: 16,
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {activo && (
                <span
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: -6,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: '#FFD23F',
                    border: '2px solid #1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Svg markup={`<svg width="12" height="12" viewBox="0 0 24 24"><path d="M6 3 L21 12 L6 21 Z" fill="#1A1A1A"></path></svg>`} />
                </span>
              )}
              <Avatar quien={cfg.avatar} w={40} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                  <Svg markup={`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="7" width="11" height="14" rx="2" fill="#FFF8E7"></rect><path d="M8 4 H19 a2 2 0 0 1 2 2 V16"></path></svg>`} />
                  <span>{rp.hand.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 16, fontWeight: 700, lineHeight: 1, color }}>
                  {pts >= 70 && (
                    <Svg markup={`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L22 20.5 H2 Z"></path><path d="M12 10 V14"></path></svg>`} />
                  )}
                  <span>{pts}</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: '#2C5E43', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.round((pts / 101) * 100))}%`, background: color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Centro: mazo, carta activa, palo forzado / cambio de sentido */}
      <div style={{ height: 142, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <button
          data-testid="robar"
          aria-label={`Mazo de robo, ${round.drawPile.length} cartas`}
          onClick={game.drawHuman}
          disabled={estado !== 'robar'}
          style={{
            position: 'relative',
            padding: 0,
            border: `${estado === 'robar' ? 5 : 0}px solid ${estado === 'robar' ? '#FFD23F' : 'transparent'}`,
            borderRadius: 12,
            background: 'transparent',
            cursor: estado === 'robar' ? 'pointer' : 'default',
            lineHeight: 0,
          }}
        >
          <Carta estado="dorso" w={66} />
          <span
            style={{
              position: 'absolute',
              top: -10,
              right: -14,
              minWidth: 38,
              height: 38,
              boxSizing: 'border-box',
              borderRadius: 19,
              background: '#FFF8E7',
              color: '#1A1A1A',
              border: '3px solid #1A1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 19,
              fontWeight: 700,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            {round.drawPile.length}
          </span>
          {estado === 'robar' && (
            <span
              style={{
                position: 'absolute',
                bottom: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#FFD23F',
                border: '3px solid #1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg markup={`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20 V5"></path><path d="M6 11 L12 5 L18 11"></path></svg>`} />
            </span>
          )}
        </button>

        <div aria-label={`Carta en la mesa: ${cardLabel(top)}`} style={{ lineHeight: 0 }}>
          <CartaDe card={top} estado="normal" w={88} />
        </div>

        {forzado && !game.directionToast && (
          <div
            aria-label={`Palo obligatorio: ${SUIT_NAME[round.activeSuit]}`}
            style={{
              width: 104,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: '#FFF8E7',
              color: '#1A1A1A',
              border: `3px solid ${SUIT_COLOR[round.activeSuit]}`,
              borderRadius: 18,
              padding: '8px 6px',
              fontSize: 17,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            <Palo palo={round.activeSuit} w={44} />
            <span>Ahora: {SUIT_NAME[round.activeSuit]}</span>
          </div>
        )}

        {game.directionToast && (
          <div
            style={{
              width: 104,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: '#FFD23F',
              color: '#1A1A1A',
              border: '3px solid #1A1A1A',
              borderRadius: 18,
              padding: '8px 6px',
              fontSize: 17,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            <Svg markup={`<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5 H18.5 L14.5 4.5"></path><path d="M20 15.5 H5.5 L9.5 19.5"></path></svg>`} />
            <span>¡Cambio de sentido!</span>
          </div>
        )}
      </div>

      {/* Banner de estado */}
      <Banner estado={estado} curPlayer={curPlayer} />

      {/* Panel del jugador */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: '#134229',
          borderRadius: 24,
          border: `${humanTurn ? 4 : 2}px solid ${humanTurn ? '#FFD23F' : '#2F6E4A'}`,
          padding: '10px 10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar quien={game.humanAvatar} w={38} />
          <span style={{ fontSize: 21, fontWeight: 700 }}>Tú</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 21, fontWeight: 700, marginLeft: 4 }}>
            <Svg markup={`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="7" width="11" height="14" rx="2" fill="#FFF8E7"></rect><path d="M8 4 H19 a2 2 0 0 1 2 2 V16"></path></svg>`} />
            <span data-testid="mis-cartas">{human.hand.length}</span>
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: colorPuntos(humanScore) }}>{humanScore}</span>
          <div style={{ width: 54, height: 8, borderRadius: 5, background: '#2C5E43', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((humanScore / 101) * 100))}%`, background: colorPuntos(humanScore) }} />
          </div>
          <button
            data-testid="ver-mano"
            aria-label="Ver mis cartas en grande"
            onClick={game.openVerMano}
            style={{
              width: 48,
              height: 48,
              boxSizing: 'border-box',
              borderRadius: 14,
              background: '#FFF8E7',
              border: '2px solid #1A1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              marginLeft: 4,
              cursor: 'pointer',
            }}
          >
            <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5 L21 21"></path><path d="M10.5 7.5 V13.5 M7.5 10.5 H13.5"></path></svg>`} />
          </button>
        </div>

        {modo === 'grande' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px 8px', justifyItems: 'center', paddingTop: 18 }}>
            {hand.map((i, k) => (
              <CartaBtn key={k} item={i} w={96} onPlay={game.playHuman} />
            ))}
          </div>
        )}

        {modo === 'dividido' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${jugables.length <= 6 ? 3 : 4}, minmax(0, 1fr))`,
                gap: '20px 8px',
                justifyItems: 'center',
                paddingTop: 18,
              }}
            >
              {jugables.map((i, k) => (
                <CartaBtn
                  key={k}
                  item={i}
                  w={jugables.length <= 3 ? 96 : jugables.length <= 6 ? 84 : 70}
                  onPlay={game.playHuman}
                />
              ))}
            </div>
            <button
              data-testid="ver-mano-atras"
              aria-label={`Cartas que no puedes jugar ahora: ${n - jugables.length}. Toca para verlas en grande`}
              onClick={game.openVerMano}
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#CFE8D8',
                background: '#0F3A24',
                border: 0,
                borderRadius: 16,
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', opacity: 0.6, filter: 'saturate(0.5)' }}>
                {hand.filter((i) => i.est !== 'jugable').map((i, k) => (
                  <span key={k} style={{ marginLeft: k === 0 ? 0 : -18, lineHeight: 0 }}>
                    <CartaDe card={i.card} estado="espera" w={44} />
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, flex: 'none' }}>{n - jugables.length}</span>
            </button>
          </>
        )}

        {modo === 'rejilla' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px 6px', justifyItems: 'center', paddingTop: 6 }}>
            {(n > 12 ? hand.slice(0, 11) : hand).map((i, k) => (
              <CartaBtn key={k} item={i} w={72} onPlay={game.playHuman} />
            ))}
            {n > 12 && (
              <button
                data-testid="ver-mano-mas"
                aria-label={`Ver ${n - 11} cartas más`}
                onClick={game.openVerMano}
                style={{
                  width: 72,
                  height: 111,
                  boxSizing: 'border-box',
                  borderRadius: 8,
                  border: '3px dashed #CFE8D8',
                  background: 'transparent',
                  color: '#FFF8E7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +{n - 11}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Overlays */}
      {game.overlay?.kind === 'palo' && <SelectorPalo onPick={game.chooseSuit} />}
      {game.overlay?.kind === 'roba2' && (
        <Roba2 overlay={game.overlay} onOk={game.dismissRoba2} />
      )}
      {game.overlay?.kind === 'verMano' && (
        <VerMano hand={hand} humanTurn={humanTurn} onPlay={game.playHuman} onClose={game.closeOverlay} />
      )}
    </div>
  )
}

function Banner({
  estado,
  curPlayer,
}: {
  estado: 'tu' | 'robar' | 'ia'
  curPlayer: PlayerCfg | undefined
}) {
  if (estado === 'ia') {
    return (
      <div
        role="status"
        data-testid="estado"
        data-value="ia"
        style={{ height: 52, boxSizing: 'border-box', borderRadius: 999, background: '#0F3A24', color: '#FFF8E7', border: '3px solid #3C7A57', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 23, fontWeight: 700 }}
      >
        {curPlayer && <Avatar quien={curPlayer.avatar} w={34} />}
        <span>Juega {curPlayer?.name ?? ''}</span>
      </div>
    )
  }
  const robar = estado === 'robar'
  return (
    <div
      role="status"
      data-testid="estado"
      data-value={estado}
      style={{ height: 52, boxSizing: 'border-box', borderRadius: 999, background: '#FFD23F', color: '#1A1A1A', border: '3px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: robar ? 23 : 24, fontWeight: 700 }}
    >
      {robar ? (
        <>
          <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20 V5"></path><path d="M6 11 L12 5 L18 11"></path></svg>`} />
          <span>No puedes jugar: roba</span>
        </>
      ) : (
        <>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="#FFF8E7" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"><path d="M8.5 13 V5.2 a1.75 1.75 0 0 1 3.5 0 V11 l5.2 1 a2 2 0 0 1 1.6 2.2 L18.1 19 a2 2 0 0 1 -2 1.7 H11 a2 2 0 0 1 -1.6 -0.8 L5.8 15.3 a1.6 1.6 0 0 1 2.7 -1.8 Z"></path></svg>`} />
          <span>¡Te toca! Toca una carta</span>
        </>
      )}
    </div>
  )
}

function CartaBtn({
  item,
  w,
  onPlay,
}: {
  item: HandItem
  w: number
  onPlay: (c: Card) => void
}) {
  const jugable = item.est === 'jugable'
  return (
    <button
      data-testid={jugable ? 'carta-jugable' : 'carta'}
      aria-label={cardLabel(item.card) + (jugable ? ', se puede jugar' : item.est === 'apagada' ? ', no se puede jugar' : '')}
      disabled={!jugable}
      onClick={() => jugable && onPlay(item.card)}
      style={{ padding: 0, border: 0, background: 'transparent', cursor: jugable ? 'pointer' : 'default', borderRadius: 10, lineHeight: 0 }}
    >
      <CartaDe card={item.card} estado={item.est} w={w} />
    </button>
  )
}

// ---- Overlays -----------------------------------------------------------

function SelectorPalo({ onPick }: { onPick: (s: Suit) => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,20,12,0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div role="dialog" aria-label="Elige el palo" style={{ background: '#FFF8E7', color: '#1A1A1A', borderRadius: '28px 28px 0 0', borderTop: '6px solid #5A3A1E', padding: '22px 18px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Carta rank="sota" suit="bastos" w={58} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>Elige el palo</div>
            <div style={{ fontSize: 19, color: '#4A4A4A', lineHeight: 1.25 }}>Los demás tendrán que seguirlo</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {SUITS.map((s) => (
            <button
              key={s}
              data-testid={`palo-${s}`}
              aria-label={`Elegir ${SUIT_NAME[s]}`}
              onClick={() => onPick(s)}
              style={{ height: 148, boxSizing: 'border-box', borderRadius: 22, border: `4px solid ${SUIT_COLOR[s]}`, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: SUIT_COLOR[s], padding: 0, fontFamily: 'inherit' }}
            >
              <Palo palo={s} w={78} />
              <span style={{ fontSize: 24, fontWeight: 700 }}>{SUIT_NAME[s]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Roba2({
  overlay,
  onOk,
}: {
  overlay: { byName: string; byAvatar: AvatarKind; card: Card }
  onOk: () => void
}) {
  return (
    <div role="alertdialog" aria-label="Robas 2 cartas y pierdes el turno" style={{ position: 'absolute', inset: 0, background: 'rgba(6,20,12,0.86)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0F3A24', border: '2px solid #3C7A57', padding: '8px 16px 8px 8px', borderRadius: 999, fontSize: 20, fontWeight: 700, color: '#FFF8E7' }}>
        <Avatar quien={overlay.byAvatar} w={40} />
        <span>{overlay.byName} ha jugado</span>
        <CartaDe card={overlay.card} w={36} />
      </div>
      <div aria-hidden="true" style={{ position: 'relative', width: 250, height: 220 }}>
        <div style={{ position: 'absolute', left: 30, top: 30, transform: 'rotate(-12deg)' }}>
          <Carta estado="dorso" w={104} />
        </div>
        <div style={{ position: 'absolute', left: 92, top: 14, transform: 'rotate(9deg)' }}>
          <Carta estado="dorso" w={104} />
        </div>
        <div style={{ position: 'absolute', right: -8, bottom: -14, width: 118, height: 118, boxSizing: 'border-box', borderRadius: '50%', background: '#FFD23F', color: '#1A1A1A', border: '6px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, fontWeight: 700, lineHeight: 1 }}>+2</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, color: '#FFF8E7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 700 }}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: '#FFF8E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Svg markup={`<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 V19"></path><path d="M6 13 L12 19 L18 13"></path></svg>`} />
          </span>
          <span>Robas 2 cartas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 700 }}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: '#FFF8E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Svg markup={`<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B8202A" stroke-width="2.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M6 6 L18 18"></path></svg>`} />
          </span>
          <span>Pierdes el turno</span>
        </div>
      </div>
      <button
        data-testid="roba2-ok"
        onClick={onOk}
        style={{ width: 240, height: 68, borderRadius: 22, background: '#FFD23F', color: '#1A1A1A', border: '4px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', fontSize: 28, fontWeight: 700, cursor: 'pointer' }}
      >
        <Svg markup={`<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`} />
        <span>Vale</span>
      </button>
    </div>
  )
}

function VerMano({
  hand,
  humanTurn,
  onPlay,
  onClose,
}: {
  hand: HandItem[]
  humanTurn: boolean
  onPlay: (c: Card) => void
  onClose: () => void
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,20,12,0.92)', display: 'flex', flexDirection: 'column', padding: 16, boxSizing: 'border-box', color: '#FFF8E7' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Tus cartas</h2>
        <button
          data-testid="ver-mano-cerrar"
          aria-label="Cerrar"
          onClick={onClose}
          style={{ height: 52, padding: '0 18px', borderRadius: 16, border: '3px solid #FFD23F', background: '#0F3A24', color: '#FFF8E7', fontSize: 20, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cerrar
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px 8px', justifyItems: 'center', paddingTop: 10 }}>
          {hand.map((i, k) => (
            <CartaBtn key={k} item={{ ...i, est: humanTurn ? i.est : 'espera' }} w={96} onPlay={(c) => { onPlay(c); onClose() }} />
          ))}
        </div>
      </div>
    </div>
  )
}

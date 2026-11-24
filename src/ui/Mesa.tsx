// Pantalla 2 · Mesa de juego (portado de Mesa.dc.html) + overlays.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Card, Suit } from '../cards'
import { isPlayable, type RoundState } from '../engine'
import type { MatchState } from '../match'
import { HUMAN_ID, type Jugada, type Ovni, type PlayerCfg } from './game'
import { Avatar, type AvatarKind } from './Avatar'
import { Palo } from './Palo'
import { Carta, CartaDe } from './Carta'
import { Svg } from './dc'
import { ALTO_REF_MESA, estiloTablero, useEscala } from './Pantalla'
import { ajustarRejilla, PROPORCION_CARTA } from './ajuste'
import { BotonVista, PanelVista } from './Vista'
import { CapaVuelo, CartelAviso, claveCarta, Pensando, useLatido } from './Animaciones'
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
  border: '2px solid var(--borde)',
  background: 'var(--panel)',
  color: '#FFF8E7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
}

/** Mide el tamaño de contenido de un elemento (px de diseño; no le afecta el escalado). */
function useMedida<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [tam, setTam] = useState({ ancho: 0, alto: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const ancho = el.clientWidth
      const alto = el.clientHeight
      setTam((t) => (t.ancho === ancho && t.alto === alto ? t : { ancho, alto }))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, tam] as const
}

export function Mesa({ game }: { game: Ovni }) {
  const raizRef = useRef<HTMLDivElement>(null)
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

  const estado: 'tu' | 'robar' | 'ia' | 'fin' =
    round.phase === 'over' ? 'fin' : humanTurn ? (hayJugable ? 'tu' : 'robar') : 'ia'

  const top = round.discardPile[round.discardPile.length - 1]
  const invertido = round.direction === -1
  const forzado = round.activeRank === 'sota'
  const curPlayer = players.find((p) => p.id === curId)

  const scoreOf = (id: string) => match.players.find((p) => p.id === id)?.score ?? 0
  const humanScore = scoreOf(HUMAN_ID)
  const colorPuntos = (pts: number) =>
    pts >= 90 ? '#FF8A8A' : pts >= 70 ? '#FFB347' : '#8FE3A6'

  // Cartas recién llegadas a la mano (robo o +2): se destacan hasta un rato después de
  // que no haya overlays delante, o hasta la siguiente jugada propia.
  const [nuevas, setNuevas] = useState<Set<string>>(() => new Set())
  const prevMano = useRef<{ ronda: number; claves: Set<string> } | null>(null)
  useEffect(() => {
    const claves = new Set(human.hand.map(claveCarta))
    const prev = prevMano.current
    prevMano.current = { ronda: game.roundNumber, claves }
    if (!prev || prev.ronda !== game.roundNumber || !game.dur.animar) return
    const llegadas = [...claves].filter((k) => !prev.claves.has(k))
    if (llegadas.length > 0) setNuevas(new Set(llegadas))
    else if (claves.size < prev.claves.size) setNuevas(new Set()) // has jugado: se quita
  }, [human.hand, game.roundNumber, game.dur.animar])
  useEffect(() => {
    if (nuevas.size === 0 || game.overlay) return
    const t = setTimeout(() => setNuevas(new Set()), game.dur.aviso * 1.6)
    return () => clearTimeout(t)
  }, [nuevas, game.overlay, game.dur.aviso])

  const rivales = round.players
    .map((rp, idx) => ({ rp, idx }))
    .filter(({ rp }) => rp.id !== HUMAN_ID)

  // R-UI-PLAT-1: en pantallas bajas (< 700 px de diseño) la zona central encoge un poco
  // para dejar sitio a la mano; las cartas de la mano se ajustan al hueco que queda.
  const { h: altoPantalla, w: anchoPantalla } = useEscala(ALTO_REF_MESA)
  // Ancho de diseño estrecho (móvil pequeño, o modo grande): cabecera y rivales más compactos.
  const estrecho = anchoPantalla < 340
  const muyBaja = altoPantalla < 560
  const altoCentro = Math.round(Math.max(100, Math.min(142, 142 - (700 - altoPantalla) * 0.3)))
  const wActiva = Math.min(88, Math.floor((altoCentro - 6) / PROPORCION_CARTA))
  const wMazo = Math.round(wActiva * 0.75)
  const [refMano, mano] = useMedida<HTMLDivElement>()
  const huecoMano = { ancho: mano.ancho, alto: mano.alto, gapX: 8, gapY: 20, margenSup: 18 }
  const rGrande = ajustarRejilla(n, huecoMano, 120)
  // En modo dividido, debajo va la tira de cartas no jugables (~88 px).
  // Tira de no jugables: encoge si la mano tiene poco alto.
  const wTira = mano.alto < 240 ? 30 : 44
  const altoTira = Math.round(wTira * PROPORCION_CARTA) + 12 + 8
  const rDividido = ajustarRejilla(jugables.length, { ...huecoMano, alto: mano.alto - altoTira }, 120)
  const nRejilla = Math.min(n, 12)
  const rRejilla = ajustarRejilla(nRejilla, { ...huecoMano, gapX: 6, gapY: 12, margenSup: 6 }, 96)

  return (
    <div
      data-testid="mesa"
      ref={raizRef}
      // El tablero no hace scroll, así los overlays (absolutos) lo cubren entero.
      style={estiloTablero({ overflowY: 'hidden' })}
    >
      {/* Contenido. Solo hace scroll en pantallas muy bajas (móvil en horizontal), donde la
          mano no cabría; en el resto la mano se adapta al hueco (R-UI-PLAT-1). */}
      <div
        data-testid="mesa-contenido"
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 16px 14px', overflowY: muyBaja ? 'auto' : 'hidden' }}
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
            gap: estrecho ? 6 : 8,
            whiteSpace: 'nowrap',
            height: 52,
            boxSizing: 'border-box',
            background: invertido ? '#FFD23F' : 'var(--panel)',
            color: invertido ? '#1A1A1A' : '#FFF8E7',
            border: `2px solid ${invertido ? '#1A1A1A' : 'var(--panel)'}`,
            borderRadius: 999,
            padding: estrecho ? '0 12px 0 8px' : '0 16px 0 10px',
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          <Svg
            style={{ transform: `scaleX(${invertido ? -1 : 1})` }}
            markup={`<svg width="${estrecho ? 26 : 32}" height="${estrecho ? 26 : 32}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4.5 A9 9 0 1 0 12 3"></path><path d="M12 0.5 L12 5.5 L7 3"></path></svg>`}
          />
          <span>Ronda {game.roundNumber}</span>
        </div>
        {/* Ajustes de vista (R-UI-A11Y-4). Antes iba aquí el botón de sonido, retirado
            hasta decidir Q3 (R-UI-A11Y-10). */}
        <BotonVista onClick={game.openVista} />
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
              data-vuelo={`jugador-${rp.id}`}
              aria-label={`${cfg.name}: ${rp.hand.length} cartas, ${pts} puntos${activo ? ', está jugando' : ''}`}
              style={{
                position: 'relative',
                boxSizing: 'border-box',
                height: 66,
                background: 'var(--panel)',
                border: `${activo ? 4 : 2}px solid ${activo ? '#FFD23F' : 'var(--borde-suave)'}`,
                borderRadius: 16,
                padding: estrecho ? '0 5px' : '0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: estrecho ? 4 : 8,
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
              {activo && !game.jugada && !game.aviso && !game.overlay && <Pensando animar={game.dur.animar} />}
              {game.robosRecientes[rp.id] && (
                <span
                  data-testid={`robo-${rp.id}`}
                  aria-label={`Ha robado ${game.robosRecientes[rp.id]}`}
                  style={{
                    position: 'absolute',
                    bottom: -12,
                    right: -4,
                    zIndex: 2,
                    minWidth: 36,
                    height: 30,
                    boxSizing: 'border-box',
                    padding: '0 6px',
                    borderRadius: 15,
                    background: '#FFF8E7',
                    color: '#1A1A1A',
                    border: '3px solid #1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  +{game.robosRecientes[rp.id]}
                </span>
              )}
              <Avatar quien={cfg.avatar} w={estrecho ? 28 : 40} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: estrecho ? 2 : 4, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                  <Svg markup={`<svg width="${estrecho ? 12 : 16}" height="${estrecho ? 12 : 16}" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="7" width="11" height="14" rx="2" fill="#FFF8E7"></rect><path d="M8 4 H19 a2 2 0 0 1 2 2 V16"></path></svg>`} />
                  <span>{rp.hand.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 16, fontWeight: 700, lineHeight: 1, color }}>
                  {pts >= 70 && (
                    <Svg markup={`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L22 20.5 H2 Z"></path><path d="M12 10 V14"></path></svg>`} />
                  )}
                  <span>{pts}</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'var(--pista)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.round((pts / 101) * 100))}%`, background: color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Centro: mazo, carta activa y palo forzado (el cambio de sentido se avisa en grande) */}
      <div style={{ height: altoCentro, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <button
          data-testid="robar"
          data-vuelo="mazo"
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
          <Carta estado="dorso" w={wMazo} />
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

        <div data-vuelo="pila" aria-label={`Carta en la mesa: ${cardLabel(top)}`} style={{ lineHeight: 0 }}>
          <CartaDe card={top} estado="normal" w={wActiva} />
        </div>

        {forzado && (
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

      </div>

      {/* Banner de estado */}
      <Banner estado={estado} animar={game.dur.animar} curPlayer={curPlayer} roba={game.jugada?.tipo === 'roba' && game.jugada.actorId === curId ? game.jugada.n : 0} />

      {/* Panel del jugador */}
      <div
        style={{
          flex: 1,
          minHeight: muyBaja ? 280 : 0,
          background: 'var(--panel-mano)',
          borderRadius: 24,
          border: `${humanTurn ? 4 : 2}px solid ${humanTurn ? '#FFD23F' : 'var(--borde-suave)'}`,
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
          <div style={{ width: 54, height: 8, borderRadius: 5, background: 'var(--pista)', overflow: 'hidden' }}>
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

        <div ref={refMano} data-testid="zona-mano" data-vuelo="jugador-yo" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {modo === 'grande' && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rGrande.cols}, minmax(0, 1fr))`, gap: '20px 8px', justifyItems: 'center', alignContent: 'center', flex: 1, paddingTop: 18 }}>
            {hand.map((i, k) => (
              <CartaBtn key={k} item={i} w={rGrande.w} onPlay={game.playHuman} vuelo={game.jugada} nuevas={nuevas} />
            ))}
          </div>
        )}

        {modo === 'dividido' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${rDividido.cols}, minmax(0, 1fr))`,
                gap: '20px 8px',
                justifyItems: 'center',
                paddingTop: 18,
              }}
            >
              {jugables.map((i, k) => (
                <CartaBtn
                  vuelo={game.jugada}
                  nuevas={nuevas}
                  key={k}
                  item={i}
                  w={rDividido.w}
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
                color: 'var(--texto-2)',
                background: 'var(--panel)',
                border: 0,
                borderRadius: 16,
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', opacity: 0.6, filter: 'saturate(0.5)' }}>
                {hand.filter((i) => i.est !== 'jugable').map((i, k) => (
                  <span key={k} style={{ marginLeft: k === 0 ? 0 : -Math.round(wTira * 0.4), lineHeight: 0 }}>
                    <CartaDe card={i.card} estado="espera" w={wTira} />
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, flex: 'none' }}>{n - jugables.length}</span>
            </button>
          </>
        )}

        {modo === 'rejilla' && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rRejilla.cols}, minmax(0, 1fr))`, gap: '12px 6px', justifyItems: 'center', paddingTop: 6 }}>
            {(n > 12 ? hand.slice(0, 11) : hand).map((i, k) => (
              <CartaBtn key={k} item={i} w={rRejilla.w} onPlay={game.playHuman} vuelo={game.jugada} nuevas={nuevas} />
            ))}
            {n > 12 && (
              <button
                data-testid="ver-mano-mas"
                aria-label={`Ver ${n - 11} cartas más`}
                onClick={game.openVerMano}
                style={{
                  width: rRejilla.w,
                  height: Math.round(rRejilla.w * PROPORCION_CARTA),
                  boxSizing: 'border-box',
                  borderRadius: 8,
                  border: '3px dashed var(--texto-2)',
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
      </div>

      </div>

      {/* Cartas en movimiento y avisos grandes de lo que pasa */}
      <CapaVuelo jugada={game.jugada} dur={game.dur} raiz={raizRef} wPila={wActiva} wMazo={wMazo} />
      {game.aviso && (
        <CartelAviso aviso={game.aviso} players={players} dur={game.dur} raiz={raizRef} onClose={game.cerrarAviso} />
      )}

      {/* Overlays */}
      {game.overlay?.kind === 'palo' && (
        <SelectorPalo sota={game.overlay.card} mano={human.hand} onPick={game.chooseSuit} />
      )}
      {game.overlay?.kind === 'vista' && <PanelVista onClose={game.closeOverlay} />}
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
  animar,
  curPlayer,
  roba = 0,
}: {
  estado: 'tu' | 'robar' | 'ia' | 'fin'
  animar: boolean
  curPlayer: PlayerCfg | undefined
  /** Cartas que está robando el bot en turno (0 si no está robando). */
  roba?: number
}) {
  // Late al pasar a ser tu turno (o a tener que robar), para que se note el cambio.
  const tuyo = estado === 'tu' || estado === 'robar'
  const latido = useLatido<HTMLDivElement>(estado, animar && tuyo)
  if (estado === 'fin') {
    return (
      <div
        role="status"
        data-testid="estado"
        data-value="fin"
        style={{ minHeight: 52, padding: '4px 16px', lineHeight: 1.1, textAlign: 'center', flex: 'none', boxSizing: 'border-box', borderRadius: 999, background: 'var(--panel)', color: '#FFF8E7', border: '3px solid var(--borde)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 23, fontWeight: 700 }}
      >
        <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 V4"></path><path d="M5 4 H18 L15.5 8 L18 12 H5"></path></svg>`} />
        <span>Fin de la ronda</span>
      </div>
    )
  }
  if (estado === 'ia') {
    return (
      <div
        role="status"
        data-testid="estado"
        data-value="ia"
        style={{ minHeight: 52, padding: '4px 16px', lineHeight: 1.1, textAlign: 'center', flex: 'none', boxSizing: 'border-box', borderRadius: 999, background: 'var(--panel)', color: '#FFF8E7', border: '3px solid var(--borde)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 23, fontWeight: 700 }}
      >
        {curPlayer && <Avatar quien={curPlayer.avatar} w={34} />}
        <span>{roba > 0 ? `${curPlayer?.name ?? ''} roba ${roba}` : `Juega ${curPlayer?.name ?? ''}`}</span>
      </div>
    )
  }
  const robar = estado === 'robar'
  return (
    <div
      ref={latido}
      role="status"
      data-testid="estado"
      data-value={estado}
      style={{ minHeight: 52, padding: '4px 16px', lineHeight: 1.1, textAlign: 'center', flex: 'none', boxSizing: 'border-box', borderRadius: 999, background: '#FFD23F', color: '#1A1A1A', border: '3px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: robar ? 23 : 24, fontWeight: 700 }}
    >
      {robar ? (
        <>
          <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20 V5"></path><path d="M6 11 L12 5 L18 11"></path></svg>`} />
          <span>No tienes jugada: roba</span>
        </>
      ) : (
        <>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="#FFF8E7" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"><path d="M8.5 13 V5.2 a1.75 1.75 0 0 1 3.5 0 V11 l5.2 1 a2 2 0 0 1 1.6 2.2 L18.1 19 a2 2 0 0 1 -2 1.7 H11 a2 2 0 0 1 -1.6 -0.8 L5.8 15.3 a1.6 1.6 0 0 1 2.7 -1.8 Z"></path></svg>`} />
          <span>¡Tu turno! Elige una carta</span>
        </>
      )}
    </div>
  )
}

function CartaBtn({
  item,
  w,
  onPlay,
  vuelo = null,
  nuevas,
}: {
  item: HandItem
  w: number
  onPlay: (c: Card) => void
  /** Movimiento en curso: si es esta carta volando a la mesa, se oculta de la mano. */
  vuelo?: Jugada | null
  /** Claves de las cartas recién llegadas a la mano. */
  nuevas?: Set<string>
}) {
  const jugable = item.est === 'jugable'
  const volando =
    vuelo?.tipo === 'juega' &&
    vuelo.actorId === HUMAN_ID &&
    vuelo.card.suit === item.card.suit &&
    vuelo.card.rank === item.card.rank
  return (
    <button
      data-testid={jugable ? 'carta-jugable' : 'carta'}
      data-vuelo={claveCarta(item.card)}
      aria-label={cardLabel(item.card) + (jugable ? ', se puede jugar' : item.est === 'apagada' ? ', no se puede jugar' : '')}
      disabled={!jugable}
      onClick={() => jugable && onPlay(item.card)}
      style={{ padding: 0, border: 0, background: 'transparent', cursor: jugable ? 'pointer' : 'default', borderRadius: 10, lineHeight: 0, visibility: volando ? 'hidden' : 'visible' }}
    >
      <CartaDe card={item.card} estado={item.est} w={w} nueva={nuevas?.has(claveCarta(item.card))} />
    </button>
  )
}

// ---- Overlays -----------------------------------------------------------

/**
 * Elegir palo al jugar una Sota. Muestra tus cartas (sin la Sota que juegas) y cuántas
 * tienes de cada palo, para decidir sin tener que recordar la mano que queda detrás.
 */
function SelectorPalo({ sota, mano, onPick }: { sota: Card; mano: Card[]; onPick: (s: Suit) => void }) {
  let quitada = false
  const resto = mano.filter((c) => {
    if (!quitada && c.suit === sota.suit && c.rank === sota.rank) {
      quitada = true
      return false
    }
    return true
  })
  const ordenadas = [...resto].sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || rankVnum(a.rank) - rankVnum(b.rank))
  const cuantas = (s: Suit) => resto.filter((c) => c.suit === s && c.rank !== 'sota').length
  const solape = ordenadas.length > 7 ? -Math.min(22, (ordenadas.length - 7) * 4 + 8) : 4
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,20,12,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div role="dialog" aria-label="Elige el palo" style={{ background: '#FFF8E7', color: '#1A1A1A', borderRadius: '28px 28px 0 0', borderTop: '6px solid #5A3A1E', padding: '18px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <CartaDe card={sota} w={52} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>Elige el palo</div>
            <div style={{ fontSize: 19, color: '#4A4A4A', lineHeight: 1.25 }}>Los demás tendrán que seguirlo</div>
          </div>
        </div>
        {ordenadas.length > 0 && (
          <div data-testid="palo-mano" aria-label="Tus cartas" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1D5A3A', borderRadius: 16, padding: '8px 10px' }}>
            <span style={{ color: '#FFF8E7', fontSize: 17, fontWeight: 700, flex: 'none' }}>Tú</span>
            <div style={{ display: 'flex', flexWrap: 'nowrap', minWidth: 0 }}>
              {ordenadas.map((c, k) => (
                <span key={k} style={{ marginLeft: k === 0 ? 0 : solape, lineHeight: 0 }}>
                  <CartaDe card={c} w={38} />
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {SUITS.map((s) => (
            <button
              key={s}
              data-testid={`palo-${s}`}
              aria-label={`Elegir ${SUIT_NAME[s]}: tienes ${cuantas(s)}`}
              onClick={() => onPick(s)}
              style={{ position: 'relative', height: 122, boxSizing: 'border-box', borderRadius: 22, border: `4px solid ${SUIT_COLOR[s]}`, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: SUIT_COLOR[s], padding: 0, fontFamily: 'inherit' }}
            >
              <Palo palo={s} w={62} />
              <span style={{ fontSize: 22, fontWeight: 700 }}>{SUIT_NAME[s]}</span>
              <span
                aria-hidden="true"
                style={{ position: 'absolute', top: 8, right: 8, minWidth: 40, height: 40, boxSizing: 'border-box', padding: '0 6px', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 22, fontWeight: 700, background: cuantas(s) > 0 ? SUIT_COLOR[s] : '#E8E2D2', color: cuantas(s) > 0 ? '#FFFFFF' : '#6B6455' }}
              >
                ×{cuantas(s)}
              </span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--panel)', border: '2px solid var(--borde)', padding: '8px 16px 8px 8px', borderRadius: 999, fontSize: 20, fontWeight: 700, color: '#FFF8E7' }}>
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
          style={{ height: 52, padding: '0 18px', borderRadius: 16, border: '3px solid #FFD23F', background: 'var(--panel)', color: '#FFF8E7', fontSize: 20, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
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

// Pantalla 2 · Mesa de juego (portado de Mesa.dc.html) + overlays.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Card, Suit } from '../cards'
import { isPlayable, type RoundState } from '../engine'
import type { MatchState } from '../match'
import { HUMAN_ID, type Jugada, type Ovni, type PlayerCfg } from './game'
import { Avatar } from './Avatar'
import { Palo } from './Palo'
import { Carta, CartaDe } from './Carta'
import { Svg } from './dc'
import { ALTO_REF_MESA, estiloTablero, useEscala } from './Pantalla'
import { ajustarRejilla, PROPORCION_CARTA } from './ajuste'
import { BotonVista, PanelVista } from './Vista'
import { AvisoRoba2 } from './Roba2'
import { Reglas } from './Reglas'
import { useFocoDialogo } from './foco'
import { FACTOR_GRANDE, usePreferencias } from './preferencias'
import { textoPista, type MotivoPista } from './pistas'
import { anuncioJuega, anuncioRoba } from './anuncios'
import { animarLlegada, CapaVuelo, CartelAviso, claveCarta, ManitaAyuda, Pensando, useLatido } from './Animaciones'
import {
  cardLabel,
  rankVnum,
  SUIT_COLOR,
  SUIT_NAME,
  SUIT_ORDER,
} from './deck'

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos']

/** Turnos con la manita de ayuda para quien juega por primera vez. */
const TURNOS_AYUDA = 3
const CLAVE_AYUDA = 'ovni.ayudaTurnos'

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

  // Cartas que te llegan a la mano (robo o +2): vuelan del mazo a su sitio. Mientras haya
  // un overlay delante (p. ej. el aviso del +2) esperan ocultas y vuelan al cerrarlo.
  // Layout effects: se ocultan antes de pintarse, sin un fotograma en su sitio final.
  const [llegando, setLlegando] = useState<string[]>([])
  const prevMano = useRef<{ ronda: number; claves: Set<string> } | null>(null)
  useLayoutEffect(() => {
    const claves = new Set(human.hand.map(claveCarta))
    const prev = prevMano.current
    prevMano.current = { ronda: game.roundNumber, claves }
    if (!prev || prev.ronda !== game.roundNumber) return
    const llegadas = [...claves].filter((k) => !prev.claves.has(k))
    if (llegadas.length === 0) return
    setAnuncio(anuncioRoba(null, llegadas.length, human.hand.filter((c) => llegadas.includes(claveCarta(c)))))
    if (game.dur.animar) setLlegando((l) => [...l, ...llegadas])
  }, [human.hand, game.roundNumber, game.dur.animar])

  // Lectores de pantalla: qué se juega o se roba (lo que a la vista se ve volar).
  const [anuncio, setAnuncio] = useState('')
  useEffect(() => {
    const j = game.jugada
    if (!j) return
    const nombre = j.actorId === HUMAN_ID ? null : (players.find((p) => p.id === j.actorId)?.name ?? '')
    if (j.tipo === 'juega') setAnuncio(anuncioJuega(nombre, j.card))
    else if (nombre !== null) setAnuncio(anuncioRoba(nombre, j.n))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.jugada?.id])
  useLayoutEffect(() => {
    if (llegando.length === 0 || game.overlay || !raizRef.current) return
    animarLlegada(raizRef.current, llegando, game.dur)
    setLlegando([])
  }, [llegando, game.overlay, game.dur])

  // Pista al tocar una carta que no vale (o fuera de tu turno): ocupa el banner 2,5 s.
  const [pista, setPista] = useState<{ texto: string; palo: Suit | null; id: number } | null>(null)
  const pistaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (pistaTimer.current) clearTimeout(pistaTimer.current) }, [])
  const mostrarPista = (item: HandItem, el: HTMLElement) =>
    pistaPor(
      item.est === 'espera'
        ? { tipo: 'espera', quien: curPlayer?.name ?? '' }
        : { tipo: 'no-vale', palo: round.activeSuit, numero: round.activeRank },
      el,
    )
  const pistaPor = (motivo: MotivoPista, el: HTMLElement) => {
    if (game.dur.animar) {
      el.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }],
        { duration: 320, easing: 'ease-in-out' },
      )
    }
    setPista({ texto: textoPista(motivo), palo: motivo.tipo === 'no-vale' ? motivo.palo : null, id: Date.now() })
    if (pistaTimer.current) clearTimeout(pistaTimer.current)
    pistaTimer.current = setTimeout(() => setPista(null), 2500)
  }
  // Cambia el turno o la mesa: la pista ya no aplica.
  useEffect(() => setPista(null), [round.currentPlayerIndex, round.discardPile.length])

  // Ayuda en los primeros turnos: una manita señala qué tocar. Se descuenta un turno cada
  // vez que el tuyo termina; al llegar a 0 no vuelve a salir (se guarda en el dispositivo).
  const [ayudas, setAyudas] = useState(() => {
    try {
      const v = localStorage.getItem(CLAVE_AYUDA)
      return v === null ? TURNOS_AYUDA : Number(v) || 0
    } catch {
      return TURNOS_AYUDA
    }
  })
  const estadoPrevio = useRef(estado)
  useEffect(() => {
    const eraMio = estadoPrevio.current === 'tu' || estadoPrevio.current === 'robar'
    estadoPrevio.current = estado
    if (eraMio && (estado === 'ia' || estado === 'fin') && ayudas > 0) {
      const quedan = ayudas - 1
      setAyudas(quedan)
      try {
        localStorage.setItem(CLAVE_AYUDA, String(quedan))
      } catch {
        // sin almacenamiento: la ayuda vuelve en la próxima visita
      }
    }
  }, [estado, ayudas])
  const verAyuda = ayudas > 0 && (estado === 'tu' || estado === 'robar') && !game.overlay && !game.aviso && !game.jugada

  // La carta propia en vuelo se oculta de la mano solo si de verdad se ve volar.
  const vueloVisible = game.dur.animar ? game.jugada : null

  const rivales = round.players
    .map((rp, idx) => ({ rp, idx }))
    .filter(({ rp }) => rp.id !== HUMAN_ID)

  // R-UI-PLAT-1: en pantallas bajas (< 700 px de diseño) la zona central encoge un poco
  // para dejar sitio a la mano; las cartas de la mano se ajustan al hueco que queda.
  const { h: altoPantalla, w: anchoTotal, apaisada } = useEscala(ALTO_REF_MESA, true)
  const { grande, contraste } = usePreferencias()
  // Apaisada (tableta/ordenador en horizontal, móvil girado): dos columnas, mesa a la
  // izquierda y tu mano a la derecha. `anchoPantalla` es el ancho de la columna de la mesa.
  const anchoPantalla = apaisada ? (anchoTotal - 32 - 14) / 2 : anchoTotal
  // Ancho de diseño estrecho (móvil pequeño, o modo grande): cabecera y rivales más compactos.
  const estrecho = anchoPantalla < 340
  // En vertical y muy bajo, la mesa hace scroll; en apaisado la mano tiene su columna.
  const muyBaja = !apaisada && altoPantalla < 560
  // Vertical: por debajo de ~800 px de alto la zona central cede sitio a la mano (142 px en
  // 844, ~109 en 667, mínimo 100). Apaisada: la columna de la mesa es solo para ella.
  const altoCentroBase = apaisada
    ? Math.round(Math.max(100, Math.min(210, altoPantalla - 290)))
    : Math.round(Math.max(100, Math.min(142, 142 - (800 - altoPantalla) * 0.25)))
  // «Más grande»: la mesa (mazo y pila) se queda a su tamaño en pantalla y el alto que libera
  // va a tu mano, que es lo que hay que ver bien (si no, la mano acaba más pequeña).
  const altoCentro = grande && !apaisada ? Math.max(96, Math.round(altoCentroBase / FACTOR_GRANDE)) : altoCentroBase
  const bajo = altoPantalla < 760
  const wActiva = Math.min(apaisada ? 130 : 88, Math.floor((altoCentro - 6) / PROPORCION_CARTA))
  const wMazo = Math.round(wActiva * 0.75)
  const [refMano, mano] = useMedida<HTMLDivElement>()
  // Con «Más grande», separación entre cartas menor: con todo ampliado, cada píxel cuenta
  // para que las cartas de la mano sean de verdad más grandes que en el modo normal.
  // Con poco alto (móvil pequeño) también se aprietan las filas: si no, con 6 cartas sale
  // una sola fila de cartas diminutas.
  const apretado = grande || mano.alto < 260
  const huecoMano = { ancho: mano.ancho, alto: mano.alto, gapX: apretado ? 6 : 8, gapY: apretado ? 10 : 20, margenSup: apretado ? 14 : 18 }
  const topeCarta = grande ? 150 : 120
  const rGrande = ajustarRejilla(n, huecoMano, topeCarta)
  // En modo dividido, debajo va la tira de cartas no jugables (~88 px).
  // Tira de no jugables: encoge si la mano tiene poco alto.
  const wTira = mano.alto < 240 ? 30 : 44
  // Solape de la tira: el justo para que quepan todas en el ancho (menos el número de la
  // derecha y márgenes, ~56 px); como mínimo el 40 % de la carta y como máximo el 80 %.
  const nTira = n - jugables.length
  const anchoTira = Math.max(0, mano.ancho - 56)
  const solapeTira =
    nTira <= 1
      ? 0
      : Math.round(Math.min(wTira * 0.8, Math.max(wTira * 0.4, wTira - (anchoTira - wTira) / (nTira - 1))))
  const altoTira = Math.round(wTira * PROPORCION_CARTA) + 12 + 8
  const rDividido = ajustarRejilla(jugables.length, { ...huecoMano, alto: mano.alto - altoTira }, topeCarta)
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
        data-apaisada={apaisada}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: apaisada ? 'row' : 'column', gap: apaisada ? 14 : grande ? 6 : 10, padding: grande ? '10px 10px 10px' : '16px 16px 14px', overflowY: muyBaja ? 'auto' : 'hidden' }}
      >
      {/* Columna de la mesa: en vertical es transparente (display: contents) y todo va en
          una sola columna; en apaisado agrupa cabecera, rivales, centro y banner. */}
      <div
        data-testid="mesa-izquierda"
        style={apaisada ? { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 } : { display: 'contents' }}
      >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button data-testid="salir" aria-label="Salir al inicio" onClick={game.openSalir} style={headBtn}>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 L12 3.5 L21 11"></path><path d="M5.5 9.5 V20.5 H18.5 V9.5"></path><path d="M10 20.5 V15 H14 V20.5"></path></svg>`} />
        </button>
        <div
          role="img"
          aria-label={`Ronda ${game.roundNumber}. Sentido de juego: ${invertido ? 'horario' : 'antihorario'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: estrecho ? 6 : 8,
            whiteSpace: 'nowrap',
            height: 52,
            boxSizing: 'border-box',
            // Sin resaltar en amarillo cuando el sentido se invierte: el amarillo es «te toca»
            // y el sentido ya lo dicen las flechas entre rivales; aquí solo gira el icono.
            background: 'var(--panel)',
            color: '#FFF8E7',
            border: '2px solid var(--panel)',
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
        {rivales.map(({ rp, idx }, k) => {
          const cfg = players.find((p) => p.id === rp.id)!
          const pts = scoreOf(rp.id)
          const activo = idx === round.currentPlayerIndex && round.phase === 'playing'
          const color = colorPuntos(pts)
          return (
            <div
              key={rp.id}
              data-vuelo={`jugador-${rp.id}`}
              role="group"
              aria-label={`${cfg.name}: ${rp.hand.length} cartas, ${pts} puntos${activo ? ', está jugando' : ''}`}
              style={{
                position: 'relative',
                boxSizing: 'border-box',
                height: bajo ? 56 : 66,
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
              {/* Sentido de juego entre rivales: las fichas van en orden de asiento; la flecha
                  apunta a quién juega después y se da la vuelta con un As (R-AS-1). */}
              {k < rivales.length - 1 && (
                <span
                  aria-hidden="true"
                  data-testid="flecha-sentido"
                  style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 20, height: 20, borderRadius: '50%', background: invertido ? '#FFD23F' : 'var(--fondo)', border: `2px solid ${invertido ? '#1A1A1A' : 'var(--borde)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Svg markup={`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${invertido ? '#1A1A1A' : '#FFF8E7'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="${invertido ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'}"></path></svg>`} />
                </span>
              )}
              {game.robosRecientes[rp.id] && (
                <span
                  data-testid={`robo-${rp.id}`}
                  role="img"
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
          aria-label={`Mazo de robo, ${round.drawPile.length} cartas${round.reshuffleUsed ? '. Último mazo: si se acaba, termina la ronda' : ''}`}
          data-ultimo={round.reshuffleUsed}
          // Sin `disabled`: si no toca robar, el mazo responde con una pista (R-JUEGO-4).
          onClick={(e) =>
            estado === 'robar'
              ? game.drawHuman()
              : estado === 'tu'
                ? pistaPor({ tipo: 'tienes-jugada' }, e.currentTarget)
                : estado === 'ia' && pistaPor({ tipo: 'espera', quien: curPlayer?.name ?? '' }, e.currentTarget)
          }
          aria-disabled={estado !== 'robar'}
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
              // Último mazo (ya se rebarajó, R-MAZO-2): contador en rojo y con banderita de fin,
              // porque si se acaba termina la ronda (R-MAZO-3). No solo color (R-UI-A11Y-3).
              background: round.reshuffleUsed ? '#B8202A' : '#FFF8E7',
              color: round.reshuffleUsed ? '#FFFFFF' : '#1A1A1A',
              border: '3px solid #1A1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: 19,
              fontWeight: 700,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            {round.reshuffleUsed && (
              <Svg markup={`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 V4"></path><path d="M5 4 H18 L15.5 8 L18 12 H5"></path></svg>`} />
            )}
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

        <div data-vuelo="pila" role="img" aria-label={`Carta en la mesa: ${cardLabel(top)}`} style={{ lineHeight: 0 }}>
          <CartaDe card={top} estado="normal" w={wActiva} />
        </div>

        {forzado && (
          <div
            role="img"
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
      {pista ? (
        <div
          role="status"
          data-testid="pista"
          style={{ minHeight: 52, padding: '4px 14px', lineHeight: 1.15, textAlign: 'center', flex: 'none', boxSizing: 'border-box', borderRadius: 999, background: '#FFF8E7', color: '#1A1A1A', border: '3px solid #B8202A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: anchoPantalla < 380 ? 17 : 19, fontWeight: 700 }}
        >
          {pista.palo && <Palo palo={pista.palo} w={30} />}
          <span>{pista.texto}</span>
        </div>
      ) : (
      <Banner estado={estado} animar={game.dur.animar} letra={anchoPantalla < 380 ? 20 : 22} curPlayer={curPlayer} roba={game.jugada?.tipo === 'roba' && game.jugada.actorId === curId ? game.jugada.n : 0} />
      )}
      </div>

      {/* Panel del jugador */}
      <div
        style={{
          flex: apaisada ? '1 1 0' : 1,
          minWidth: 0,
          minHeight: muyBaja ? 280 : 0,
          background: 'var(--panel-mano)',
          borderRadius: 24,
          border: `${humanTurn ? 4 : 2}px solid ${humanTurn ? '#FFD23F' : 'var(--borde-suave)'}`,
          padding: grande ? '6px 6px 8px' : '10px 10px 12px',
          // Turno de otro: la mano se atenúa un poco (sigue legible), para que se vea de un
          // vistazo que ahora no te toca. Al pasar a tu turno vuelve a plena intensidad.
          // (En modo contraste no: restar contraste iría en contra de lo que se ha pedido.)
          opacity: estado === 'ia' && !contraste ? 0.72 : 1,
          filter: estado === 'ia' && !contraste ? 'saturate(0.7)' : 'none',
          transition: game.dur.animar ? 'opacity 300ms, filter 300ms' : 'none',
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
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rGrande.cols}, minmax(0, 1fr))`, gap: `${huecoMano.gapY}px ${huecoMano.gapX}px`, justifyItems: 'center', alignContent: 'center', flex: 1, paddingTop: huecoMano.margenSup }}>
            {hand.map((i, k) => (
              <CartaBtn key={k} item={i} w={rGrande.w} onPlay={game.playHuman} vuelo={vueloVisible} oculta={llegando} onNoJugable={mostrarPista} />
            ))}
          </div>
        )}

        {modo === 'dividido' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${rDividido.cols}, minmax(0, 1fr))`,
                gap: `${huecoMano.gapY}px ${huecoMano.gapX}px`,
                justifyItems: 'center',
                alignContent: 'center',
                flex: 1,
                paddingTop: huecoMano.margenSup,
              }}
            >
              {jugables.map((i, k) => (
                <CartaBtn
                  vuelo={vueloVisible}
                  oculta={llegando}
                  onNoJugable={mostrarPista}
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
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', overflow: 'hidden', opacity: 0.85, filter: 'saturate(0.6)' }}>
                {hand.filter((i) => i.est !== 'jugable').map((i, k) => (
                  <span key={k} style={{ marginLeft: k === 0 ? 0 : -solapeTira, lineHeight: 0, flex: 'none' }}>
                    <CartaDe card={i.card} estado="espera" w={wTira} />
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, flex: 'none' }}>{n - jugables.length}</span>
            </button>
          </>
        )}

        {modo === 'rejilla' && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rRejilla.cols}, minmax(0, 1fr))`, gap: '12px 6px', justifyItems: 'center', alignContent: 'center', flex: 1, paddingTop: 6 }}>
            {(n > 12 ? hand.slice(0, 11) : hand).map((i, k) => (
              <CartaBtn key={k} item={i} w={rRejilla.w} onPlay={game.playHuman} vuelo={vueloVisible} oculta={llegando} onNoJugable={mostrarPista} />
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

      <div
        aria-live="polite"
        data-testid="anuncio"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        {anuncio}
      </div>

      {verAyuda && (
        <ManitaAyuda selector={estado === 'tu' ? '[data-testid="carta-jugable"]' : '[data-vuelo="mazo"]'} animar={game.dur.animar} />
      )}

      {/* Cartas en movimiento y avisos grandes de lo que pasa */}
      <CapaVuelo jugada={game.jugada} dur={game.dur} raiz={raizRef} wPila={wActiva} wMazo={wMazo} />
      {game.aviso && (
        <CartelAviso aviso={game.aviso} players={players} dur={game.dur} raiz={raizRef} onClose={game.cerrarAviso} />
      )}

      {/* Overlays */}
      {game.overlay?.kind === 'palo' && (
        <SelectorPalo sota={game.overlay.card} mano={human.hand} onPick={game.chooseSuit} onCancel={game.cancelarSota} unaFila={apaisada} />
      )}
      {game.overlay?.kind === 'vista' && <PanelVista onClose={game.closeOverlay} onReglas={game.openReglas} />}
      {game.overlay?.kind === 'reglas' && <Reglas onClose={game.closeOverlay} />}
      {game.overlay?.kind === 'salir' && <ConfirmarSalir onSeguir={game.closeOverlay} onSalir={game.restart} />}
      {game.overlay?.kind === 'roba2' && (
        <AvisoRoba2 datos={game.overlay} onOk={game.dismissRoba2} compacto={altoPantalla < 520} />
      )}
      {game.overlay?.kind === 'verMano' && (
        <VerMano
          hand={hand}
          humanTurn={humanTurn}
          onPlay={game.playHuman}
          onClose={game.closeOverlay}
          pistaDe={(item) =>
            textoPista(
              humanTurn && item.est !== 'espera'
                ? { tipo: 'no-vale', palo: round.activeSuit, numero: round.activeRank }
                : { tipo: 'espera', quien: curPlayer?.name ?? '' },
            )
          }
        />
      )}
    </div>
  )
}

function Banner({
  estado,
  animar,
  letra,
  curPlayer,
  roba = 0,
}: {
  estado: 'tu' | 'robar' | 'ia' | 'fin'
  animar: boolean
  /** Tamaño de letra: algo menor en pantallas estrechas para que quepa en una línea. */
  letra: number
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
        style={{ minHeight: 52, padding: '4px 16px', lineHeight: 1.1, textAlign: 'center', flex: 'none', boxSizing: 'border-box', borderRadius: 999, background: 'var(--panel)', color: '#FFF8E7', border: '3px solid var(--borde)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: letra, fontWeight: 700 }}
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
        style={{ minHeight: 52, padding: '4px 16px', lineHeight: 1.1, textAlign: 'center', flex: 'none', boxSizing: 'border-box', borderRadius: 999, background: 'var(--panel)', color: '#FFF8E7', border: '3px solid var(--borde)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: letra, fontWeight: 700 }}
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
      style={{ minHeight: 52, padding: '4px 16px', lineHeight: 1.1, textAlign: 'center', flex: 'none', boxSizing: 'border-box', borderRadius: 999, background: '#FFD23F', color: '#1A1A1A', border: '3px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: letra, fontWeight: 700 }}
    >
      {robar ? (
        <>
          <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20 V5"></path><path d="M6 11 L12 5 L18 11"></path></svg>`} />
          <span>No tienes jugada: roba</span>
        </>
      ) : (
        <>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="#FFF8E7" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"><path d="M8.5 13 V5.2 a1.75 1.75 0 0 1 3.5 0 V11 l5.2 1 a2 2 0 0 1 1.6 2.2 L18.1 19 a2 2 0 0 1 -2 1.7 H11 a2 2 0 0 1 -1.6 -0.8 L5.8 15.3 a1.6 1.6 0 0 1 2.7 -1.8 Z"></path></svg>`} />
          {/* En pantallas estrechas no cabe la frase entera: la mano dibujada ya dice «toca una carta». */}
          <span>{letra < 22 ? '¡Tu turno!' : '¡Tu turno! Elige una carta'}</span>
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
  oculta,
  onNoJugable,
}: {
  item: HandItem
  w: number
  onPlay: (c: Card) => void
  /** Al tocar una carta que no se puede jugar: pista (y la carta tiembla). */
  onNoJugable?: (item: HandItem, el: HTMLElement) => void
  /** Movimiento en curso: si es esta carta volando a la mesa, se oculta de la mano. */
  vuelo?: Jugada | null
  /** Claves de cartas que aún no han «llegado» (esperan su vuelo desde el mazo). */
  oculta?: string[]
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
      // No `disabled`: tocar una carta que no vale debe responder (pista), no ignorarse.
      aria-disabled={!jugable}
      onClick={(e) => (jugable ? onPlay(item.card) : onNoJugable?.(item, e.currentTarget))}
      style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 10, lineHeight: 0, visibility: volando || oculta?.includes(claveCarta(item.card)) ? 'hidden' : 'visible' }}
    >
      <CartaDe card={item.card} estado={item.est} w={w} />
    </button>
  )
}

// ---- Overlays -----------------------------------------------------------

/**
 * Elegir palo al jugar una Sota. Muestra tus cartas (sin la Sota que juegas) y cuántas
 * tienes de cada palo, para decidir sin tener que recordar la mano que queda detrás.
 */
function SelectorPalo({
  sota,
  mano,
  onPick,
  onCancel,
  unaFila = false,
}: {
  sota: Card
  mano: Card[]
  onPick: (s: Suit) => void
  onCancel: () => void
  /** Apaisado: los 4 palos en una fila, más bajos, para que todo quepa sin scroll. */
  unaFila?: boolean
}) {
  const ref = useFocoDialogo<HTMLDivElement>(onCancel)
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
    <div
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(6,20,12,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
    >
      <div ref={ref} role="dialog" data-claro aria-label="Elige el palo" style={{ background: '#FFF8E7', color: '#1A1A1A', borderRadius: '28px 28px 0 0', borderTop: '6px solid #5A3A1E', padding: '18px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <CartaDe card={sota} w={52} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>Elige el palo</div>
            <div style={{ fontSize: 19, color: '#4A4A4A', lineHeight: 1.25 }}>Los demás tendrán que seguirlo</div>
          </div>
        </div>
        {ordenadas.length > 0 && (
          <div data-testid="palo-mano" role="group" aria-label="Tus cartas" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1D5A3A', borderRadius: 16, padding: '8px 10px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${unaFila ? 4 : 2}, minmax(0, 1fr))`, gap: 12 }}>
          {SUITS.map((s) => (
            <button
              key={s}
              data-testid={`palo-${s}`}
              aria-label={`Elegir ${SUIT_NAME[s]}: tienes ${cuantas(s)}`}
              onClick={() => onPick(s)}
              style={{ position: 'relative', height: unaFila ? 100 : 122, boxSizing: 'border-box', borderRadius: 22, border: `4px solid ${SUIT_COLOR[s]}`, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: SUIT_COLOR[s], padding: 0, fontFamily: 'inherit' }}
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
        <button
          data-testid="palo-volver"
          aria-label="Volver sin jugar la Sota"
          onClick={onCancel}
          style={{ height: 56, borderRadius: 18, border: '3px solid #1A1A1A', background: '#FFFFFF', color: '#1A1A1A', fontFamily: 'inherit', fontSize: 21, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12 H4"></path><path d="M10 6 L4 12 L10 18"></path></svg>`} />
          <span>Volver</span>
        </button>
      </div>
    </div>
  )
}

/** Confirmación antes de abandonar: un toque sin querer en la casita no debe perder la partida. */
function ConfirmarSalir({ onSeguir, onSalir }: { onSeguir: () => void; onSalir: () => void }) {
  const ref = useFocoDialogo<HTMLDivElement>(onSeguir)
  const boton = { height: 72, width: '100%', borderRadius: 22, border: '4px solid #1A1A1A', fontFamily: 'inherit', fontSize: 26, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 } as const
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, background: 'rgba(6,20,12,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div ref={ref} role="alertdialog" data-claro aria-label="¿Salir de la partida?" style={{ width: '100%', maxWidth: 340, background: '#FFF8E7', color: '#1A1A1A', borderRadius: 28, border: '4px solid #1A1A1A', padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <Svg markup={`<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 L12 3.5 L21 11"></path><path d="M5.5 9.5 V20.5 H18.5 V9.5"></path><path d="M10 20.5 V15 H14 V20.5"></path></svg>`} />
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>¿Salir de la partida?</div>
        <div style={{ fontSize: 19, color: '#4A4A4A' }}>Se perderá la partida</div>
        <button data-testid="seguir-jugando" data-autofoco onClick={onSeguir} style={{ ...boton, background: '#FFD23F', color: '#1A1A1A' }}>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24"><path d="M7 4.5 L19.5 12 L7 19.5 Z" fill="#1A1A1A"></path></svg>`} />
          <span>Seguir jugando</span>
        </button>
        <button data-testid="confirmar-salir" onClick={onSalir} style={{ ...boton, height: 60, fontSize: 22, background: '#FFFFFF', color: '#1A1A1A', border: '3px solid #1A1A1A' }}>
          Salir
        </button>
      </div>
    </div>
  )
}

function VerMano({
  hand,
  humanTurn,
  onPlay,
  onClose,
  pistaDe,
}: {
  hand: HandItem[]
  humanTurn: boolean
  onPlay: (c: Card) => void
  onClose: () => void
  /** Texto de la pista al tocar una carta que no vale (como en la mesa). */
  pistaDe: (item: HandItem) => string
}) {
  const ref = useFocoDialogo<HTMLDivElement>(onClose)
  const [pista, setPista] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const noJugable = (item: HandItem, el: HTMLElement) => {
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }], { duration: 300 })
    }
    setPista(pistaDe(item))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPista(null), 2500)
  }
  // «En grande» de verdad: tan anchas como quepan (2 columnas con pocas cartas, 3 con más),
  // hasta 150 px; si no caben a lo alto, el panel hace scroll.
  const [refRejilla, rejilla] = useMedida<HTMLDivElement>()
  const cols = hand.length <= 4 ? 2 : 3
  const gapX = 12
  const w = Math.max(96, Math.min(150, Math.floor((rejilla.ancho - (cols - 1) * gapX) / cols)))
  return (
    <div ref={ref} role="dialog" aria-label="Tus cartas" data-testid="ver-mano-panel" style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'var(--fondo)', boxShadow: 'inset 0 0 0 8px #5A3A1E', display: 'flex', flexDirection: 'column', padding: 16, boxSizing: 'border-box', color: '#FFF8E7' }}>
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
      {pista && (
        <div role="status" data-testid="pista-lupa" style={{ marginBottom: 8, padding: '8px 14px', borderRadius: 18, background: '#FFF8E7', color: '#1A1A1A', border: '3px solid #B8202A', fontSize: 19, fontWeight: 700, textAlign: 'center' }}>
          {pista}
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div ref={refRejilla} data-testid="ver-mano-rejilla" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `22px ${gapX}px`, justifyItems: 'center', paddingTop: 20, paddingBottom: 8 }}>
          {hand.map((i, k) => (
            <CartaBtn key={k} item={{ ...i, est: humanTurn ? i.est : 'espera' }} w={w} onPlay={(c) => { onClose(); onPlay(c) }} onNoJugable={noJugable} />
          ))}
        </div>
      </div>
    </div>
  )
}

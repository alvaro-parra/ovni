// Animaciones de la mesa: cartas que vuelan y avisos grandes de lo que acaba de pasar.
// Objetivo (R-UI-A11Y-7, R-UI-A11Y-9, R-UI-COMP-5): que se entienda cada jugada sin leer.
//
// Los elementos de origen y destino se marcan en la mesa con `data-vuelo`:
//   "mazo", "pila", "jugador-<id>" (ficha del rival o mano propia) y "carta-<palo>-<valor>".
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import type { Card } from '../cards'
import { Avatar } from './Avatar'
import { Carta, CartaDe } from './Carta'
import { Palo } from './Palo'
import { Svg } from './dc'
import { HUMAN_ID, type Aviso, type Jugada, type PlayerCfg } from './game'
import { SUIT_COLOR, SUIT_NAME } from './deck'
import { PROPORCION_CARTA } from './ajuste'
import type { Duraciones } from './ritmo'
import { textosRoba2 } from './textosRoba2'

export const claveCarta = (c: Card) => `carta-${c.suit}-${c.rank}`

interface Caja {
  x: number
  y: number
  w: number
  h: number
}

/** Caja de un elemento marcado, en px de diseño relativos a la raíz (descuenta el escalado). */
function caja(raiz: HTMLElement, clave: string): Caja | null {
  const el = raiz.querySelector(`[data-vuelo="${clave}"]`)
  if (!el) return null
  const R = raiz.getBoundingClientRect()
  const s = R.width / raiz.offsetWidth || 1
  const r = el.getBoundingClientRect()
  return { x: (r.left - R.left) / s, y: (r.top - R.top) / s, w: r.width / s, h: r.height / s }
}

const EASE = 'cubic-bezier(.25,.75,.3,1)'

/**
 * Cartas que te llegan a la mano (robo o +2): cada una sale del mazo y vuela, boca arriba,
 * hasta su sitio. Técnica FLIP: la carta ya está colocada en la mano y se anima desde la
 * posición del mazo, así cae justo en su hueco sea cual sea la distribución de la mano.
 * Las que no tienen sitio propio (p. ej. en la tira de no jugables) aparecen sin vuelo.
 */
export function animarLlegada(raiz: HTMLElement, claves: string[], dur: Duraciones) {
  const mazo = caja(raiz, 'mazo')
  claves.forEach((clave, i) => {
    const el = raiz.querySelector<HTMLElement>(`[data-vuelo="${clave}"]`)
    const destino = caja(raiz, clave)
    if (!el || !destino || !mazo) return
    const dx = mazo.x + mazo.w / 2 - (destino.x + destino.w / 2)
    const dy = mazo.y + mazo.h / 2 - (destino.y + destino.h / 2)
    const s0 = Math.min(1, mazo.w / destino.w)
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s0})`, zIndex: 3 },
        { transform: 'translate(0, 0) scale(1)', zIndex: 3 },
      ],
      { duration: dur.robo, delay: i * dur.roboExtra * 1.5, easing: EASE, fill: 'backwards' },
    )
  })
}

export function CapaVuelo({
  jugada,
  dur,
  raiz,
  wPila,
  wMazo,
}: {
  jugada: Jugada | null
  dur: Duraciones
  raiz: RefObject<HTMLElement | null>
  wPila: number
  wMazo: number
}) {
  const capa = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const r = raiz.current
    const c = capa.current
    if (!jugada || !r || !c) return
    const cartas = [...c.querySelectorAll<HTMLElement>('[data-carta-vuelo]')]
    const anims: Animation[] = []

    if (jugada.tipo === 'juega') {
      const humano = jugada.actorId === HUMAN_ID
      const desde =
        (humano ? caja(r, claveCarta(jugada.card)) : null) ?? caja(r, `jugador-${jugada.actorId}`)
      const hasta = caja(r, 'pila')
      const el = cartas[0]
      if (!desde || !hasta || !el) return
      const W = wPila
      const H = W * PROPORCION_CARTA
      el.style.left = `${hasta.x + hasta.w / 2 - W / 2}px`
      el.style.top = `${hasta.y + hasta.h / 2 - H / 2}px`
      const dx = desde.x + desde.w / 2 - (hasta.x + hasta.w / 2)
      const dy = desde.y + desde.h / 2 - (hasta.y + hasta.h / 2)
      // Desde la ficha de un bot la carta "sale" pequeña y crece; desde la mano, a su tamaño.
      const s0 = humano ? desde.w / W : 0.45
      const total = humano ? dur.vueloHumano : dur.vueloBot
      anims.push(
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${s0}) rotate(${humano ? 0 : -14}deg)`, opacity: humano ? 1 : 0.2 },
            { opacity: 1, offset: 0.25 },
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
          ],
          // Llega un poco antes de que se aplique la jugada, para que "se pose" en la pila.
          { duration: total * 0.85, easing: EASE, fill: 'both' },
        ),
      )
      el.style.visibility = 'visible'
    } else {
      const desde = caja(r, 'mazo')
      const hasta = caja(r, `jugador-${jugada.actorId}`)
      if (!desde || !hasta) return
      const W = wMazo
      const H = W * PROPORCION_CARTA
      cartas.forEach((el, i) => {
        el.style.left = `${desde.x + desde.w / 2 - W / 2}px`
        el.style.top = `${desde.y + desde.h / 2 - H / 2}px`
        const dx = hasta.x + hasta.w / 2 - (desde.x + desde.w / 2)
        const dy = hasta.y + hasta.h / 2 - (desde.y + desde.h / 2)
        anims.push(
          el.animate(
            [
              { transform: 'translate(0, 0) scale(1)', opacity: 1 },
              { transform: `translate(${dx}px, ${dy}px) scale(0.45)`, opacity: 0.15 },
            ],
            { duration: dur.robo * 0.9, delay: i * dur.roboExtra, easing: EASE, fill: 'both' },
          ),
        )
        el.style.visibility = 'visible'
      })
    }
    return () => anims.forEach((a) => a.cancel())
    // Solo al empezar cada jugada nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugada?.id])

  if (!jugada || !dur.animar) return null
  const base = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    zIndex: 4,
    pointerEvents: 'none' as const,
    lineHeight: 0,
    visibility: 'hidden' as const,
    filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.45))',
  }
  return (
    <div ref={capa} aria-hidden="true" data-testid="capa-vuelo" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
      {jugada.tipo === 'juega' ? (
        <div data-carta-vuelo style={base}>
          <CartaDe card={jugada.card} estado="normal" w={wPila} />
        </div>
      ) : (
        Array.from({ length: Math.min(jugada.n, 6) }, (_, i) => (
          <div key={i} data-carta-vuelo style={base}>
            <Carta estado="dorso" w={wMazo} />
          </div>
        ))
      )}
    </div>
  )
}

// ---- Avisos ---------------------------------------------------------------

const ICONO_SENTIDO = `<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11 A8 8 0 0 0 5.6 6.2"></path><path d="M5 2.5 V6.6 H9.1"></path><path d="M4 13 A8 8 0 0 0 18.4 17.8"></path><path d="M19 21.5 V17.4 H14.9"></path></svg>`
const ICONO_REPITE = `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12 a7.5 7.5 0 1 1 -2.2 -5.3"></path><path d="M19.5 3.5 V7.5 H15.5"></path></svg>`
const ICONO_SALTA = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8E0F18" stroke-width="2.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><path d="M5.6 5.6 L18.4 18.4"></path></svg>`

export function CartelAviso({
  aviso,
  players,
  dur,
  raiz,
  onClose,
}: {
  aviso: Aviso
  players: PlayerCfg[]
  dur: Duraciones
  raiz: RefObject<HTMLElement | null>
  onClose: () => void
}) {
  const panel = useRef<HTMLDivElement>(null)
  // Centrado sobre la pila de descarte: así no tapa la mano cuando te toca jugar.
  useLayoutEffect(() => {
    const el = panel.current
    // Si el aviso aparece a la vez que la mesa (inicio de ronda), la ref de la raíz aún no
    // está enganchada: se busca la mesa desde el propio panel.
    const r = raiz.current ?? el?.closest<HTMLElement>('[data-testid="mesa"]') ?? null
    if (!r || !el) return
    const pila = caja(r, 'pila')
    const alto = r.offsetHeight
    const h = el.offsetHeight
    const centro = pila ? pila.y + pila.h / 2 : alto / 2
    el.style.marginTop = `${Math.max(8, Math.min(alto - h - 8, centro - h / 2))}px`
    // Apaisada (mesa a la izquierda, tu mano a la derecha): centrado sobre la columna de la
    // mesa, no sobre la pantalla entera, para no tapar tu mano cuando te toca.
    const izq = r.querySelector<HTMLElement>('[data-apaisada="true"] [data-testid="mesa-izquierda"]')
    if (izq) {
      const R = r.getBoundingClientRect()
      const s = R.width / r.offsetWidth || 1
      const c = izq.getBoundingClientRect()
      const ancho = r.offsetWidth
      const w = el.offsetWidth
      const cx = (c.left - R.left + c.width / 2) / s
      const x = Math.max(8 + w / 2, Math.min(ancho - 8 - w / 2, cx))
      el.style.left = `${x - ancho / 2}px`
    } else {
      el.style.left = ''
    }
  }, [aviso.id, raiz])
  useLayoutEffect(() => {
    if (!dur.animar || !panel.current) return
    const a = panel.current.animate(
      [
        { transform: 'scale(0.6)', opacity: 0 },
        { transform: 'scale(1.06)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 320, easing: 'ease-out' },
    )
    return () => a.cancel()
  }, [aviso.id, dur.animar])

  const cfg = (id: string) => players.find((p) => p.id === id)
  const nombre = (id: string) => cfg(id)?.name ?? id
  const esYo = (id: string) => id === HUMAN_ID

  let contenido: ReactNode = null
  let borde = '#1A1A1A'
  let etiqueta = ''

  if (aviso.tipo === 'roba2') {
    const v = cfg(aviso.victimaId)
    const t = textosRoba2(
      { n: aviso.n, rebarajado: aviso.rebarajado, finRonda: aviso.finRonda },
      esYo(aviso.victimaId) ? null : nombre(aviso.victimaId),
      esYo(aviso.actorId) ? null : nombre(aviso.actorId),
    )
    etiqueta = t.resumen
    contenido = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {v && <Avatar quien={v.avatar} w={76} />}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {Array.from({ length: aviso.n }, (_, i) => (
              <span key={i} style={{ transform: `rotate(${i === 0 ? -10 : 8}deg)`, marginLeft: i === 0 ? 0 : -18, lineHeight: 0 }}>
                <Carta estado="dorso" w={44} />
              </span>
            ))}
          </div>
          <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>+{aviso.n}</span>
        </div>
        <span style={{ fontSize: 22 }}>{t.robo}</span>
        {t.rebaraje && <span style={{ fontSize: 18, fontWeight: 400 }}>{t.rebaraje}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22 }}>
          {!aviso.finRonda && <Svg markup={ICONO_SALTA} />}
          <span>{t.consecuencia}</span>
        </div>
      </>
    )
  } else if (aviso.tipo === 'sentido' || aviso.tipo === 'repite') {
    // Quién jugó el As (o si es la carta inicial) y la carta misma: el cartel tapa la pila,
    // así que la carta que provoca el efecto se enseña aquí.
    const a = cfg(aviso.actorId)
    const titulo =
      aviso.tipo === 'sentido'
        ? '¡Cambio de sentido!'
        : esYo(aviso.actorId) ? '¡Vuelves a jugar!' : `¡${nombre(aviso.actorId)} vuelve a jugar!`
    const causa = aviso.inicial
      ? 'La carta inicial es un As'
      : esYo(aviso.actorId) ? 'Has jugado un As' : `${nombre(aviso.actorId)} ha jugado un As`
    etiqueta = `${causa}. ${titulo}`
    contenido = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {a && !aviso.inicial && <Avatar quien={a.avatar} w={64} />}
          <CartaDe card={aviso.carta} w={54} sinSubir />
          <Svg markup={aviso.tipo === 'sentido' ? ICONO_SENTIDO : ICONO_REPITE} />
        </div>
        <span>{titulo}</span>
        <span style={{ fontSize: 18, fontWeight: 400 }}>{causa}</span>
      </>
    )
  } else if (aviso.tipo === 'palo') {
    const a = cfg(aviso.actorId)
    borde = SUIT_COLOR[aviso.suit]
    etiqueta = `${esYo(aviso.actorId) ? 'Eliges' : `${nombre(aviso.actorId)} elige`} ${SUIT_NAME[aviso.suit]}`
    contenido = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {a && <Avatar quien={a.avatar} w={64} />}
          <Palo palo={aviso.suit} w={92} />
        </div>
        <span>
          {esYo(aviso.actorId) ? 'Eliges' : `${nombre(aviso.actorId)} elige`}{' '}
          <span style={{ color: SUIT_COLOR[aviso.suit] }}>{SUIT_NAME[aviso.suit]}</span>
        </span>
      </>
    )
  } else if (aviso.tipo === 'ronda') {
    const e = cfg(aviso.empiezaId)
    const yo = esYo(aviso.empiezaId)
    etiqueta = `Ronda ${aviso.numero}. ${yo ? '¡Empiezas tú!' : `Empieza ${nombre(aviso.empiezaId)}`}`
    contenido = (
      <>
        <span style={{ fontSize: 34 }}>Ronda {aviso.numero}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {e && <Avatar quien={e.avatar} w={64} />}
          <span>{yo ? '¡Empiezas tú!' : `Empieza ${nombre(aviso.empiezaId)}`}</span>
        </div>
      </>
    )
  } else {
    const g = aviso.ganadorId ? cfg(aviso.ganadorId) : null
    etiqueta = !aviso.ganadorId
      ? 'Se acabó el mazo: fin de la ronda'
      : esYo(aviso.ganadorId)
        ? '¡Te has quedado sin cartas!'
        : `¡${nombre(aviso.ganadorId)} se queda sin cartas!`
    contenido = (
      <>
        {g ? <Avatar quien={g.avatar} w={96} /> : <Carta estado="dorso" w={60} />}
        <span>{etiqueta}</span>
      </>
    )
  }

  return (
    <div
      data-testid="aviso"
      data-value={aviso.tipo}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        // El fondo deja pasar los toques: si ya es tu turno, tocar una carta la juega a la
        // primera (y cierra el aviso) en vez de gastar el toque en cerrarlo.
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'rgba(6,20,12,0.3)',
        padding: '0 20px',
      }}
    >
      <div
        ref={panel}
        role="alert"
        aria-label={etiqueta}
        onClick={onClose}
        style={{
          position: 'relative', // `left` lo fija el efecto de arriba en apaisada
          pointerEvents: 'auto',
          cursor: aviso.tipo === 'fin' ? 'default' : 'pointer',
          maxWidth: 340,
          width: '100%',
          boxSizing: 'border-box',
          background: '#FFF8E7',
          color: '#1A1A1A',
          border: `5px solid ${borde}`,
          boxShadow: '0 0 0 3px #1A1A1A, 0 18px 40px rgba(0,0,0,0.5)',
          borderRadius: 28,
          padding: '22px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          fontSize: 26,
          fontWeight: 700,
          lineHeight: 1.15,
          textAlign: 'center',
        }}
      >
        {contenido}
      </div>
    </div>
  )
}

/** Tres puntos que laten: el bot está pensando su jugada. */
export function Pensando({ animar }: { animar: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    if (!animar || !ref.current) return
    const anims = [...ref.current.children].map((el, i) =>
      (el as HTMLElement).animate(
        [{ transform: 'translateY(0)', opacity: 0.35 }, { transform: 'translateY(-4px)', opacity: 1 }, { transform: 'translateY(0)', opacity: 0.35 }],
        { duration: 900, delay: i * 150, iterations: Infinity },
      ),
    )
    return () => anims.forEach((a) => a.cancel())
  }, [animar])
  return (
    <span
      ref={ref}
      data-testid="pensando"
      role="img"
      aria-label="Pensando"
      style={{
        position: 'absolute',
        bottom: -12,
        left: -4,
        zIndex: 2,
        height: 24,
        padding: '0 7px',
        borderRadius: 12,
        background: '#FFF8E7',
        border: '2px solid #1A1A1A',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A1A1A', opacity: animar ? 0.35 : 1 }} />
      ))}
    </span>
  )
}

/** Hace «latir» una vez el elemento cuando cambia `clave` (p. ej. al pasar a ser tu turno). */
export function useLatido<T extends HTMLElement>(clave: string, activo: boolean) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    if (!activo || !ref.current) return
    const a = ref.current.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
      { duration: 450, easing: 'ease-out', iterations: 2 },
    )
    return () => a.cancel()
  }, [clave, activo])
  return ref
}

const ICONO_MANITA = `<svg width="54" height="54" viewBox="0 0 24 24" fill="#FFF8E7" stroke="#1A1A1A" stroke-width="1.5" stroke-linejoin="round"><path d="M8.5 13 V5.2 a1.75 1.75 0 0 1 3.5 0 V11 l5.2 1 a2 2 0 0 1 1.6 2.2 L18.1 19 a2 2 0 0 1 -2 1.7 H11 a2 2 0 0 1 -1.6 -0.8 L5.8 15.3 a1.6 1.6 0 0 1 2.7 -1.8 Z"></path></svg>`

/**
 * Manita que señala qué tocar en tus primeros turnos (una carta jugable o el mazo). No
 * captura toques. Se coloca midiendo el objetivo; si este se mueve, se recoloca.
 */
export function ManitaAyuda({ selector, animar }: { selector: string; animar: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const raiz = el?.closest<HTMLElement>('[data-testid="mesa"]')
    if (!el || !raiz) return
    const colocar = () => {
      const objetivo = raiz.querySelector<HTMLElement>(selector)
      if (!objetivo) {
        el.style.visibility = 'hidden'
        return
      }
      const R = raiz.getBoundingClientRect()
      const s = R.width / raiz.offsetWidth || 1
      const r = objetivo.getBoundingClientRect()
      el.style.left = `${(r.left - R.left) / s + r.width / s / 2 - 20}px`
      el.style.top = `${(r.top - R.top) / s + r.height / s * 0.55}px`
      el.style.visibility = 'visible'
    }
    colocar()
    const ro = new ResizeObserver(colocar)
    ro.observe(raiz)
    const anim = animar
      ? el.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(-6px, -14px)' }, { transform: 'translate(0, 0)' }], { duration: 900, iterations: Infinity, easing: 'ease-in-out' })
      : null
    return () => {
      ro.disconnect()
      anim?.cancel()
    }
  }, [selector, animar])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="manita-ayuda"
      style={{ position: 'absolute', zIndex: 4, pointerEvents: 'none', visibility: 'hidden', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))', lineHeight: 0 }}
    >
      <Svg markup={ICONO_MANITA} />
    </div>
  )
}

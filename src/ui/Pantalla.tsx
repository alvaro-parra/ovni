// Contenedor de pantalla responsive (R-UI-PLAT-1).
//
// El diseño está hecho en píxeles para un móvil de 390 px de ancho. En lugar de un marco
// fijo de 390×844, la pantalla ocupa todo el viewport:
//  - En móviles (escala 1) el marco mide lo que mida la pantalla y el contenido se adapta.
//  - En tablet/escritorio todo el marco se amplía con `transform: scale(s)`, de modo que
//    letra y cartas crecen. Nunca se reduce por debajo de 1: en un móvil pequeño la letra
//    conserva su tamaño y es el contenido el que se reorganiza (o hace scroll).
// Se usa `transform` (y no `zoom`) porque no altera las medidas de layout: los
// ResizeObserver de dentro siguen midiendo en píxeles de diseño.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { FACTOR_GRANDE, usePreferencias, variablesTema } from './preferencias'

/**
 * Alto de referencia (px de diseño) para calcular la escala. La mesa se adapta a cualquier
 * altura y cabe con holgura en 700, así que en tablet/escritorio se amplía más. Inicio, fin
 * de ronda y victoria están diseñadas para 844 y se escalan para caber enteras.
 */
export const ALTO_REF_MESA = 700
export const ALTO_REF_PANTALLA = 844
/** Ancho de referencia del diseño original. */
const ANCHO_REF = 390
const ESCALA_MAX = 1.8
/** Escala mínima en modo normal; el modo grande (R-UI-A11Y-4) la multiplica. */
const ESCALA_MIN = 1
/** Más ancho que esto no aporta nada a un diseño vertical: se centra con bandas. */
const ANCHO_MAX = 560
/** Ancho de diseño mínimo con el modo grande activo. */
const ANCHO_MIN_GRANDE = 320

/**
 * Mesa apaisada (tableta u ordenador en horizontal, móvil girado): dos columnas, a la
 * izquierda la mesa y a la derecha tu mano. Diseño de referencia 780×480.
 */
const PROPORCION_APAISADA = 1.25
const ANCHO_REF_APAISADO = 780
const ALTO_REF_APAISADO = 480
const ANCHO_MAX_APAISADO = 1000
const ANCHO_MIN_GRANDE_APAISADO = 640

export interface Escala {
  /** Factor de escala aplicado (≥ 1). */
  s: number
  /** Ancho y alto del marco en píxeles de diseño. */
  w: number
  h: number
  /** Desplazamiento horizontal en px reales para centrar el marco. */
  left: number
  /** La pantalla es apaisada y quien la usa admite el diseño en dos columnas (la mesa). */
  apaisada: boolean
}

export function calcularEscala(
  vw: number,
  vh: number,
  altoRef: number,
  factor = 1,
  admiteApaisada = false,
): Escala {
  const apaisada = admiteApaisada && vw / vh > PROPORCION_APAISADA
  const anchoRef = apaisada ? ANCHO_REF_APAISADO : ANCHO_REF
  const alto = apaisada ? ALTO_REF_APAISADO : altoRef
  const anchoMin = apaisada ? ANCHO_MIN_GRANDE_APAISADO : ANCHO_MIN_GRANDE
  const base = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Math.min(vw / anchoRef, vh / alto)))
  // El modo grande amplía hasta `factor`, pero sin dejar el ancho de diseño por debajo del
  // mínimo: más estrecho, la mesa no cabe y la mano se sale de la pantalla.
  const s = factor > 1 ? Math.max(base, Math.min(base * factor, vw / anchoMin)) : base
  const w = Math.min(apaisada ? ANCHO_MAX_APAISADO : ANCHO_MAX, vw / s)
  const h = vh / s
  return { s, w, h, left: (vw - w * s) / 2, apaisada }
}

/**
 * Zonas seguras del dispositivo (muesca, barra de inicio del iPhone…), en px. Se leen con
 * un elemento de prueba porque `env()` solo se puede consultar desde CSS. Sin muesca: 0.
 */
function zonasSeguras() {
  if (typeof document === 'undefined' || !document.body) return { t: 0, r: 0, b: 0, l: 0 }
  const d = document.createElement('div')
  d.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'
  document.body.appendChild(d)
  const cs = getComputedStyle(d)
  const px = (v: string) => parseFloat(v) || 0
  const z = { t: px(cs.paddingTop), r: px(cs.paddingRight), b: px(cs.paddingBottom), l: px(cs.paddingLeft) }
  d.remove()
  return z
}

/** Espacio útil: la ventana menos las zonas seguras (ahí no se dibuja nada importante). */
function medirViewport() {
  if (typeof window === 'undefined') return { vw: ANCHO_REF, vh: 844 }
  const z = zonasSeguras()
  return { vw: window.innerWidth - z.l - z.r, vh: window.innerHeight - z.t - z.b }
}

/** Escala para el viewport actual. Se calcula en el render: cambiar de pantalla
 *  (y por tanto de `altoRef`) aplica la escala nueva sin un fotograma intermedio. */
export function useEscala(altoRef: number, admiteApaisada = false): Escala {
  const { grande } = usePreferencias()
  const [vp, setVp] = useState(medirViewport)
  useEffect(() => {
    const on = () =>
      setVp((v) => {
        const n = medirViewport()
        return n.vw === v.vw && n.vh === v.vh ? v : n
      })
    window.addEventListener('resize', on)
    window.visualViewport?.addEventListener('resize', on)
    return () => {
      window.removeEventListener('resize', on)
      window.visualViewport?.removeEventListener('resize', on)
    }
  }, [])
  return calcularEscala(vp.vw, vp.vh, altoRef, grande ? FACTOR_GRANDE : 1, admiteApaisada)
}

/** Ocupa el viewport y coloca dentro el marco escalado. */
export function Pantalla({
  children,
  altoRef,
  admiteApaisada = false,
}: {
  children: ReactNode
  altoRef: number
  admiteApaisada?: boolean
}) {
  const { s, w, h, left } = useEscala(altoRef, admiteApaisada)
  const { grande, contraste } = usePreferencias()
  return (
    <div
      data-grande={grande}
      data-contraste={contraste}
      style={{
        ...variablesTema(contraste),
        position: 'fixed',
        // Respeta muesca y barra de inicio: el fondo del body (mismo verde) rellena esas zonas.
        top: 'env(safe-area-inset-top, 0px)',
        right: 'env(safe-area-inset-right, 0px)',
        bottom: 'env(safe-area-inset-bottom, 0px)',
        left: 'env(safe-area-inset-left, 0px)',
        overflow: 'hidden',
        background: 'var(--fondo)',
      }}
    >
      <div
        data-testid="pantalla"
        role="main"
        data-escala={s.toFixed(3)}
        style={{
          position: 'absolute',
          top: 0,
          left,
          width: w,
          height: h,
          transform: `scale(${s})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Estilo base del tablero (madera + tapete) que ocupa todo el marco. */
export function estiloTablero(extra: CSSProperties = {}): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
    background: 'var(--tapete)',
    boxShadow: 'inset 0 0 0 8px #5A3A1E',
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    color: '#FFF8E7',
    display: 'flex',
    flexDirection: 'column',
    ...extra,
  }
}

/**
 * Tablero con zona de contenido desplazable y un pie fijo (el botón principal), para que
 * la acción principal se vea siempre aunque el contenido no quepa en pantallas bajas.
 */
export function Tablero({
  children,
  pie,
  padding,
  gap,
  alignItems,
  ...rest
}: {
  children: ReactNode
  pie?: ReactNode
  padding: string
  gap: number
  alignItems?: CSSProperties['alignItems']
  'data-testid'?: string
  'data-value'?: string
}) {
  return (
    <div {...rest} style={estiloTablero({ padding, gap: 12, overflowY: 'hidden' })}>
      <div
        data-testid="tablero-scroll"
        // Enfocable: así también se puede desplazar con el teclado (flechas) si no cabe.
        tabIndex={0}
        // padding + margin negativo: deja sitio al anillo de foco (si no, el scroll lo recorta).
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap, alignItems, padding: 7, margin: -7 }}
      >
        {children}
      </div>
      {pie && <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>{pie}</div>}
    </div>
  )
}

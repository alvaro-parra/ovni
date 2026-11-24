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

export interface Escala {
  /** Factor de escala aplicado (≥ 1). */
  s: number
  /** Ancho y alto del marco en píxeles de diseño. */
  w: number
  h: number
  /** Desplazamiento horizontal en px reales para centrar el marco. */
  left: number
}

export function calcularEscala(vw: number, vh: number, altoRef: number, factor = 1): Escala {
  const base = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Math.min(vw / ANCHO_REF, vh / altoRef)))
  const s = base * factor
  const w = Math.min(ANCHO_MAX, vw / s)
  const h = vh / s
  return { s, w, h, left: (vw - w * s) / 2 }
}

function medirViewport() {
  if (typeof window === 'undefined') return { vw: ANCHO_REF, vh: 844 }
  return { vw: window.innerWidth, vh: window.innerHeight }
}

/** Escala para el viewport actual. Se calcula en el render: cambiar de pantalla
 *  (y por tanto de `altoRef`) aplica la escala nueva sin un fotograma intermedio. */
export function useEscala(altoRef: number): Escala {
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
  return calcularEscala(vp.vw, vp.vh, altoRef, grande ? FACTOR_GRANDE : 1)
}

/** Ocupa el viewport y coloca dentro el marco escalado. */
export function Pantalla({ children, altoRef }: { children: ReactNode; altoRef: number }) {
  const { s, w, h, left } = useEscala(altoRef)
  const { grande, contraste } = usePreferencias()
  return (
    <div
      data-grande={grande}
      data-contraste={contraste}
      style={{ ...variablesTema(contraste), position: 'fixed', inset: 0, overflow: 'hidden', background: 'var(--fondo)' }}
    >
      <div
        data-testid="pantalla"
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
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap, alignItems }}
      >
        {children}
      </div>
      {pie && <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>{pie}</div>}
    </div>
  )
}

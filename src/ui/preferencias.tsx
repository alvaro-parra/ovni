// Preferencias de visualización (R-UI-A11Y-4): letra/elementos grandes y contraste reforzado.
//
// - Se guardan en el dispositivo (localStorage). Si no se puede (modo privado, etc.), funcionan
//   igual durante la sesión.
// - Contraste: mientras el usuario no lo toque, sigue al sistema (`prefers-contrast: more`).
import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/** Factor de ampliación del modo grande (se multiplica por la escala responsive). */
export const FACTOR_GRANDE = 1.25

const CLAVE = 'ovni.vista'

/** Ritmo de las jugadas de los bots y de las animaciones. */
export type Velocidad = 'lenta' | 'normal' | 'rapida'

/** Multiplicador de todas las duraciones según la velocidad elegida. */
export const FACTOR_VELOCIDAD: Record<Velocidad, number> = { lenta: 1.6, normal: 1, rapida: 0.55 }

interface Guardado {
  velocidad?: Velocidad
  grande?: boolean
  /** Ausente = seguir al sistema. */
  contraste?: boolean
}

export interface Preferencias {
  velocidad: Velocidad
  setVelocidad: (v: Velocidad) => void
  grande: boolean
  contraste: boolean
  setGrande: (v: boolean) => void
  setContraste: (v: boolean) => void
}

const Ctx = createContext<Preferencias>({
  velocidad: 'normal',
  setVelocidad: () => {},
  grande: false,
  contraste: false,
  setGrande: () => {},
  setContraste: () => {},
})

export const usePreferencias = () => useContext(Ctx)

function leer(): Guardado {
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as Guardado) : {}
  } catch {
    return {}
  }
}

function guardar(g: Guardado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(g))
  } catch {
    // Sin almacenamiento: la preferencia dura lo que dure la sesión.
  }
}

function sistemaPideContraste(): boolean {
  try {
    return window.matchMedia?.('(prefers-contrast: more)').matches ?? false
  } catch {
    return false
  }
}

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [g, setG] = useState<Guardado>(leer)
  const [sistema, setSistema] = useState(sistemaPideContraste)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-contrast: more)')
    if (!mq) return
    const on = () => setSistema(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  const actualizar = (cambio: Guardado) =>
    setG((prev) => {
      const n = { ...prev, ...cambio }
      guardar(n)
      return n
    })

  const valor: Preferencias = {
    velocidad: g.velocidad ?? 'normal',
    setVelocidad: (v) => actualizar({ velocidad: v }),
    grande: g.grande ?? false,
    contraste: g.contraste ?? sistema,
    setGrande: (v) => actualizar({ grande: v }),
    setContraste: (v) => actualizar({ contraste: v }),
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

/**
 * Colores del tema como variables CSS. Los componentes usan `var(--…)` en sus estilos en
 * línea, así el modo contraste cambia todo sin tocar cada componente.
 */
const TEMA_NORMAL = {
  '--fondo': '#0F3A24',
  '--tapete': '#1D5A3A',
  '--panel': '#0F3A24',
  '--panel-mano': '#134229',
  '--panel-ganador': '#174B30',
  '--borde': '#3C7A57',
  '--borde-suave': '#2F6E4A',
  '--pista': '#2C5E43',
  '--texto-2': '#CFE8D8',
  '--texto-3': '#E8DFC8',
  '--texto-apagado': '#BFD3C6',
  '--apagada-opacidad': '0.45',
  '--apagada-fondo': '#9DA9A2',
  '--apagada-patron': 'none',
}

const TEMA_CONTRASTE: typeof TEMA_NORMAL = {
  '--fondo': '#04140B',
  '--tapete': '#0B2A1A',
  '--panel': '#03120A',
  '--panel-mano': '#03120A',
  '--panel-ganador': '#0B3A1F',
  '--borde': '#FFF8E7',
  '--borde-suave': '#FFF8E7',
  '--pista': '#5E7D6B',
  '--texto-2': '#FFFFFF',
  '--texto-3': '#FFFFFF',
  '--texto-apagado': '#FFFFFF',
  // Sin transparencia: la carta no jugable se marca con un rayado oscuro.
  '--apagada-opacidad': '1',
  '--apagada-fondo': '#FFFFFF',
  '--apagada-patron':
    'repeating-linear-gradient(135deg, rgba(0,0,0,0.55) 0 6px, rgba(0,0,0,0.15) 6px 12px)',
}

export function variablesTema(contraste: boolean): CSSProperties {
  return (contraste ? TEMA_CONTRASTE : TEMA_NORMAL) as CSSProperties
}

// Helpers para portar el diseño de Claude Design (estilos en línea + SVG crudo).
import type { CSSProperties } from 'react'

/** Convierte una cadena de CSS en línea del diseño a un objeto de estilo de React. */
export function css(s: string): CSSProperties {
  const out: Record<string, string> = {}
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const key = decl.slice(0, i).trim()
    const val = decl.slice(i + 1).trim()
    if (!key) continue
    const camel = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    out[camel] = val
  }
  return out as CSSProperties
}

/** Renderiza un SVG (u otro HTML) del diseño tal cual, sin convertir atributos. */
export function Svg({
  markup,
  style,
  ariaLabel,
}: {
  markup: string
  style?: CSSProperties
  ariaLabel?: string
}) {
  return (
    <span
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{ display: 'inline-flex', lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}

// Avatar circular (portado de Avatar.dc.html). Personas: sol/estrella/corazon/flor. Bots: robi/pixel/toby.
import { Svg } from './dc'

export type AvatarKind =
  | 'sol'
  | 'estrella'
  | 'corazon'
  | 'flor'
  | 'robi'
  | 'pixel'
  | 'toby'

const DATOS: Record<AvatarKind, { fondo: string; nombre: string }> = {
  sol: { fondo: '#FFC83D', nombre: 'Sol' },
  estrella: { fondo: '#8EC1FF', nombre: 'Estrella' },
  corazon: { fondo: '#FF9DB0', nombre: 'Corazón' },
  flor: { fondo: '#B6E58A', nombre: 'Flor' },
  robi: { fondo: '#2558C9', nombre: 'Robi' },
  pixel: { fondo: '#6E36B8', nombre: 'Pixel' },
  toby: { fondo: '#B8480F', nombre: 'Toby' },
}

function icono(q: AvatarKind, ico: number, fondo: string): string {
  if (q === 'sol')
    return `<svg width="${ico}" height="${ico}" viewBox="0 0 48 48"><circle cx="24" cy="24" r="9" fill="#1A1A1A"></circle><g stroke="#1A1A1A" stroke-width="4" stroke-linecap="round"><line x1="24" y1="4" x2="24" y2="10"></line><line x1="24" y1="38" x2="24" y2="44"></line><line x1="4" y1="24" x2="10" y2="24"></line><line x1="38" y1="24" x2="44" y2="24"></line><line x1="10" y1="10" x2="14" y2="14"></line><line x1="34" y1="34" x2="38" y2="38"></line><line x1="38" y1="10" x2="34" y2="14"></line><line x1="10" y1="38" x2="14" y2="34"></line></g></svg>`
  if (q === 'estrella')
    return `<svg width="${ico}" height="${ico}" viewBox="0 0 48 48"><polygon points="24,5 29.6,17.4 43,18.6 32.8,27.6 35.8,40.8 24,33.8 12.2,40.8 15.2,27.6 5,18.6 18.4,17.4" fill="#1A1A1A"></polygon></svg>`
  if (q === 'corazon')
    return `<svg width="${ico}" height="${ico}" viewBox="0 0 48 48"><path d="M24 41 C10 31 5 24 5 17 C5 11 9.5 7 15 7 C18.8 7 22 9 24 12.5 C26 9 29.2 7 33 7 C38.5 7 43 11 43 17 C43 24 38 31 24 41 Z" fill="#1A1A1A"></path></svg>`
  if (q === 'flor')
    return `<svg width="${ico}" height="${ico}" viewBox="0 0 48 48"><circle cx="24" cy="12" r="8" fill="#1A1A1A"></circle><circle cx="35.4" cy="20.3" r="8" fill="#1A1A1A"></circle><circle cx="31" cy="33.7" r="8" fill="#1A1A1A"></circle><circle cx="17" cy="33.7" r="8" fill="#1A1A1A"></circle><circle cx="12.6" cy="20.3" r="8" fill="#1A1A1A"></circle><circle cx="24" cy="24" r="6" fill="${fondo}"></circle></svg>`
  // robots: robi, pixel, toby (distinta forma de ojos/visor)
  const ojoR = q === 'robi' ? 4 : 0
  const ojoC = q === 'pixel' ? 8 : 0
  const visor = q === 'toby' ? 22 : 0
  return `<svg width="${ico}" height="${ico}" viewBox="0 0 48 48"><line x1="24" y1="5" x2="24" y2="11" stroke="#FFFFFF" stroke-width="3"></line><circle cx="24" cy="5" r="3.2" fill="#FFFFFF"></circle><rect x="6" y="19" width="4" height="9" rx="2" fill="#FFFFFF"></rect><rect x="38" y="19" width="4" height="9" rx="2" fill="#FFFFFF"></rect><rect x="9" y="11" width="30" height="26" rx="7" fill="#FFFFFF"></rect><circle cx="18" cy="22" r="${ojoR}" fill="${fondo}"></circle><circle cx="30" cy="22" r="${ojoR}" fill="${fondo}"></circle><rect x="14" y="18" width="${ojoC}" height="${ojoC}" fill="${fondo}"></rect><rect x="26" y="18" width="${ojoC}" height="${ojoC}" fill="${fondo}"></rect><rect x="13" y="18" width="${visor}" height="7" rx="3.5" fill="${fondo}"></rect><rect x="18" y="29" width="12" height="3" rx="1.5" fill="${fondo}"></rect></svg>`
}

export function Avatar({
  quien,
  w = 96,
  apagado = false,
}: {
  quien: AvatarKind
  w?: number
  apagado?: boolean
}) {
  const d = DATOS[quien]
  const ico = Math.round(w * 0.66)
  const bw = w >= 40 ? 3 : 2
  return (
    <div
      role="img"
      aria-label={d.nombre}
      style={{
        width: w,
        height: w,
        boxSizing: 'border-box',
        borderRadius: '50%',
        background: d.fondo,
        border: `${bw}px solid #FFF8E7`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: apagado ? 'grayscale(1) opacity(0.6)' : 'none',
        flex: 'none',
      }}
    >
      <Svg markup={icono(quien, ico, d.fondo)} />
    </div>
  )
}

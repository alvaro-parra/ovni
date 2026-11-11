// Icono SVG de cada palo español (portado de Palo.dc.html).
import type { Suit } from '../cards'
import { SUIT_NAME } from './deck'
import { Svg } from './dc'

const PALOS: Record<Suit, string> = {
  oros: `<circle cx="24" cy="24" r="21" fill="#F0B323" stroke="#9A1B22" stroke-width="2.5"></circle><circle cx="24" cy="24" r="14.5" fill="none" stroke="#9A1B22" stroke-width="2"></circle><path d="M24 13 L26.6 20.4 L34 21 L28.2 25.6 L30.2 33 L24 28.8 L17.8 33 L19.8 25.6 L14 21 L21.4 20.4 Z" fill="#9A1B22"></path>`,
  copas: `<path d="M8 4 H40 V12 C40 23 33 30 24 30 C15 30 8 23 8 12 Z" fill="#D2262E" stroke="#6E0F14" stroke-width="2" stroke-linejoin="round"></path><rect x="9" y="9" width="30" height="4.5" fill="#F0B323" stroke="#6E0F14" stroke-width="1.2"></rect><path d="M20 30 H28 L27 36 H21 Z" fill="#F0B323" stroke="#6E0F14" stroke-width="1.6" stroke-linejoin="round"></path><path d="M10 45.5 C10 40 16.5 36 24 36 C31.5 36 38 40 38 45.5 Z" fill="#D2262E" stroke="#6E0F14" stroke-width="2" stroke-linejoin="round"></path>`,
  espadas: `<path d="M24 1.5 L29.5 8 V30 H18.5 V8 Z" fill="#3F7BD9" stroke="#13306B" stroke-width="2" stroke-linejoin="round"></path><path d="M24 6 V28" stroke="#13306B" stroke-width="1.6"></path><path d="M7.5 30 C12 28 36 28 40.5 30 C40.5 33.5 40.5 33.5 40.5 34 C36 36 12 36 7.5 34 Z" fill="#F0B323" stroke="#6B4A00" stroke-width="1.8" stroke-linejoin="round"></path><rect x="20.5" y="35" width="7" height="8" fill="#9A1B22" stroke="#4A0A0E" stroke-width="1.4"></rect><circle cx="24" cy="44" r="3.4" fill="#F0B323" stroke="#6B4A00" stroke-width="1.4"></circle>`,
  bastos: `<path d="M31 2.5 C38.5 2.5 43 8.5 40.5 15 L24.5 44 C23.2 46.5 18.8 46.2 18 43.4 L17 40 C16.5 38.3 17 37 18 35.6 L27.6 6.4 C28.2 4 29.4 2.5 31 2.5 Z" fill="#3E8E3E" stroke="#1C461C" stroke-width="2" stroke-linejoin="round"></path><path d="M33 9.5 L37.5 7.5 M28.5 20.5 L24 18.5 M24.5 31 L29 30" stroke="#1C461C" stroke-width="2" stroke-linecap="round"></path><path d="M17 40 C16.5 38.3 17 37 18 35.6 L21.5 37 L19.8 44.8 C18.8 44.6 18.2 44.1 18 43.4 Z" fill="#B8202A" stroke="#4A0A0E" stroke-width="1.4"></path>`,
}

export function Palo({ palo, w = 96 }: { palo: Suit; w?: number }) {
  return (
    <span
      style={{
        width: w,
        height: w,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      <Svg
        ariaLabel={SUIT_NAME[palo]}
        markup={`<svg width="${w}" height="${w}" viewBox="0 0 48 48" role="img" aria-label="${SUIT_NAME[palo]}">${PALOS[palo]}</svg>`}
      />
    </span>
  )
}

// Aviso cuando te hacen robar con un 2 (R-DOS-1). Enseña las cartas que has robado de
// verdad, boca arriba, y explica los casos límite: menos de 2 cartas en el mazo, rebaraje
// de la mesa (R-MAZO-2) o fin de ronda porque el 2 era la última carta (R-DOS-4).
import type { Card } from '../cards'
import type { AvatarKind } from './Avatar'
import { Avatar } from './Avatar'
import { CartaDe } from './Carta'
import { Svg } from './dc'
import { textosRoba2 } from './textosRoba2'

export interface DatosAvisoRoba2 {
  byName: string
  byAvatar: AvatarKind
  /** El 2 jugado. */
  card: Card
  /** Cartas que has robado (0, 1 o 2). */
  cartas: Card[]
  rebarajado: boolean
  finRonda: boolean
}

const ICONO_ROBO = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 V19"></path><path d="M6 13 L12 19 L18 13"></path></svg>`
const ICONO_TURNO = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B8202A" stroke-width="2.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M6 6 L18 18"></path></svg>`
const ICONO_BARAJA = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7 H8 C11 7 13 17 16 17 H21"></path><path d="M3 17 H8 C11 17 13 7 16 7 H21"></path><path d="M18 4 L21 7 L18 10"></path><path d="M18 14 L21 17 L18 20"></path></svg>`
const ICONO_FIN = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 V4"></path><path d="M5 4 H18 L15.5 8 L18 12 H5"></path></svg>`

function Linea({ icono, texto, testid }: { icono: string; texto: string; testid: string }) {
  return (
    <div data-testid={testid} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
      <span style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: '#FFF8E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Svg markup={icono} />
      </span>
      <span>{texto}</span>
    </div>
  )
}

export function AvisoRoba2({ datos, onOk }: { datos: DatosAvisoRoba2; onOk: () => void }) {
  const n = datos.cartas.length
  const t = textosRoba2({ n, rebarajado: datos.rebarajado, finRonda: datos.finRonda }, null, datos.byName)
  return (
    <div
      role="alertdialog"
      aria-label={t.resumen}
      data-testid="aviso-roba2"
      data-robadas={n}
      style={{ position: 'absolute', inset: 0, zIndex: 6, background: 'rgba(6,20,12,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '20px 22px', boxSizing: 'border-box', overflowY: 'auto', color: '#FFF8E7' }}
    >
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--panel)', border: '2px solid var(--borde)', padding: '8px 16px 8px 8px', borderRadius: 999, fontSize: 20, fontWeight: 700 }}>
        <Avatar quien={datos.byAvatar} w={40} />
        <span>{datos.byName} ha jugado</span>
        <CartaDe card={datos.card} w={36} />
      </div>

      {/* Las cartas robadas, boca arriba (o un hueco vacío si no quedaba ninguna). */}
      <div data-testid="cartas-robadas" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 160, padding: '0 40px' }}>
        {n === 0 ? (
          <div aria-hidden="true" style={{ width: 96, height: 148, boxSizing: 'border-box', borderRadius: 10, border: '4px dashed #CFE8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: '#CFE8D8' }}>
            0
          </div>
        ) : (
          datos.cartas.map((c, i) => (
            <div key={i} style={{ lineHeight: 0, transform: n > 1 ? `rotate(${i === 0 ? -6 : 6}deg)` : undefined }}>
              <CartaDe card={c} w={96} />
            </div>
          ))
        )}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', right: -4, bottom: -18, width: 84, height: 84, boxSizing: 'border-box', borderRadius: '50%', background: '#FFD23F', color: '#1A1A1A', border: '5px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, lineHeight: 1 }}
        >
          +{n}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, maxWidth: 340 }}>
        <Linea testid="roba2-robo" icono={ICONO_ROBO} texto={t.robo} />
        {t.rebaraje && <Linea testid="roba2-rebaraje" icono={ICONO_BARAJA} texto={t.rebaraje} />}
        <Linea testid="roba2-consecuencia" icono={datos.finRonda ? ICONO_FIN : ICONO_TURNO} texto={t.consecuencia} />
      </div>

      <button
        data-testid="roba2-ok"
        onClick={onOk}
        style={{ marginBottom: 'auto', flex: 'none', width: 240, height: 68, borderRadius: 22, background: '#FFD23F', color: '#1A1A1A', border: '4px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', fontSize: 28, fontWeight: 700, cursor: 'pointer' }}
      >
        <Svg markup={`<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`} />
        <span>Vale</span>
      </button>
    </div>
  )
}

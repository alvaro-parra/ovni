// Interruptores de visualización (R-UI-A11Y-4): letra/elementos grandes y contraste reforzado.
// Se reconocen por el icono; el estado activo se ve por color Y por una marca ✓ (R-UI-A11Y-3).
import type { CSSProperties, ReactNode } from 'react'
import { Svg } from './dc'
import { usePreferencias, type Velocidad } from './preferencias'
import { useFocoDialogo } from './foco'

const ICONO_GRANDE = (c: string, w: number) =>
  `<svg width="${w}" height="${w}" viewBox="0 0 32 32"><text x="1" y="26" font-family="Atkinson Hyperlegible, system-ui, sans-serif" font-size="15" font-weight="700" fill="${c}">A</text><text x="11" y="27" font-family="Atkinson Hyperlegible, system-ui, sans-serif" font-size="25" font-weight="700" fill="${c}">A</text></svg>`

const ICONO_CONTRASTE = (c: string, w: number) =>
  `<svg width="${w}" height="${w}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="2.6"></circle><path d="M12 3 A9 9 0 0 1 12 21 Z" fill="${c}"></path></svg>`

function Check() {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -10,
        right: -8,
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: '#FFD23F',
        border: '3px solid #1A1A1A',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg markup={`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`} />
    </span>
  )
}

function estiloBoton(activo: boolean, extra: CSSProperties): CSSProperties {
  return {
    position: 'relative',
    boxSizing: 'border-box',
    borderRadius: 16,
    border: activo ? '3px solid #1A1A1A' : '2px solid var(--borde)',
    background: activo ? '#FFD23F' : 'var(--panel)',
    color: activo ? '#1A1A1A' : '#FFF8E7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0, // áreas táctiles fijas: no se encogen en pantallas estrechas
    ...extra,
  }
}

const VELOCIDADES: { v: Velocidad; icono: string; texto: string }[] = [
  { v: 'lenta', icono: '🐢', texto: 'Despacio' },
  { v: 'normal', icono: '🚶', texto: 'Normal' },
  { v: 'rapida', icono: '🐇', texto: 'Rápido' },
]

/** Rótulo corto bajo un botón de icono: el icono solo no basta (¿qué es el muñeco que anda?). */
export function ConRotulo({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
      {children}
      <span aria-hidden="true" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: 'var(--texto-2)', whiteSpace: 'nowrap' }}>
        {texto}
      </span>
    </div>
  )
}

/** Botones cuadrados (icono + rótulo) para la cabecera de la pantalla de inicio: letra grande,
 *  contraste y velocidad (este último pasa a la siguiente con cada toque). */
export function InterruptoresVista() {
  const { grande, contraste, setGrande, setContraste, velocidad, setVelocidad } = usePreferencias()
  const iVel = VELOCIDADES.findIndex((x) => x.v === velocidad)
  const vel = VELOCIDADES[iVel]
  const siguiente = VELOCIDADES[(iVel + 1) % VELOCIDADES.length]
  return (
    <>
      <ConRotulo texto="Letra">
        <button
          data-testid="vista-grande"
          aria-label="Letra y botones más grandes"
          aria-pressed={grande}
          onClick={() => setGrande(!grande)}
          style={estiloBoton(grande, { width: 52, height: 52 })}
        >
          <Svg markup={ICONO_GRANDE(grande ? '#1A1A1A' : '#FFF8E7', 32)} />
          {grande && <Check />}
        </button>
      </ConRotulo>
      <ConRotulo texto="Contraste">
        <button
          data-testid="vista-contraste"
          aria-label="Más contraste"
          aria-pressed={contraste}
          onClick={() => setContraste(!contraste)}
          style={estiloBoton(contraste, { width: 52, height: 52 })}
        >
          <Svg markup={ICONO_CONTRASTE(contraste ? '#1A1A1A' : '#FFF8E7', 28)} />
          {contraste && <Check />}
        </button>
      </ConRotulo>
      <ConRotulo texto={vel.texto}>
        <button
          data-testid="vista-velocidad"
          data-value={velocidad}
          aria-label={`Velocidad: ${vel.texto}. Toca para ${siguiente.texto.toLowerCase()}`}
          onClick={() => setVelocidad(siguiente.v)}
          style={estiloBoton(velocidad !== 'normal', { width: 52, height: 52 })}
        >
          <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>{vel.icono}</span>
        </button>
      </ConRotulo>
    </>
  )
}

/** Botón de la cabecera de la mesa que abre el panel de vista. */
export function BotonVista({ onClick }: { onClick: () => void }) {
  return (
    <button
      data-testid="abrir-vista"
      aria-label="Ver mejor: letra grande y contraste"
      onClick={onClick}
      style={estiloBoton(false, { width: 52, height: 52, flexShrink: 0 })}
    >
      <Svg markup={`<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12 C4.5 6.5 8 4.5 12 4.5 C16 4.5 19.5 6.5 22.5 12 C19.5 17.5 16 19.5 12 19.5 C8 19.5 4.5 17.5 1.5 12 Z"></path><circle cx="12" cy="12" r="3.6" fill="#FFF8E7"></circle></svg>`} />
    </button>
  )
}

/** Panel inferior con los dos interruptores grandes (icono + texto), para la mesa. */

export function PanelVista({ onClose, onReglas }: { onClose: () => void; onReglas?: () => void }) {
  const { grande, contraste, setGrande, setContraste, velocidad, setVelocidad } = usePreferencias()
  const ref = useFocoDialogo<HTMLDivElement>(onClose)
  const fila = (activo: boolean, icono: string, texto: string, testid: string, on: () => void) => (
    <button
      data-testid={testid}
      aria-pressed={activo}
      onClick={on}
      style={estiloBoton(activo, {
        height: 84,
        width: '100%',
        justifyContent: 'flex-start',
        gap: 16,
        padding: '0 18px',
        fontSize: 24,
        fontWeight: 700,
        border: activo ? '4px solid #1A1A1A' : '3px solid #1A1A1A',
        background: activo ? '#FFD23F' : '#FFFFFF',
        color: '#1A1A1A',
      })}
    >
      <Svg markup={icono} />
      <span>{texto}</span>
      {activo && <Check />}
    </button>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,20,12,0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 5 }}>
      <div ref={ref} role="dialog" data-claro aria-label="Ver mejor" style={{ background: '#FFF8E7', color: '#1A1A1A', borderRadius: '28px 28px 0 0', borderTop: '6px solid #5A3A1E', padding: '22px 18px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>Ver mejor</div>
        {fila(grande, ICONO_GRANDE('#1A1A1A', 40), 'Más grande', 'vista-grande', () => setGrande(!grande))}
        {fila(contraste, ICONO_CONTRASTE('#1A1A1A', 36), 'Más contraste', 'vista-contraste', () => setContraste(!contraste))}
        <div role="radiogroup" aria-label="Velocidad del juego" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {VELOCIDADES.map(({ v, icono, texto }) => {
            const activo = velocidad === v
            return (
              <button
                key={v}
                role="radio"
                aria-checked={activo}
                data-testid={`velocidad-${v}`}
                onClick={() => setVelocidad(v)}
                style={estiloBoton(activo, {
                  height: 84,
                  flexDirection: 'column',
                  gap: 2,
                  fontSize: 18,
                  fontWeight: 700,
                  border: activo ? '4px solid #1A1A1A' : '3px solid #1A1A1A',
                  background: activo ? '#FFD23F' : '#FFFFFF',
                  color: '#1A1A1A',
                })}
              >
                <span aria-hidden="true" style={{ fontSize: 34, lineHeight: 1 }}>{icono}</span>
                <span>{texto}</span>
                {activo && <Check />}
              </button>
            )
          })}
        </div>
        {onReglas && (
          <button
            data-testid="vista-reglas"
            onClick={onReglas}
            style={estiloBoton(false, { height: 60, width: '100%', justifyContent: 'flex-start', gap: 14, padding: '0 18px', fontSize: 22, fontWeight: 700, border: '3px solid #1A1A1A', background: '#FFFFFF', color: '#1A1A1A' })}
          >
            <Svg markup={`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"></circle><path d="M9.2 9.3 a3 3 0 0 1 5.6 1.2 c0 2 -2.8 2.4 -2.8 4"></path><path d="M12 17.6 V17.8"></path></svg>`} />
            <span>Cómo se juega</span>
          </button>
        )}
        <button
          data-testid="cerrar-vista"
          onClick={onClose}
          style={{ height: 64, borderRadius: 20, border: '4px solid #1A1A1A', background: '#1D5A3A', color: '#FFF8E7', fontSize: 24, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`} />
          <span>Listo</span>
        </button>
      </div>
    </div>
  )
}

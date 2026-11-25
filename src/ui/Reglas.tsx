// Reglas resumidas («¿Cómo se juega?»), con un dibujo por regla y frases cortas, para
// quien lee poco (R-UI-PUB-1). Resumen de REQUISITOS.md, no sustituye al reglamento.
import type { ReactNode } from 'react'
import type { Card } from '../cards'
import { Carta, CartaDe } from './Carta'
import { Palo } from './Palo'
import { Svg } from './dc'
import { useFocoDialogo } from './foco'

const C = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit })

const ICONO_SENTIDO = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11 A8 8 0 0 0 5.6 6.2"></path><path d="M5 2.5 V6.6 H9.1"></path><path d="M4 13 A8 8 0 0 0 18.4 17.8"></path><path d="M19 21.5 V17.4 H14.9"></path></svg>`
const FLECHA = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 H20"></path><path d="M14 6 L20 12 L14 18"></path></svg>`
const CHECK = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F6B2F" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`
const BANDERA = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#B8202A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 V4"></path><path d="M5 4 H18 L15.5 8 L18 12 H5"></path></svg>`

const W = 40 // ancho de las cartas de ejemplo

function Regla({ n, dibujo, children }: { n: number; dibujo: ReactNode; children: ReactNode }) {
  return (
    <li
      data-testid={`regla-${n}`}
      style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: '3px solid #1A1A1A', borderRadius: 18, padding: '10px 12px' }}
    >
      <div aria-hidden="true" style={{ flex: 'none', width: 118, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {dibujo}
      </div>
      <div style={{ fontSize: 19, lineHeight: 1.25, fontWeight: 700 }}>{children}</div>
    </li>
  )
}

export function Reglas({ onClose }: { onClose: () => void }) {
  const ref = useFocoDialogo<HTMLDivElement>(onClose)
  return (
    <div
      ref={ref}
      role="dialog"
      data-claro
      aria-label="Cómo se juega"
      data-testid="reglas"
      style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#FFF8E7', color: '#1A1A1A', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 0 0 8px #5A3A1E' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 18px 10px' }}>
        <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.1, flex: 1 }}>Cómo se juega</h2>
        <button
          data-testid="reglas-cerrar"
          aria-label="Cerrar"
          onClick={onClose}
          style={{ width: 52, height: 52, flex: 'none', borderRadius: 16, border: '3px solid #1A1A1A', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
        >
          <Svg markup={`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3.2" stroke-linecap="round"><path d="M6 6 L18 18"></path><path d="M18 6 L6 18"></path></svg>`} />
        </button>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: '4px 18px 12px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <Regla
          n={1}
          dibujo={
            <>
              <span style={{ lineHeight: 0 }}><Carta estado="dorso" w={30} /></span>
              <span style={{ lineHeight: 0, marginLeft: -16 }}><Carta estado="dorso" w={30} /></span>
              <Svg markup={FLECHA} />
              <span style={{ fontSize: 34, fontWeight: 700 }}>0</span>
            </>
          }
        >
          Gana la ronda quien se queda antes sin cartas.
        </Regla>

        <Regla
          n={2}
          dibujo={
            <>
              <span style={{ lineHeight: 0 }}><CartaDe card={C('7', 'copas')} w={W} /></span>
              <Svg markup={FLECHA} />
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><CartaDe card={C('3', 'copas')} w={24} /><Svg markup={CHECK} /></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><CartaDe card={C('7', 'oros')} w={24} /><Svg markup={CHECK} /></span>
              </span>
            </>
          }
        >
          Echa una carta del mismo palo o del mismo número que la de la mesa.
        </Regla>

        <Regla
          n={3}
          dibujo={
            <>
              <span style={{ lineHeight: 0 }}><Carta estado="dorso" w={W} /></span>
              <Svg markup={`<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 V19"></path><path d="M6 13 L12 19 L18 13"></path></svg>`} />
            </>
          }
        >
          Si no puedes echar ninguna, roba del mazo hasta que puedas.
        </Regla>

        <Regla
          n={4}
          dibujo={
            <>
              <span style={{ lineHeight: 0 }}><CartaDe card={C('sota', 'oros')} w={W} /></span>
              <span style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 22px)', gap: 2 }}>
                <Palo palo="oros" w={22} />
                <Palo palo="copas" w={22} />
                <Palo palo="espadas" w={22} />
                <Palo palo="bastos" w={22} />
              </span>
            </>
          }
        >
          La Sota (10) vale siempre. Tú eliges el palo que sigue.
        </Regla>

        <Regla
          n={5}
          dibujo={
            <>
              <span style={{ lineHeight: 0 }}><CartaDe card={C('2', 'espadas')} w={W} /></span>
              <span style={{ fontSize: 30, fontWeight: 700 }}>+2</span>
            </>
          }
        >
          Con un 2, el siguiente roba 2 y pierde el turno.
        </Regla>

        <Regla
          n={6}
          dibujo={
            <>
              <span style={{ lineHeight: 0 }}><CartaDe card={C('as', 'copas')} w={W} /></span>
              <Svg markup={ICONO_SENTIDO} />
            </>
          }
        >
          El As (1) cambia el sentido. Si sois 2, vuelves a jugar.
        </Regla>

        <Regla
          n={7}
          dibujo={
            <>
              <Svg markup={BANDERA} />
              <span style={{ fontSize: 30, fontWeight: 700, color: '#B8202A' }}>101</span>
            </>
          }
        >
          Las cartas que te quedan suman puntos (la Sota, 50). Con 101 quedas fuera. Gana el último; si todos pasáis de 101 a la vez, gana quien tenga menos.
        </Regla>
      </ol>

      <div style={{ padding: '8px 18px 20px' }}>
        <button
          data-testid="reglas-ok"
          data-autofoco
          onClick={onClose}
          style={{ width: '100%', height: 68, borderRadius: 22, background: '#FFD23F', color: '#1A1A1A', border: '4px solid #1A1A1A', fontFamily: 'inherit', fontSize: 28, fontWeight: 700, cursor: 'pointer' }}
        >
          ¡A jugar!
        </button>
      </div>
    </div>
  )
}

// Pantalla 1 · Inicio (portado de Main.dc.html): nº de rivales (1–3 bots), avatar, JUGAR.
import type { ReactNode } from 'react'
import type { Ovni } from './game'
import { Avatar, type AvatarKind } from './Avatar'
import { Palo } from './Palo'
import { Carta } from './Carta'
import { Svg, css } from './dc'
import { ALTO_REF_PANTALLA, Tablero, useEscala } from './Pantalla'

const BOTS: AvatarKind[] = ['robi', 'pixel', 'toby']
const AVATARES: { q: AvatarKind; nombre: string }[] = [
  { q: 'sol', nombre: 'Sol' },
  { q: 'estrella', nombre: 'Estrella' },
  { q: 'corazon', nombre: 'Corazón' },
  { q: 'flor', nombre: 'Flor' },
]

const btnTop =
  'width: 52px; height: 52px; border-radius: 16px; border: 2px solid #3C7A57; background: #0F3A24; color: #FFF8E7; display: flex; align-items: center; justify-content: center; padding: 0; cursor: pointer'

export function Main({ game }: { game: Ovni }) {
  // En pantallas bajas se quita el abanico decorativo y se compacta el título para que
  // la elección de rivales y avatar quepa sin scroll (R-UI-PLAT-1).
  const compacta = useEscala(ALTO_REF_PANTALLA).h < 760
  return (
    <Marco
      compacta={compacta}
      pie={
        <>
          <button
            data-testid="jugar"
            onClick={game.startGame}
            style={{
              height: 80,
              flexShrink: 0,
              borderRadius: 24,
              background: '#FFD23F',
              color: '#1A1A1A',
              border: '4px solid #1A1A1A',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Svg markup={`<svg width="36" height="36" viewBox="0 0 24 24"><path d="M7 4.5 L19.5 12 L7 19.5 Z" fill="#1A1A1A"></path></svg>`} />
            <span>JUGAR</span>
          </button>

          {/* Crédito exigido por la licencia CC BY-SA 3.0 de las imágenes (ver LICENCIA-CARTAS.md). */}
          <p data-testid="credito-cartas" style={{ margin: 0, fontSize: 14, lineHeight: 1.3, textAlign: 'center', color: '#E8DFC8' }}>
            Cartas:{' '}
            <a href="https://commons.wikimedia.org/wiki/User:Basquetteur" target="_blank" rel="noopener noreferrer" style={{ color: '#FFF8E7' }}>
              Basquetteur
            </a>{' '}
            ·{' '}
            <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.es" target="_blank" rel="noopener noreferrer" style={{ color: '#FFF8E7', whiteSpace: 'nowrap' }}>
              CC BY-SA 3.0
            </a>
          </p>
        </>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button aria-label="Cómo se juega" style={css(btnTop)}>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"></circle><path d="M9.2 9.3 a3 3 0 0 1 5.6 1.2 c0 2 -2.8 2.4 -2.8 4"></path><path d="M12 17.6 V17.8"></path></svg>`} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            gap: 10,
            background: '#FFF8E7',
            borderRadius: 999,
            padding: '8px 16px',
            marginBottom: compacta ? 2 : 6,
          }}
        >
          <Palo palo="oros" w={36} />
          <Palo palo="copas" w={36} />
          <Palo palo="espadas" w={36} />
          <Palo palo="bastos" w={36} />
        </div>
        <h1 style={{ margin: 0, fontSize: compacta ? 52 : 72, lineHeight: 1, fontWeight: 700, letterSpacing: 6, color: '#FFF8E7' }}>
          OVNI
        </h1>
      </div>

      {!compacta && (
      <div
        aria-hidden="true"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 104, flex: 'none' }}
      >
        <div style={{ transform: 'rotate(-12deg) translateY(8px)', marginRight: -14 }}>
          <Carta rank="sota" suit="oros" w={64} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Carta rank="7" suit="copas" w={64} />
        </div>
        <div style={{ transform: 'rotate(12deg) translateY(8px)', marginLeft: -14 }}>
          <Carta rank="2" suit="espadas" w={64} />
        </div>
      </div>
      )}

      <section
        aria-label="Número de rivales"
        style={{ background: '#0F3A24', borderRadius: 22, padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, color: '#FFF8E7' }}>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 48 48"><line x1="24" y1="5" x2="24" y2="11" stroke="#FFF8E7" stroke-width="3"></line><circle cx="24" cy="5" r="3" fill="#FFF8E7"></circle><rect x="9" y="11" width="30" height="24" rx="7" fill="#FFF8E7"></rect><circle cx="18" cy="22" r="3.5" fill="#0F3A24"></circle><circle cx="30" cy="22" r="3.5" fill="#0F3A24"></circle><rect x="18" y="28" width="12" height="3" rx="1.5" fill="#0F3A24"></rect></svg>`} />
          <span>Rivales</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {[1, 2, 3].map((n) => {
            const sel = n === game.nRivals
            return (
              <button
                key={n}
                data-testid={`rivales-${n}`}
                aria-label={n === 1 ? 'Jugar contra 1 rival' : `Jugar contra ${n} rivales`}
                aria-pressed={sel}
                onClick={() => game.setNRivals(n)}
                style={{
                  position: 'relative',
                  height: 104,
                  borderRadius: 18,
                  border: `4px solid ${sel ? '#FFD23F' : '#3C7A57'}`,
                  background: sel ? '#FFF8E7' : '#1D5A3A',
                  color: sel ? '#1A1A1A' : '#FFF8E7',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{n}</span>
                <span style={{ display: 'flex', gap: 2 }}>
                  {BOTS.slice(0, n).map((q) => (
                    <Avatar key={q} quien={q} w={26} />
                  ))}
                </span>
                {sel && <Marca />}
              </button>
            )
          })}
        </div>
      </section>

      <section
        aria-label="Tu avatar"
        style={{ background: '#0F3A24', borderRadius: 22, padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, color: '#FFF8E7' }}>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21"></path></svg>`} />
          <span>Tú</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          {AVATARES.map((a) => {
            const sel = a.q === game.humanAvatar
            return (
              <button
                key={a.q}
                data-testid={`avatar-${a.q}`}
                aria-label={`Avatar ${a.nombre}`}
                aria-pressed={sel}
                onClick={() => game.setHumanAvatar(a.q)}
                style={{
                  position: 'relative',
                  height: 76,
                  borderRadius: 18,
                  border: `4px solid ${sel ? '#FFD23F' : '#3C7A57'}`,
                  background: sel ? '#FFF8E7' : '#1D5A3A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <Avatar quien={a.q} w={54} />
                {sel && <Marca />}
              </button>
            )
          })}
        </div>
      </section>

    </Marco>
  )
}

function Marca() {
  return (
    <span
      style={{
        position: 'absolute',
        top: -12,
        right: -10,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#FFD23F',
        border: '3px solid #1A1A1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg markup={`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`} />
    </span>
  )
}

/** Tablero de la pantalla de inicio: ocupa todo el marco y hace scroll si no cabe. */
export function Marco({ children, pie, compacta = false }: { children: ReactNode; pie?: ReactNode; compacta?: boolean }) {
  return (
    <Tablero padding={compacta ? '12px 18px 14px' : '20px 18px 24px'} gap={compacta ? 12 : 16} pie={pie}>
      {children}
    </Tablero>
  )
}

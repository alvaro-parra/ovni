// Pantalla 1 · Inicio (portado de Main.dc.html): nº de rivales (1–3 bots), avatar, JUGAR.
import { useState, type ReactNode } from 'react'
import type { Ovni } from './game'
import { Avatar, type AvatarKind } from './Avatar'
import { Palo } from './Palo'
import { Carta } from './Carta'
import { Svg, css } from './dc'
import { ALTO_REF_PANTALLA, Tablero, useEscala } from './Pantalla'
import { ConRotulo, InterruptoresVista } from './Vista'
import { Reglas } from './Reglas'
import { leerEstadisticas } from './estadisticas'

const BOTS: AvatarKind[] = ['robi', 'pixel', 'toby']
const AVATARES: { q: AvatarKind; nombre: string }[] = [
  { q: 'sol', nombre: 'Sol' },
  { q: 'estrella', nombre: 'Estrella' },
  { q: 'corazon', nombre: 'Corazón' },
  { q: 'flor', nombre: 'Flor' },
]

const CLAVE_REGLAS = 'ovni.reglasVistas'

const btnTop =
  'width: 52px; height: 52px; border-radius: 16px; border: 2px solid var(--borde); background: var(--panel); color: #FFF8E7; display: flex; align-items: center; justify-content: center; padding: 0; cursor: pointer'

export function Main({ game }: { game: Ovni }) {
  // En pantallas bajas se quita el abanico decorativo y se compacta el título para que
  // la elección de rivales y avatar quepa sin scroll (R-UI-PLAT-1).
  const { h: altoInicio, w: anchoInicio, apaisada } = useEscala(ALTO_REF_PANTALLA, true)
  // Compacta (sin abanico de cartas) si no cabría todo sin scroll.
  const conEstadisticas = leerEstadisticas().jugadas > 0
  // Contenido completo ≈ 700 px de diseño (+50 con el contador); pie y márgenes ≈ 140.
  // Apaisado: siempre compacta (sin abanico) y el título en su columna (no en fila).
  const compacta = apaisada || altoInicio < 830
  const abanicoConContador = !compacta && conEstadisticas
  const muyCompacta = !apaisada && compacta && conEstadisticas && altoInicio < 720
  // Apaisado estrecho (p. ej. 667×375): no caben 3 columnas; el título pasa a la cabecera.
  const sinColumnaTitulo = apaisada && anchoInicio < 760
  const [verReglas, setVerReglas] = useState(false)
  const [estadisticas] = useState(leerEstadisticas)
  const pastillaGanadas = estadisticas.jugadas > 0 && (
    <div
      data-testid="ganadas"
      role="img"
      aria-label={`Has ganado ${estadisticas.ganadas} de ${estadisticas.jugadas} partidas`}
      style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, boxSizing: 'border-box', background: 'var(--panel)', border: '2px solid var(--borde)', borderRadius: 999, padding: '0 12px 0 8px', marginTop: 4, fontWeight: 700 }}
    >
      <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24"><path d="M7.5 3.5 H16.5 V10 a4.5 4.5 0 0 1 -9 0 Z" fill="#FFD23F" stroke="#1A1A1A" stroke-width="1.2"></path><path d="M7.5 5.5 H4 a3.5 3.5 0 0 0 4 4.5 M16.5 5.5 H20 a3.5 3.5 0 0 1 -4 4.5" fill="none" stroke="#FFD23F" stroke-width="1.6"></path><path d="M12 14.5 V18" stroke="#FFD23F" stroke-width="1.8"></path><path d="M7.5 21 H16.5 L15.5 18 H8.5 Z" fill="#FFD23F" stroke="#1A1A1A" stroke-width="1.2"></path></svg>`} />
      <span aria-hidden="true" style={{ fontSize: 24 }}>{estadisticas.ganadas}</span>
      <span aria-hidden="true" style={{ fontSize: 17, color: 'var(--texto-2)' }}>de {estadisticas.jugadas}</span>
    </div>
  )
  // Hasta que se abran las reglas una vez, el botón se destaca (para quien juega por primera vez).
  const [reglasVistas, setReglasVistas] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_REGLAS) === '1'
    } catch {
      return true
    }
  })
  const abrirReglas = () => {
    setVerReglas(true)
    setReglasVistas(true)
    try {
      localStorage.setItem(CLAVE_REGLAS, '1')
    } catch {
      // sin almacenamiento: se seguirá destacando, no pasa nada
    }
  }
  const guardada = game.partidaGuardada
  return (
    <Marco
      compacta={compacta}
      pie={
        <>
          {/* Partida a medias (p. ej. el navegador recargó la página): se ofrece seguirla. */}
          {guardada && (
            <button
              data-testid="continuar"
              onClick={game.continuarPartida}
              style={{
                height: apaisada ? 60 : 80,
                flexShrink: 0,
                borderRadius: 24,
                background: '#FFD23F',
                color: '#1A1A1A',
                border: '4px solid #1A1A1A',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Svg markup={`<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 V19"></path><path d="M10 5 L20 12 L10 19 Z" fill="#1A1A1A"></path></svg>`} />
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.05 }}>
                <span style={{ fontSize: 30, fontWeight: 700 }}>Continuar</span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Ronda {guardada.ronda}</span>
              </span>
            </button>
          )}
          <button
            data-testid="jugar"
            onClick={game.startGame}
            style={{
              height: guardada || apaisada ? 60 : 80,
              flexShrink: 0,
              borderRadius: 24,
              background: guardada ? 'var(--panel)' : '#FFD23F',
              color: guardada ? '#FFF8E7' : '#1A1A1A',
              border: guardada ? '3px solid var(--borde)' : '4px solid #1A1A1A',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              fontSize: guardada ? 24 : 34,
              fontWeight: 700,
              letterSpacing: guardada ? 0 : 2,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Svg markup={`<svg width="${guardada ? 28 : 36}" height="${guardada ? 28 : 36}" viewBox="0 0 24 24"><path d="M7 4.5 L19.5 12 L7 19.5 Z" fill="${guardada ? '#FFF8E7' : '#1A1A1A'}"></path></svg>`} />
            <span>{guardada ? 'Nueva partida' : 'JUGAR'}</span>
          </button>

          {/* Crédito exigido por la licencia CC BY-SA 3.0 de las imágenes (ver LICENCIA-CARTAS.md). */}
          <p data-testid="credito-cartas" style={{ margin: 0, fontSize: 14, lineHeight: 1.3, textAlign: 'center', color: 'var(--texto-3)' }}>
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
      {/* paddingTop: deja sitio a la marca ✓ del interruptor activo (si no, la recorta el scroll). */}
      <div style={{ display: 'flex', gap: 10, flex: 'none', paddingTop: 8 }}>
        <InterruptoresVista />
        {sinColumnaTitulo ? (
          <span style={{ flex: 1, alignSelf: 'center', textAlign: 'center', fontSize: 30, fontWeight: 700, letterSpacing: 4, color: '#FFF8E7' }}>OVNI</span>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {/* Con rótulo debajo cuando el botón es solo el icono (como los de la izquierda). */}
        {(() => {
          const boton = (
          <button
            data-testid="abrir-reglas"
            data-destacado={!reglasVistas}
            aria-label="Cómo se juega"
            onClick={abrirReglas}
            style={
              reglasVistas
                ? css(btnTop)
                : { ...css(btnTop), width: anchoInicio >= 360 ? 'auto' : 52, padding: anchoInicio >= 360 ? '0 14px 0 10px' : 0, gap: 6, flexShrink: 0, background: '#FFD23F', color: '#1A1A1A', border: '3px solid #1A1A1A', fontFamily: 'inherit', fontSize: 20, fontWeight: 700 }
            }
          >
            <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"></circle><path d="M9.2 9.3 a3 3 0 0 1 5.6 1.2 c0 2 -2.8 2.4 -2.8 4"></path><path d="M12 17.6 V17.8"></path></svg>`} />
            {!reglasVistas && anchoInicio >= 360 && <span>Reglas</span>}
          </button>
          )
          return reglasVistas || anchoInicio < 360 ? <ConRotulo texto="Reglas">{boton}</ConRotulo> : boton
        })()}
      </div>

      {/* Apaisado (móvil girado): dos columnas — título a la izquierda, elecciones a la derecha.
          En vertical estas dos cajas son transparentes (display: contents). */}
      <div style={apaisada ? { display: 'flex', gap: 16, alignItems: 'stretch', flex: 1, minHeight: 0 } : { display: 'contents' }}>
      <div style={sinColumnaTitulo ? { display: 'none' } : apaisada ? { flex: '0 0 26%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12 } : { display: 'contents' }}>
      {/* Muy justo de alto (pantalla baja y con contador de partidas): título en una fila. */}
      <div style={{ display: 'flex', flexDirection: muyCompacta ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: muyCompacta ? 12 : 2 }}>
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            gap: muyCompacta ? 4 : 10,
            background: '#FFF8E7',
            borderRadius: 999,
            padding: muyCompacta ? '6px 10px' : '8px 16px',
            marginBottom: compacta ? 2 : 6,
            ...(muyCompacta ? { display: 'grid', gridTemplateColumns: 'repeat(2, 24px)', borderRadius: 14, marginBottom: 0 } : {}),
          }}
        >
          <Palo palo="oros" w={muyCompacta ? 24 : 36} />
          <Palo palo="copas" w={muyCompacta ? 24 : 36} />
          <Palo palo="espadas" w={muyCompacta ? 24 : 36} />
          <Palo palo="bastos" w={muyCompacta ? 24 : 36} />
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
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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
        {/* Con abanico, el contador va a su lado: no añade alto. */}
        {abanicoConContador && <div style={{ marginLeft: 18, alignSelf: 'center' }}>{pastillaGanadas}</div>}
      </div>
      )}

      {/* Partidas ganadas en este dispositivo (sin abanico: debajo del título). */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: compacta ? -6 : 0 }}>
        {!abanicoConContador && pastillaGanadas}
      </div>

      </div>
      <div style={apaisada ? { flex: '1 1 0', minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: 12 } : { display: 'contents' }}>
      <section
        aria-label="Número de rivales"
        style={{ background: 'var(--panel)', borderRadius: 22, padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
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
                  height: apaisada ? 96 : 104,
                  borderRadius: 18,
                  border: `4px solid ${sel ? '#FFD23F' : 'var(--borde)'}`,
                  background: sel ? '#FFF8E7' : 'var(--tapete)',
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
        style={{ background: 'var(--panel)', borderRadius: 22, padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, color: '#FFF8E7' }}>
          <Svg markup={`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21"></path></svg>`} />
          <span>Tú</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${apaisada ? 2 : 4}, minmax(0, 1fr))`, gap: apaisada ? 8 : 10 }}>
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
                  height: apaisada ? 56 : 76,
                  borderRadius: 18,
                  border: `4px solid ${sel ? '#FFD23F' : 'var(--borde)'}`,
                  background: sel ? '#FFF8E7' : 'var(--tapete)',
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
      </div>
      </div>

      {/* Absoluto respecto al tablero: no se desplaza con el scroll del contenido. */}
      {verReglas && <Reglas onClose={() => setVerReglas(false)} />}
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
    <Tablero padding={compacta ? '6px 18px 14px' : '12px 18px 24px'} gap={compacta ? 12 : 14} pie={pie}>
      {children}
    </Tablero>
  )
}

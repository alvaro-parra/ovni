// Carta (portado de Carta.dc.html). Imagen de la baraja + número grande y estrella (Sota)
// para baja visión; si la imagen falla, se dibuja la cara sola (número + palo).
import { useState } from 'react'
import type { Card, Rank, Suit } from '../cards'
import { cardImg, dorsoImg, rankToV, SUIT_COLOR } from './deck'
import { Palo } from './Palo'
import { Svg } from './dc'

export type EstadoCarta = 'normal' | 'jugable' | 'apagada' | 'espera' | 'dorso'

export function Carta({
  rank,
  suit,
  estado = 'normal',
  w = 130,
  sinSubir = false,
  indiceGrande = true,
}: {
  rank?: Rank
  suit?: Suit
  estado?: EstadoCarta
  w?: number
  sinSubir?: boolean
  indiceGrande?: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const h = Math.round(w * 1.542)
  const dorso = estado === 'dorso'
  const jugable = estado === 'jugable'
  const apagada = estado === 'apagada'
  const v = rank ? rankToV(rank) : ''
  const col = suit ? SUIT_COLOR[suit] : '#1A1A1A'
  const src = dorso ? dorsoImg() : suit && rank ? cardImg(suit, rank) : ''

  const conImagen = src !== '' && !imgError
  const sinImagenCara = !conImagen && !dorso
  const sinImagenDorso = !conImagen && dorso

  const rad = Math.round(w * 0.08)
  const radIn = Math.max(2, Math.round(w * 0.06))
  const padD = Math.max(3, Math.round(w * 0.06))
  const rankF = Math.round(w * 0.3)
  const idxP = Math.max(1, Math.round(w * 0.03))
  const idxW = Math.round(rankF * 1.1)
  const idxR = Math.max(3, Math.round(w * 0.05))
  const g = Math.round(w * 0.24)
  const chk = Math.max(20, Math.round(w * 0.36))
  const chkT = -Math.round(chk * 0.4)
  const chkIco = Math.round(chk * 0.6)

  const borde = jugable ? '#FFD23F' : '#CFC4A8'
  const bw = jugable ? 4 : 2
  const sombra = jugable
    ? '0 0 0 2px #1A1A1A, 0 10px 18px rgba(0,0,0,0.45)'
    : apagada
      ? 'none'
      : '0 3px 6px rgba(0,0,0,0.35)'
  const lift = jugable && !sinSubir ? -16 : 0
  const op = apagada ? 0.45 : 1
  const mostrarIndice = !dorso && (indiceGrande || !conImagen)

  return (
    <div
      aria-hidden="true"
      style={{
        width: w,
        height: h,
        boxSizing: 'border-box',
        position: 'relative',
        flex: 'none',
        borderRadius: rad,
        background: '#FFFFFF',
        border: `${bw}px solid ${borde}`,
        boxShadow: sombra,
        transform: `translateY(${lift}px)`,
        opacity: op,
        color: '#1A1A1A',
        transition: 'transform 120ms ease',
      }}
    >
      {conImagen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radIn,
            overflow: 'hidden',
          }}
        >
          <img
            src={src}
            alt=""
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {sinImagenCara && suit && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radIn,
            background: '#FFF8E7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Palo palo={suit} w={Math.round(w * 0.5)} />
        </div>
      )}

      {sinImagenDorso && (
        <div
          style={{
            position: 'absolute',
            left: padD,
            top: padD,
            right: padD,
            bottom: padD,
            borderRadius: radIn,
            border: '2px solid #1A3470',
            backgroundColor: '#2348A0',
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 1.5px, transparent 1.5px, transparent 7px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 1.5px, transparent 1.5px, transparent 7px)',
          }}
        />
      )}

      {mostrarIndice && (
        <div
          style={{
            position: 'absolute',
            left: idxP,
            top: idxP,
            minWidth: idxW,
            boxSizing: 'border-box',
            background: '#FFFFFF',
            border: `2px solid ${col}`,
            borderRadius: idxR,
            padding: '1px 3px',
            textAlign: 'center',
            fontSize: rankF,
            fontWeight: 700,
            lineHeight: 1,
            color: col,
          }}
        >
          {v}
        </div>
      )}

      {!dorso && rank === 'sota' && (
        <Svg
          style={{ position: 'absolute', right: idxP, top: idxP }}
          markup={`<svg width="${g}" height="${g}" viewBox="0 0 24 24"><polygon points="12,1.8 15,8.4 22,9.1 16.7,13.8 18.3,20.8 12,17.2 5.7,20.8 7.3,13.8 2,9.1 9,8.4" fill="#FFD23F" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"></polygon></svg>`}
        />
      )}

      {jugable && (
        <div
          style={{
            position: 'absolute',
            top: chkT,
            right: chkT,
            width: chk,
            height: chk,
            borderRadius: '50%',
            background: '#FFD23F',
            border: '3px solid #1A1A1A',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg
            markup={`<svg width="${chkIco}" height="${chkIco}" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>`}
          />
        </div>
      )}
    </div>
  )
}

/** Carta a partir de un objeto Card del motor. */
export function CartaDe({
  card,
  estado,
  w,
  sinSubir,
}: {
  card: Card
  estado?: EstadoCarta
  w?: number
  sinSubir?: boolean
}) {
  return <Carta rank={card.rank} suit={card.suit} estado={estado} w={w} sinSubir={sinSubir} />
}

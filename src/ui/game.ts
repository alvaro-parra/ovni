// Controlador del juego OVNI: orquesta el motor (reglas) con la UI, la IA de los
// bots y el bucle de turnos. Soporta una semilla reproducible vía ?seed= para los e2e.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Card, Suit } from '../cards'
import { cardPoints } from '../cards'
import {
  createRound,
  playCard,
  drawCard,
  getPlayableCards,
  isPlayable,
  type RoundState,
} from '../engine'
import { createMatch, applyRoundResult, type MatchState } from '../match'
import type { AvatarKind } from './Avatar'
import { makeShuffle, mulberry32, shuffledDeck } from './deck'
import { usePreferencias } from './preferencias'
import { duraciones, duracionRobo, type Duraciones } from './ritmo'
import { borrarPartida, guardarPartida, leerPartida, type PartidaGuardada } from './guardado'

export type Screen = 'inicio' | 'mesa' | 'finRonda' | 'victoria'

export interface PlayerCfg {
  id: string
  name: string
  avatar: AvatarKind
  isBot: boolean
}

export type Overlay =
  | null
  | { kind: 'palo'; card: Card }
  | ({ kind: 'roba2'; byName: string; byAvatar: AvatarKind; card: Card } & Omit<Roba2Info, 'victimaId'>)
  | { kind: 'verMano' }
  | { kind: 'vista' } // ajustes de letra grande / contraste (R-UI-A11Y-4)
  | { kind: 'salir' } // confirmar antes de abandonar la partida
  | { kind: 'reglas' } // consultar las reglas sin salir de la partida

/** Movimiento de cartas en curso (se anima en la mesa; el estado se aplica al terminar). */
export type Jugada =
  | { id: number; tipo: 'juega'; actorId: string; card: Card }
  | { id: number; tipo: 'roba'; actorId: string; n: number }

/** Aviso grande de lo que acaba de pasar (R-UI-A11Y-9, R-UI-COMP-5). */
export type Aviso =
  | ({ id: number; tipo: 'roba2'; actorId: string; n: number } & Omit<Roba2Info, 'cartas'>)
  | { id: number; tipo: 'sentido'; actorId: string }
  | { id: number; tipo: 'repite'; actorId: string }
  | { id: number; tipo: 'palo'; actorId: string; suit: Suit }
  | { id: number; tipo: 'fin'; ganadorId: string | null }
  /** Empieza una ronda: cuál y quién abre el juego (la mano rota cada ronda, R-CFG-4/6). */
  | { id: number; tipo: 'ronda'; numero: number; empiezaId: string }

type SinId<T> = T extends unknown ? Omit<T, 'id'> : never

/**
 * Aviso para los efectos de la carta inicial (R-INI-1), que el motor aplica al repartir
 * y que, sin aviso, pasarían desapercibidos (p. ej. empezar con 7 cartas por un 2).
 */
export function avisoInicial(r: RoundState, dealerId: string): SinId<Aviso> | null {
  const top = r.discardPile[r.discardPile.length - 1]
  if (!top) return null
  if (top.rank === '2') {
    const victima = r.players.find((p) => p.hand.length > 5)
    return victima
      ? { tipo: 'roba2', actorId: dealerId, victimaId: victima.id, n: victima.hand.length - 5, rebarajado: false, finRonda: false }
      : null
  }
  if (top.rank === 'as') {
    return r.players.length === 2
      ? { tipo: 'repite', actorId: dealerId }
      : { tipo: 'sentido', actorId: dealerId }
  }
  return null
}

export const HUMAN_ID = 'yo'
const BOT_IDS = ['robi', 'pixel', 'toby'] as const
const BOT_NAMES: Record<string, string> = { robi: 'Robi', pixel: 'Pixel', toby: 'Toby' }

// ---- IA de bots ---------------------------------------------------------

/** El bot se deshace de la carta de más puntos que pueda jugar. */
function botChoose(playable: Card[]): Card {
  return [...playable].sort((a, b) => cardPoints(b.rank) - cardPoints(a.rank))[0]
}

/** Al jugar una sota, el bot elige el palo del que más cartas le quedan. */
function botChooseSuit(round: RoundState): Suit {
  const hand = round.players[round.currentPlayerIndex].hand.filter((c) => c.rank !== 'sota')
  const counts: Record<Suit, number> = { oros: 0, copas: 0, espadas: 0, bastos: 0 }
  for (const c of hand) counts[c.suit]++
  const suits: Suit[] = ['oros', 'copas', 'espadas', 'bastos']
  return suits.sort((a, b) => counts[b] - counts[a])[0]
}

/**
 * Lo que pasó realmente con un «roba 2» (R-DOS-1). Puede robar menos de 2 si no quedan
 * cartas (R-MAZO-2: una sola rebaraja por ronda) y, si el 2 era la última carta de quien
 * lo jugó, la ronda termina después de robar (R-DOS-4).
 */
export interface Roba2Info {
  victimaId: string
  /** Cartas robadas de verdad (0, 1 o 2), en orden. */
  cartas: Card[]
  /** Hubo que rebarajar la pila de la mesa para poder robar. */
  rebarajado: boolean
  /** Quien jugó el 2 se quedó sin cartas: la ronda acaba tras el robo. */
  finRonda: boolean
}

export interface PlayOutcome {
  next: RoundState
  reversed: boolean
  roba2: Roba2Info | null
  actorId: string
}

/** Juega una carta y describe los efectos relevantes para la UI (sentido, +2). */
export function describeAndPlay(
  round: RoundState,
  card: Card,
  suit: Suit | undefined,
  shuffle: <T>(xs: T[]) => T[],
): PlayOutcome {
  const actorIdx = round.currentPlayerIndex
  const n = round.players.length
  const next = playCard(round, card, suit, shuffle)
  const reversed = card.rank === 'as' && n >= 3
  let roba2: Roba2Info | null = null
  if (card.rank === '2') {
    const victimIdx = (actorIdx + round.direction + n) % n
    const antes = round.players[victimIdx].hand.length
    roba2 = {
      victimaId: round.players[victimIdx].id,
      // forceDraw añade las robadas al final de la mano.
      cartas: next.players[victimIdx].hand.slice(antes),
      rebarajado: !round.reshuffleUsed && next.reshuffleUsed,
      finRonda: next.phase === 'over',
    }
  }
  return { next, reversed, roba2, actorId: round.players[actorIdx].id }
}

export interface Ovni {
  screen: Screen
  players: PlayerCfg[]
  match: MatchState | null
  round: RoundState | null
  roundNumber: number
  overlay: Overlay
  /** Carta(s) en movimiento ahora mismo, o null. */
  jugada: Jugada | null
  /** Aviso grande en pantalla, o null. */
  aviso: Aviso | null
  /** Cartas que cada bot acaba de robar (para la marca «+N» en su ficha). */
  robosRecientes: Record<string, number>
  dur: Duraciones
  cerrarAviso: () => void
  lastResult: RoundState['result']
  // config
  nRivals: number
  humanAvatar: AvatarKind
  setNRivals: (n: number) => void
  setHumanAvatar: (a: AvatarKind) => void
  // acciones
  startGame: () => void
  playHuman: (card: Card) => void
  chooseSuit: (suit: Suit) => void
  /** Arrepentirse de jugar la Sota: se cierra el selector y la carta vuelve a la mano. */
  cancelarSota: () => void
  drawHuman: () => void
  dismissRoba2: () => void
  openVerMano: () => void
  openVista: () => void
  openSalir: () => void
  openReglas: () => void
  closeOverlay: () => void
  nextRound: () => void
  restart: () => void
  /** Partida a medias guardada en el dispositivo (para «Continuar»), o null. */
  partidaGuardada: { rivales: number; ronda: number } | null
  continuarPartida: () => void
}

export function useOvni(): Ovni {
  // RNG determinista si hay ?seed=, aleatorio si no.
  const rngRef = useRef<(() => number) | null>(null)
  if (!rngRef.current) {
    const params = new URLSearchParams(
      typeof location !== 'undefined' ? location.search : '',
    )
    const seedStr = params.get('seed')
    const seed = seedStr ? Number(seedStr) : Math.floor(Math.random() * 2 ** 31)
    rngRef.current = mulberry32(seed)
  }
  const rng = rngRef.current
  const shuffle = useMemo(() => makeShuffle(rng), [rng])

  // Ritmo: según la velocidad elegida; ?fast lo deja todo instantáneo para los e2e.
  const { velocidad } = usePreferencias()
  const rapidoTests = useMemo(
    () => new URLSearchParams(typeof location !== 'undefined' ? location.search : '').has('fast'),
    [],
  )
  const movimientoReducido = useMemo(() => {
    try {
      return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    } catch {
      return false
    }
  }, [])
  const dur = useMemo(
    () => duraciones(velocidad, { rapidoTests, movimientoReducido }),
    [velocidad, rapidoTests, movimientoReducido],
  )

  const [screen, setScreen] = useState<Screen>('inicio')
  const [players, setPlayers] = useState<PlayerCfg[]>([])
  const [match, setMatch] = useState<MatchState | null>(null)
  const [round, setRound] = useState<RoundState | null>(null)
  const [roundNumber, setRoundNumber] = useState(1)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [jugada, setJugada] = useState<Jugada | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [robosRecientes, setRobosRecientes] = useState<Record<string, number>>({})
  const [lastResult, setLastResult] = useState<RoundState['result']>(null)
  const [nRivals, setNRivals] = useState(3)
  const [humanAvatar, setHumanAvatar] = useState<AvatarKind>('sol')
  const [guardada, setGuardada] = useState<PartidaGuardada | null>(() => leerPartida())

  const matchRef = useRef<MatchState | null>(null)
  matchRef.current = match
  const playersRef = useRef<PlayerCfg[]>([])
  playersRef.current = players
  const pendingSota = useRef<Card | null>(null)

  // Temporizadores de animaciones y avisos: se cancelan todos al salir o empezar de nuevo.
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const programar = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
    return t
  }, [])
  const cancelarTodo = useCallback(() => {
    for (const t of timers.current) clearTimeout(t)
    timers.current.clear()
    ocupado.current = false
    setJugada(null)
    setAviso(null)
    setRobosRecientes({})
  }, [])
  useEffect(() => cancelarTodo, [cancelarTodo])

  const seq = useRef(0)
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mostrarAviso = useCallback(
    (a: SinId<Aviso>) => {
      if (dur.aviso === 0) return
      if (avisoTimer.current) clearTimeout(avisoTimer.current)
      setAviso({ ...a, id: ++seq.current } as Aviso)
      avisoTimer.current = programar(() => setAviso(null), dur.aviso)
    },
    [dur.aviso, programar],
  )

  const cerrarAviso = useCallback(() => {
    if (avisoTimer.current) clearTimeout(avisoTimer.current)
    avisoTimer.current = null
    setAviso((a) => (a?.tipo === 'fin' ? a : null)) // el de fin de ronda se va solo
  }, [])

  // Hay un movimiento en curso. Ref (y no solo estado) para que un doble toque rápido,
  // que puede llegar antes del siguiente render, no lance la misma jugada dos veces.
  const ocupado = useRef(false)

  /** Muestra el movimiento `j` durante `ms` y después aplica `fin` (el nuevo estado). */
  const animarYAplicar = useCallback(
    (j: SinId<Jugada>, ms: number, fin: () => void) => {
      if (ms === 0) {
        fin()
        return
      }
      ocupado.current = true
      setJugada({ ...j, id: ++seq.current } as Jugada)
      programar(() => {
        ocupado.current = false
        setJugada(null)
        fin()
      }, ms)
    },
    [programar],
  )

  const marcarRobo = useCallback(
    (id: string, n: number) => {
      if (dur.aviso === 0) return
      setRobosRecientes((r) => ({ ...r, [id]: n }))
      programar(
        () =>
          setRobosRecientes((r) => {
            const { [id]: _, ...resto } = r
            return resto
          }),
        dur.aviso + dur.pensar,
      )
    },
    [dur.aviso, dur.pensar, programar],
  )

  const buildRound = useCallback(
    (m: MatchState): RoundState => {
      const activeIds = m.players.filter((p) => !p.eliminated).map((p) => p.id)
      const dealerId = m.players[m.dealerIndex].id
      const dealerIndex = Math.max(0, activeIds.indexOf(dealerId))
      return createRound({ playerIds: activeIds, deck: shuffledDeck(rng), dealerIndex })
    },
    [rng],
  )

  const nameOf = (id: string) => playersRef.current.find((p) => p.id === id)?.name ?? id
  const avatarOf = (id: string) =>
    playersRef.current.find((p) => p.id === id)?.avatar ?? 'robi'

  /**
   * Al empezar una ronda: si la carta inicial tiene efecto (R-INI-1) se avisa de eso; si no,
   * de qué ronda es y quién empieza.
   */
  const avisarInicioRonda = useCallback(
    (r: RoundState, m: MatchState, numero: number) => {
      const ini = avisoInicial(r, m.players[m.dealerIndex].id)
      if (ini) {
        if (ini.tipo === 'roba2') marcarRobo(ini.victimaId, 2)
        mostrarAviso(ini)
      } else {
        mostrarAviso({ tipo: 'ronda', numero, empiezaId: r.players[r.currentPlayerIndex].id })
      }
    },
    [mostrarAviso, marcarRobo],
  )

  // --- arranque -----------------------------------------------------------
  const startGame = useCallback(() => {
    const bots: PlayerCfg[] = BOT_IDS.slice(0, nRivals).map((id) => ({
      id,
      name: BOT_NAMES[id],
      avatar: id as AvatarKind,
      isBot: true,
    }))
    const next: PlayerCfg[] = [
      { id: HUMAN_ID, name: 'Tú', avatar: humanAvatar, isBot: false },
      ...bots,
    ]
    const ids = next.map((p) => p.id)
    const firstDealer = Math.floor(rng() * ids.length)
    const m = createMatch(ids, firstDealer)
    cancelarTodo()
    borrarPartida()
    setGuardada(null)
    playersRef.current = next
    matchRef.current = m
    setPlayers(next)
    setMatch(m)
    setRoundNumber(1)
    setLastResult(null)
    setOverlay(null)
    const r = buildRound(m)
    setRound(r)
    setScreen('mesa')
    avisarInicioRonda(r, m, 1)
  }, [nRivals, humanAvatar, rng, buildRound, cancelarTodo, avisarInicioRonda])

  /** Aplica una jugada ya resuelta y lanza el aviso de su efecto especial, si lo tiene. */
  const aplicarJugada = useCallback(
    (prev: RoundState, res: PlayOutcome, card: Card, porHumano: boolean) => {
      setRound(res.next)
      const n = prev.players.length
      // El +2 se muestra también si acaba la ronda (R-DOS-4): el fin de ronda espera a que
      // se haya visto (ver su efecto más abajo).
      const r2 = res.roba2
      if (r2?.victimaId === HUMAN_ID) {
        setOverlay({
          kind: 'roba2',
          byName: nameOf(res.actorId),
          byAvatar: avatarOf(res.actorId),
          card,
          cartas: r2.cartas,
          rebarajado: r2.rebarajado,
          finRonda: r2.finRonda,
        })
      } else if (r2) {
        if (r2.cartas.length > 0) marcarRobo(r2.victimaId, r2.cartas.length)
        mostrarAviso({
          tipo: 'roba2',
          actorId: res.actorId,
          victimaId: r2.victimaId,
          n: r2.cartas.length,
          rebarajado: r2.rebarajado,
          finRonda: r2.finRonda,
        })
      } else if (res.next.phase === 'over') {
        return // el aviso de fin de ronda lo pone su efecto
      } else if (res.reversed) {
        mostrarAviso({ tipo: 'sentido', actorId: res.actorId })
      } else if (card.rank === 'as' && n === 2) {
        mostrarAviso({ tipo: 'repite', actorId: res.actorId })
      } else if (card.rank === 'sota' && !porHumano) {
        mostrarAviso({ tipo: 'palo', actorId: res.actorId, suit: res.next.activeSuit })
      }
    },
    [mostrarAviso, marcarRobo],
  )

  // --- turno de bots ------------------------------------------------------
  // Fases: pensar → (robar todas las necesarias de una vez) → jugar con vuelo → aviso.
  // Se para mientras haya un overlay, un aviso o un movimiento en curso.
  useEffect(() => {
    if (screen !== 'mesa' || !round || round.phase !== 'playing') return
    if (overlay || aviso || jugada) return
    const idx = round.currentPlayerIndex
    const cur = round.players[idx]
    if (cur.id === HUMAN_ID) return // espera al humano

    const timer = setTimeout(() => {
      if (getPlayableCards(round).length === 0) {
        let r = round
        let guard = 0
        while (
          r.phase === 'playing' &&
          r.currentPlayerIndex === idx &&
          getPlayableCards(r).length === 0 &&
          guard++ < 80
        ) {
          r = drawCard(r, shuffle)
        }
        const n = r.players[idx].hand.length - cur.hand.length
        if (n <= 0) {
          setRound(r) // R-MAZO-3: no quedaba nada que robar
          return
        }
        marcarRobo(cur.id, n)
        animarYAplicar({ tipo: 'roba', actorId: cur.id, n }, duracionRobo(dur, n), () => setRound(r))
        return
      }
      const card = botChoose(getPlayableCards(round))
      const suit = card.rank === 'sota' ? botChooseSuit(round) : undefined
      const res = describeAndPlay(round, card, suit, shuffle)
      animarYAplicar({ tipo: 'juega', actorId: cur.id, card }, dur.vueloBot, () =>
        aplicarJugada(round, res, card, false),
      )
    }, dur.pensar)
    return () => clearTimeout(timer)
  }, [round, screen, overlay, aviso, jugada, shuffle, dur, animarYAplicar, aplicarJugada, marcarRobo])

  // --- fin de ronda -------------------------------------------------------
  // Aviso «sin cartas» (o «mazo agotado») y, después, el recuento. Espera a que se cierre
  // lo que haya delante (p. ej. el +2 de un 2 jugado como última carta, R-DOS-4).
  const finProgramado = useRef<RoundState | null>(null)
  useEffect(() => {
    if (screen !== 'mesa' || !round || round.phase !== 'over' || jugada) return
    if (overlay || (aviso && aviso.tipo !== 'fin')) return
    if (finProgramado.current === round) return // ya programado para esta ronda
    finProgramado.current = round
    const result = round.result!
    if (dur.finRonda > 0) setAviso({ tipo: 'fin', ganadorId: result.winnerId, id: ++seq.current })
    programar(() => {
      setAviso(null)
      const m = applyRoundResult(matchRef.current!, result)
      setMatch(m)
      setLastResult(result)
      setScreen('finRonda')
    }, dur.finRonda)
  }, [round, screen, jugada, overlay, aviso, dur.finRonda, programar])

  // --- acciones del humano ------------------------------------------------
  const esTurnoHumano = (r: RoundState | null): r is RoundState =>
    !!r && r.phase === 'playing' && r.players[r.currentPlayerIndex].id === HUMAN_ID

  const playHuman = useCallback(
    (card: Card) => {
      if (!esTurnoHumano(round) || jugada || ocupado.current) return
      if (!isPlayable(card, round.activeSuit, round.activeRank)) return
      cerrarAviso()
      if (card.rank === 'sota') {
        pendingSota.current = card
        setOverlay({ kind: 'palo', card })
        return
      }
      const res = describeAndPlay(round, card, undefined, shuffle)
      setOverlay(null)
      animarYAplicar({ tipo: 'juega', actorId: HUMAN_ID, card }, dur.vueloHumano, () =>
        aplicarJugada(round, res, card, true),
      )
    },
    [round, jugada, shuffle, dur.vueloHumano, animarYAplicar, aplicarJugada, cerrarAviso],
  )

  const chooseSuit = useCallback(
    (suit: Suit) => {
      const card = pendingSota.current
      if (!card || !round || jugada || ocupado.current) return
      const res = describeAndPlay(round, card, suit, shuffle)
      pendingSota.current = null
      setOverlay(null)
      animarYAplicar({ tipo: 'juega', actorId: HUMAN_ID, card }, dur.vueloHumano, () =>
        aplicarJugada(round, res, card, true),
      )
    },
    [round, jugada, shuffle, dur.vueloHumano, animarYAplicar, aplicarJugada],
  )

  const drawHuman = useCallback(() => {
    if (!esTurnoHumano(round) || jugada || ocupado.current) return
    if (getPlayableCards(round).length > 0) return // jugar es obligatorio
    cerrarAviso()
    // Se aplica al momento: la mesa hace volar la carta robada, boca arriba, del mazo a su
    // sitio en la mano (así se ve qué carta ha llegado y dónde).
    setRound(drawCard(round, shuffle))
  }, [round, jugada, shuffle, cerrarAviso])

  const dismissRoba2 = useCallback(() => setOverlay(null), [])
  const cancelarSota = useCallback(() => {
    pendingSota.current = null
    setOverlay(null)
  }, [])
  const openVerMano = useCallback(() => setOverlay({ kind: 'verMano' }), [])
  const openVista = useCallback(() => setOverlay({ kind: 'vista' }), [])
  const openSalir = useCallback(() => setOverlay({ kind: 'salir' }), [])
  const openReglas = useCallback(() => setOverlay({ kind: 'reglas' }), [])
  const closeOverlay = useCallback(() => setOverlay(null), [])

  // --- simula el resto de la partida (cuando el humano queda eliminado) ---
  const simulateToEnd = useCallback(
    (start: MatchState): MatchState => {
      let m = start
      let guard = 0
      while (m.phase === 'playing' && guard++ < 2000) {
        let r = buildRound(m)
        let steps = 0
        while (r.phase !== 'over' && steps++ < 5000) {
          const playable = getPlayableCards(r)
          if (playable.length === 0) {
            r = drawCard(r, shuffle)
          } else {
            const c = botChoose(playable)
            const s = c.rank === 'sota' ? botChooseSuit(r) : undefined
            r = playCard(r, c, s, shuffle)
          }
        }
        m = applyRoundResult(m, r.result!)
      }
      return m
    },
    [buildRound, shuffle],
  )

  const nextRound = useCallback(() => {
    const m = matchRef.current!
    if (m.phase === 'over') {
      setScreen('victoria')
      return
    }
    const human = m.players.find((p) => p.id === HUMAN_ID)
    if (human?.eliminated) {
      const final = simulateToEnd(m)
      setMatch(final)
      setScreen('victoria')
      return
    }
    cancelarTodo()
    const rn = roundNumber + 1
    setRoundNumber(rn)
    setOverlay(null)
    const r = buildRound(m)
    setRound(r)
    setScreen('mesa')
    avisarInicioRonda(r, m, rn)
  }, [roundNumber, buildRound, simulateToEnd, cancelarTodo, avisarInicioRonda])

  const restart = useCallback(() => {
    cancelarTodo()
    // Desde la mesa se sale tras confirmar «Se perderá la partida»; desde la victoria ya
    // había terminado. En ambos casos no queda nada que continuar.
    borrarPartida()
    setGuardada(null)
    setScreen('inicio')
    setRound(null)
    setMatch(null)
    setOverlay(null)
  }, [cancelarTodo])

  // --- partida guardada en el dispositivo ---------------------------------
  // Se guarda en cada cambio de la mesa o del recuento; se borra al acabar la partida.
  useEffect(() => {
    if ((screen === 'mesa' || screen === 'finRonda') && match && round) {
      guardarPartida({ players, match, round, roundNumber, screen, lastResult })
    } else if (screen === 'victoria') {
      borrarPartida()
    }
  }, [screen, players, match, round, roundNumber, lastResult])

  const continuarPartida = useCallback(() => {
    const g = guardada
    if (!g) return
    cancelarTodo()
    finProgramado.current = null
    playersRef.current = g.players
    matchRef.current = g.match
    setPlayers(g.players)
    setMatch(g.match)
    setRound(g.round)
    setRoundNumber(g.roundNumber)
    setLastResult(g.lastResult)
    setNRivals(g.players.length - 1)
    const yo = g.players.find((p) => p.id === HUMAN_ID)
    if (yo) setHumanAvatar(yo.avatar)
    setOverlay(null)
    setGuardada(null)
    setScreen(g.screen)
  }, [guardada, cancelarTodo])

  return {
    partidaGuardada: guardada ? { rivales: guardada.players.length - 1, ronda: guardada.roundNumber } : null,
    continuarPartida,
    screen,
    players,
    match,
    round,
    roundNumber,
    overlay,
    jugada,
    aviso,
    robosRecientes,
    dur,
    cerrarAviso,
    lastResult,
    nRivals,
    humanAvatar,
    setNRivals,
    setHumanAvatar,
    startGame,
    playHuman,
    chooseSuit,
    cancelarSota,
    drawHuman,
    dismissRoba2,
    openVerMano,
    openVista,
    openSalir,
    openReglas,
    closeOverlay,
    nextRound,
    restart,
  }
}

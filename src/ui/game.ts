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

export type Screen = 'inicio' | 'mesa' | 'finRonda' | 'victoria'

export interface PlayerCfg {
  id: string
  name: string
  avatar: AvatarKind
  isBot: boolean
}

export type Overlay =
  | null
  | { kind: 'palo' }
  | { kind: 'roba2'; byName: string; byAvatar: AvatarKind; card: Card }
  | { kind: 'verMano' }
  | { kind: 'vista' } // ajustes de letra grande / contraste (R-UI-A11Y-4)

export const HUMAN_ID = 'yo'
const BOT_IDS = ['robi', 'pixel', 'toby'] as const
const BOT_NAMES: Record<string, string> = { robi: 'Robi', pixel: 'Pixel', toby: 'Toby' }

const BOT_DELAY_MS = 850
const PLAY_SETTLE_MS = 900
const FAST_BOT_MS = 0
const FAST_SETTLE_MS = 0

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

interface PlayOutcome {
  next: RoundState
  reversed: boolean
  roba2VictimId: string | null
  actorId: string
}

/** Juega una carta y describe los efectos relevantes para la UI (sentido, +2). */
function describeAndPlay(
  round: RoundState,
  card: Card,
  suit: Suit | undefined,
  shuffle: <T>(xs: T[]) => T[],
): PlayOutcome {
  const actorIdx = round.currentPlayerIndex
  const n = round.players.length
  const next = playCard(round, card, suit, shuffle)
  const reversed = card.rank === 'as' && n >= 3
  let roba2VictimId: string | null = null
  if (card.rank === '2') {
    const victimIdx = (actorIdx + round.direction + n) % n
    roba2VictimId = round.players[victimIdx].id
  }
  return { next, reversed, roba2VictimId, actorId: round.players[actorIdx].id }
}

export interface Ovni {
  screen: Screen
  players: PlayerCfg[]
  match: MatchState | null
  round: RoundState | null
  roundNumber: number
  overlay: Overlay
  directionToast: boolean
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
  drawHuman: () => void
  dismissRoba2: () => void
  openVerMano: () => void
  openVista: () => void
  closeOverlay: () => void
  nextRound: () => void
  restart: () => void
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

  // Tiempos (acelerables con ?fast para los e2e).
  const timingRef = useRef<{ bot: number; settle: number } | null>(null)
  if (!timingRef.current) {
    const fast = new URLSearchParams(
      typeof location !== 'undefined' ? location.search : '',
    ).has('fast')
    timingRef.current = {
      bot: fast ? FAST_BOT_MS : BOT_DELAY_MS,
      settle: fast ? FAST_SETTLE_MS : PLAY_SETTLE_MS,
    }
  }
  const timing = timingRef.current

  const [screen, setScreen] = useState<Screen>('inicio')
  const [players, setPlayers] = useState<PlayerCfg[]>([])
  const [match, setMatch] = useState<MatchState | null>(null)
  const [round, setRound] = useState<RoundState | null>(null)
  const [roundNumber, setRoundNumber] = useState(1)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [directionToast, setDirectionToast] = useState(false)
  const [lastResult, setLastResult] = useState<RoundState['result']>(null)
  const [nRivals, setNRivals] = useState(3)
  const [humanAvatar, setHumanAvatar] = useState<AvatarKind>('sol')

  const matchRef = useRef<MatchState | null>(null)
  matchRef.current = match
  const playersRef = useRef<PlayerCfg[]>([])
  playersRef.current = players
  const pendingSota = useRef<Card | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashDirection = useCallback(() => {
    setDirectionToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setDirectionToast(false), 1600)
  }, [])

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
    playersRef.current = next
    matchRef.current = m
    setPlayers(next)
    setMatch(m)
    setRoundNumber(1)
    setLastResult(null)
    setOverlay(null)
    setRound(buildRound(m))
    setScreen('mesa')
  }, [nRivals, humanAvatar, rng, buildRound])

  // --- turno de bots ------------------------------------------------------
  useEffect(() => {
    if (screen !== 'mesa' || !round || round.phase !== 'playing') return
    if (overlay) return // pausado (roba2 / selector de palo / ver mano)
    const cur = round.players[round.currentPlayerIndex]
    if (cur.id === HUMAN_ID) return // espera al humano

    const timer = setTimeout(() => {
      const playable = getPlayableCards(round)
      if (playable.length === 0) {
        setRound(drawCard(round, shuffle))
        return
      }
      const card = botChoose(playable)
      const suit = card.rank === 'sota' ? botChooseSuit(round) : undefined
      const res = describeAndPlay(round, card, suit, shuffle)
      if (res.reversed) flashDirection()
      setRound(res.next)
      if (res.roba2VictimId === HUMAN_ID) {
        setOverlay({
          kind: 'roba2',
          byName: nameOf(res.actorId),
          byAvatar: avatarOf(res.actorId),
          card,
        })
      }
    }, timing.bot)
    return () => clearTimeout(timer)
  }, [round, screen, overlay, shuffle, flashDirection, timing.bot])

  // --- fin de ronda -------------------------------------------------------
  useEffect(() => {
    if (screen !== 'mesa' || !round || round.phase !== 'over') return
    const timer = setTimeout(() => {
      const result = round.result!
      const m = applyRoundResult(matchRef.current!, result)
      setMatch(m)
      setLastResult(result)
      setScreen('finRonda')
    }, timing.settle)
    return () => clearTimeout(timer)
  }, [round, screen, timing.settle])

  // --- acciones del humano ------------------------------------------------
  const playHuman = useCallback(
    (card: Card) => {
      if (!round || round.phase !== 'playing') return
      if (round.players[round.currentPlayerIndex].id !== HUMAN_ID) return
      if (!isPlayable(card, round.activeSuit, round.activeRank)) return
      if (card.rank === 'sota') {
        pendingSota.current = card
        setOverlay({ kind: 'palo' })
        return
      }
      const res = describeAndPlay(round, card, undefined, shuffle)
      if (res.reversed) flashDirection()
      setOverlay(null)
      setRound(res.next)
    },
    [round, shuffle, flashDirection],
  )

  const chooseSuit = useCallback(
    (suit: Suit) => {
      const card = pendingSota.current
      if (!card || !round) return
      const res = describeAndPlay(round, card, suit, shuffle)
      pendingSota.current = null
      setOverlay(null)
      setRound(res.next)
    },
    [round, shuffle],
  )

  const drawHuman = useCallback(() => {
    if (!round || round.phase !== 'playing') return
    if (round.players[round.currentPlayerIndex].id !== HUMAN_ID) return
    if (getPlayableCards(round).length > 0) return // jugar es obligatorio
    setRound(drawCard(round, shuffle))
  }, [round, shuffle])

  const dismissRoba2 = useCallback(() => setOverlay(null), [])
  const openVerMano = useCallback(() => setOverlay({ kind: 'verMano' }), [])
  const openVista = useCallback(() => setOverlay({ kind: 'vista' }), [])
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
    const rn = roundNumber + 1
    setRoundNumber(rn)
    setOverlay(null)
    setRound(buildRound(m))
    setScreen('mesa')
  }, [roundNumber, buildRound, simulateToEnd])

  const restart = useCallback(() => {
    setScreen('inicio')
    setRound(null)
    setMatch(null)
    setOverlay(null)
  }, [])

  return {
    screen,
    players,
    match,
    round,
    roundNumber,
    overlay,
    directionToast,
    lastResult,
    nRivals,
    humanAvatar,
    setNRivals,
    setHumanAvatar,
    startGame,
    playHuman,
    chooseSuit,
    drawHuman,
    dismissRoba2,
    openVerMano,
    openVista,
    closeOverlay,
    nextRound,
    restart,
  }
}

import { useEffect, useReducer, useState } from 'react'

import {
  CRIT_CAP_PER_TP,
  CRIT_OPS,
  type CritOpId,
  DEFAULT_ROSTER,
  OBJECTIVE_MARKERS,
  OP_CAP,
  type OpKind,
  type Operative,
  STARTING_CP,
  type SideId,
  TEAMS,
  TURNING_POINTS,
  killThresholds,
} from './rules'

export type Order = 'conceal' | 'engage'
export type OpState = { hp: number; expended: boolean; dead: boolean; order: Order }
export type PlayerState = { player: string; cp: number; tacOp: string; tacVp: number }

export type Game = {
  tp: number
  tpCount: number // homebrew: the battle can run longer than the official four
  opCap: number // max VP per op type; official is 6 over 4 turning points
  critCap: number // max crit VP per turning point; the cards say 2, this homebrew defaults to 3
  objectives: (SideId | null)[] // one entry per marker, index 0 is the centre
  finished: boolean
  critOp: CritOpId | null
  initiative: SideId
  primary: Record<SideId, OpKind | null>
  crit: Record<SideId, number[]> // one entry per turning point
  killOverride: Record<SideId, number[] | null> // GM-editable kill grade thresholds
  order: Record<SideId, string[]> // team ids in activation order, per side
  paired: boolean // house rule: two operatives from two different players per side turn
  sideTurn: SideId // which alliance is activating, in paired mode
  pairUsed: string[] // team ids that have already activated in this side turn
  counteracts: Record<SideId, number> // banked Counteracts for a flushed side
  roster: Record<string, Operative[]> // teamId -> live, editable operatives
  ops: Record<string, OpState>
  teams: Record<string, PlayerState>
  turnIdx: number
}

const freshOps = (roster: Record<string, Operative[]>) =>
  Object.fromEntries(
    Object.values(roster)
      .flat()
      .map((o) => [o.id, { hp: o.w, expended: false, dead: false, order: 'conceal' as Order }]),
  )

export const initialGame = (): Game => {
  const roster = structuredClone(DEFAULT_ROSTER)
  return {
    tp: 1,
    tpCount: TURNING_POINTS,
    opCap: OP_CAP,
    critCap: CRIT_CAP_PER_TP,
    objectives: Array(OBJECTIVE_MARKERS).fill(null),
    finished: false,
    critOp: null,
    initiative: 'imperium',
    primary: { imperium: null, xenos: null },
    crit: { imperium: Array(TURNING_POINTS).fill(0), xenos: Array(TURNING_POINTS).fill(0) },
    killOverride: { imperium: null, xenos: null },
    order: {
      imperium: TEAMS.filter((t) => t.side === 'imperium').map((t) => t.id),
      xenos: TEAMS.filter((t) => t.side === 'xenos').map((t) => t.id),
    },
    paired: true,
    sideTurn: 'imperium',
    pairUsed: [],
    counteracts: { imperium: 0, xenos: 0 },
    roster,
    ops: freshOps(roster),
    teams: Object.fromEntries(TEAMS.map((t) => [t.id, { player: t.player, cp: STARTING_CP, tacOp: '', tacVp: 0 }])),
    turnIdx: 0,
  }
}

export type Action =
  | { type: 'reset' }
  | { type: 'replace'; game: Game } // a whole snapshot: from the relay, or a loaded save
  | { type: 'critOp'; id: CritOpId }
  | { type: 'initiative'; side: SideId }
  | { type: 'primary'; side: SideId; op: OpKind | null }
  | { type: 'critVp'; side: SideId; tp: number; delta: number }
  | { type: 'setCritVp'; side: SideId; tp: number; value: number }
  | { type: 'tpCount'; value: number }
  | { type: 'setTp'; value: number }
  | { type: 'opCap'; value: number }
  | { type: 'critCap'; value: number }
  | { type: 'objective'; index: number; value: SideId | null }
  | { type: 'objectiveCount'; value: number }
  | { type: 'thresholds'; side: SideId; value: number[] | null }
  | { type: 'wound'; opId: string; delta: number }
  | { type: 'dead'; opId: string; dead: boolean }
  | { type: 'activate'; opId: string }
  | { type: 'skip' }
  | { type: 'moveTeam'; teamId: string; dir: -1 | 1 }
  | { type: 'paired'; value: boolean }
  | { type: 'counteractBank'; side: SideId; delta: number }
  | { type: 'passPair' }
  | { type: 'order'; opId: string; value: Order }
  | { type: 'teamOrder'; teamId: string; value: Order }
  | { type: 'cp'; teamId: string; delta: number }
  | { type: 'tacOp'; teamId: string; value: string }
  | { type: 'tacVp'; teamId: string; delta: number }
  | { type: 'player'; teamId: string; name: string }
  | { type: 'nextTp' }
  | { type: 'finish'; finished: boolean }
  | { type: 'addOp'; teamId: string; op: Operative }
  | { type: 'removeOp'; teamId: string; opId: string }
  | { type: 'editOp'; teamId: string; opId: string; patch: Partial<Operative> }
  | { type: 'resetRoster'; teamId: string }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const findOp = (g: Game, opId: string) =>
  Object.values(g.roster)
    .flat()
    .find((o) => o.id === opId)

const teamIdOf = (g: Game, opId: string) =>
  Object.keys(g.roster).find((tid) => g.roster[tid].some((o) => o.id === opId))

export function reduce(g: Game, a: Action): Game {
  switch (a.type) {
    case 'reset':
      return initialGame()
    // Merged over a fresh game the same way a localStorage load is, so a snapshot from an
    // older client can't leave a newer top-level field undefined.
    case 'replace':
      return { ...initialGame(), ...a.game }
    case 'critOp':
      return { ...g, critOp: a.id }
    case 'initiative':
      return { ...g, initiative: a.side, sideTurn: a.side, pairUsed: [], turnIdx: 0 }
    case 'paired':
      return { ...g, paired: a.value, sideTurn: g.initiative, pairUsed: [], turnIdx: 0 }
    case 'counteractBank':
      return { ...g, counteracts: { ...g.counteracts, [a.side]: Math.max(0, g.counteracts[a.side] + a.delta) } }
    case 'passPair':
      return handOff({ ...g, pairUsed: [] })
    case 'primary':
      return { ...g, primary: { ...g.primary, [a.side]: a.op } }
    case 'critVp': {
      const row = [...g.crit[a.side]]
      row[a.tp] = clamp(row[a.tp] + a.delta, 0, g.critCap)
      return { ...g, crit: { ...g.crit, [a.side]: row } }
    }
    case 'setCritVp': {
      const row = [...g.crit[a.side]]
      row[a.tp] = clamp(a.value, 0, g.critCap)
      return { ...g, crit: { ...g.crit, [a.side]: row } }
    }
    case 'tpCount': {
      const n = clamp(a.value, 1, 12)
      const resize = (row: number[]) => Array.from({ length: n }, (_, i) => row[i] ?? 0)
      return {
        ...g,
        tpCount: n,
        tp: Math.min(g.tp, n),
        crit: { imperium: resize(g.crit.imperium), xenos: resize(g.crit.xenos) },
      }
    }
    case 'setTp':
      return { ...g, tp: clamp(a.value, 1, g.tpCount) }
    case 'opCap':
      return { ...g, opCap: clamp(a.value, 1, 30) }
    case 'critCap':
      return { ...g, critCap: clamp(a.value, 1, 10) }
    case 'objective': {
      const next = [...g.objectives]
      next[a.index] = a.value
      return { ...g, objectives: next }
    }
    case 'objectiveCount': {
      const n = clamp(a.value, 1, 9)
      return { ...g, objectives: Array.from({ length: n }, (_, i) => g.objectives[i] ?? null) }
    }
    case 'thresholds':
      return { ...g, killOverride: { ...g.killOverride, [a.side]: a.value } }
    case 'wound': {
      const o = g.ops[a.opId]
      const max = findOp(g, a.opId)!.w
      const hp = clamp(o.hp + a.delta, 0, max)
      return { ...g, ops: { ...g.ops, [a.opId]: { ...o, hp, dead: hp === 0 ? true : o.dead } } }
    }
    case 'dead': {
      const o = g.ops[a.opId]
      return { ...g, ops: { ...g.ops, [a.opId]: { ...o, dead: a.dead, hp: a.dead ? 0 : o.hp } } }
    }
    case 'activate': {
      const o = g.ops[a.opId]
      const teamId = teamIdOf(g, a.opId)
      const spending = !o.expended // readying an operative again is a correction, not an activation
      const next = { ...g, ops: { ...g.ops, [a.opId]: { ...o, expended: spending } } }

      if (!g.paired) {
        const isCurrent = currentTeamId(g) === teamId
        return { ...next, turnIdx: spending && isCurrent ? g.turnIdx + 1 : g.turnIdx }
      }
      if (!spending || !teamId) return next

      const team = TEAMS.find((t) => t.id === teamId)!
      // An out-of-turn activation is the GM's call; we only track whose turn it is.
      if (team.side !== g.sideTurn) return next

      // While the enemy has nothing ready, each activation banks them a Counteract.
      const foe = enemy(g.sideTurn)
      const enemyDry = !teamsOf(next, foe).some((t) => readyCount(next, t.id) > 0)
      const banked = enemyDry
        ? { ...next, counteracts: { ...next.counteracts, [foe]: next.counteracts[foe] + 1 } }
        : next

      const used = g.pairUsed.includes(teamId) ? g.pairUsed : [...g.pairUsed, teamId]
      const staged = { ...banked, pairUsed: used }
      return used.length >= pairTarget(staged) ? handOff({ ...staged, pairUsed: [] }) : staged
    }
    case 'skip':
      return { ...g, turnIdx: g.turnIdx + 1 }
    case 'moveTeam': {
      const team = TEAMS.find((t) => t.id === a.teamId)
      if (!team) return g
      const ids = orderedIds(g, team.side)
      const i = ids.indexOf(a.teamId)
      const j = i + a.dir
      if (i < 0 || j < 0 || j >= ids.length) return g
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
      // the cursor counts slots, so its meaning changes once the order does
      return { ...g, order: { ...g.order, [team.side]: ids }, turnIdx: 0 }
    }
    case 'order': {
      const o = g.ops[a.opId]
      return { ...g, ops: { ...g.ops, [a.opId]: { ...o, order: a.value } } }
    }
    case 'teamOrder': {
      const ops = { ...g.ops }
      for (const o of teamOps(g, a.teamId)) if (!ops[o.id].dead) ops[o.id] = { ...ops[o.id], order: a.value }
      return { ...g, ops }
    }
    case 'cp': {
      const t = g.teams[a.teamId]
      return { ...g, teams: { ...g.teams, [a.teamId]: { ...t, cp: Math.max(0, t.cp + a.delta) } } }
    }
    case 'tacOp': {
      const t = g.teams[a.teamId]
      return { ...g, teams: { ...g.teams, [a.teamId]: { ...t, tacOp: a.value } } }
    }
    case 'tacVp': {
      const t = g.teams[a.teamId]
      return { ...g, teams: { ...g.teams, [a.teamId]: { ...t, tacVp: clamp(t.tacVp + a.delta, 0, g.opCap) } } }
    }
    case 'player': {
      const t = g.teams[a.teamId]
      return { ...g, teams: { ...g.teams, [a.teamId]: { ...t, player: a.name } } }
    }
    case 'nextTp': {
      // Ready all surviving operatives, hand out CP.
      const ops = Object.fromEntries(Object.entries(g.ops).map(([id, o]) => [id, { ...o, expended: false }]))
      const teams = Object.fromEntries(
        TEAMS.map((t) => [t.id, { ...g.teams[t.id], cp: g.teams[t.id].cp + (t.side === g.initiative ? 1 : 2) }]),
      )
      return {
        ...g,
        tp: Math.min(g.tpCount, g.tp + 1),
        ops,
        teams,
        turnIdx: 0,
        sideTurn: g.initiative,
        pairUsed: [],
        counteracts: { imperium: 0, xenos: 0 }, // a Counteract is a this-turn opportunity
      }
    }
    case 'finish':
      return { ...g, finished: a.finished }

    /* ---------- roster editing ---------- */
    case 'addOp':
      return {
        ...g,
        roster: { ...g.roster, [a.teamId]: [...g.roster[a.teamId], a.op] },
        ops: { ...g.ops, [a.op.id]: { hp: a.op.w, expended: false, dead: false, order: 'conceal' } },
      }
    case 'removeOp': {
      const { [a.opId]: _gone, ...ops } = g.ops
      return { ...g, roster: { ...g.roster, [a.teamId]: g.roster[a.teamId].filter((o) => o.id !== a.opId) }, ops }
    }
    case 'editOp': {
      const list = g.roster[a.teamId].map((o) => (o.id === a.opId ? { ...o, ...a.patch } : o))
      const next = list.find((o) => o.id === a.opId)!
      const st = g.ops[a.opId]
      // Lowering max wounds must not leave an operative on more hp than it has.
      const ops = { ...g.ops, [a.opId]: { ...st, hp: Math.min(st.hp, next.w) } }
      return { ...g, roster: { ...g.roster, [a.teamId]: list }, ops }
    }
    case 'resetRoster': {
      const list = structuredClone(DEFAULT_ROSTER[a.teamId])
      const kept = Object.fromEntries(Object.entries(g.ops).filter(([id]) => teamIdOf(g, id) !== a.teamId))
      return {
        ...g,
        roster: { ...g.roster, [a.teamId]: list },
        ops: { ...kept, ...freshOps({ [a.teamId]: list }) },
      }
    }
  }
}

/* ---------- derived ---------- */

export const enemy = (s: SideId): SideId => (s === 'imperium' ? 'xenos' : 'imperium')

/**
 * A side's team ids in activation order. Anything saved is honoured, but unknown
 * ids are dropped and missing ones appended — so adding a player to a side does
 * not require throwing away a game in progress.
 */
const orderedIds = (g: Game, s: SideId) => {
  const all = TEAMS.filter((t) => t.side === s).map((t) => t.id)
  const saved = (g.order?.[s] ?? []).filter((id) => all.includes(id))
  return [...saved, ...all.filter((id) => !saved.includes(id))]
}

const sideTeams = (g: Game, s: SideId) => orderedIds(g, s).map((id) => TEAMS.find((t) => t.id === id)!)
export const teamOps = (g: Game, teamId: string) => g.roster[teamId] ?? []
export const sideOps = (g: Game, s: SideId) => sideTeams(g, s).flatMap((t) => teamOps(g, t.id))

export const thresholds = (g: Game, s: SideId) => g.killOverride[s] ?? killThresholds(sideOps(g, enemy(s)).length)

export const kills = (g: Game, s: SideId) => sideOps(g, enemy(s)).filter((o) => g.ops[o.id]?.dead).length

export const killGrade = (g: Game, s: SideId) => thresholds(g, s).filter((t) => kills(g, s) >= t).length

export const scores = (g: Game, s: SideId) => {
  const cap = g.opCap
  const grade = killGrade(g, s)
  const beatsEnemy = g.finished && grade > killGrade(g, enemy(s))
  const kill = Math.min(cap, grade + (beatsEnemy ? 1 : 0))
  const crit = Math.min(
    cap,
    g.crit[s].reduce((n, v) => n + Math.min(g.critCap, v), 0),
  )
  const tacRaw = sideTeams(g, s).reduce((n, t) => n + g.teams[t.id].tacVp, 0)
  const tac = Math.min(cap, tacRaw)
  const p = g.primary[s]
  // Official bonus is half the op, max 3 — i.e. half the 6 VP cap. Scales with the cap.
  const bonus = p ? Math.min(Math.ceil(cap / 2), Math.ceil({ kill, crit, tac }[p] / 2)) : 0
  return { kill, crit, tac, tacRaw, bonus, total: kill + crit + tac + bonus }
}

/* ---------- objectives ---------- */

export const objectiveCounts = (g: Game) => ({
  imperium: g.objectives.filter((o) => o === 'imperium').length,
  xenos: g.objectives.filter((o) => o === 'xenos').length,
  neutral: g.objectives.filter((o) => o === null).length,
})

/**
 * What the marker board is worth to a side this turning point — but only for the
 * crit ops whose VP follows from marker control alone (Secure, Transmission).
 * The other seven accumulate points or track named markers, so they return null
 * and the GM uses the steppers. No crit op scores during the first turning point.
 */
export const suggestedCrit = (g: Game, s: SideId): number | null => {
  const op = CRIT_OPS.find((c) => c.id === g.critOp)
  if (!op || op.derive !== 'holders') return null
  if (g.tp < 2) return 0
  const c = objectiveCounts(g)
  const mine = c[s]
  const theirs = c[enemy(s)]
  return Math.min(g.critCap, (mine > 0 ? 1 : 0) + (mine > theirs ? 1 : 0))
}

/**
 * Fixed rotation: initiative side first, then alternating, one operative per slot.
 * The sides need not be the same size — pairing runs to the longer of the two, so
 * a side with an extra player still gets that player a slot at the end of the cycle.
 */
export const rotation = (g: Game) => {
  const a = sideTeams(g, g.initiative)
  const b = sideTeams(g, enemy(g.initiative))
  const n = Math.max(a.length, b.length)
  return Array.from({ length: n }, (_, i) => [a[i], b[i]])
    .flat()
    .filter((t): t is (typeof TEAMS)[number] => Boolean(t))
}

/** Teams on a side, in activation order — the scoreboard lays one row out per slot. */
export const teamsOf = (g: Game, s: SideId) => sideTeams(g, s)

/** Can this team still move that way within its own side's order? */
export const canMove = (g: Game, teamId: string, dir: -1 | 1) => {
  const team = TEAMS.find((t) => t.id === teamId)
  if (!team) return false
  const ids = orderedIds(g, team.side)
  const j = ids.indexOf(teamId) + dir
  return j >= 0 && j < ids.length
}
/** Rows the scoreboard needs — the larger side's player count. Order cannot change it. */
export const maxTeamsPerSide = Math.max(
  ...(['imperium', 'xenos'] as SideId[]).map((s) => TEAMS.filter((t) => t.side === s).length),
)

/**
 * How many activations this side turn takes. Two, per the Buddy System — but the
 * Lone Wolf exception drops it to one when only a single player still has ready
 * operatives. Teams already counted in this pair still count toward the target, so
 * spending a player's last operative cannot move the goalposts mid-turn.
 */
export const pairTarget = (g: Game) => {
  if (!g.paired) return 1
  const live = teamsOf(g, g.sideTurn).filter((t) => readyCount(g, t.id) > 0 || g.pairUsed.includes(t.id))
  return Math.min(2, live.length)
}

/** Teams on the active side that may still take one of this side turn's activations. */
export const pairEligible = (g: Game) =>
  teamsOf(g, g.sideTurn).filter((t) => readyCount(g, t.id) > 0 && !g.pairUsed.includes(t.id))

/** Hand the turn over — unless the other side has nothing ready, in which case the
 *  active side keeps activating back-to-back and the other side banks Counteracts. */
const handOff = (g: Game): Game => {
  const other = enemy(g.sideTurn)
  return teamsOf(g, other).some((t) => readyCount(g, t.id) > 0) ? { ...g, sideTurn: other } : g
}

/** How the team's surviving operatives are split across orders, and how many are still ready. */
export const orderCounts = (g: Game, teamId: string) => {
  const live = teamOps(g, teamId).filter((o) => g.ops[o.id] && !g.ops[o.id].dead)
  return {
    conceal: live.filter((o) => g.ops[o.id].order === 'conceal').length,
    engage: live.filter((o) => g.ops[o.id].order === 'engage').length,
  }
}

export const readyCount = (g: Game, teamId: string) =>
  teamOps(g, teamId).filter((o) => g.ops[o.id] && !g.ops[o.id].dead && !g.ops[o.id].expended).length

/** Next team in the rotation that still has a ready operative, or null if the firefight is over. */
export const currentTeamId = (g: Game): string | null => {
  const order = rotation(g)
  for (let i = 0; i < order.length; i++) {
    const t = order[(g.turnIdx + i) % order.length]
    if (readyCount(g, t.id) > 0) return t.id
  }
  return null
}

/**
 * A side may counteract when it has nothing ready but the enemy still does —
 * and only an expended operative on ENGAGE can actually do it.
 */
export const counteract = (g: Game, s: SideId) => {
  const mine = sideTeams(g, s).reduce((n, t) => n + readyCount(g, t.id), 0)
  const theirs = sideTeams(g, enemy(s)).reduce((n, t) => n + readyCount(g, t.id), 0)
  const eligible = sideOps(g, s).filter((o) => {
    const st = g.ops[o.id]
    return st && !st.dead && st.expended && st.order === 'engage'
  })
  return { available: mine === 0 && theirs > 0, eligible }
}

/* ---------- persistence ---------- */

const KEY = 'killteam-gm/v10' // bump when the shape changes; old saves are ignored
const ROOM_KEY = 'killteam-gm/room' // the GM's { code, token }; viewers read the URL instead

/* ---------- rooms ---------- */

export const API = import.meta.env.VITE_API_URL ?? ''

/** A GM has the write token. A viewer has only the code, off the URL. */
export type Room = { code: string; token?: string }
export type SaveMeta = { id: string; label: string; saved_at: string }

const read = <T,>(key: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

/** `#/r/ABCD` in the URL means spectator. Otherwise fall back to the stored GM room. */
const readRoom = (): Room | null => {
  const viewing = location.hash.match(/^#\/r\/([A-Z0-9]{4})$/)
  return viewing ? { code: viewing[1] } : read<Room>(ROOM_KEY)
}

export const viewerUrl = (code: string) => `${location.origin}${location.pathname}#/r/${code}`

const api = (path: string, token: string, init: RequestInit = {}) =>
  fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...init.headers },
  })

export const createRoom = async (): Promise<Room> => {
  const room = (await (await fetch(`${API}/rooms`, { method: 'POST' })).json()) as Room
  localStorage.setItem(ROOM_KEY, JSON.stringify(room))
  return room
}

export const listSaves = async (r: Room): Promise<SaveMeta[]> =>
  r.token ? await (await api(`/rooms/${r.code}/saves`, r.token)).json() : []

export const saveMatch = (r: Room, label: string, game: Game) =>
  api(`/rooms/${r.code}/saves`, r.token!, { method: 'POST', body: JSON.stringify({ label, game }) })

export const loadSave = async (r: Room, id: string): Promise<Game> =>
  await (await api(`/rooms/${r.code}/saves/${id}`, r.token!)).json()

export function useGame() {
  const [game, dispatch] = useReducer(reduce, null, () => {
    const saved = read<Game>(KEY)
    return saved ? { ...initialGame(), ...saved } : initialGame()
  })
  const [room, setRoom] = useState(readRoom)
  const viewer = !!room && !room.token

  useEffect(() => {
    if (!viewer) localStorage.setItem(KEY, JSON.stringify(game))
  }, [game, viewer])

  // GM → relay. Debounced because player-name and tac-op inputs dispatch per keystroke, and
  // best-effort because localStorage is the source of truth — a dead VPS must not stop the match.
  useEffect(() => {
    if (!room?.token) return
    const t = setTimeout(() => {
      api(`/rooms/${room.code}/state`, room.token!, { method: 'POST', body: JSON.stringify(game) }).catch(
        () => {},
      )
    }, 400)
    return () => clearTimeout(t)
  }, [game, room])

  // Viewer ← relay. The server sends the current snapshot on connect, so a late joiner or a
  // reconnect is caught up without a separate fetch.
  useEffect(() => {
    if (!viewer || !room) return
    let ws: WebSocket
    let retry: ReturnType<typeof setTimeout>
    let done = false
    const connect = () => {
      ws = new WebSocket(`${API.replace(/^http/, 'ws')}/rooms/${room.code}/ws`)
      ws.onmessage = (e) => dispatch({ type: 'replace', game: JSON.parse(e.data) })
      ws.onclose = () => {
        if (!done) retry = setTimeout(connect, 2000)
      }
    }
    connect()
    return () => {
      done = true
      clearTimeout(retry)
      ws.close()
    }
  }, [viewer, room])

  return [game, dispatch, { room, viewer, setRoom }] as const
}

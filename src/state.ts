import { useEffect, useReducer, useState } from 'react'

import {
  CP_PER_TP,
  CRIT_CAP_PER_TP,
  CRIT_OPS,
  type CritOpId,
  DEFAULT_ROSTER,
  OBJECTIVE_MARKERS,
  OP_CAP,
  type OpKind,
  type Operative,
  PRESET_SIDES,
  PRESET_TEAMS,
  SIDE_PALETTE,
  STARTING_CP,
  type SideDef,
  type SideId,
  type TeamDef,
  TURNING_POINTS,
  killThresholds,
} from './rules'
import type { PhaseId } from './compendium'

export type Order = 'conceal' | 'engage'
export type OpState = {
  hp: number
  expended: boolean
  dead: boolean
  order: Order
}
/** Kept as an alias: `TeamDef` absorbed it when teams became runtime data. */
export type PlayerState = TeamDef

export type Game = {
  setup: boolean // showing the setup view rather than the console
  sides: SideDef[] // the alliances, in order — order picks the console's columns
  cpPerTp: { lead: number; other: number } // CP granted each turning point
  tp: number
  tpCount: number // homebrew: the battle can run longer than the official four
  opCap: number // max VP per op type; official is 6 over 4 turning points
  critCap: number // max crit VP per turning point; the cards say 2, this homebrew defaults to 3
  objectives: (SideId | null)[] // one entry per marker, index 0 is the centre
  finished: boolean
  phase: PhaseId // which phase of the turning point the table is in; announced to every viewer
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
  teams: Record<string, TeamDef> // teamId -> the team itself, metadata and play state
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
    setup: false,
    sides: structuredClone(PRESET_SIDES),
    cpPerTp: { ...CP_PER_TP },
    tp: 1,
    tpCount: TURNING_POINTS,
    opCap: OP_CAP,
    critCap: CRIT_CAP_PER_TP,
    objectives: Array(OBJECTIVE_MARKERS).fill(null),
    finished: false,
    phase: 'initiative',
    critOp: null,
    initiative: 'imperium',
    primary: { imperium: null, xenos: null },
    crit: { imperium: Array(TURNING_POINTS).fill(0), xenos: Array(TURNING_POINTS).fill(0) },
    killOverride: { imperium: null, xenos: null },
    order: Object.fromEntries(
      PRESET_SIDES.map((s) => [s.id, PRESET_TEAMS.filter((t) => t.side === s.id).map((t) => t.id)]),
    ),
    paired: true,
    sideTurn: 'imperium',
    pairUsed: [],
    counteracts: { imperium: 0, xenos: 0 },
    roster,
    ops: freshOps(roster),
    teams: Object.fromEntries(PRESET_TEAMS.map((t) => [t.id, { ...t, cp: STARTING_CP, tacOp: '', tacVp: 0 }])),
    turnIdx: 0,
  }
}

export type Action =
  | { type: 'reset' }
  | { type: 'replace'; game: Game } // a whole snapshot: from the relay, or a loaded save
  | { type: 'critOp'; id: CritOpId }
  | { type: 'phase'; value: PhaseId }
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
  // --- setup: the match itself is editable, so these change who is playing ---
  | { type: 'setup'; value: boolean }
  | { type: 'sideAdd' }
  | { type: 'sideRemove'; id: SideId }
  | { type: 'sidePatch'; id: SideId; patch: Partial<SideDef> }
  | { type: 'sideMove'; id: SideId; dir: -1 | 1 }
  | { type: 'teamAdd'; team: TeamDef; roster: Operative[] }
  | { type: 'teamRemove'; teamId: string }
  | { type: 'teamPatch'; teamId: string; patch: Partial<TeamDef> }
  | { type: 'cpPerTp'; patch: Partial<{ lead: number; other: number }> }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const findOp = (g: Game, opId: string) =>
  Object.values(g.roster)
    .flat()
    .find((o) => o.id === opId)

/** Which team owns an operative. A real lookup, because op ids come in four shapes and `dw` is
 *  a prefix of `dw2` — `id.startsWith(teamId)` is ambiguous. */
export const teamIdOf = (g: Game, opId: string) =>
  Object.keys(g.roster).find((tid) => g.roster[tid].some((o) => o.id === opId))

/* ---------- setup invariants ---------- */

/** A record with one entry per side. The five per-side records are plain objects keyed by a
 *  now-open `string`, so the compiler cannot tell you when one is missing a side — everything
 *  that adds or removes a side goes through `normalize` instead. */
const blankBySide = <T,>(sides: SideDef[], value: T): Record<SideId, T> =>
  Object.fromEntries(sides.map((x) => [x.id, value]))

const bySide = <T,>(sides: SideDef[], src: Record<SideId, T>, blank: () => T): Record<SideId, T> =>
  Object.fromEntries(sides.map((x) => [x.id, src[x.id] ?? blank()]))

/**
 * The single repair point for everything a setup edit can leave dangling.
 *
 * Adding a side leaves five per-side records without a row for it, and `scores` would
 * read `undefined.reduce`. Removing one leaves rows nobody reads, a marker held by a side
 * that no longer exists, and possibly `initiative`/`sideTurn` pointing at nothing. Removing
 * a team leaves its roster and its operatives' wound tracks behind.
 *
 * `order` and `pairUsed` are deliberately *not* repaired here: `orderedIds` already
 * self-heals at read time, and a stale `pairUsed` id is inert because `pairTarget` only
 * ever intersects it with live teams. Fewer stored invariants, fewer things to drift.
 */
const normalize = (g: Game): Game => {
  const sides = g.sides.length ? g.sides : [{ id: 'side1', name: 'Alliance 1', color: SIDE_PALETTE[0] }]
  const live = new Set(sides.map((x) => x.id))
  // A team whose side is gone is re-homed rather than deleted. Deleting is `sideRemove`'s
  // job, and it does it explicitly — so a malformed snapshot can never silently empty the
  // match on its way through `replace`.
  const teams = Object.fromEntries(
    Object.entries(g.teams).map(([id, t]) => [id, live.has(t.side) ? t : { ...t, side: sides[0].id }]),
  )
  const ids = new Set(Object.keys(teams))
  const roster = Object.fromEntries(Object.entries(g.roster).filter(([tid]) => ids.has(tid)))
  const keep = new Set(Object.values(roster).flat().map((o) => o.id))
  const has = (x: SideId) => (live.has(x) ? x : sides[0].id)
  return {
    ...g,
    sides,
    teams,
    roster,
    ops: Object.fromEntries(Object.entries(g.ops).filter(([id]) => keep.has(id))),
    objectives: g.objectives.map((o) => (o && live.has(o) ? o : null)),
    primary: bySide(sides, g.primary, () => null),
    crit: bySide(sides, g.crit, () => Array(g.tpCount).fill(0)),
    killOverride: bySide(sides, g.killOverride, () => null),
    counteracts: bySide(sides, g.counteracts, () => 0),
    order: bySide(sides, g.order, () => []),
    initiative: has(g.initiative),
    sideTurn: has(g.sideTurn),
  }
}

/** `normalize` plus a rewound turn cursor. Every setup edit uses this; `replace` does not,
 *  because it runs on every relay snapshot and must not move a spectator off the live turn. */
const recast = (g: Game): Game => ({ ...normalize(g), turnIdx: 0, pairUsed: [] })

export function reduce(g: Game, a: Action): Game {
  switch (a.type) {
    case 'reset':
      return initialGame()
    // Merged over a fresh game the same way a localStorage load is, so a snapshot from an
    // older client can't leave a newer top-level field undefined.
    case 'replace':
      return normalize({ ...initialGame(), ...a.game })
    case 'critOp':
      return { ...g, critOp: a.id }
    case 'phase':
      return { ...g, phase: a.value }
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
        crit: Object.fromEntries(g.sides.map((x) => [x.id, resize(g.crit[x.id] ?? [])])),
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
      // Activating *is* the Firefight phase, so the GM never has to announce that one by hand.
      // Every path below spreads `next`, so setting it here covers all of them.
      const next = {
        ...g,
        phase: spending ? ('firefight' as const) : g.phase,
        ops: { ...g.ops, [a.opId]: { ...o, expended: spending } },
      }

      if (!g.paired) {
        const isCurrent = currentTeamId(g) === teamId
        return { ...next, turnIdx: spending && isCurrent ? g.turnIdx + 1 : g.turnIdx }
      }
      if (!spending || !teamId) return next

      const team = g.teams[teamId]
      // An out-of-turn activation is the GM's call; we only track whose turn it is.
      if (!team || team.side !== g.sideTurn) return next

      // While an alliance has nothing ready, each activation banks it a Counteract.
      // With more than two sides every dry one banks, not just "the enemy".
      const dry = enemies(g, g.sideTurn).filter((e) => !teamsOf(next, e).some((t) => readyCount(next, t.id) > 0))
      const banked = dry.length
        ? {
            ...next,
            counteracts: dry.reduce((acc, e) => ({ ...acc, [e]: (next.counteracts[e] ?? 0) + 1 }), next.counteracts),
          }
        : next

      const used = g.pairUsed.includes(teamId) ? g.pairUsed : [...g.pairUsed, teamId]
      const staged = { ...banked, pairUsed: used }
      return used.length >= pairTarget(staged) ? handOff({ ...staged, pairUsed: [] }) : staged
    }
    case 'skip':
      return { ...g, turnIdx: g.turnIdx + 1 }
    case 'moveTeam': {
      const team = g.teams[a.teamId]
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
      // Iterate the live teams, not the preset list — a team the GM added mid-match
      // would otherwise vanish from `g.teams` here while its roster and ops survived.
      const teams = Object.fromEntries(
        allTeams(g).map((t) => [
          t.id,
          { ...t, cp: t.cp + (t.side === g.initiative ? g.cpPerTp.lead : g.cpPerTp.other) },
        ]),
      )
      return {
        ...g,
        tp: Math.min(g.tpCount, g.tp + 1),
        ops,
        teams,
        turnIdx: 0,
        phase: 'initiative',
        sideTurn: g.initiative,
        pairUsed: [],
        counteracts: blankBySide(g.sides, 0), // a Counteract is a this-turn opportunity
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
      // A hand-built team has no preset to go back to; resetting it empties it.
      const list = structuredClone(DEFAULT_ROSTER[a.teamId] ?? [])
      const kept = Object.fromEntries(Object.entries(g.ops).filter(([id]) => teamIdOf(g, id) !== a.teamId))
      return {
        ...g,
        roster: { ...g.roster, [a.teamId]: list },
        ops: { ...kept, ...freshOps({ [a.teamId]: list }) },
      }
    }

    /* ---------- setup ----------
     * Everything below changes who is playing, so every case ends in `normalize`.
     */
    case 'setup':
      return { ...g, setup: a.value }
    case 'sideAdd': {
      const n = g.sides.length
      const id = `side${n + 1}-${Math.random().toString(36).slice(2, 6)}`
      return recast({
        ...g,
        sides: [...g.sides, { id, name: `Alliance ${n + 1}`, color: SIDE_PALETTE[n % SIDE_PALETTE.length] }],
      })
    }
    case 'sideRemove': {
      if (g.sides.length <= 1) return g // a match needs somebody to fight
      const teams = Object.fromEntries(Object.entries(g.teams).filter(([, t]) => t.side !== a.id))
      return recast({ ...g, sides: g.sides.filter((x) => x.id !== a.id), teams })
    }
    case 'sidePatch':
      return normalize({ ...g, sides: g.sides.map((x) => (x.id === a.id ? { ...x, ...a.patch, id: x.id } : x)) })
    case 'sideMove': {
      const i = g.sides.findIndex((x) => x.id === a.id)
      const j = i + a.dir
      if (i < 0 || j < 0 || j >= g.sides.length) return g
      const sides = [...g.sides]
      ;[sides[i], sides[j]] = [sides[j], sides[i]]
      return recast({ ...g, sides })
    }
    case 'teamAdd':
      return recast({
        ...g,
        teams: { ...g.teams, [a.team.id]: a.team },
        roster: { ...g.roster, [a.team.id]: a.roster },
        ops: { ...g.ops, ...freshOps({ [a.team.id]: a.roster }) },
        order: { ...g.order, [a.team.side]: [...(g.order[a.team.side] ?? []), a.team.id] },
      })
    case 'teamRemove': {
      const { [a.teamId]: _gone, ...teams } = g.teams
      return recast({ ...g, teams })
    }
    case 'teamPatch': {
      const t = g.teams[a.teamId]
      if (!t) return g
      const next = { ...g, teams: { ...g.teams, [a.teamId]: { ...t, ...a.patch, id: t.id } } }
      // Only a change of alliance moves slots; a rename or a recolour must not rewind the turn.
      return a.patch.side && a.patch.side !== t.side ? recast(next) : normalize(next)
    }
    case 'cpPerTp': {
      const c = { ...g.cpPerTp, ...a.patch }
      return { ...g, cpPerTp: { lead: clamp(c.lead, 0, 10), other: clamp(c.other, 0, 10) } }
    }
  }
}

/* ---------- derived ---------- */

/** Every alliance but this one. There used to be exactly one; now there can be any number,
 *  so "the enemy" is a list and every rule that named it has to fold over that list. */
export const enemies = (g: Game, s: SideId) => g.sides.filter((x) => x.id !== s).map((x) => x.id)

export const sideDef = (g: Game, s: SideId) => g.sides.find((x) => x.id === s)
export const allTeams = (g: Game) => Object.values(g.teams)

/**
 * A side's team ids in activation order. Anything saved is honoured, but unknown
 * ids are dropped and missing ones appended — so adding a player to a side does
 * not require throwing away a game in progress.
 */
const orderedIds = (g: Game, s: SideId) => {
  const all = allTeams(g)
    .filter((t) => t.side === s)
    .map((t) => t.id)
  const saved = (g.order?.[s] ?? []).filter((id) => all.includes(id))
  return [...saved, ...all.filter((id) => !saved.includes(id))]
}

const sideTeams = (g: Game, s: SideId) => orderedIds(g, s).map((id) => g.teams[id])
export const teamOps = (g: Game, teamId: string) => g.roster[teamId] ?? []
export const sideOps = (g: Game, s: SideId) => sideTeams(g, s).flatMap((t) => teamOps(g, t.id))

/** Everything the side is fighting — one alliance's operatives, or several. */
const foeOps = (g: Game, s: SideId) => enemies(g, s).flatMap((e) => sideOps(g, e))

export const thresholds = (g: Game, s: SideId) => g.killOverride[s] ?? killThresholds(foeOps(g, s).length)

export const kills = (g: Game, s: SideId) => foeOps(g, s).filter((o) => g.ops[o.id]?.dead).length

export const killGrade = (g: Game, s: SideId) => thresholds(g, s).filter((t) => kills(g, s) >= t).length

export const scores = (g: Game, s: SideId) => {
  const cap = g.opCap
  const grade = killGrade(g, s)
  // Strictly better than every other alliance. A tie at the top pays nobody — with more
  // than two sides that is the only reading of "beat the enemy" that stays a single bonus.
  const beatsEnemy = g.finished && enemies(g, s).every((e) => grade > killGrade(g, e))
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

/** Markers a side holds. A plain function rather than a keyed record, because a record
 *  would need a `neutral` key — and nothing stops a GM naming an alliance "neutral". */
export const held = (g: Game, s: SideId) => g.objectives.filter((o) => o === s).length
export const heldByNobody = (g: Game) => g.objectives.filter((o) => o === null).length

/**
 * What the objective markers are worth to a side this turning point — but only for the
 * crit ops whose VP follows from marker control alone (Secure, Transmission).
 * The other seven accumulate points or track named markers, so they return null
 * and the GM uses the steppers. No crit op scores during the first turning point.
 */
export const suggestedCrit = (g: Game, s: SideId): number | null => {
  const op = CRIT_OPS.find((c) => c.id === g.critOp)
  if (!op || op.derive !== 'holders') return null
  if (g.tp < 2) return 0
  const mine = held(g, s)
  const theirs = Math.max(0, ...enemies(g, s).map((e) => held(g, e)))
  return Math.min(g.critCap, (mine > 0 ? 1 : 0) + (mine > theirs ? 1 : 0))
}

/** The alliances in turn order: whoever holds initiative first, then the rest in `sides` order. */
const turnOrder = (g: Game) => {
  const i = Math.max(0, g.sides.findIndex((x) => x.id === g.initiative))
  return g.sides.map((_, k) => g.sides[(i + k) % g.sides.length].id)
}

/**
 * Fixed rotation: initiative side first, then round-robin, one operative per slot.
 * The sides need not be the same size — it runs to the longest, so a side with an
 * extra player still gets that player a slot at the end of the cycle.
 */
export const rotation = (g: Game): TeamDef[] => {
  const lists = turnOrder(g).map((sid) => sideTeams(g, sid))
  const n = Math.max(0, ...lists.map((l) => l.length))
  return Array.from({ length: n }, (_, i) => lists.map((l) => l[i]))
    .flat()
    .filter((t): t is TeamDef => Boolean(t))
}

/** Teams on a side, in activation order — the scoreboard lays one row out per slot. */
export const teamsOf = (g: Game, s: SideId) => sideTeams(g, s)

/** Can this team still move that way within its own side's order? */
export const canMove = (g: Game, teamId: string, dir: -1 | 1) => {
  const team = g.teams[teamId]
  if (!team) return false
  const ids = orderedIds(g, team.side)
  const j = ids.indexOf(teamId) + dir
  return j >= 0 && j < ids.length
}
/** Rows the scoreboard needs — the largest side's player count. Order cannot change it. */
export const maxTeamsPerSide = (g: Game) => Math.max(1, ...g.sides.map((x) => teamsOf(g, x.id).length))

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
  const order = turnOrder(g)
  const at = Math.max(0, order.indexOf(g.sideTurn))
  for (let i = 1; i < order.length; i++) {
    const next = order[(at + i) % order.length]
    if (teamsOf(g, next).some((t) => readyCount(g, t.id) > 0)) return { ...g, sideTurn: next }
  }
  return g
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
  const ready = (x: SideId) => sideTeams(g, x).reduce((n, t) => n + readyCount(g, t.id), 0)
  const mine = ready(s)
  const theirs = enemies(g, s).reduce((n, e) => n + ready(e), 0)
  const eligible = sideOps(g, s).filter((o) => {
    const st = g.ops[o.id]
    return st && !st.dead && st.expended && st.order === 'engage'
  })
  return { available: mine === 0 && theirs > 0, eligible }
}

/* ---------- persistence ---------- */

const KEY = 'killteam-gm/v14' // bump when the shape changes; old saves are ignored
const ROOM_KEY = 'killteam-gm/room' // the GM's { code, token }; viewers read the URL instead

/* ---------- rooms ---------- */

/**
 * The relay. Hard-coded default rather than a required build variable, because this app is
 * hard-wired to one match on one domain anyway — and because the old `''` fallback failed
 * silently and expensively: it made the console POST `/rooms` to its own origin, where the
 * asset Worker answers `index.html` with HTTP 200, so `res.json()` threw on HTML and the UI
 * just said "offline". Twice. Local dev overrides it (see the command in CLAUDE.md).
 */
export const API = import.meta.env.VITE_API_URL ?? 'https://kt-api.ydothien.work'

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

/* ---------- undo ---------- */

const UNDO_DEPTH = 50

/** `undo` never reaches `reduce` — the reducer stays a pure Game -> Game and the whole
 *  history lives in the hook, out of localStorage and out of the relay. */
export type UiAction = Action | { type: 'undo' }

export type History = { past: Game[]; now: Game; last?: string }

/** Keystroke-level actions coalesce, or typing one player name eats the whole stack. */
const COALESCE = new Set(['player', 'tacOp', 'teamPatch', 'sidePatch'])
// Keyed per subject, so editing two different teams (or sides) never merges into one step.
const stepKey = (a: Action) =>
  'teamId' in a ? `${a.type}:${a.teamId}` : 'id' in a ? `${a.type}:${a.id}` : a.type

export const withHistory = (h: History, a: UiAction): History => {
  if (a.type === 'undo') return h.past.length ? { past: h.past.slice(0, -1), now: h.past[h.past.length - 1] } : h

  const now = reduce(h.now, a)
  if (now === h.now) return h
  // A loaded save (or a viewer's relay message) is a new starting point, not a step back to.
  if (a.type === 'replace') return { past: [], now }

  const key = stepKey(a)
  const merge = COALESCE.has(a.type) && h.last === key
  return { past: merge ? h.past : [...h.past, h.now].slice(-UNDO_DEPTH), now, last: key }
}

export function useGame() {
  const [hist, dispatch] = useReducer(withHistory, null, () => {
    const saved = read<Game>(KEY)
    return { past: [], now: saved ? { ...initialGame(), ...saved } : initialGame() }
  })
  const game = hist.now
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

  // Ctrl/Cmd+Z, except while a text field has focus — the browser's own undo belongs there.
  useEffect(() => {
    if (viewer) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z' || tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      dispatch({ type: 'undo' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewer])

  return [game, dispatch, { room, viewer, setRoom }, hist.past.length > 0] as const
}

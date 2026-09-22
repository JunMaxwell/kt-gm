import { useCallback, useEffect, useReducer, useRef, useState } from 'react'

import {
  CP_PER_TP,
  CRIT_CAP_PER_TP,
  CRIT_OPS,
  type CritOpId,
  DEFAULT_ROSTER,
  GEAR_LIMIT,
  INJURY_IGNORES,
  gearBonus,
  OBJECTIVE_MARKERS,
  OP_CAP,
  type OpKind,
  type OwnCard,
  type Operative,
  type Order,
  PRESET_SIDES,
  PRESET_TEAMS,
  SIDE_PALETTE,
  STARTING_CP,
  type SideDef,
  type SideId,
  type TeamDef,
  TURNING_POINTS,
  killThresholds,
  aplAfter,
  grantedIgnore,
  killWorth,
  moveAfter,
  rollAfter,
} from './rules'
import type { Fx, PhaseId, RefKind, Weapon } from './compendium'
import { cardFx } from './fx'

// `Order` moved to rules.ts, because `Operative.lockOrder` needs it. Re-exported so the
// panels that `import type { Order } from '../state'` keep working.
export type { Order }

export type OpState = {
  hp: number
  /** Activations spent this turning point. Absent means none. `expended` stays the thing
   *  everything else reads — this only exists so an operative can activate more than once. */
  used?: number
  expended: boolean
  dead: boolean
  order: Order
  /** This operative ignores the Injured penalty. Seeded from `INJURY_IGNORES` for the four
   *  operatives whose rule is flat and unconditional, and a GM toggle otherwise — the rest of
   *  the library's injury-ignoring rules are auras ("within 6\" of this operative") or optional
   *  ("you can ignore"), and this app has no board and does not make the player's choices. */
  tough?: boolean
}
/** Kept as an alias: `TeamDef` absorbed it when teams became runtime data. */
export type PlayerState = TeamDef

/**
 * Where the GM is in the flow. This replaced a `setup: boolean` that only ever chose between
 * one 451-line panel stack and the board — there was no start, no finish, and no "a game".
 *
 * `rooms` is a stage rather than device state on purpose: as a stage, every button that
 * reaches it is an ordinary `dispatch`, where device state would have to thread a setter
 * through `Net` to `TurnBar` and `RoomBar`. It costs a meaningless `stage: 'rooms'` in the
 * odd relay snapshot, which no spectator reads — `net.viewer` wins in `App` before any stage
 * is consulted. The same free ride `phase` got.
 */
export type Stage = 'rooms' | 'alliances' | 'teams' | 'config' | 'tacops' | 'play' | 'end'

/** The wizard steps, in order — the rail, the Back/Next cursor and the escape-hatch menu. */
export const STEPS: Stage[] = ['alliances', 'teams', 'config', 'tacops']

/**
 * Something that is true right now and was not true when the card was printed: a ploy in effect,
 * a Stun, a house call the GM made.
 *
 * **The numbers are stated, never inferred.** There is no structured meaning behind any of the
 * app's 774 cards — they are prose extracted from PDFs — so nothing here can work out that
 * Kau'yon grants +1 APL. Whoever applies the effect says what it does; the app remembers it,
 * shows it on the right cards, and expires it. That division is the whole design: no rules
 * engine, ever.
 *
 * `text` is copied off the card rather than looked up, because the reducer has no faction data
 * and a phone reading this may never load that faction's chunk.
 */
export type Effect = {
  id: string
  label: string // 'Kau'yon', or whatever was typed
  text?: string // the card's own prose, so the phone can show what it actually says
  kind?: RefKind // badges it as a strategy / firefight ploy
  teamId: string
  opId?: string // narrowed to one operative; absent means the whole team
  /** What it does, from `src/fx/` when it came from a card and from the GM's form otherwise.
   *  A list because one card often does several things — *Sting* improves a named weapon's Hit
   *  AND grants it two rules. An empty list is normal and common: most ploys resolve as a dice
   *  re-roll or a free action, and then the card's own `text` is the whole of the effect. */
  fx: Fx[]
  until: 'activation' | 'tp' | 'battle'
}

export type Game = {
  stage: Stage // which view the GM is on; see `Stage`
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
  /** Is the players' draft open? Closes on its own when the match starts; the GM reopens it
   *  from the header. Lives on `Game`, not on a device, because it has to reach seven phones. */
  picks: boolean
  /** What is in effect right now. On `Game`, so it reaches all seven phones for free — the
   *  whole snapshot is already relayed and `replace` merges over `initialGame()`. */
  effects: Effect[]
}

/** Everyone starts Concealed, except an operative a rule forbids it to. */
const startOrder = (o: Operative): Order => o.lockOrder ?? 'conceal'

const freshOps = (roster: Record<string, Operative[]>) =>
  Object.fromEntries(
    Object.values(roster)
      .flat()
      .map((o) => [o.id, { hp: o.w, used: 0, expended: false, dead: false, order: startOrder(o) }]),
  )

export const initialGame = (): Game => {
  const roster = structuredClone(DEFAULT_ROSTER)
  return {
    stage: 'play',
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
    // `opLimit` from the roster it ships with, so every preset team's draft limit is its own
    // legal size (5/6/9/10/7/11) without the GM setting a single number.
    teams: Object.fromEntries(
      PRESET_TEAMS.map((t) => [
        t.id,
        { ...t, cp: STARTING_CP, tacOp: '', tacVp: 0, opLimit: roster[t.id]?.length ?? 0 },
      ]),
    ),
    turnIdx: 0,
    picks: true,
    effects: [],
  }
}

/** Two empty alliances, and nothing else. Step 1 of the wizard opens here.
 *
 *  NOT zero alliances: `normalize` materialises an "Alliance 1" out of an empty list, and it
 *  runs on every setup edit and on every `replace` — so `sides: []` would sprout a phantom
 *  alliance on the first click or the first relay round-trip. Two is the floor `normalize`
 *  already believes in, and it gives step 1 something to rename rather than a blank page.
 *
 *  Built from `initialGame()` through `recast` so its shape cannot drift from `Game`: `recast`
 *  drops the preset rosters and ops, rebuilds all five per-side records and re-homes
 *  `initiative`/`sideTurn`. */
const BLANK_SIDES: SideDef[] = [
  { id: 'side1', name: 'Alliance 1', color: SIDE_PALETTE[0] },
  { id: 'side2', name: 'Alliance 2', color: SIDE_PALETTE[1] },
]

export const blankGame = (): Game =>
  recast({ ...initialGame(), stage: 'alliances', sides: structuredClone(BLANK_SIDES), teams: {} })

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
  | { type: 'tough'; opId: string; value: boolean }
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
  // --- the player's draft. The first three are the ONLY actions a phone may ask for; see
  //     `PLAYER_ASKS`. `picks` is the GM's gate over them and is never asked for. ---
  | { type: 'claim'; teamId: string; name: string; from?: string }
  | { type: 'setRoster'; teamId: string; ops: Operative[] }
  | { type: 'gear'; teamId: string; names: string[] }
  | { type: 'picks'; value: boolean }
  // --- what is in effect. `cost` spends CP, which is what makes one of these "use a ploy". ---
  | { type: 'effectAdd'; effect: Omit<Effect, 'id'>; cost?: number }
  | { type: 'effectRemove'; id: string }
  // --- setup: the match itself is editable, so these change who is playing ---
  | { type: 'stage'; value: Stage }
  | { type: 'sideAdd' }
  | { type: 'sideRemove'; id: SideId }
  | { type: 'sidePatch'; id: SideId; patch: Partial<SideDef> }
  | { type: 'sideMove'; id: SideId; dir: -1 | 1 }
  | { type: 'teamAdd'; team: TeamDef; roster: Operative[] }
  | { type: 'teamRemove'; teamId: string }
  | { type: 'teamPatch'; teamId: string; patch: Partial<TeamDef> }
  | { type: 'cpPerTp'; patch: Partial<{ lead: number; other: number }> }
  // --- GM-authored cards: the only way to put a boss's rules on a player's phone ---
  | { type: 'cardAdd'; teamId: string; kind: RefKind }
  | { type: 'cardPatch'; teamId: string; cardId: string; patch: Partial<Omit<OwnCard, 'id'>> }
  | { type: 'cardRemove'; teamId: string; cardId: string }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const findOp = (g: Game, opId: string) =>
  Object.values(g.roster)
    .flat()
    .find((o) => o.id === opId)

/** Which team owns an operative. A real lookup, because op ids come in four shapes and `dw` is
 *  a prefix of `dw2` — `id.startsWith(teamId)` is ambiguous. */
export const teamIdOf = (g: Game, opId: string) =>
  Object.keys(g.roster).find((tid) => g.roster[tid].some((o) => o.id === opId))

/** The operative itself, not its live state. `g.ops` is keyed by id but holds only OpState. */
export const opById = (g: Game, opId: string): Operative | undefined =>
  Object.values(g.roster)
    .flat()
    .find((o) => o.id === opId)

/** Whether a rule forbids this operative that order. See `Operative.lockOrder`. */
const lockedAgainst = (g: Game, opId: string, value: Order) => {
  const lock = opById(g, opId)?.lockOrder
  return !!lock && lock !== value
}

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
    // An effect belongs to a team and sometimes to one operative. Both can be deleted under it,
    // and `liveStats` sums whatever it finds — so a dangling one would keep buffing nothing, or
    // worse, a re-minted id that happens to match.
    effects: (g.effects ?? []).filter((e) => ids.has(e.teamId) && (!e.opId || keep.has(e.opId))),
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
    // "New game" is reset now. The preset seven-team match is a button on step 1 instead —
    // a `replace` over `initialGame()`, which already clears the undo stack.
    case 'reset':
      return blankGame()
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
      // Almost every operative activates once, so `used` tracks the same bit `expended` did.
      // An operative with `acts: 2` stays ready until it has spent both, which is the only way
      // a boss's "activates twice" can be true in the app rather than in the GM's head.
      const acts = Math.max(1, findOp(g, a.opId)?.acts ?? 1)
      const spent = clamp((o.used ?? 0) + (spending ? 1 : -1), 0, acts)
      // Activating *is* the Firefight phase, so the GM never has to announce that one by hand.
      // Every path below spreads `next`, so setting it here covers all of them.
      //
      // It is also what closes the players' draft, and the trigger is here rather than on
      // `stage: 'play'` for a reason that cost a round: the GM steps onto the board constantly
      // during setup — to check the scoreboard, to read the counteract banners, to hand out the
      // room link that is printed there — and closing the draft then locks seven phones out
      // before anybody has drafted. The FIRST ACTIVATION is when a roster change actually
      // becomes dangerous, and it is unambiguous. Reopening is still the GM's header toggle.
      const next = {
        ...g,
        phase: spending ? ('firefight' as const) : g.phase,
        picks: g.picks && !spending,
        ops: { ...g.ops, [a.opId]: { ...o, used: spent, expended: spent >= acts } },
        // "Until the end of its next activation" is the commonest duration in the game, and this
        // is the end of it. Only the ones aimed at THIS operative — an `activation` effect with
        // no target has nothing to hang off, so it waits for the turning point.
        effects: spending ? g.effects.filter((e) => !(e.until === 'activation' && e.opId === a.opId)) : g.effects,
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
    // "This one ignores the Injured penalty." A toggle rather than a lookup because the rules
    // that grant it are mostly auras or optional — see `INJURY_IGNORES`.
    case 'tough': {
      const o = g.ops[a.opId]
      if (!o) return g
      return { ...g, ops: { ...g.ops, [a.opId]: { ...o, tough: a.value } } }
    }
    case 'order': {
      // A locked operative does not move. The GM is the referee everywhere else in this app,
      // but this is a stat on the datacard, not a call — and a boss silently sitting on
      // Conceal after a mis-tap would quietly bar it from counteracting.
      if (lockedAgainst(g, a.opId, a.value)) return g
      const o = g.ops[a.opId]
      return { ...g, ops: { ...g.ops, [a.opId]: { ...o, order: a.value } } }
    }
    case 'teamOrder': {
      const ops = { ...g.ops }
      for (const o of teamOps(g, a.teamId)) {
        if (ops[o.id].dead || (o.lockOrder && o.lockOrder !== a.value)) continue
        ops[o.id] = { ...ops[o.id], order: a.value }
      }
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
      const ops = Object.fromEntries(Object.entries(g.ops).map(([id, o]) => [id, { ...o, used: 0, expended: false }]))
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
        // Everything but 'battle' is over. Same tradition as the two lines above it.
        effects: g.effects.filter((e) => e.until === 'battle'),
      }
    }
    // One action, so "End battle" stays one undo step. `finished` is NOT derived from
    // `stage === 'end'`: the escape hatch lets the GM step off the end screen to fix a dial,
    // and deriving it would silently revoke the +1 kill bonus in the scoreboard he is reading.
    case 'finish':
      return { ...g, finished: a.finished, stage: a.finished ? 'end' : 'play' }

    /* ---------- roster editing ---------- */
    case 'addOp':
      return {
        ...g,
        roster: { ...g.roster, [a.teamId]: [...g.roster[a.teamId], a.op] },
        ops: { ...g.ops, [a.op.id]: { hp: a.op.w, used: 0, expended: false, dead: false, order: startOrder(a.op) } },
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

    /* ---------- the player's draft ----------
     * Three actions a phone may ask for, applied by the GM's client after the `PLAYER_ASKS`
     * whitelist. Like the roster cases above they manage `g.ops` by hand rather than calling
     * `normalize` — nothing here changes the cast of alliances or teams.
     */

    // NOT gated on `picks`: a late arrival still has to tell the GM who they are, even once the
    // draft has closed. Releasing the old team is part of the same step, so switching teams is
    // atomic and costs one undo, and a phone can never hold two claims.
    //
    // An empty name IS the release — the same action both ways, because the two always happen
    // together and splitting them would let a phone drop one half. The label survives a release:
    // the GM typed "Player 3" there once and may want it back, and a blank team card tells him
    // less than a stale name does.
    case 'claim': {
      const teams = { ...g.teams }
      if (a.from && teams[a.from]) teams[a.from] = { ...teams[a.from], claimed: false }
      const team = teams[a.teamId]
      if (!team) return { ...g, teams }
      teams[a.teamId] = a.name
        ? { ...team, player: a.name, claimed: true }
        : { ...team, claimed: false }
      return { ...g, teams }
    }

    // The player's picks ARE the roster, so this is `resetRoster` with the list supplied.
    // The one addition: an operative that survives the change keeps its OpState. The GM can
    // reopen the draft mid-match, and re-picking must not heal the whole team.
    case 'setRoster': {
      if (!g.picks) return g
      const kept = Object.fromEntries(Object.entries(g.ops).filter(([id]) => teamIdOf(g, id) !== a.teamId))
      const survivors = Object.fromEntries(
        a.ops.filter((o) => g.ops[o.id]).map((o) => [o.id, g.ops[o.id]]),
      )
      // Freeze the pool on the first draft, and only then. An uncurated pool falls back to the
      // team's ROSTER — which this action is about to overwrite with the player's picks — so
      // without this, dropping an operative deletes it from the very list it could be picked
      // back from. A one-way ratchet: 11 Kommandos to 4, and never up again.
      //
      // The roster is captured BEFORE the replacement, so the pool holds the full starting
      // eleven for good and the GM's Setup panel stays a list he removes from. Skipped when the
      // roster is empty, because that pool falls through to the faction's own datacards
      // instead, and that tier is derived from the faction and cannot shrink.
      const team = g.teams[a.teamId]
      const teams =
        team && !team.pool && g.roster[a.teamId]?.length
          ? { ...g.teams, [a.teamId]: { ...team, pool: g.roster[a.teamId] } }
          : g.teams
      // Clamped here as well as in the UI, exactly as `gear` is: the GM's limit is the rule, and
      // the ask arrives over a network from a phone that may be showing a stale one. `||`, not
      // `??` — a limit of 0 means "never set", which is how a team added from the library starts.
      const ops = a.ops.slice(0, team?.opLimit || a.ops.length)
      return {
        ...g,
        teams,
        roster: { ...g.roster, [a.teamId]: ops },
        ops: { ...kept, ...freshOps({ [a.teamId]: ops }), ...survivors },
      }
    }

    case 'gear': {
      const team = g.teams[a.teamId]
      if (!g.picks || !team) return g
      // Clamped here as well as in the UI: the limit is the rule, and the ask arrives over a
      // network from a phone that may be showing a stale one.
      return {
        ...g,
        teams: { ...g.teams, [a.teamId]: { ...team, gear: a.names.slice(0, gearAllowance(g, a.teamId)) } },
      }
    }

    case 'picks':
      return { ...g, picks: a.value }

    // One action for "use a ploy" and for "note an effect", because they differ only by whether
    // CP changes hands. The id is minted here, the way `cardAdd` mints a card's.
    case 'effectAdd': {
      const team = g.teams[a.effect.teamId]
      if (!team) return g
      const teams = a.cost
        ? { ...g.teams, [a.effect.teamId]: { ...team, cp: Math.max(0, team.cp - a.cost) } }
        : g.teams
      return { ...g, teams, effects: [...g.effects, { ...a.effect, id: `e-${crypto.randomUUID().slice(0, 8)}` }] }
    }
    // Removing does NOT refund. A ploy that was used was used; the GM has a CP stepper for a
    // genuine mistake, and undo for the rest.
    case 'effectRemove':
      return { ...g, effects: g.effects.filter((e) => e.id !== a.id) }

    /* ---------- setup ----------
     * Everything below changes who is playing, so every case ends in `normalize`.
     */
    case 'stage':
      return { ...g, stage: a.value }
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
    case 'cardAdd': {
      const t = g.teams[a.teamId]
      if (!t) return g
      const card: OwnCard = { id: `c-${crypto.randomUUID().slice(0, 8)}`, kind: a.kind, name: 'New card', text: '' }
      return { ...g, teams: { ...g.teams, [a.teamId]: { ...t, cards: [...(t.cards ?? []), card] } } }
    }
    case 'cardPatch': {
      const t = g.teams[a.teamId]
      if (!t) return g
      const cards = (t.cards ?? []).map((c) => (c.id === a.cardId ? { ...c, ...a.patch, id: c.id } : c))
      return { ...g, teams: { ...g.teams, [a.teamId]: { ...t, cards } } }
    }
    case 'cardRemove': {
      const t = g.teams[a.teamId]
      if (!t) return g
      return { ...g, teams: { ...g.teams, [a.teamId]: { ...t, cards: (t.cards ?? []).filter((c) => c.id !== a.cardId) } } }
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

/**
 * How many equipment cards a team may take: the GM's number, plus whatever the operatives it
 * actually FIELDED bring with them — the Deathwatch Watch Sergeant's *Adaptable Armoury* and
 * the three others like it. Off the roster, not the pool: a Watch Sergeant you did not take
 * grants nothing.
 *
 * `gearBonus` matches on name, so this needs no faction chunk loaded and the reducer can use it.
 */
export const gearAllowance = (g: Game, teamId: string) =>
  (g.teams[teamId]?.gearLimit ?? GEAR_LIMIT) + gearBonus(teamOps(g, teamId))

/** Below half starting wounds: −2" Move and −1 to the weapon's Hit stat. Not an APL penalty. */
export const injured = (o: Operative, st: OpState) => !st.dead && st.hp * 2 < o.w

/** How much of the Injured penalty actually lands on this operative: the GM's toggle, its own
 *  datacard rule, or one a team-mate grants the whole roster. */
const ignores = (g: Game, o: Operative, st?: OpState, from: Effect[] = []) => {
  // A card's `tough` counts only when it is unconditional — a conditional one is a rider.
  if (st?.tough || from.some((e) => e.fx.some((f) => f.tough && !f.when && !f.scope))) return 'all'
  const own = INJURY_IGNORES[o.name.replace(/ \d+$/, '')]
  if (own) return own
  // The Fenrisian Wolf is excluded from its own team's grant, and the card says so.
  if (/Fenrisian Wolf/i.test(o.name)) return undefined
  return grantedIgnore(teamOps(g, teamIdOf(g, o.id) ?? ''))
}

/**
 * What this operative ACTUALLY rolls, as opposed to what its datacard prints.
 *
 * One function, because there are three places that render a stat — the phone's card, the GM's
 * team row, and the printable glossary — and before this each of them printed the raw datacard
 * while the app knew perfectly well the operative was injured and said so in prose right
 * underneath. The glossary keeps printing the printed card on purpose; the other two come here.
 *
 * `hit` is a function rather than a value because the penalty lands on each WEAPON's Hit stat,
 * and an operative has up to nine of them.
 *
 * Takes the whole game because stage 2 folds ploy effects in here too — the floors in
 * `moveAfter`/`aplAfter` are the reason this is one place and not three.
 *
 * NOT called `live`: `RefCardView.live` already means "belongs to the current phase" and
 * `Compendium` has a local `live` meaning "the open deck". A third meaning of one word in one
 * render path is how you get a bug nobody can see.
 */
export type Live = {
  apl: number
  move: string
  save: string
  hit: (w: Weapon) => string
  /** Below half wounds. True even when something is ignoring the penalty — the wound bar and
   *  the badge both want to know, and `ignoring` says whether the numbers actually moved. */
  hurt: boolean
  /** What is being ignored, and absent when nothing is. `'weapons'` is Angron's *Implacable*:
   *  he keeps HIT 3+ and still loses the 2". */
  ignoring?: 'all' | 'weapons'
  /** Weapon rules applied to every weapon, already split and deduped. */
  adds: string[]
  /** The effects in play on this operative, for a card that wants to explain itself. */
  from: Effect[]
  /** Everything that could NOT be folded into the numbers: conditional, or scoped to weapons
   *  the app cannot identify. Printed under the weapon table with its scope and trigger named,
   *  so the player applies it themselves rather than the app guessing. */
  riders: { label: string; fx: Fx }[]
}

/** Equipment the team took is always on, so its effects need no `Effect` record at all. */
const gearFx = (g: Game, teamId: string): { label: string; fx: Fx }[] => {
  const team = g.teams[teamId]
  return (team?.gear ?? []).flatMap((name) =>
    cardFx(team?.faction, name).map((fx) => ({ label: name, fx })),
  )
}

/** Every effect landing on this operative: its team's, plus the ones aimed at it by name. */
export const effectsOn = (g: Game, opId: string) => {
  const teamId = teamIdOf(g, opId)
  return g.effects.filter((e) => e.teamId === teamId && (!e.opId || e.opId === opId))
}

/**
 * Every effect on a team, whoever it is aimed at — for the "in effect" banner.
 *
 * Heals at read time rather than storing the invariant: the roster cases (`setRoster`,
 * `removeOp`, `resetRoster`) deliberately bypass `normalize` and manage `g.ops` by hand, so an
 * effect aimed at an operative the player has just dropped would otherwise sit in the banner
 * naming a model that is not on the table. `effectsOn` can never match it anyway. Same trade as
 * `orderedIds` and `pairUsed` — fewer stored invariants, fewer things to drift.
 */
export const effectsFor = (g: Game, teamId: string) =>
  g.effects.filter((e) => e.teamId === teamId && (!e.opId || !!g.ops[e.opId]))

export const liveStats = (g: Game, o: Operative, st?: OpState): Live => {
  const from = effectsOn(g, o.id)
  const hurt = !!st && injured(o, st)
  const skip = ignores(g, o, st, from)
  // Injured is −2" Move and −1 to the weapons' Hit stat. Never APL, and never Save.
  const slowed = hurt && skip !== 'all'
  const missing = hurt && !skip
  // Ploys and GM calls, plus the gear the team is carrying — which is simply always on.
  const all = [...from.flatMap((e) => e.fx.map((fx) => ({ label: e.label, fx }))), ...gearFx(g, teamIdOf(g, o.id) ?? '')]
  // A modifier moves the numbers only when it is unconditional AND applies to every weapon.
  // Anything else is printed as a rider, because this app has no board, no dice and no way to
  // tell a melee weapon from a ranged one.
  const on = all.filter((x) => !x.fx.when && !x.fx.scope).map((x) => x.fx)
  const riders = all.filter((x) => x.fx.when || x.fx.scope)

  const sum = (k: 'apl' | 'move' | 'hit' | 'save') => on.reduce((n, f) => n + (f[k] ?? 0), 0)
  // Positive IMPROVES a roll stat in an effect and WORSENS it in `rollAfter`. One negation, here.
  const adds = [...new Set(on.flatMap((f) => (f.rules ?? '').split(',').map((r) => r.trim()).filter(Boolean)))]

  return {
    apl: aplAfter(o.apl, sum('apl')),
    move: moveAfter(o.move, (slowed ? -2 : 0) + sum('move')),
    save: rollAfter(o.save, -sum('save')),
    hit: (w: Weapon) => rollAfter(w.hit, (missing ? 1 : 0) - sum('hit')),
    hurt,
    ignoring: hurt ? skip : undefined,
    adds,
    from,
    riders,
  }
}
export const sideOps = (g: Game, s: SideId) => sideTeams(g, s).flatMap((t) => teamOps(g, t.id))

/** Everything the side is fighting — one alliance's operatives, or several. */
const foeOps = (g: Game, s: SideId) => enemies(g, s).flatMap((e) => sideOps(g, e))

/** What a side is worth in kills: one per operative, more for a boss. */
export const killValue = (ops: Operative[]) => ops.reduce((n, o) => n + killWorth(o), 0)

export const thresholds = (g: Game, s: SideId) => g.killOverride[s] ?? killThresholds(killValue(foeOps(g, s)))

export const kills = (g: Game, s: SideId) => killValue(foeOps(g, s).filter((o) => g.ops[o.id]?.dead))

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

// Bump when the shape changes; old saves are ignored rather than migrated.
// One game PER ROOM, so switching back to an old room restores it with no network at all.
// `local` is the no-room fallback — if `POST /rooms` fails the GM still gets a game, because
// the relay is never a prerequisite for starting one.
const gameKey = (code = 'local') => `killteam-gm/v20/${code}`
const ROOM_KEY = 'killteam-gm/room' // the room this device is CURRENTLY in
const ROOMS_KEY = 'killteam-gm/rooms' // every room this device knows, newest first

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
export type Room = { code: string; token?: string; at?: number }
export type SaveMeta = { id: string; label: string; saved_at: string }

const read = <T,>(key: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

/** `#/r/ABCD` is a spectator; `#/g/ABCD/<uuid>` carries the write token. */
const HASH = /^#\/(r|g)\/([A-Z0-9]{4})(?:\/([0-9a-f-]{36}))?$/

/** Pure, so the launcher can run it on a *pasted* link without navigating. `readRoom` is a
 *  lazy `useState` initialiser with no `hashchange` listener, so a paste must reach `setRoom`
 *  directly rather than going through the address bar. */
export const parseHash = (hash: string): Room | null => {
  const m = hash.match(HASH)
  return m ? (m[1] === 'g' && m[3] ? { code: m[2], token: m[3] } : { code: m[2] }) : null
}

export const knownRooms = (): Room[] => read<Room[]>(ROOMS_KEY) ?? []

/** Remember a room without losing the ones before it. `createRoom` used to overwrite the one
 *  slot, which orphaned the previous room's token forever — and the token is the only thing
 *  that can ever read that room's saves again. */
export const rememberRoom = (room: Room) => {
  const list = knownRooms().filter((r) => r.code !== room.code)
  localStorage.setItem(ROOMS_KEY, JSON.stringify([{ ...room, at: Date.now() }, ...list].slice(0, 20)))
  localStorage.setItem(ROOM_KEY, JSON.stringify(room))
}

export const forgetRoom = (code: string) => {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(knownRooms().filter((r) => r.code !== code)))
  localStorage.removeItem(gameKey(code))
  if (read<Room>(ROOM_KEY)?.code === code) localStorage.removeItem(ROOM_KEY)
}

/** The game this device has stored for a room, if any. The launcher labels its rows from it. */
export const roomGame = (code: string) => read<Game>(gameKey(code))

const readRoom = (): Room | null => {
  const fromUrl = parseHash(location.hash)
  if (!fromUrl) return read<Room>(ROOM_KEY)
  // A spectator's hash STAYS — it is what makes them a spectator on reload.
  if (!fromUrl.token) return fromUrl
  // A GM link's does not. The realistic leak is not Referer (fragments are never sent); it is
  // the GM copying the address bar to share the match, or projecting it, and handing seven
  // people write access. `rememberRoom` has already persisted it, so a reload still lands here.
  rememberRoom(fromUrl)
  history.replaceState(null, '', location.pathname + location.search)
  return fromUrl
}

/** The spectator link. With a team id it lands that phone straight on that team's cards, so a
 *  new player never meets the picker — note the param goes BEFORE the hash, because
 *  `location.search` is only what precedes it. `Viewer` reads it through `meInUrl`. */
export const viewerUrl = (code: string, me = '') =>
  `${location.origin}${location.pathname}${me ? `?me=${encodeURIComponent(me)}` : ''}#/r/${code}`
export const gmUrl = (r: Room) => `${location.origin}${location.pathname}#/g/${r.code}/${r.token}`

/** Throws on a non-2xx. A 401 body is valid JSON, so without this `loadSave` returns
 *  `{error:'bad token'}` as if it were a Game and `listSaves` hands the UI a non-array to
 *  `.map`. Every existing caller already tolerates a throw. */
const api = async (path: string, token: string, init: RequestInit = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...init.headers },
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res
}

export const createRoom = async (): Promise<Room> => {
  const res = await fetch(`${API}/rooms`, { method: 'POST' })
  if (!res.ok) throw new Error(`/rooms -> ${res.status}`)
  const room = (await res.json()) as Room
  rememberRoom(room)
  return room
}

export const listSaves = async (r: Room): Promise<SaveMeta[]> =>
  r.token ? await (await api(`/rooms/${r.code}/saves`, r.token)).json() : []

export const saveMatch = (r: Room, label: string, game: Game) =>
  api(`/rooms/${r.code}/saves`, r.token!, { method: 'POST', body: JSON.stringify({ label, game }) })

export const loadSave = async (r: Room, id: string): Promise<Game> =>
  await (await api(`/rooms/${r.code}/saves/${id}`, r.token!)).json()

/**
 * The game for a room this device does not have: the live snapshot, else the newest save,
 * else nothing.
 *
 * Be honest about the hit rate — `live` on the relay is an in-memory Map lost on every
 * redeploy and never re-seeded until the owning GM's next tap, so **the save fallback is the
 * normal path after a restart**, not an edge case. And a room nobody ever clicked "Save match"
 * on has nothing anywhere; `null` means exactly that, and the launcher says so rather than
 * inventing a third store.
 *
 * A dead relay throws out of `listSaves`, which is what lets the caller distinguish
 * "offline" from "nothing to resume".
 */
export const resume = async (r: Room): Promise<Game | null> => {
  const snapshot = await api(`/rooms/${r.code}/state`, r.token!)
    .then((x) => x.json() as Promise<Game>)
    .catch(() => null)
  if (snapshot) return snapshot
  const [newest] = await listSaves(r)
  return newest ? await loadSave(r, newest.id) : null
}

/* ---------- export / import ---------- */

/**
 * A match as a file. The third way out, beside the relay (live, in memory) and "Save match"
 * (Postgres, room-scoped): this one needs no server at all and crosses origins, which the
 * other two cannot — localStorage is per-origin, so the deployed copy and localhost keep
 * entirely separate games and a save made on one is invisible to the other.
 *
 * `Blob` + `<a download>` rather than a library: a `Game` is already a serialisable blob, and
 * `replace` already merges one over `initialGame()` exactly like a localStorage load.
 */
export const matchFilename = (g: Game) => {
  const who = g.sides.map((x) => x.name).join('-v-') || 'match'
  const when = new Date().toISOString().slice(0, 10)
  const where = g.stage === 'end' ? 'final' : `tp${g.tp}`
  return `killteam-${who}-${where}-${when}.json`.replace(/[^\w.-]+/g, '-').toLowerCase()
}

export const exportGame = (g: Game) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(g, null, 2)], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: matchFilename(g) })
  a.click()
  // Revoking immediately can race the download in some browsers; a tick is enough and the
  // object is small anyway.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * A match file from anywhere — another device, a chat message, an old backup. That makes it a
 * TRUST BOUNDARY, so the shape is checked before it reaches the reducer.
 *
 * `replace` merges over `initialGame()`, which fills in anything *missing*, and `normalize`
 * repairs anything dangling. Neither survives a field of the wrong TYPE: `sides: "hello"` has
 * a `.length` and then explodes on `.map`. These three checks are what stand between a bad
 * file and a white screen.
 */
export const importGame = async (file: File): Promise<Game> => {
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    throw new Error('that file is not JSON')
  }
  const g = raw as Partial<Game>
  if (!g || typeof g !== 'object' || Array.isArray(g)) throw new Error('that file is not a match')
  if (!Array.isArray(g.sides)) throw new Error('no alliances in that file — is it a match export?')
  if (!g.teams || typeof g.teams !== 'object' || Array.isArray(g.teams))
    throw new Error('no teams in that file — is it a match export?')
  return g as Game
}

/* ---------- undo ---------- */

const UNDO_DEPTH = 50

/** `undo` never reaches `reduce` — the reducer stays a pure Game -> Game and the whole
 *  history lives in the hook, out of localStorage and out of the relay. */
export type UiAction = Action | { type: 'undo' }

export type History = { past: Game[]; now: Game; last?: string }

/** Keystroke-level actions coalesce, or typing one player name eats the whole stack. */
const COALESCE = new Set(['player', 'tacOp', 'teamPatch', 'sidePatch', 'cardPatch'])
// Keyed per subject, so editing two different teams (or sides) never merges into one step.
// Every id the action carries is part of the key: `cardPatch` has BOTH a teamId and a cardId,
// and keying on teamId alone would collapse edits to two different cards into one undo step.
const stepKey = (a: Action) =>
  [a.type, 'teamId' in a ? a.teamId : '', 'cardId' in a ? a.cardId : '', 'id' in a ? a.id : ''].join(':')

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

/**
 * The only actions a player's phone may ask the GM to run.
 *
 * This set IS the security boundary. The room code is the only secret there is — anyone who can
 * open the spectator link can open a socket and send a frame — so the GM validates by action
 * type and applies nothing else. All three are scoped to one team, and none of them can reach
 * VP, wounds, initiative or the turn cursor.
 *
 * `effectAdd` and `effectRemove` are the loosest two: a phone can name any team and any numbers,
 * where the other three are inert outside the sender's own team. That is deliberate and cheap —
 * every effect is listed, by team, on the GM's console and on all seven phones, and the GM can
 * drop any of them in one tap. An audit trail beats a permission model for seven friends.
 *
 * ponytail: type-level whitelist over a shared code. Sign each ask with a per-player token if
 * this ever guards something that matters.
 */
const PLAYER_ASKS = new Set(['claim', 'setRoster', 'gear', 'effectAdd', 'effectRemove'])

export function useGame() {
  // Above the reducer, because the reducer's lazy initialiser now needs the room to pick its
  // storage key. Switching rooms afterwards is NOT a re-init — the launcher dispatches an
  // explicit `replace` with whatever it resolved.
  const [room, setRoom] = useState(readRoom)
  const [hist, dispatch] = useReducer(withHistory, room, (r) => {
    const saved = read<Game>(gameKey(r?.code))
    // No stored game at all means a fresh device: start at the launcher, not on an empty board.
    const fresh: Game = { ...blankGame(), stage: 'rooms' }
    return { past: [], now: saved ? { ...initialGame(), ...saved } : fresh }
  })
  const game = hist.now
  const viewer = !!room && !room.token
  const sock = useRef<WebSocket | null>(null)

  /** Ask the GM to run an action. The player's only write path; see `PLAYER_ASKS`.
   *  Returns false when there is no open socket, which is the caller's cue to say so — an ask
   *  into a closed socket is silent, and a player tapping Done deserves to know it went nowhere. */
  const ask = useCallback((a: Action) => {
    if (sock.current?.readyState !== WebSocket.OPEN) return false
    sock.current.send(JSON.stringify({ ask: a }))
    return true
  }, [])

  useEffect(() => {
    if (!viewer) localStorage.setItem(gameKey(room?.code), JSON.stringify(game))
  }, [game, viewer, room])

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

  // The relay socket, now in both directions.
  //
  //   viewer ← relay : the whole snapshot, exactly as before. The server sends the current one
  //                    on connect, so a late joiner or a reconnect is caught up with no fetch.
  //   GM     ← relay : `{ ask }` frames only, on their own topic. The GM is the only reducer
  //                    there has ever been; a phone asks, the GM applies, and the resulting
  //                    snapshot goes back out the normal way. That is what lets players write
  //                    without giving anyone a second writer or teaching the server the rules.
  //
  // The GM subscribes to `<code>:ask`, never to `<code>`, so it does not receive its own
  // snapshot back — it POSTs one every debounced change, and echoing it would double the
  // uplink on a phone-tethered GM for nothing.
  useEffect(() => {
    if (!room) return
    let ws: WebSocket
    let retry: ReturnType<typeof setTimeout>
    let done = false
    const connect = () => {
      ws = new WebSocket(`${API.replace(/^http/, 'ws')}/rooms/${room.code}/ws${viewer ? '' : '?gm=1'}`)
      sock.current = ws
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        if (viewer) return dispatch({ type: 'replace', game: msg })
        // Anyone who knows the room code can send an ask, so the whitelist is the boundary.
        if (PLAYER_ASKS.has(msg?.ask?.type)) dispatch(msg.ask)
      }
      ws.onclose = () => {
        if (sock.current === ws) sock.current = null
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

  return [game, dispatch, { room, viewer, setRoom, ask }, hist.past.length > 0] as const
}

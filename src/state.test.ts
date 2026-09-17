import { expect, test } from 'bun:test'

import {
  ARCHETYPES,
  CATALOGUE,
  CRIT_OPS,
  TAC_OPS,
  PRESET_TEAMS,
  STARTING_CP,
  presetRoster,
  blankOperative,
  fromCatalogue,
  killThresholds,
  tacOp,
  teamTacOps,
  teamsWithArchetype,
} from './rules'
import { PHASES, type RefKind, phaseCards, phaseMeta, UNIVERSAL_EQUIPMENT } from './compendium'
import { datacardOf, FACTIONS, factionData, loadFaction } from './factions'

/** The preset teams still carry archetypes and a faction; these keep the old test shape. */
const preset = (id: string) => PRESET_TEAMS.find((t) => t.id === id)!
const tacOpsOf = (id: string) => teamTacOps(preset(id).archetypes)
import {
  canMove,
  counteract,
  currentTeamId,
  rotation,
  type Game,
  initialGame,
  killGrade,
  kills,
  held,
  heldByNobody,
  orderCounts,
  pairEligible,
  pairTarget,
  reduce,
  scores,
  allTeams,
  readyCount,
  sideOps,
  suggestedCrit,
  teamIdOf,
  teamOps,
  teamsOf,
  killValue,
  thresholds,
  withHistory,
} from './state'

const ids = (g: Game, teamId: string) => teamOps(g, teamId).map((o) => o.id)
/** Paired activations are the default, so official-alternation tests opt out. */
const single = () => reduce(initialGame(), { type: 'paired', value: false })
const killOff = (g: Game, opIds: string[]) =>
  opIds.reduce((acc, opId) => reduce(acc, { type: 'dead', opId, dead: true }), g)

test('sides start at 25 vs 28 operatives across seven players', () => {
  const g = initialGame()
  expect(PRESET_TEAMS.length).toBe(7)
  expect(teamsOf(g, 'imperium').length).toBe(4) // two Deathwatch teams
  expect(teamsOf(g, 'xenos').length).toBe(3)
  expect(sideOps(g, 'imperium').length).toBe(25)
  expect(sideOps(g, 'xenos').length).toBe(28)
  expect(teamOps(g, 'dw2').length).toBe(5)
  expect(teamOps(g, 'rav').length).toBe(10) // Prime + 4 named + 5 Warriors
  expect(teamOps(g, 'rav').filter((o) => o.name.startsWith('Warrior')).length).toBe(5)
})

test('every operative id is unique, including across the two Deathwatch teams', () => {
  const g = initialGame()
  const ids = Object.values(g.roster).flat().map((o) => o.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(new Set(ids).size).toBe(53)
  // both teams field a Watch Sergeant, but they are distinct operatives
  const sarges = Object.values(g.roster).flat().filter((o) => o.name === 'Watch Sergeant')
  expect(sarges.length).toBe(2)
  expect(sarges[0].id).not.toBe(sarges[1].id)
})

test('the rotation reaches the extra player whichever side has initiative', () => {
  const imp = initialGame() // imperium has initiative and the extra player
  expect(rotation(imp).map((t) => t.id)).toEqual(['dw', 'rav', 'aod', 'xv26', 'dw2', 'kom', 'sct'])

  const xen = reduce(initialGame(), { type: 'initiative', side: 'xenos' })
  const order = rotation(xen).map((t) => t.id)
  expect(order).toEqual(['rav', 'dw', 'xv26', 'aod', 'kom', 'dw2', 'sct'])
  // the fourth Imperium team must not be dropped just because Xenos went first
  expect(order).toContain('sct')
  expect(order.length).toBe(7)
})

test('kill grade thresholds scale to oversized teams', () => {
  expect(killThresholds(28)).toEqual([5, 9, 14, 19, 23]) // Imperium, facing 28 Xenos
  expect(killThresholds(25)).toEqual([4, 8, 13, 17, 21]) // Xenos, facing 25 Imperium
  // never degenerate: grade 5 must always need at least 5 kills
  expect(killThresholds(3)).toEqual([1, 2, 3, 4, 5])
})

test('kill grade advances off dead enemy operatives only', () => {
  let g = initialGame()
  expect(killGrade(g, 'imperium')).toBe(0)
  g = killOff(g, ids(g, 'kom').slice(0, 5)) // 5 dead Orks
  expect(kills(g, 'imperium')).toBe(5)
  expect(killGrade(g, 'imperium')).toBe(1) // threshold vs 28 ops is 5
  expect(killGrade(g, 'xenos')).toBe(0) // no Imperium losses
  expect(scores(g, 'imperium').kill).toBe(1)
})

test('crit op VP clamps at 3 per turning point and 6 overall', () => {
  let g = initialGame()
  for (let i = 0; i < 5; i++) g = reduce(g, { type: 'critVp', side: 'xenos', tp: 0, delta: 1 })
  expect(g.crit.xenos[0]).toBe(3)
  for (const tp of [1, 2, 3])
    for (let i = 0; i < 3; i++) g = reduce(g, { type: 'critVp', side: 'xenos', tp, delta: 1 })
  expect(scores(g, 'xenos').crit).toBe(6) // raw 12, capped
})

test('tac op VP sums across every player on a side but caps at 6', () => {
  let g = initialGame()
  for (const teamId of ['rav', 'xv26', 'kom'])
    for (let i = 0; i < 3; i++) g = reduce(g, { type: 'tacVp', teamId, delta: 1 })
  expect(scores(g, 'xenos').tacRaw).toBe(9)
  expect(scores(g, 'xenos').tac).toBe(6)

  // the Imperium's fourth player contributes to the same pool
  for (const teamId of ['dw', 'aod', 'sct', 'dw2']) g = reduce(g, { type: 'tacVp', teamId, delta: 2 })
  expect(scores(g, 'imperium').tacRaw).toBe(8)
  expect(scores(g, 'imperium').tac).toBe(6)
})

test('primary op bonus is half the chosen op, rounded up, max 3', () => {
  let g = initialGame()
  for (let i = 0; i < 3; i++) g = reduce(g, { type: 'critVp', side: 'imperium', tp: 0, delta: 1 })
  g = reduce(g, { type: 'primary', side: 'imperium', op: 'crit' })
  expect(scores(g, 'imperium').crit).toBe(3)
  expect(scores(g, 'imperium').bonus).toBe(2) // ceil(3/2)
})

test('end-of-battle bonus VP goes to the higher kill grade', () => {
  let g = initialGame()
  g = killOff(g, ids(g, 'kom').slice(0, 5))
  expect(scores(g, 'imperium').kill).toBe(1)
  g = reduce(g, { type: 'finish', finished: true })
  expect(scores(g, 'imperium').kill).toBe(2) // grade 1 + beats enemy grade 0
  expect(scores(g, 'xenos').kill).toBe(0)
})

test('rotation alternates sides and skips exhausted players', () => {
  let g = single() // initiative: imperium
  expect(currentTeamId(g)).toBe('dw')
  g = reduce(g, { type: 'activate', opId: ids(g, 'dw')[0] })
  expect(currentTeamId(g)).toBe('rav') // alternates to the other side
  g = reduce(g, { type: 'activate', opId: ids(g, 'rav')[0] })
  expect(currentTeamId(g)).toBe('aod')

  // expend everything the Angels have; rotation must skip straight past them
  for (const opId of ids(g, 'aod')) g = reduce(g, { type: 'activate', opId })
  expect(currentTeamId(g)).toBe('xv26')
})

test('a side with nothing ready may counteract', () => {
  let g = initialGame()
  expect(counteract(g, 'imperium').available).toBe(false)
  for (const t of ['dw', 'aod', 'sct', 'dw2']) for (const opId of ids(g, t)) g = reduce(g, { type: 'activate', opId })
  expect(counteract(g, 'imperium').available).toBe(true)
  expect(counteract(g, 'xenos').available).toBe(false)
  expect(currentTeamId(g)).toBe('rav') // firefight continues for the Xenos
})

test('new turning point readies survivors and pays CP (2 to the side without initiative)', () => {
  let g = initialGame()
  const [first, second] = ids(g, 'dw')
  g = reduce(g, { type: 'activate', opId: first })
  g = reduce(g, { type: 'dead', opId: second, dead: true })
  g = reduce(g, { type: 'nextTp' })
  expect(g.tp).toBe(2)
  expect(g.ops[first].expended).toBe(false)
  expect(g.ops[second].dead).toBe(true) // dead stays dead
  expect(g.teams.dw.cp).toBe(3) // 2 + 1, has initiative
  expect(g.teams.rav.cp).toBe(4) // 2 + 2, no initiative
})

test('wounding to zero marks an operative dead', () => {
  let g = initialGame()
  const squig = teamOps(g, 'kom').find((o) => o.name === 'Bomb Squig')!
  for (let i = 0; i < 30; i++) g = reduce(g, { type: 'wound', opId: squig.id, delta: -1 })
  expect(g.ops[squig.id].hp).toBe(0)
  expect(g.ops[squig.id].dead).toBe(true)
})

/* ---------- roster editing ---------- */

test('editing wounds and APL sticks, and clamps current hp down', () => {
  let g = initialGame()
  const prime = teamOps(g, 'rav')[0]
  expect(g.ops[prime.id].hp).toBe(21)
  g = reduce(g, { type: 'editOp', teamId: 'rav', opId: prime.id, patch: { w: 12, apl: 2, move: '9"', save: '4+' } })
  const edited = teamOps(g, 'rav')[0]
  expect([edited.w, edited.apl, edited.move, edited.save]).toEqual([12, 2, '9"', '4+'])
  expect(g.ops[prime.id].hp).toBe(12) // was 21, clamped to the new max
})

test('adding an operative gives it full hp and moves the enemy kill ladder', () => {
  let g = initialGame()
  const before = [...(g.killOverride.imperium ?? killThresholds(28))]
  const extra = { ...fromCatalogue('kom', 'Boy'), id: 'kom-extra-boy' }
  g = reduce(g, { type: 'addOp', teamId: 'kom', op: extra })
  expect(teamOps(g, 'kom').length).toBe(12)
  expect(g.ops['kom-extra-boy']).toEqual({ hp: 10, used: 0, expended: false, dead: false, order: 'conceal' })
  expect(sideOps(g, 'xenos').length).toBe(29)
  // Imperium now needs more kills per grade, since it faces one more Ork
  expect(killThresholds(29)).not.toEqual(before)
})

test('removing an operative drops its state and shrinks the side', () => {
  let g = initialGame()
  const doomed = teamOps(g, 'sct')[8]
  g = reduce(g, { type: 'removeOp', teamId: 'sct', opId: doomed.id })
  expect(teamOps(g, 'sct').length).toBe(8)
  expect(g.ops[doomed.id]).toBeUndefined()
  expect(sideOps(g, 'imperium').length).toBe(24)
  // a removed operative is not a kill for the enemy
  expect(kills(g, 'xenos')).toBe(0)
})

test('a custom operative is editable from a blank slate', () => {
  let g = initialGame()
  const op = blankOperative('dw')
  g = reduce(g, { type: 'addOp', teamId: 'dw', op })
  g = reduce(g, { type: 'editOp', teamId: 'dw', opId: op.id, patch: { name: 'Chaplain', w: 16 } })
  const added = teamOps(g, 'dw').at(-1)!
  expect(added.name).toBe('Chaplain')
  expect(added.w).toBe(16)
  expect(g.ops[op.id].hp).toBe(10) // hp was set on add; raising max does not heal
})

test('every catalogue entry is unique and usable as a roster pick', () => {
  for (const [teamId, list] of Object.entries(CATALOGUE)) {
    expect(new Set(list.map((o) => o.id)).size).toBe(list.length)
    for (const c of list) expect(fromCatalogue(teamId, c.name).w).toBe(c.w)
  }
})

test('resetting a team roster restores the defaults without touching other teams', () => {
  let g = initialGame()
  g = reduce(g, { type: 'removeOp', teamId: 'kom', opId: ids(g, 'kom')[0] })
  g = killOff(g, ids(g, 'dw').slice(0, 2))
  g = reduce(g, { type: 'resetRoster', teamId: 'kom' })
  expect(teamOps(g, 'kom').length).toBe(11)
  expect(kills(g, 'xenos')).toBe(2) // Deathwatch losses survive the Kommando reset
})

/* ---------- activation order ---------- */

test('a team can be moved within its own side, changing the rotation', () => {
  let g = initialGame()
  expect(rotation(g).map((t) => t.id)).toEqual(['dw', 'rav', 'aod', 'xv26', 'dw2', 'kom', 'sct'])
  g = reduce(g, { type: 'moveTeam', teamId: 'sct', dir: -1 }) // Scouts up one
  expect(teamsOf(g, 'imperium').map((t) => t.id)).toEqual(['dw', 'aod', 'sct', 'dw2'])
  expect(rotation(g).map((t) => t.id)).toEqual(['dw', 'rav', 'aod', 'xv26', 'sct', 'kom', 'dw2'])
  expect(teamsOf(g, 'xenos').map((t) => t.id)).toEqual(['rav', 'xv26', 'kom']) // untouched
})

test('reordering resets the activation cursor', () => {
  let g = reduce(single(), { type: 'activate', opId: teamOps(initialGame(), 'dw')[0].id })
  expect(g.turnIdx).toBe(1)
  g = reduce(g, { type: 'moveTeam', teamId: 'aod', dir: 1 })
  expect(g.turnIdx).toBe(0)
})

test('a team cannot be moved off either end of its side', () => {
  const g = initialGame()
  expect(canMove(g, 'dw', -1)).toBe(false) // already first on its side
  expect(canMove(g, 'dw', 1)).toBe(true)
  expect(canMove(g, 'sct', 1)).toBe(false) // already last
  expect(reduce(g, { type: 'moveTeam', teamId: 'dw', dir: -1 })).toBe(g)
  expect(reduce(g, { type: 'moveTeam', teamId: 'kom', dir: 1 })).toBe(g)
})

test('a saved order missing a newly added team self-heals instead of dropping it', () => {
  const g = { ...initialGame(), order: { imperium: ['sct', 'dw'], xenos: ['kom'] } }
  // known ids keep their saved position, the rest are appended in team order
  expect(teamsOf(g, 'imperium').map((t) => t.id)).toEqual(['sct', 'dw', 'aod', 'dw2'])
  expect(teamsOf(g, 'xenos').map((t) => t.id)).toEqual(['kom', 'rav', 'xv26'])
})

test('a saved order holding a team that no longer exists ignores it', () => {
  const g = { ...initialGame(), order: { imperium: ['ghost', 'aod'], xenos: [] } }
  expect(teamsOf(g, 'imperium').map((t) => t.id)).toEqual(['aod', 'dw', 'dw2', 'sct'])
})

/* ---------- paired activations (Buddy System) ---------- */

const spend = (g: Game, teamId: string, n = 1) => {
  let out = g
  for (const opId of teamOps(g, teamId)
    .filter((o) => !out.ops[o.id].expended && !out.ops[o.id].dead)
    .slice(0, n)
    .map((o) => o.id))
    out = reduce(out, { type: 'activate', opId })
  return out
}

test('paired activations are on by default and take two different players', () => {
  let g = initialGame()
  expect(g.paired).toBe(true)
  expect(g.sideTurn).toBe('imperium')
  expect(pairTarget(g)).toBe(2)
  expect(pairEligible(g).map((t) => t.id)).toEqual(['dw', 'aod', 'dw2', 'sct'])

  g = spend(g, 'dw')
  expect(g.sideTurn).toBe('imperium') // still Imperium's turn, one to go
  expect(g.pairUsed).toEqual(['dw'])
  expect(pairEligible(g).map((t) => t.id)).toEqual(['aod', 'dw2', 'sct']) // DW cannot go twice

  g = spend(g, 'aod')
  expect(g.sideTurn).toBe('xenos') // pair complete, handed over
  expect(g.pairUsed).toEqual([])
})

test('a second operative from the same player does not complete the pair', () => {
  let g = spend(initialGame(), 'dw', 2) // both from Deathwatch
  expect(g.pairUsed).toEqual(['dw'])
  expect(g.sideTurn).toBe('imperium') // no handover: that was one player, not two
})

test('activating out of turn expends the operative but does not advance the side turn', () => {
  let g = spend(initialGame(), 'rav') // Xenos acting during Imperium's turn
  expect(g.sideTurn).toBe('imperium')
  expect(g.pairUsed).toEqual([])
  expect(g.ops[teamOps(g, 'rav')[0].id].expended).toBe(true) // the GM's call still lands
})

test('Pass hands the turn over mid-pair', () => {
  let g = spend(initialGame(), 'dw')
  expect(g.sideTurn).toBe('imperium')
  g = reduce(g, { type: 'passPair' })
  expect(g.sideTurn).toBe('xenos')
  expect(g.pairUsed).toEqual([])
})

test('Lone Wolf: one player left on a side drops the target to a single activation', () => {
  let g = initialGame()
  // flush every Imperium player but the Scouts
  for (const t of ['dw', 'aod', 'dw2']) g = spend(g, t, 99)
  g = { ...g, sideTurn: 'imperium', pairUsed: [] }
  expect(pairTarget(g)).toBe(1)
  g = spend(g, 'sct')
  expect(g.sideTurn).toBe('xenos') // one activation was the whole side turn
})

test('spending a player last operative cannot move the pair goalposts mid-turn', () => {
  let g = initialGame()
  for (const t of ['aod', 'sct', 'dw2']) g = spend(g, t, 99) // only Deathwatch has anything ready
  g = { ...g, sideTurn: 'imperium', pairUsed: [] }
  expect(pairTarget(g)).toBe(1)
  g = spend(g, 'dw', 99) // burn all five in one go
  expect(pairTarget({ ...g, sideTurn: 'imperium', pairUsed: ['dw'] })).toBe(1)
})

test('a flushed side banks one Counteract per enemy activation', () => {
  let g = initialGame()
  for (const t of ['dw', 'aod', 'sct', 'dw2']) g = spend(g, t, 99) // Imperium is out
  expect(g.counteracts.imperium).toBe(0)

  g = { ...g, sideTurn: 'xenos', pairUsed: [] }
  g = spend(g, 'rav')
  expect(g.counteracts.imperium).toBe(1)
  g = spend(g, 'xv26')
  expect(g.counteracts.imperium).toBe(2)
  expect(g.sideTurn).toBe('xenos') // no handover — there is nobody to hand to
  expect(g.counteracts.xenos).toBe(0)

  g = reduce(g, { type: 'counteractBank', side: 'imperium', delta: -1 })
  expect(g.counteracts.imperium).toBe(1)
  g = reduce(g, { type: 'counteractBank', side: 'imperium', delta: -5 })
  expect(g.counteracts.imperium).toBe(0) // never negative
})

test('a new turning point resets the side turn, the pair and any banked Counteracts', () => {
  let g = initialGame()
  for (const t of ['dw', 'aod', 'sct', 'dw2']) g = spend(g, t, 99)
  g = { ...g, sideTurn: 'xenos' }
  g = spend(g, 'rav')
  expect(g.counteracts.imperium).toBeGreaterThan(0)

  g = reduce(g, { type: 'nextTp' })
  expect(g.sideTurn).toBe(g.initiative)
  expect(g.pairUsed).toEqual([])
  expect(g.counteracts).toEqual({ imperium: 0, xenos: 0 })
  expect(pairTarget(g)).toBe(2) // everyone readied, back to the Buddy System
})

test('changing initiative moves the side turn with it', () => {
  const g = reduce(initialGame(), { type: 'initiative', side: 'xenos' })
  expect(g.sideTurn).toBe('xenos')
  expect(pairEligible(g).map((t) => t.id)).toEqual(['rav', 'xv26', 'kom'])
})

test('switching to single mode restores the official alternation', () => {
  let g = spend(initialGame(), 'dw')
  expect(g.pairUsed).toEqual(['dw'])
  g = reduce(g, { type: 'paired', value: false })
  expect(g.pairUsed).toEqual([])
  expect(g.turnIdx).toBe(0)
  expect(pairTarget(g)).toBe(1)
})

/* ---------- orders ---------- */

test('the extra Deathwatch team shares the archetypes and tac ops of the first', () => {
  expect(tacOpsOf('dw2').map((o) => o.name)).toEqual(tacOpsOf('dw').map((o) => o.name))
  expect(teamsWithArchetype(PRESET_TEAMS, 'Security').map((t) => t.id)).toEqual(['dw', 'aod', 'dw2'])
})

test('operatives start on Conceal and flip individually', () => {
  let g = initialGame()
  const [first] = teamOps(g, 'kom')
  expect(g.ops[first.id].order).toBe('conceal')
  expect(orderCounts(g, 'kom')).toEqual({ conceal: 11, engage: 0 })
  g = reduce(g, { type: 'order', opId: first.id, value: 'engage' })
  expect(orderCounts(g, 'kom')).toEqual({ conceal: 10, engage: 1 })
})

test('setting a team order skips the dead and survives a new turning point', () => {
  let g = initialGame()
  const [prime] = teamOps(g, 'rav')
  g = reduce(g, { type: 'dead', opId: prime.id, dead: true })
  g = reduce(g, { type: 'teamOrder', teamId: 'rav', value: 'engage' })
  expect(orderCounts(g, 'rav')).toEqual({ conceal: 0, engage: 9 }) // the dead Prime is not counted
  expect(g.ops[prime.id].order).toBe('conceal') // untouched
  g = reduce(g, { type: 'nextTp' })
  expect(orderCounts(g, 'rav')).toEqual({ conceal: 0, engage: 9 }) // orders persist across TPs
})

test('only expended Engage operatives can counteract', () => {
  let g = initialGame()
  expect(counteract(g, 'imperium').available).toBe(false)
  for (const t of ['dw', 'aod', 'sct', 'dw2'])
    for (const o of teamOps(g, t)) g = reduce(g, { type: 'activate', opId: o.id })

  const dry = counteract(g, 'imperium')
  expect(dry.available).toBe(true)
  expect(dry.eligible.length).toBe(0) // everyone is still on Conceal

  const sarge = teamOps(g, 'dw')[0]
  g = reduce(g, { type: 'order', opId: sarge.id, value: 'engage' })
  expect(counteract(g, 'imperium').eligible.map((o) => o.id)).toEqual([sarge.id])

  // a ready (unexpended) Engage operative is not a counteract candidate
  g = reduce(g, { type: 'activate', opId: sarge.id })
  expect(counteract(g, 'imperium').eligible.length).toBe(0)
})

/* ---------- turning points, caps, objectives ---------- */

test('adding turning points grows the crit rows and keeps existing VP', () => {
  let g = initialGame()
  expect(g.tpCount).toBe(4)
  g = reduce(g, { type: 'critVp', side: 'imperium', tp: 3, delta: 2 })
  g = reduce(g, { type: 'tpCount', value: 6 })
  expect(g.crit.imperium).toEqual([0, 0, 0, 2, 0, 0])
  expect(g.crit.xenos.length).toBe(6)
  expect(g.tp).toBe(1)
})

test('shrinking turning points drops the trailing VP and pulls the current TP back', () => {
  let g = reduce(initialGame(), { type: 'tpCount', value: 6 })
  g = reduce(g, { type: 'setTp', value: 6 })
  g = reduce(g, { type: 'critVp', side: 'xenos', tp: 5, delta: 3 })
  g = reduce(g, { type: 'tpCount', value: 4 })
  expect(g.crit.xenos).toEqual([0, 0, 0, 0])
  expect(g.tp).toBe(4)
})

test('the last turning point does not advance past tpCount', () => {
  let g = reduce(initialGame(), { type: 'tpCount', value: 5 })
  for (let i = 0; i < 8; i++) g = reduce(g, { type: 'nextTp' })
  expect(g.tp).toBe(5)
})

test('setTp is clamped to the configured battle length', () => {
  let g = initialGame()
  g = reduce(g, { type: 'setTp', value: 9 })
  expect(g.tp).toBe(4)
  g = reduce(g, { type: 'setTp', value: 0 })
  expect(g.tp).toBe(1)
})

test('raising the VP cap lifts every op type and the primary bonus with it', () => {
  let g = reduce(initialGame(), { type: 'tpCount', value: 6 })
  for (const tp of [0, 1, 2, 3, 4, 5])
    for (let i = 0; i < 3; i++) g = reduce(g, { type: 'critVp', side: 'imperium', tp, delta: 1 })
  g = reduce(g, { type: 'primary', side: 'imperium', op: 'crit' })
  expect(scores(g, 'imperium').crit).toBe(6) // raw 18, still capped at the default 6
  expect(scores(g, 'imperium').bonus).toBe(3)

  g = reduce(g, { type: 'opCap', value: 9 })
  expect(scores(g, 'imperium').crit).toBe(9)
  expect(scores(g, 'imperium').bonus).toBe(5) // ceil(9/2), under the ceil(cap/2)=5 ceiling
})

test('objective markers cycle neutral to Imperium to Xenos and back', () => {
  let g = initialGame()
  expect(g.objectives).toEqual([null, null, null, null, null])
  g = reduce(g, { type: 'objective', index: 0, value: 'imperium' })
  g = reduce(g, { type: 'objective', index: 1, value: 'xenos' })
  expect([held(g, 'imperium'), held(g, 'xenos'), heldByNobody(g)]).toEqual([1, 1, 3])
  g = reduce(g, { type: 'objective', index: 0, value: null })
  expect([held(g, 'imperium'), held(g, 'xenos'), heldByNobody(g)]).toEqual([0, 1, 4])
})

test('changing the marker count preserves the holders it keeps', () => {
  let g = initialGame()
  g = reduce(g, { type: 'objective', index: 4, value: 'xenos' })
  g = reduce(g, { type: 'objectiveCount', value: 3 })
  expect(g.objectives).toEqual([null, null, null]) // the 5th marker and its holder are gone
  g = reduce(g, { type: 'objective', index: 0, value: 'imperium' })
  g = reduce(g, { type: 'objectiveCount', value: 6 })
  expect(g.objectives).toEqual(['imperium', null, null, null, null, null])
})

test('Secure suggests 1VP for holding any and 2VP for holding the most', () => {
  let g = reduce(initialGame(), { type: 'critOp', id: 'secure' })
  g = reduce(g, { type: 'setTp', value: 2 }) // TP1 never scores crit VP
  expect(suggestedCrit(g, 'imperium')).toBe(0) // holds nothing
  g = reduce(g, { type: 'objective', index: 0, value: 'imperium' })
  g = reduce(g, { type: 'objective', index: 1, value: 'xenos' })
  expect(suggestedCrit(g, 'imperium')).toBe(1) // holds one, but not more than the enemy
  expect(suggestedCrit(g, 'xenos')).toBe(1)
  g = reduce(g, { type: 'objective', index: 2, value: 'imperium' })
  expect(suggestedCrit(g, 'imperium')).toBe(2) // holds any, and holds more
  expect(suggestedCrit(g, 'xenos')).toBe(1)
})

test('point-accumulating crit ops are scored by hand, not suggested', () => {
  let g = reduce(initialGame(), { type: 'setTp', value: 2 })
  for (const i of [0, 1, 2, 3]) g = reduce(g, { type: 'objective', index: i, value: 'xenos' })
  for (const id of ['loot', 'upload', 'intel', 'extraction', 'sabotage', 'surge', 'coordinates'] as const) {
    g = reduce(g, { type: 'critOp', id })
    expect(suggestedCrit(g, 'xenos')).toBeNull()
  }
  // the two control-based ops still compute
  g = reduce(g, { type: 'critOp', id: 'transmission' })
  expect(suggestedCrit(g, 'xenos')).toBe(2)
  expect(suggestedCrit(g, 'imperium')).toBe(0)
})

test('no crit op chosen, or the first turning point, yields no crit suggestion', () => {
  let g = initialGame()
  g = reduce(g, { type: 'objective', index: 0, value: 'imperium' })
  expect(suggestedCrit(g, 'imperium')).toBeNull() // nothing selected
  g = reduce(g, { type: 'critOp', id: 'secure' })
  expect(suggestedCrit(g, 'imperium')).toBe(0) // TP1 never scores
  g = reduce(g, { type: 'setTp', value: 2 })
  expect(suggestedCrit(g, 'imperium')).toBe(2) // holds one marker, and more than the enemy
})

test('the per-turning-point crit cap is tunable, and clamps existing entries', () => {
  let g = initialGame()
  expect(g.critCap).toBe(3)
  for (let i = 0; i < 5; i++) g = reduce(g, { type: 'critVp', side: 'imperium', tp: 1, delta: 1 })
  expect(g.crit.imperium[1]).toBe(3)
  g = reduce(g, { type: 'critCap', value: 2 })
  expect(scores(g, 'imperium').crit).toBe(2) // the stored 3 now counts as 2
  g = reduce(g, { type: 'setCritVp', side: 'imperium', tp: 2, value: 9 })
  expect(g.crit.imperium[2]).toBe(2)
})

test('all nine crit ops are present and uniquely numbered', () => {
  expect(CRIT_OPS.length).toBe(9)
  expect(CRIT_OPS.map((c) => c.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  expect(new Set(CRIT_OPS.map((c) => c.id)).size).toBe(9)
})

test('twelve tac ops, three per archetype, uniquely named', () => {
  expect(TAC_OPS.length).toBe(12)
  expect(new Set(TAC_OPS.map((o) => o.name)).size).toBe(12)
  for (const a of ARCHETYPES) expect(TAC_OPS.filter((o) => o.archetype === a).length).toBe(3)
  for (const o of TAC_OPS) {
    expect(o.vp.length).toBeGreaterThan(0)
    expect(tacOp(o.name)).toBe(o)
  }
})

test('each team can choose from exactly six tac ops, its own two archetypes only', () => {
  for (const t of PRESET_TEAMS) {
    const mine = tacOpsOf(t.id)
    expect(mine.length).toBe(6)
    expect(new Set(mine.map((o) => o.archetype))).toEqual(new Set(t.archetypes))
  }
})

test('teams sharing an archetype pair share a tac op list', () => {
  const names = (id: string) => tacOpsOf(id).map((o) => o.name)
  expect(names('dw')).toEqual(names('aod')) // both Seek & Destroy + Security
  expect(names('dw')).toEqual(names('dw2'))
  expect(names('sct')).toEqual(names('xv26')) // both Infiltration + Recon
  expect(names('rav')).toEqual(names('kom')) // both Seek & Destroy + Infiltration
  expect(names('dw')).not.toEqual(names('sct'))
})

test('a team cannot reach a tac op outside its archetypes', () => {
  // Scouts are Infiltration + Recon, so no Seek & Destroy or Security ops
  const scouts = tacOpsOf('sct').map((o) => o.name)
  expect(scouts).not.toContain('Rout')
  expect(scouts).not.toContain('Plant Banner')
  // and Deathwatch cannot take a Recon op
  expect(tacOpsOf('dw').map((o) => o.name)).not.toContain('Flank')
})

test('every archetype is covered by at least one team', () => {
  for (const a of ARCHETYPES) expect(teamsWithArchetype(PRESET_TEAMS, a).length).toBeGreaterThan(0)
  expect(teamsWithArchetype(PRESET_TEAMS, 'Security').map((t) => t.id)).toEqual(['dw', 'aod', 'dw2'])
  expect(teamsWithArchetype(PRESET_TEAMS, 'Recon').map((t) => t.id)).toEqual(['sct', 'xv26'])
})

test('setCritVp writes an absolute value and respects the per-TP cap', () => {
  let g = initialGame()
  g = reduce(g, { type: 'setCritVp', side: 'xenos', tp: 1, value: 9 })
  expect(g.crit.xenos[1]).toBe(3)
  g = reduce(g, { type: 'setCritVp', side: 'xenos', tp: 1, value: 2 })
  expect(g.crit.xenos[1]).toBe(2)
})

/* ---------- replace: relay snapshots and loaded saves ---------- */

test('replace adopts a whole snapshot, wounds and turn state included', () => {
  const played = [
    { type: 'setTp', value: 3 },
    { type: 'wound', opId: sideOps(initialGame(), 'xenos')[0].id, delta: -2 },
    { type: 'cp', teamId: 'dw', delta: 2 },
  ].reduce((g, a) => reduce(g, a as Parameters<typeof reduce>[1]), initialGame())

  const wire = JSON.parse(JSON.stringify(played)) as Game // what the socket actually delivers
  const got = reduce(initialGame(), { type: 'replace', game: wire })

  expect(got.tp).toBe(3)
  expect(got.teams.dw.cp).toBe(played.teams.dw.cp)
  expect(got.ops).toEqual(played.ops)
  expect(got.roster).toEqual(played.roster)
})

test('replace fills in fields a snapshot from an older client is missing', () => {
  const { critCap: _c, counteracts: _n, ...stale } = initialGame()
  const got = reduce(initialGame(), { type: 'replace', game: stale as Game })

  expect(got.critCap).toBe(initialGame().critCap)
  expect(got.counteracts).toEqual({ imperium: 0, xenos: 0 })
  expect(Object.keys(got).sort()).toEqual(Object.keys(initialGame()).sort())
})

test('replace does not read the previous game, so viewers cannot drift', () => {
  const diverged = reduce(reduce(initialGame(), { type: 'nextTp' }), { type: 'passPair' })
  const fresh = initialGame()
  expect(reduce(diverged, { type: 'replace', game: fresh })).toEqual(
    reduce(fresh, { type: 'replace', game: fresh }),
  )
})

/* ---------- undo ---------- */

const hist0 = () => ({ past: [], now: initialGame() })

test('undo steps back through changes and stops at the bottom', () => {
  const start = hist0()
  const a = withHistory(start, { type: 'cp', teamId: 'dw', delta: 1 })
  const b = withHistory(a, { type: 'cp', teamId: 'dw', delta: 1 })
  expect(b.now.teams.dw.cp).toBe(start.now.teams.dw.cp + 2)

  const back = withHistory(withHistory(b, { type: 'undo' }), { type: 'undo' })
  expect(back.now).toEqual(start.now)
  expect(withHistory(back, { type: 'undo' })).toBe(back) // nothing left to undo
})

test('typing a player name coalesces into a single undo step', () => {
  let h = hist0()
  for (const name of ['A', 'An', 'Ann']) h = withHistory(h, { type: 'player', teamId: 'aod', name })
  expect(h.past).toHaveLength(1)
  expect(withHistory(h, { type: 'undo' }).now.teams.aod.player).toBe(initialGame().teams.aod.player)

  // a different field in between breaks the run, so both are separately undoable
  const split = withHistory(withHistory(h, { type: 'cp', teamId: 'aod', delta: 1 }), {
    type: 'player',
    teamId: 'aod',
    name: 'Anna',
  })
  expect(split.past).toHaveLength(3)
})

test('history is bounded, and a loaded save starts a fresh one', () => {
  let h = hist0()
  for (let i = 0; i < 80; i++) h = withHistory(h, { type: 'cp', teamId: 'dw', delta: 1 })
  expect(h.past).toHaveLength(50)

  const loaded = withHistory(h, { type: 'replace', game: initialGame() })
  expect(loaded.past).toEqual([])
})

test('undo restores the rest of the game, not just the score', () => {
  const spent = withHistory(hist0(), { type: 'cp', teamId: 'dw', delta: 3 })
  expect(spent.now.teams.dw.cp).toBe(STARTING_CP + 3)
  expect(withHistory(spent, { type: 'undo' }).now.teams.dw.cp).toBe(STARTING_CP)
})

/* ---------- phases and the compendium ---------- */

test('a battle opens in the initiative phase', () => {
  expect(initialGame().phase).toBe('initiative')
})

test('the GM can name the phase', () => {
  expect(reduce(initialGame(), { type: 'phase', value: 'strategy' }).phase).toBe('strategy')
})

test('activating an operative is itself the firefight phase', () => {
  const g = reduce(initialGame(), { type: 'phase', value: 'strategy' })
  const op = teamOps(g, 'dw')[0]
  expect(reduce(g, { type: 'activate', opId: op.id }).phase).toBe('firefight')
})

test('readying an operative back up is a correction, not a phase change', () => {
  const g = reduce(initialGame(), { type: 'phase', value: 'strategy' })
  const op = teamOps(g, 'dw')[0]
  const spent = reduce(g, { type: 'activate', opId: op.id })
  const undone = reduce(reduce(spent, { type: 'phase', value: 'strategy' }), { type: 'activate', opId: op.id })
  expect(undone.phase).toBe('strategy')
})

test('the next turning point starts over at initiative', () => {
  const g = reduce(initialGame(), { type: 'phase', value: 'firefight' })
  expect(reduce(g, { type: 'nextTp' }).phase).toBe('initiative')
})

test('every phase names the card kinds it puts in play', () => {
  expect(PHASES.map((p) => p.id)).toEqual(['initiative', 'strategy', 'firefight'])
  expect(phaseMeta('strategy').use).toEqual(['strategy'])
  expect(phaseMeta('initiative').use).toEqual([]) // nothing to spend before initiative is settled
})

// Guards the extraction: a faction the preset match names but the library lacks would
// silently show a player nothing.
test('every preset team names a faction the library actually has', () => {
  for (const t of PRESET_TEAMS) {
    expect(FACTIONS.some((f) => f.id === t.faction)).toBe(true)
    expect(factionData(t.faction)).toBeDefined() // bundled, not lazy — initialGame cannot await
  }
})

test('every card in every faction is well formed', async () => {
  const kinds: RefKind[] = ['faction', 'strategy', 'firefight', 'equipment']
  for (const f of FACTIONS) {
    const data = await loadFaction(f.id)
    expect(data).toBeDefined()
    for (const c of data!.cards) {
      expect(kinds).toContain(c.kind)
      expect(c.name.length).toBeGreaterThan(0)
      expect(c.text.length).toBeGreaterThan(20)
    }
    for (const o of data!.operatives) {
      expect(o.id.startsWith(`${f.id}:`)).toBe(true)
      expect(o.apl).toBeGreaterThan(0)
      expect(o.w).toBeGreaterThan(0)
      expect(o.save).toMatch(/^\d\+$/)
      expect(o.move).toMatch(/^\d+"$/)
    }
  }
})

// The 2024 format: every team's card carries exactly four of each ploy kind and four
// pieces of faction equipment. A short count means the extractor dropped a card.
//
// Scoped to the EXTRACTED factions on purpose — homebrew (`custom`) is not bound by the
// printed format, and holding it to the same shape would mean padding a boss with ploys
// nobody wrote. The guard exists to catch extractor regressions, and it still does.
test('every extracted faction has 4 strategy ploys, 4 firefight ploys and 4 equipment', async () => {
  for (const f of FACTIONS.filter((x) => !x.custom)) {
    const cards = (await loadFaction(f.id))!.cards
    const n = (k: RefKind) => cards.filter((c) => c.kind === k).length
    expect([f.id, n('strategy'), n('firefight'), n('equipment')]).toEqual([f.id, 4, 4, 4])
    expect(n('faction')).toBeGreaterThan(0)
  }
})

// The join the player view depends on. The preset six field operatives under the SHORT
// hand-curated CATALOGUE names ("Aegis"), while the PDFs print the full one ("Deathwatch
// Aegis Veteran") — so if this ever stops resolving, every operative on the table silently
// loses its weapons and abilities and the card just shows four numbers.
test('every operative in the preset match resolves to exactly one datacard', () => {
  const g = initialGame()
  for (const t of allTeams(g)) {
    const data = factionData(t.faction)
    for (const o of teamOps(g, t.id)) {
      const card = datacardOf(data, o.name)
      expect([t.id, o.name, card?.name ?? null]).not.toEqual([t.id, o.name, null])
      expect(card!.weapons.length).toBeGreaterThan(0)
    }
  }
})

// NOT scoped to `!custom`, unlike the 4/4/4 card-format guard above. That guard encodes the
// printed layout, which homebrew is not bound by. This one encodes something every operative
// needs whoever wrote it: its own weapons and rules. Scoping it is exactly what let the three
// hand-written factions ship with no datacards at all while the other 48 had them.
test('every operative in the library has a datacard, and it is well formed', async () => {
  for (const f of FACTIONS) {
    const data = (await loadFaction(f.id))!
    expect(data.datacards!.length).toBe(data.operatives.length)
    for (const o of data.operatives) {
      const card = datacardOf(data, o.name)
      expect([f.id, o.name, card?.name]).toEqual([f.id, o.name, o.name])
    }
    for (const d of data.datacards!) {
      for (const w of d.weapons) {
        expect(w.hit).toMatch(/^\d\+$/)
        expect(w.dmg).toMatch(/^\d+\/\d+$/)
        expect(w.atk).toBeGreaterThan(0)
      }
      for (const a of d.abilities) expect(a.text.length).toBeGreaterThan(10)
      // 0AP unique actions are real — Kasrkin's Medikit, Exaction Squad's Apprehend
      for (const a of d.actions) expect(a.ap).toBeGreaterThanOrEqual(0)
    }
  }
})

// The two bosses are hand-written, so nothing regenerates them — and they are the operatives
// whose rules matter most. Without their own datacards they would be the ONLY operatives in the
// game reduced to four bare numbers on the player's Ops card.
test('the NEMESIS bosses carry a datacard with their weapons and traits', async () => {
  for (const id of ['angron', 'farsight']) {
    const f = (await loadFaction(id))!
    const o = f.operatives[0]
    const card = datacardOf(f, o.name)
    expect([id, card?.name]).toEqual([id, card!.name]) // found at all
    expect(card!.weapons.length).toBeGreaterThan(1)
    // the nemesis trait and the allegiance trait, the same objects the Rules cards use
    expect(card!.abilities.length).toBeGreaterThanOrEqual(2)
    expect(card!.keywords).toContain('NEMESIS')
    for (const a of card!.abilities) expect(f.cards.some((c) => c.text === a.text) || a.name === 'Paired Weapon').toBe(true)
  }
})

// A hand-built team has no faction at all, and a GM can rename an operative to anything. Both
// must resolve to undefined rather than throw — the card then simply shows less.
test('an unknown name, and no faction at all, resolve to undefined', async () => {
  const custom = FACTIONS.find((f) => f.custom)!
  expect(datacardOf(await loadFaction(custom.id), 'Not An Operative')).toBeUndefined()
  expect(datacardOf(factionData('kom'), 'Not An Operative')).toBeUndefined()
  expect(datacardOf(undefined, 'Boss Nob')).toBeUndefined()
})

// "Boy" is a suffix of eight Kommandos; the shortest full name is the right one.
test('an ambiguous short name picks the shortest matching datacard', () => {
  expect(datacardOf(factionData('kom'), 'Boy')!.name).toBe('Kommando Boy')
  expect(datacardOf(factionData('kom'), 'Snipa Boy')!.name).toBe('Kommando Snipa Boy')
  // a roster duplicate carries a trailing number that is not part of any datacard name
  expect(datacardOf(factionData('rav'), 'Ravener Warrior 3')!.name).toBe(
    datacardOf(factionData('rav'), 'Ravener Warrior')!.name,
  )
})

test('operative ids are unique across the whole library', async () => {
  const seen = new Set<string>()
  for (const f of FACTIONS) {
    for (const o of (await loadFaction(f.id))!.operatives) {
      expect(seen.has(o.id)).toBe(false)
      seen.add(o.id)
    }
  }
  expect(seen.size).toBeGreaterThan(400)
})

test('a hand-written faction is still well formed, just not to the printed format', async () => {
  const custom = FACTIONS.filter((f) => f.custom)
  expect(custom.length).toBeGreaterThan(0)
  for (const f of custom) {
    const data = (await loadFaction(f.id))!
    expect(data.cards.length).toBeGreaterThan(0)
    expect(data.operatives.length).toBeGreaterThan(0)
    for (const c of data.cards) expect(c.text.length).toBeGreaterThan(20)
    for (const o of data.operatives) expect(o.id.startsWith(`${f.id}:`)).toBe(true)
  }
})

test('universal equipment is no longer empty', () => {
  expect(UNIVERSAL_EQUIPMENT.length).toBeGreaterThan(0)
  for (const c of UNIVERSAL_EQUIPMENT) expect(c.kind).toBe('equipment')
})

test('the two Deathwatch teams share one datacard', () => {
  expect(preset('dw2').faction).toBe('dw') // one datacard, two kill teams — no aliased deck
})

test('phaseCards returns only what that phase unlocks', () => {
  for (const t of PRESET_TEAMS) {
    const cards = factionData(t.faction)!.cards
    expect(phaseCards(cards, 'initiative')).toEqual([])
    expect(phaseCards(cards, 'strategy').every((c) => c.kind === 'strategy')).toBe(true)
    expect(phaseCards(cards, 'firefight').every((c) => c.kind === 'firefight')).toBe(true)
  }
})

test('a team sees all six tac ops its archetypes allow, chosen one first', () => {
  // What the player view offers in its Tac op deck: every eligible op, not just the picked one.
  for (const t of PRESET_TEAMS) {
    const six = tacOpsOf(t.id)
    expect(six).toHaveLength(6)
    expect(six.every((o) => t.archetypes.includes(o.archetype))).toBe(true)
  }
  const g = reduce(initialGame(), { type: 'tacOp', teamId: 'dw', value: 'Rout' })
  const sorted = [...tacOpsOf('dw')].sort(
    (a, b) => Number(b.name === g.teams.dw.tacOp) - Number(a.name === g.teams.dw.tacOp),
  )
  expect(sorted[0].name).toBe('Rout')
  expect(sorted).toHaveLength(6)
})

test('teamIdOf resolves an operative back to its team, prefixes and all', () => {
  const g = initialGame()
  for (const t of PRESET_TEAMS) for (const o of teamOps(g, t.id)) expect(teamIdOf(g, o.id)).toBe(t.id)

  // `dw` is a prefix of `dw2`, which is exactly why this is a lookup and not startsWith.
  expect(teamIdOf(g, teamOps(g, 'dw2')[0].id)).toBe('dw2')
  expect(teamIdOf(g, 'nobody')).toBeUndefined()
})

/* ---------- any number of alliances ---------- */

/** A three-way match built the way the setup view builds one. */
const threeWay = () => {
  let g = reduce(initialGame(), { type: 'sideAdd' })
  const third = g.sides[2].id
  // move the Scouts across, so all three sides have somebody
  g = reduce(g, { type: 'teamPatch', teamId: 'sct', patch: { side: third } })
  return { g, third }
}

test('a third alliance gets its own rows rather than an undefined one', () => {
  const { g, third } = threeWay()
  expect(g.sides.length).toBe(3)
  expect(g.crit[third]).toEqual([0, 0, 0, 0])
  expect(g.primary[third]).toBeNull()
  expect(g.counteracts[third]).toBe(0)
  expect(g.killOverride[third]).toBeNull()
  expect(scores(g, third).total).toBe(0) // would throw if `crit` had no row
  expect(teamsOf(g, third).map((t) => t.id)).toEqual(['sct'])
  expect(teamsOf(g, 'imperium').map((t) => t.id)).toEqual(['dw', 'aod', 'dw2'])
})

test('rotation round-robins every alliance, and still alternates for two', () => {
  const two = initialGame()
  expect(rotation(two).map((t) => t.id)).toEqual(['dw', 'rav', 'aod', 'xv26', 'dw2', 'kom', 'sct'])

  const { g } = threeWay()
  // imperium holds initiative, then xenos, then the new side, one slot each per cycle
  expect(rotation(g).map((t) => t.id)).toEqual(['dw', 'rav', 'sct', 'aod', 'xv26', 'dw2', 'kom'])
})

test('kills and thresholds count every other alliance, not just one', () => {
  const { g, third } = threeWay()
  // Imperium is down to 16 without the Scouts; it faces Xenos' 28 plus the Scouts' 9
  expect(sideOps(g, 'imperium').length).toBe(16)
  expect(thresholds(g, 'imperium')).toEqual(killThresholds(37)) // 28 + 9
  expect(thresholds(g, third)).toEqual(killThresholds(44)) // 16 + 28
})

test('the end-of-battle bonus needs a strict win over every other alliance', () => {
  const { g, third } = threeWay()
  const drop = (h: Game, ids: string[]) => ids.reduce((a, id) => reduce(a, { type: 'dead', opId: id, dead: true }), h)
  // enough Xenos down that Imperium and the Scouts reach the same grade
  let h = drop(g, sideOps(g, 'xenos').slice(0, 8).map((o) => o.id))
  h = reduce(h, { type: 'finish', finished: true })
  const a = killGrade(h, 'imperium')
  expect(a).toBeGreaterThan(0)
  expect(killGrade(h, third)).toBe(a) // both share the same kills, so it is a tie
  expect(scores(h, 'imperium').kill).toBe(a) // a tie at the top pays nobody the bonus
})

test('every dry alliance banks a Counteract, not only the one enemy', () => {
  const { g, third } = threeWay()
  // wipe both other sides out so neither has anything ready
  let h = g
  for (const o of [...sideOps(g, 'xenos'), ...sideOps(g, third)]) h = reduce(h, { type: 'dead', opId: o.id, dead: true })
  h = reduce(h, { type: 'activate', opId: sideOps(h, 'imperium')[0].id })
  expect(h.counteracts.xenos).toBe(1)
  expect(h.counteracts[third]).toBe(1)
})

test('the turn hands over to the next alliance with something ready, skipping the dry', () => {
  const { g, third } = threeWay()
  let h = g
  for (const o of sideOps(h, 'xenos')) h = reduce(h, { type: 'dead', opId: o.id, dead: true })
  // a full pair: two operatives from two different Imperium teams
  h = reduce(h, { type: 'activate', opId: teamOps(h, 'dw')[0].id })
  expect(h.sideTurn).toBe('imperium') // still mid-pair
  h = reduce(h, { type: 'activate', opId: teamOps(h, 'aod')[0].id })
  expect(h.sideTurn).toBe(third) // xenos has nothing ready, so it is passed over
})

test('removing an alliance takes its teams with it and leaves nothing dangling', () => {
  const { g, third } = threeWay()
  const scoutOps = teamOps(g, 'sct').map((o) => o.id)
  let h = reduce(g, { type: 'objective', index: 0, value: third })
  h = reduce(h, { type: 'initiative', side: third })
  h = reduce(h, { type: 'sideRemove', id: third })

  expect(h.sides.map((x) => x.id)).toEqual(['imperium', 'xenos'])
  expect(h.teams.sct).toBeUndefined()
  expect(h.roster.sct).toBeUndefined()
  for (const id of scoutOps) expect(h.ops[id]).toBeUndefined()
  expect(h.crit[third]).toBeUndefined()
  expect(h.objectives[0]).toBeNull() // the marker it held falls back to neutral
  expect(h.sides.some((x) => x.id === h.initiative)).toBe(true)
  expect(h.sides.some((x) => x.id === h.sideTurn)).toBe(true)
  expect(sideOps(h, 'imperium').length).toBe(16) // the other teams are untouched
})

test('the last alliance cannot be removed', () => {
  let g = reduce(initialGame(), { type: 'sideRemove', id: 'xenos' })
  g = reduce(g, { type: 'sideRemove', id: 'imperium' })
  expect(g.sides.length).toBe(1)
})

test('removing one team leaves every other team whole', () => {
  const g = initialGame()
  const dwOps = teamOps(g, 'dw').map((o) => o.id)
  const h = reduce(g, { type: 'teamRemove', teamId: 'dw' })
  expect(h.teams.dw).toBeUndefined()
  for (const id of dwOps) expect(h.ops[id]).toBeUndefined()
  expect(teamOps(h, 'dw2').length).toBe(5) // `dw` is a prefix of `dw2` — must not be caught
  expect(sideOps(h, 'imperium').length).toBe(20)
})

test('a team added from a preset cannot collide ids with the team it copied', () => {
  const g = initialGame()
  const team = { ...PRESET_TEAMS[0], id: 'dw-copy', side: 'xenos', cp: 0, tacOp: '', tacVp: 0 }
  const h = reduce(g, { type: 'teamAdd', team, roster: presetRoster('dw', 'dw-copy') })
  const ids = Object.values(h.roster).flat().map((o) => o.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(teamOps(h, 'dw-copy').length).toBe(teamOps(g, 'dw').length)
  expect(teamsOf(h, 'xenos').map((t) => t.id)).toEqual(['rav', 'xv26', 'kom', 'dw-copy'])
  expect(h.ops[teamOps(h, 'dw-copy')[0].id]).toBeDefined()
})

test('a new turning point keeps a team the GM added, and pays the tunable CP', () => {
  const team = { ...PRESET_TEAMS[0], id: 'late', side: 'xenos', cp: 0, tacOp: '', tacVp: 0 }
  let g = reduce(initialGame(), { type: 'teamAdd', team, roster: presetRoster('dw', 'late') })
  g = reduce(g, { type: 'cpPerTp', patch: { lead: 0, other: 5 } })
  g = reduce(g, { type: 'nextTp' })
  expect(g.teams.late).toBeDefined() // it used to be deleted here
  expect(g.teams.late.cp).toBe(5) // xenos does not hold initiative
  expect(g.teams.dw.cp).toBe(STARTING_CP + 0)
})

test('replace repairs a snapshot missing a side, without moving the turn cursor', () => {
  const g = reduce(initialGame(), { type: 'sideAdd' })
  const third = g.sides[2].id
  // a snapshot from a client that never knew about the third side
  const stale = { ...g, crit: { imperium: [0, 0, 0, 0], xenos: [0, 0, 0, 0] }, turnIdx: 3 }
  const h = reduce(g, { type: 'replace', game: stale as Game })
  expect(h.crit[third]).toEqual([0, 0, 0, 0])
  expect(h.turnIdx).toBe(3) // a spectator must not be knocked off the live turn
})

/* ---------- kill value ---------- */

test('an operative with no kill value is worth exactly one, so the ladders are unchanged', () => {
  const g = initialGame()
  // 25 Imperium vs 28 Xenos, every operative worth 1 — the published ladders
  expect(thresholds(g, 'imperium')).toEqual([5, 9, 14, 19, 23])
  expect(thresholds(g, 'xenos')).toEqual([4, 8, 13, 17, 21])
  expect(killValue(sideOps(g, 'imperium'))).toBe(25)
})

test('a boss raises the ladder it is added to and scores its full value when it dies', () => {
  let g = initialGame()
  const boss = { ...blankOperative('rav'), name: 'Angron', w: 45, kv: 8 }
  g = reduce(g, { type: 'addOp', teamId: 'rav', op: boss })
  // Xenos is now worth 28 + 8 = 36 to the Imperium
  expect(killValue(sideOps(g, 'xenos'))).toBe(36)
  expect(thresholds(g, 'imperium')).toEqual(killThresholds(36))

  expect(kills(g, 'imperium')).toBe(0)
  g = reduce(g, { type: 'dead', opId: boss.id, dead: true })
  expect(kills(g, 'imperium')).toBe(8) // one body, eight kills
  expect(killGrade(g, 'imperium')).toBe(1) // ladder for 36 is [6,12,18,24,30]

  // the point of the field: the same single body is worth a grade, where an ordinary
  // operative would have been worth nothing
  const plain = reduce(initialGame(), { type: 'dead', opId: ids(initialGame(), 'rav')[0], dead: true })
  expect(kills(plain, 'imperium')).toBe(1)
  expect(killGrade(plain, 'imperium')).toBe(0)
})

test('kill value survives an edit and can be lowered back to one', () => {
  let g = initialGame()
  const id = ids(g, 'dw')[0]
  g = reduce(g, { type: 'editOp', teamId: 'dw', opId: id, patch: { kv: 5 } })
  expect(killValue(sideOps(g, 'imperium'))).toBe(29) // 25 bodies, one of them worth 5
  g = reduce(g, { type: 'editOp', teamId: 'dw', opId: id, patch: { kv: 1 } })
  expect(killValue(sideOps(g, 'imperium'))).toBe(25)
})

/* ---------- GM-authored cards ---------- */

const cardsOf = (g: Game, teamId: string) => g.teams[teamId].cards ?? []

test('a GM card is added, edited and removed on one team', () => {
  let g = initialGame()
  expect(cardsOf(g, 'rav')).toEqual([])
  g = reduce(g, { type: 'cardAdd', teamId: 'rav', kind: 'faction' })
  expect(cardsOf(g, 'rav').length).toBe(1)

  const id = cardsOf(g, 'rav')[0].id
  g = reduce(g, { type: 'cardPatch', teamId: 'rav', cardId: id, patch: { name: 'Angron', text: 'Blood for the Blood God.' } })
  expect(cardsOf(g, 'rav')[0]).toMatchObject({ id, kind: 'faction', name: 'Angron', text: 'Blood for the Blood God.' })
  expect(cardsOf(g, 'dw')).toEqual([]) // no other team gains one

  g = reduce(g, { type: 'cardRemove', teamId: 'rav', cardId: id })
  expect(cardsOf(g, 'rav')).toEqual([])
})

test('a card patch cannot rewrite the card id, and a missing team is a no-op', () => {
  let g = reduce(initialGame(), { type: 'cardAdd', teamId: 'rav', kind: 'strategy' })
  const id = cardsOf(g, 'rav')[0].id
  g = reduce(g, { type: 'cardPatch', teamId: 'rav', cardId: id, patch: { id: 'hacked' } as never })
  expect(cardsOf(g, 'rav')[0].id).toBe(id)
  expect(reduce(g, { type: 'cardAdd', teamId: 'nope', kind: 'faction' })).toBe(g)
})

test('deleting a team takes its GM cards with it', () => {
  let g = reduce(initialGame(), { type: 'cardAdd', teamId: 'rav', kind: 'faction' })
  expect(cardsOf(g, 'rav').length).toBe(1)
  g = reduce(g, { type: 'teamRemove', teamId: 'rav' })
  expect(g.teams.rav).toBeUndefined() // normalize needs no extra rule: cards ride on the team
})

test('typing two different cards on one team is two undo steps, not one', () => {
  let h = { past: [] as Game[], now: reduce(initialGame(), { type: 'cardAdd', teamId: 'rav', kind: 'faction' }) }
  h = withHistory(h, { type: 'cardAdd', teamId: 'rav', kind: 'strategy' })
  const [a, b] = cardsOf(h.now, 'rav').map((c) => c.id)

  // two keystrokes into card A coalesce into one step
  h = withHistory(h, { type: 'cardPatch', teamId: 'rav', cardId: a, patch: { text: 'A' } })
  h = withHistory(h, { type: 'cardPatch', teamId: 'rav', cardId: a, patch: { text: 'An' } })
  const afterA = h.past.length
  // but a keystroke into card B must start a new one
  h = withHistory(h, { type: 'cardPatch', teamId: 'rav', cardId: b, patch: { text: 'B' } })
  expect(h.past.length).toBe(afterA + 1)

  h = withHistory(h, { type: 'undo' })
  expect(cardsOf(h.now, 'rav').find((c) => c.id === b)!.text).toBe('')
  expect(cardsOf(h.now, 'rav').find((c) => c.id === a)!.text).toBe('An') // card A's edit survives
})

/* ---------- multiple activations ---------- */

test('an operative with no acts field activates exactly once, as it always did', () => {
  let g = initialGame()
  const id = ids(g, 'dw')[0]
  expect(readyCount(g, 'dw')).toBe(5)
  g = reduce(g, { type: 'activate', opId: id })
  expect(g.ops[id].expended).toBe(true)
  expect(readyCount(g, 'dw')).toBe(4)
})

test('a two-activation operative stays ready until it has spent both', () => {
  const boss = { ...blankOperative('rav'), name: 'Angron', w: 50, acts: 2 }
  let g = reduce(initialGame(), { type: 'addOp', teamId: 'rav', op: boss })

  g = reduce(g, { type: 'activate', opId: boss.id })
  expect(g.ops[boss.id].used).toBe(1)
  expect(g.ops[boss.id].expended).toBe(false) // still has one left

  g = reduce(g, { type: 'activate', opId: boss.id })
  expect(g.ops[boss.id].used).toBe(2)
  expect(g.ops[boss.id].expended).toBe(true)

  // and the correction path walks it back one activation at a time
  g = reduce(g, { type: 'activate', opId: boss.id })
  expect(g.ops[boss.id]).toMatchObject({ used: 1, expended: false })
})

test('a new turning point gives a two-activation operative both back', () => {
  const boss = { ...blankOperative('rav'), name: 'Angron', w: 50, acts: 2 }
  let g = reduce(initialGame(), { type: 'addOp', teamId: 'rav', op: boss })
  g = reduce(g, { type: 'activate', opId: boss.id })
  g = reduce(g, { type: 'activate', opId: boss.id })
  expect(g.ops[boss.id].expended).toBe(true)
  g = reduce(g, { type: 'nextTp' })
  expect(g.ops[boss.id]).toMatchObject({ used: 0, expended: false })
})

test('a two-activation operative keeps its team ready for a second bite', () => {
  const boss = { ...blankOperative('rav'), name: 'Angron', w: 50, acts: 2 }
  let g = reduce(initialGame(), { type: 'addOp', teamId: 'rav', op: boss })
  const solo = teamOps(g, 'rav').filter((o) => o.id !== boss.id)
  for (const o of solo) g = reduce(g, { type: 'dead', opId: o.id, dead: true })
  expect(readyCount(g, 'rav')).toBe(1) // only the boss left standing
  g = reduce(g, { type: 'activate', opId: boss.id })
  expect(readyCount(g, 'rav')).toBe(1) // one activation spent, still counted ready
  g = reduce(g, { type: 'activate', opId: boss.id })
  expect(readyCount(g, 'rav')).toBe(0)
})

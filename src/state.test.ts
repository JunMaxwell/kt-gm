import { expect, test } from 'bun:test'
import { existsSync } from 'node:fs'

import {
  ARCHETYPES,
  CATALOGUE,
  CRIT_OPS,
  GEAR_BONUS,
  INJURY_GRANTS,
  INJURY_IGNORES,
  aplAfter,
  moveAfter,
  moveIn,
  rollAfter,
  rollIn,
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
import { OWN_RULE, PHASES, type RefKind, phaseCards, phaseMeta, UNIVERSAL_EQUIPMENT, WEAPON_RULES, weaponRules } from './compendium'
import { datacardOf, FACTIONS, factionData, loadFaction } from './factions'
import { ployEffect } from './ui/shared'
import { MAPPED } from './fx'
import { draftPool } from './ui/shared'

/** The preset teams still carry archetypes and a faction; these keep the old test shape. */
const preset = (id: string) => PRESET_TEAMS.find((t) => t.id === id)!
const tacOpsOf = (id: string) => teamTacOps(preset(id).archetypes)
import {
  blankGame,
  canMove,
  importGame,
  matchFilename,
  counteract,
  parseHash,
  viewerUrl,
  currentTeamId,
  rotation,
  type Game,
  initialGame,
  gearAllowance,
  effectsFor,
  killGrade,
  liveStats,
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
  // 10 of the 11 Kommandos — the Bomb Squig is Stoopid and can never take a Conceal order
  expect(orderCounts(g, 'kom')).toEqual({ conceal: 10, engage: 1 })
  g = reduce(g, { type: 'order', opId: first.id, value: 'engage' })
  expect(orderCounts(g, 'kom')).toEqual({ conceal: 9, engage: 2 })
})

// Towering Size, Sneaky Zogger and Stoopid are stats on the datacard, not calls the GM makes,
// so the reducer refuses them outright. A boss quietly left on Conceal after a mis-tap would
// be barred from counteracting for the rest of the turning point.
test('an operative locked to one order cannot be moved off it', async () => {
  let g = initialGame()
  const grot = teamOps(g, 'kom').find((o) => o.name === 'Grot')!
  const squig = teamOps(g, 'kom').find((o) => o.name === 'Bomb Squig')!
  expect([grot.lockOrder, squig.lockOrder]).toEqual(['conceal', 'engage'])
  expect([g.ops[grot.id].order, g.ops[squig.id].order]).toEqual(['conceal', 'engage'])

  // individually
  g = reduce(g, { type: 'order', opId: grot.id, value: 'engage' })
  g = reduce(g, { type: 'order', opId: squig.id, value: 'conceal' })
  expect([g.ops[grot.id].order, g.ops[squig.id].order]).toEqual(['conceal', 'engage'])

  // and a whole-team sweep leaves them where they are
  g = reduce(g, { type: 'teamOrder', teamId: 'kom', value: 'engage' })
  expect(g.ops[grot.id].order).toBe('conceal')
  g = reduce(g, { type: 'teamOrder', teamId: 'kom', value: 'conceal' })
  expect(g.ops[squig.id].order).toBe('engage')

  // every NEMESIS operative has Towering Size, whatever its size
  for (const id of ['angron', 'farsight', 'dreadnought']) {
    const o = (await loadFaction(id))!.operatives[0]
    expect([id, o.lockOrder]).toEqual([id, 'engage'])
  }
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
      // a photo is a static file the generator saw on disk; a stale or renamed one must fail here
      if (d.img) expect([d.name, d.img, existsSync('public' + d.img)]).toEqual([d.name, d.img, true])
    }
  }
})

// The two bosses are hand-written, so nothing regenerates them — and they are the operatives
// whose rules matter most. Without their own datacards they would be the ONLY operatives in the
// game reduced to four bare numbers on the player's Ops card.
test('the NEMESIS bosses carry a datacard with their weapons and traits', async () => {
  for (const id of ['angron', 'farsight', 'dreadnought']) {
    const f = (await loadFaction(id))!
    const o = f.operatives[0]
    const card = datacardOf(f, o.name)
    expect([id, card?.name]).toEqual([id, card!.name]) // found at all
    expect(card!.weapons.length).toBeGreaterThan(1)
    // the nemesis trait and the allegiance trait, the same objects the Rules cards use
    expect(card!.abilities.length).toBeGreaterThanOrEqual(2)
    expect(card!.keywords).toContain('NEMESIS')
    // The invariant is ANTI-DRIFT, not coverage: an ability that also has a Rules card must be the
    // same object, which is why each trait is declared once in the module and spread into both. An
    // ability with no card is legitimate — Angron's No Escape is deliberately datacard-only.
    for (const a of card!.abilities) {
      const twin = f.cards.find((c) => c.name === a.name)
      if (twin) expect([id, a.name, twin.text]).toEqual([id, a.name, a.text])
    }
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

/* ---------- the wizard: stages, a blank game, and the GM link ---------- */

test('a new game is blank but still a legal match', () => {
  const g = blankGame()
  expect(allTeams(g)).toEqual([])
  // NOT zero sides: `normalize` materialises an "Alliance 1" out of an empty list, so a blank
  // game with none would sprout a phantom alliance on the first click. Two is the floor.
  expect(g.sides).toHaveLength(2)
  expect(g.stage).toBe('alliances')
  expect(g.roster).toEqual({})
  expect(g.ops).toEqual({})
  // Built from initialGame() through recast, so its shape cannot drift from Game's.
  expect(Object.keys(g).sort()).toEqual(Object.keys(initialGame()).sort())
  // Every per-side record has a row for both sides, or `scores` reads undefined.reduce.
  for (const x of g.sides) {
    expect(g.crit[x.id]).toHaveLength(g.tpCount)
    expect(g.primary).toHaveProperty(x.id)
    expect(g.counteracts).toHaveProperty(x.id)
    expect(g.order).toHaveProperty(x.id)
  }
  expect(scores(g, g.sides[0].id).total).toBe(0)
})

test('"new game" is reset, and the preset match is a `replace` rather than an action', () => {
  const played = reduce(initialGame(), { type: 'wound', opId: teamOps(initialGame(), 'dw')[0].id, delta: -3 })
  expect(allTeams(reduce(played, { type: 'reset' }))).toEqual([])
  // Step 1's "load the usual match" button, verbatim.
  const usual = reduce(blankGame(), { type: 'replace', game: { ...initialGame(), stage: 'alliances' } })
  expect(allTeams(usual)).toHaveLength(7)
  expect(usual.stage).toBe('alliances')
})

test('ending the battle moves to the end stage without changing how scoring reads it', () => {
  const g = reduce(initialGame(), { type: 'finish', finished: true })
  expect(g.stage).toBe('end')
  expect(g.finished).toBe(true)
  // Back to the board un-finishes it too — `finished` is a real flag, not `stage === 'end'`,
  // because stepping off the end screen must not silently revoke the kill bonus mid-look.
  const back = reduce(g, { type: 'finish', finished: false })
  expect(back.stage).toBe('play')
  expect(back.finished).toBe(false)
})

test('a snapshot from before the wizard lands on a stage rather than undefined', () => {
  const { stage: _gone, ...old } = initialGame()
  const g = reduce(initialGame(), { type: 'replace', game: old as Game })
  expect(g.stage).toBe('play')
})

test('a GM link carries the write token; a spectator link does not', () => {
  expect(parseHash('#/g/ABCD/0189d4a1-0000-4000-8000-0123456789ab')).toEqual({
    code: 'ABCD',
    token: '0189d4a1-0000-4000-8000-0123456789ab',
  })
  expect(parseHash('#/r/ABCD')).toEqual({ code: 'ABCD' })
  expect(parseHash('#/g/ABCD')).toEqual({ code: 'ABCD' }) // no token ⇒ read only, not GM
  expect(parseHash('#/nonsense')).toBeNull()
  expect(parseHash('')).toBeNull()
})

/* ---------- export / import ---------- */

/** `File` is a web global; bun has it, so no harness is needed to exercise the trust boundary. */
const asFile = (body: string) => new File([body], 'm.json', { type: 'application/json' })

test('a match survives a round trip through a file', async () => {
  let g = reduce(initialGame(), { type: 'finish', finished: true })
  g = reduce(g, { type: 'critVp', side: 'imperium', tp: 2, delta: 2 })
  const back = await importGame(asFile(JSON.stringify(g)))
  // `replace` is what the UI actually dispatches, and it normalizes — so compare through it.
  expect(reduce(initialGame(), { type: 'replace', game: back })).toEqual(g)
})

test('a match file names itself after the fight, not the clock alone', () => {
  expect(matchFilename(initialGame())).toMatch(/^killteam-imperium-v-xenos-tp1-\d{4}-\d{2}-\d{2}\.json$/)
  expect(matchFilename(reduce(initialGame(), { type: 'finish', finished: true }))).toContain('-final-')
  // No path separators or spaces can reach the filename, whatever an alliance is called.
  const odd = reduce(initialGame(), { type: 'sidePatch', id: 'imperium', patch: { name: 'a/b c:d' } })
  expect(matchFilename(odd)).not.toMatch(/[/\\ :]/)
})

test('importing rejects anything that is not a match, rather than white-screening', async () => {
  // `replace` fills in MISSING fields and `normalize` repairs DANGLING ones, but neither
  // survives a field of the wrong type — `sides: "hello"` has a .length and dies on .map.
  const bad: [string, RegExp][] = [
    ['not json at all', /not JSON/],
    ['[1,2,3]', /not a match/],
    ['"a string"', /not a match/],
    ['null', /not a match/],
    ['{}', /no alliances/],
    ['{"sides":"hello"}', /no alliances/],
    ['{"sides":[]}', /no teams/],
    ['{"sides":[],"teams":[]}', /no teams/],
  ]
  for (const [body, msg] of bad) {
    expect(importGame(asFile(body))).rejects.toThrow(msg)
  }
  // The minimum that IS a match: empty, but structurally sound, and normalize takes it from there.
  const ok = await importGame(asFile('{"sides":[],"teams":{}}'))
  expect(() => reduce(initialGame(), { type: 'replace', game: ok })).not.toThrow()
})

/* ---------- weapon rules glossary ---------- */

test('a weapon rules column resolves to the universal rules it names', () => {
  const wr = (s: string) => weaponRules([{ name: 'w', atk: 4, hit: '3+', dmg: '3/4', wr: s }]).map(([n]) => n)

  expect(wr('Range 8"')).toEqual(['Range'])
  // x, a leading distance, and a parenthesised variant all resolve to the parent rule.
  expect(wr('Lethal 5+, Piercing 1')).toEqual(['Lethal', 'Piercing'])
  expect(wr('1" Devastating 3')).toEqual(['Devastating'])
  expect(wr('Heavy (Dash only)')).toEqual(['Heavy'])
  // Variants fold into their parent rather than resolving twice or to the wrong entry.
  expect(wr('Piercing Crits 1')).toEqual(['Piercing'])
  expect(wr('Seek Light')).toEqual(['Seek'])
  // A faction's own rule is starred and written out on the operative, so it is not ours to define.
  expect(wr('Poison*')).toEqual([])
  expect(wr('-')).toEqual([])
  expect(weaponRules(undefined)).toEqual([])
})

// A rule a ploy HANDS OUT is printed in no `wr` column anywhere, so the pack that grants it three
// times over used to carry no definition of it. Anchoring on the phrase "weapon rule" is what
// makes reading prose safe: half these names are ordinary words.
test('the glossary reads rules a card grants, not only those a weapon prints', () => {
  const rules = (...prose: string[]) => weaponRules([], prose).map(([n]) => n)

  expect(rules('Whenever it is shooting, its weapons have the Balanced weapon rule.')).toEqual(['Balanced'])
  expect(rules('all weapons gains the weapon rule of Ceaseless.')).toEqual(['Ceaseless'])
  // Two names in front of one "weapon rule", which is how He'stan's Forgefather is worded.
  expect(rules('a weapon that has the Torrent or Devastating weapon rule also has the Balanced weapon rule')).toEqual([
    'Balanced',
    'Devastating',
    'Torrent',
  ])
  // The anchor, earning its keep: these words are everywhere in rules prose and mean nothing here.
  expect(rules('while within control range of an enemy operative')).toEqual([])
  expect(rules('Select one Heavy terrain feature. Range is measured horizontally.')).toEqual([])
  // ...and it does not read across the end of a sentence into the next one.
  expect(rules('It cannot Seek cover. Its weapons have the Balanced weapon rule.')).toEqual(['Balanced'])
  // Weapons and prose merge into one deduped list in the declared order.
  const w = { name: 'w', atk: 4, hit: '3+', dmg: '3/4', wr: 'Saturate' }
  expect(weaponRules([w], ['its weapons have the Balanced weapon rule']).map(([n]) => n)).toEqual(['Balanced', 'Saturate'])
})

test('the glossary dedupes across an operative and keeps one declared order', () => {
  const w = (wr: string) => ({ name: wr, atk: 4, hit: '3+', dmg: '3/4', wr })
  const got = weaponRules([w('Saturate, Balanced'), w('Balanced, Range 6"')])
  expect(got.map(([n]) => n)).toEqual(['Balanced', 'Range', 'Saturate'])
  expect(got.every(([n, text]) => text === WEAPON_RULES[n] && text.length > 20)).toBe(true)
})

test('every universal weapon rule the generated factions print has a definition', () => {
  // The extractor is the source of the vocabulary: if a PDF ever prints a rule this list does
  // not cover, a player reads a bare keyword again. A faction's OWN rules are out of scope, and
  // `OWN_RULE` is shared with `weaponRules` rather than respelled here — the Sanctifiers footnote
  // theirs with a superscript (`Wreathed¹`) where everyone else uses an asterisk, and a second
  // copy of that assumption in the test is how it would be missed twice.
  const seen = new Set<string>()
  for (const f of FACTIONS) {
    const data = factionData(f.id)
    for (const d of data?.datacards ?? [])
      for (const weapon of d.weapons)
        for (const token of (weapon.wr ?? '').split(','))
          if (token.trim() && !OWN_RULE.test(token.trim())) seen.add(token.trim())
  }
  // Only the statically-imported factions are loaded synchronously, so this is a sample, not all
  // 51 — enough to catch a vocabulary drift without making the suite async.
  expect(seen.size).toBeGreaterThan(0)
  const orphans = [...seen].filter((t) => !weaponRules([{ name: 'w', atk: 1, hit: '3+', dmg: '1/1', wr: t }]).length)
  // Known non-rules the column also carries: the bare PSYCHIC keyword, and the extractor's
  // "no weapon rules" dash, which it sometimes leaves in rather than dropping the field.
  expect(orphans.filter((t) => !/^[-\u2010-\u2015\s]+$/.test(t) && t !== 'PSYCHIC')).toEqual([])
})

/**
 * The one thing about a player link that is easy to break silently: the team id is a SEARCH
 * param and so must come BEFORE the hash — `location.search` is only what precedes it, so
 * `#/r/ABCD?me=dw2` would read back as an empty `me` and drop the player on the picker.
 * `location` does not exist under `bun test`, hence the stub.
 */
test('a player link carries the team ahead of the room hash, and parses back', () => {
  const real = (globalThis as { location?: unknown }).location
  ;(globalThis as { location?: unknown }).location = { origin: 'https://kt.example', pathname: '/' }
  try {
    const url = new URL(viewerUrl('ABCD', 'dw2'))
    expect(new URLSearchParams(url.search).get('me')).toBe('dw2')
    expect(url.hash).toBe('#/r/ABCD')
    // The hash still reads as a spectator room, so the link cannot hand out write access.
    expect(parseHash(url.hash)).toEqual({ code: 'ABCD' })
    // And without a team it is exactly the link it has always been.
    expect(viewerUrl('ABCD')).toBe('https://kt.example/#/r/ABCD')
  } finally {
    ;(globalThis as { location?: unknown }).location = real
  }
})

/* ---------- the player's draft ----------
 *
 * Three actions a phone may ask the GM to run, and the gate over two of them. The transport is
 * verified in a browser — these pin the rules the transport carries.
 */

test('a claim names the team and locks it, and switching teams releases the old one', () => {
  const g = reduce(initialGame(), { type: 'claim', teamId: 'kom', name: 'Minh' })
  expect(g.teams.kom.player).toBe('Minh')
  expect(g.teams.kom.claimed).toBe(true)
  // Nothing else is touched: `claimed` is a separate flag precisely because the presets ship
  // "Player 1".."Player 7", so a non-empty name cannot mean taken.
  expect(g.teams.dw.claimed).toBeFalsy()
  expect(g.teams.dw.player).toBe('Player 1')

  // One action, so changing your mind can never leave two teams held or one stranded.
  const moved = reduce(g, { type: 'claim', teamId: 'rav', name: 'Minh', from: 'kom' })
  expect(moved.teams.kom.claimed).toBe(false)
  expect(moved.teams.rav.claimed).toBe(true)
  expect(moved.teams.rav.player).toBe('Minh')
})

test('an empty claim name is the release, and keeps the label the GM typed', () => {
  const g = reduce(initialGame(), { type: 'claim', teamId: 'kom', name: 'Minh' })
  const freed = reduce(g, { type: 'claim', teamId: 'kom', name: '' })
  expect(freed.teams.kom.claimed).toBe(false)
  expect(freed.teams.kom.player).toBe('Minh') // a stale name tells the GM more than a blank does
})

test('a claim still works once the draft has closed — a late player has to say who they are', () => {
  const shut = reduce(initialGame(), { type: 'picks', value: false })
  expect(reduce(shut, { type: 'claim', teamId: 'kom', name: 'Minh' }).teams.kom.claimed).toBe(true)
})

test('the picks a player sends ARE the roster, and surviving operatives keep their wounds', () => {
  const g = initialGame()
  const kept = teamOps(g, 'kom').slice(0, 3)
  const hurt = reduce(g, { type: 'wound', opId: kept[0].id, delta: -2 })
  const hp = hurt.ops[kept[0].id].hp
  const dropped = teamOps(g, 'kom')[5].id

  const next = reduce(hurt, { type: 'setRoster', teamId: 'kom', ops: kept })
  expect(ids(next, 'kom')).toEqual(kept.map((o) => o.id))
  // The GM can reopen the draft mid-match, so re-picking must not heal the whole team.
  expect(next.ops[kept[0].id].hp).toBe(hp)
  // An operative that left takes its state with it, the way `removeOp` does.
  expect(next.ops[dropped]).toBeUndefined()
  // Every other team is untouched — `setRoster` only ever prunes its own.
  expect(teamOps(next, 'rav').length).toBe(10)
})

test('an operative added by a re-pick starts at full wounds', () => {
  const g = initialGame()
  const all = teamOps(g, 'kom')
  const cut = reduce(g, { type: 'setRoster', teamId: 'kom', ops: all.slice(0, 2) })
  const back = reduce(cut, { type: 'setRoster', teamId: 'kom', ops: all.slice(0, 3) })
  expect(back.ops[all[2].id].hp).toBe(all[2].w)
  expect(back.ops[all[2].id].expended).toBe(false)
})

test('gear is clamped to the limit, because the ask arrives from a phone that may be stale', () => {
  const g = initialGame()
  const six = ['a', 'b', 'c', 'd', 'e', 'f']
  expect(reduce(g, { type: 'gear', teamId: 'kom', names: six }).teams.kom.gear).toEqual(['a', 'b', 'c', 'd'])

  // "Limit 4 unless stated otherwise" — the GM states otherwise per team.
  const raised = reduce(g, { type: 'teamPatch', teamId: 'kom', patch: { gearLimit: 6 } })
  expect(reduce(raised, { type: 'gear', teamId: 'kom', names: six }).teams.kom.gear).toEqual(six)
})

test('the FIRST ACTIVATION closes the draft, and merely opening the board does not', () => {
  const g = initialGame()
  expect(g.picks).toBe(true)
  // Walking onto the console is something the GM does all through setup — to read the
  // scoreboard, to hand out the room link printed there. Closing the draft then locks seven
  // phones out before anyone has drafted, which is exactly the bug this pins.
  const board = reduce(g, { type: 'stage', value: 'play' })
  expect(board.picks).toBe(true)
  expect(reduce(board, { type: 'stage', value: 'teams' }).picks).toBe(true)

  // An activation is unambiguous: the match is underway and a roster change is now dangerous.
  const opId = teamOps(g, 'kom')[0].id
  const started = reduce(board, { type: 'activate', opId })
  expect(started.picks).toBe(false)
  // Only the GM's header toggle reopens it — that is what "locked, GM can reopen" means.
  expect(reduce(started, { type: 'picks', value: true }).picks).toBe(true)
})

test('un-activating an operative is a correction and does not reopen the draft', () => {
  const opId = teamOps(initialGame(), 'kom')[0].id
  const started = reduce(initialGame(), { type: 'activate', opId })
  expect(reduce(started, { type: 'activate', opId }).picks).toBe(false)
})

test('a team from the faction library drafts from its datacards, with ids minted per team', () => {
  const f = FACTIONS.find((x) => !x.preset && !x.custom)!
  const mk = (id: string) => ({
    id, player: 'P', name: f.name, short: 'X', side: 'xenos', color: f.color,
    archetypes: [...f.archetypes], faction: f.id, cp: 0, tacOp: '', tacVp: 0,
  })
  let g = reduce(initialGame(), { type: 'teamAdd', team: mk('lib1'), roster: [] })
  g = reduce(g, { type: 'teamAdd', team: mk('lib2'), roster: [] })
  const data = factionData(f.id) ?? { operatives: [] }
  // Only the six preset factions carry a DEFAULT_ROSTER, so without the faction fallback the
  // other 42 hand their player a blank draft.
  const a = draftPool(g.teams.lib1, data as never, [])
  const b = draftPool(g.teams.lib2, data as never, [])
  expect(a.length).toBeGreaterThan(0)
  // `g.ops` is one flat map, so two teams of one faction must never share an operative id.
  expect(a.map((o) => o.id)).not.toEqual(b.map((o) => o.id))
  expect(new Set([...a, ...b].map((o) => o.id)).size).toBe(a.length + b.length)
  // Deterministic, so unticking an operative and changing your mind keeps its wound track.
  expect(draftPool(g.teams.lib1, data as never, []).map((o) => o.id)).toEqual(a.map((o) => o.id))
})

test('a closed draft refuses a roster and a gear ask, so a stale phone cannot edit mid-match', () => {
  const shut = reduce(initialGame(), { type: 'picks', value: false })
  expect(reduce(shut, { type: 'setRoster', teamId: 'kom', ops: [] })).toBe(shut)
  expect(reduce(shut, { type: 'gear', teamId: 'kom', names: ['a'] })).toBe(shut)
})

test('deleting a team takes its pool with it, the way it already takes its cards', () => {
  const g = reduce(initialGame(), {
    type: 'teamPatch',
    teamId: 'kom',
    patch: { pool: [blankOperative('kom')] },
  })
  expect(g.teams.kom.pool?.length).toBe(1)
  // `pool` lives on `TeamDef`, so `normalize` prunes it for free — no cleanup code exists.
  expect(reduce(g, { type: 'teamRemove', teamId: 'kom' }).teams.kom).toBeUndefined()
})

test('every preset team opens with its own legal size as the draft limit', () => {
  const g = initialGame()
  // 5/6/5/9 Imperium, 10/7/11 Xenos — the numbers the match was written around.
  expect(PRESET_TEAMS.map((t) => g.teams[t.id].opLimit)).toEqual([5, 6, 5, 9, 10, 7, 11])
  for (const t of PRESET_TEAMS) expect(g.teams[t.id].opLimit).toBe(teamOps(g, t.id).length)
})

test('drafting freezes the pool, so a dropped operative can always be picked back', () => {
  const g = initialGame()
  const all = teamOps(g, 'kom')
  expect(g.teams.kom.pool).toBeUndefined() // uncurated: the pool IS the roster, by fallback

  // ...and the roster is what this action overwrites. Without the freeze the offered list
  // ratchets down with every draft and an operative dropped once is gone for good.
  const cut = reduce(g, { type: 'setRoster', teamId: 'kom', ops: all.slice(0, 4) })
  expect(cut.teams.kom.pool?.length).toBe(11)
  expect(teamOps(cut, 'kom').length).toBe(4)

  // Frozen once, not re-frozen: a second draft must not overwrite it with the shorter list.
  const again = reduce(cut, { type: 'setRoster', teamId: 'kom', ops: all.slice(0, 2) })
  expect(again.teams.kom.pool?.length).toBe(11)
  // And the whole eleven really is still pickable.
  const back = reduce(again, { type: 'setRoster', teamId: 'kom', ops: again.teams.kom.pool! })
  expect(teamOps(back, 'kom').length).toBe(11)
})

test("a GM's curated pool is never overwritten by a draft", () => {
  const three = teamOps(initialGame(), 'kom').slice(0, 3)
  const curated = reduce(initialGame(), { type: 'teamPatch', teamId: 'kom', patch: { pool: three } })
  const after = reduce(curated, { type: 'setRoster', teamId: 'kom', ops: three.slice(0, 1) })
  expect(after.teams.kom.pool?.length).toBe(3)
})

test('a team with no roster keeps falling through to its faction, which cannot shrink', () => {
  const f = FACTIONS.find((x) => !x.preset && !x.custom)!
  const team = {
    id: 'lib', player: 'P', name: f.name, short: 'X', side: 'xenos', color: f.color,
    archetypes: [...f.archetypes], faction: f.id, cp: 0, tacOp: '', tacVp: 0,
  }
  const g = reduce(initialGame(), { type: 'teamAdd', team, roster: [] })
  const drafted = reduce(g, { type: 'setRoster', teamId: 'lib', ops: [] })
  // Freezing an EMPTY roster would pin the pool to nothing and strand the team for good.
  expect(drafted.teams.lib.pool).toBeUndefined()
})

test("the GM's pick limit is the rule, and the reducer holds it", () => {
  const g = reduce(initialGame(), { type: 'teamPatch', teamId: 'kom', patch: { opLimit: 5 } })
  const all = teamOps(g, 'kom')
  expect(all.length).toBe(11)
  // The UI stops you going over; this is the backstop, because the ask crosses a network from a
  // phone that may be showing a stale limit. `gear` has always been clamped — this matches it.
  expect(teamOps(reduce(g, { type: 'setRoster', teamId: 'kom', ops: all }), 'kom').length).toBe(5)
  // Under the limit is untouched.
  expect(teamOps(reduce(g, { type: 'setRoster', teamId: 'kom', ops: all.slice(0, 3) }), 'kom').length).toBe(3)
  // And a limit of 0 means "never set", which is how a library team starts — not "pick nothing".
  const none = reduce(initialGame(), { type: 'teamPatch', teamId: 'kom', patch: { opLimit: 0 } })
  expect(teamOps(reduce(none, { type: 'setRoster', teamId: 'kom', ops: all }), 'kom').length).toBe(11)
})

/* ---------- equipment the operatives themselves grant ---------- */

test('the Watch Sergeant is worth a fifth equipment card, and only while fielded', () => {
  const g = initialGame()
  // "Limit 4 unless stated otherwise" — Adaptable Armoury is the otherwise.
  expect(gearAllowance(g, 'dw')).toBe(5)
  expect(gearAllowance(g, 'kom')).toBe(4)

  const without = teamOps(g, 'dw').filter((o) => o.name !== 'Watch Sergeant')
  expect(gearAllowance(reduce(g, { type: 'setRoster', teamId: 'dw', ops: without }), 'dw')).toBe(4)
})

test('the reducer clamps gear to the allowance, bonus included', () => {
  const g = initialGame()
  const five = ['a', 'b', 'c', 'd', 'e']
  // Deathwatch field a Watch Sergeant, so five is legal for them...
  expect(reduce(g, { type: 'gear', teamId: 'dw', names: five }).teams.dw.gear).toEqual(five)
  // ...and not for anyone else.
  expect(reduce(g, { type: 'gear', teamId: 'kom', names: five }).teams.kom.gear).toEqual(five.slice(0, 4))
  // The GM's own number still stacks with it.
  const raised = reduce(g, { type: 'teamPatch', teamId: 'dw', patch: { gearLimit: 6 } })
  expect(gearAllowance(raised, 'dw')).toBe(7)
})

test('every GEAR_BONUS name resolves to a real operative, under both naming conventions', async () => {
  // The map is keyed by name because that needs no faction chunk loaded — which means a typo or
  // a renamed datacard fails silently. This is the check that it does not.
  const catalogued = new Set(Object.values(CATALOGUE).flat().map((o) => o.name))
  const carded = new Set<string>()
  for (const f of FACTIONS) for (const d of (await loadFaction(f.id))?.datacards ?? []) carded.add(d.name)
  for (const name of Object.keys(GEAR_BONUS))
    expect(catalogued.has(name) || carded.has(name)).toBe(true)
})

test('no datacard grants extra equipment without being in GEAR_BONUS', async () => {
  // The audit that found these four, kept runnable: a faction added later that grants a fifth
  // card should fail here rather than quietly shorting its player.
  const GRANTS = /you can select (one|two|\d+) additional equipment/i
  const missed: string[] = []
  for (const f of FACTIONS)
    for (const d of (await loadFaction(f.id))?.datacards ?? [])
      for (const a of [...d.abilities, ...d.actions])
        if (GRANTS.test(a.text) && !GEAR_BONUS[d.name]) missed.push(`${f.id}/${d.name}/${a.name}`)
  expect(missed).toEqual([])
})

/* ---------- effective stats: what the operative actually rolls ---------- */

test('the stat helpers parse the printed strings and hold the core rules floors', () => {
  expect(moveIn('6"')).toBe(6)
  expect(rollIn('3+')).toBe(3)
  // "A Move stat can never be changed to less than 4\"" — so a 5" operative injured is 4", not 3".
  expect(moveAfter('6"', -2)).toBe('4"')
  expect(moveAfter('5"', -2)).toBe('4"')
  expect(moveAfter('6"', 0)).toBe('6"')
  // Positive is WORSE on a roll stat, and it never passes 2+ or 6+.
  expect(rollAfter('3+', 1)).toBe('4+')
  expect(rollAfter('6+', 1)).toBe('6+')
  expect(rollAfter('2+', -1)).toBe('2+')
  // "APL changes can never total more than −1 or +1."
  expect(aplAfter(2, 3)).toBe(3)
  expect(aplAfter(2, -3)).toBe(1)
})

test('an injured operative rolls the reduced numbers, not the printed ones', () => {
  const g = initialGame()
  const gunner = teamOps(g, 'dw').find((o) => o.name === 'Gunner')!
  const well = liveStats(g, gunner, g.ops[gunner.id])
  expect(well.move).toBe(gunner.move)
  expect(well.hurt).toBe(false)

  // Below half wounds. The app always knew this and printed the undamaged card anyway.
  const hurt = reduce(g, { type: 'wound', opId: gunner.id, delta: -10 })
  const now = liveStats(hurt, gunner, hurt.ops[gunner.id])
  expect(now.hurt).toBe(true)
  expect(now.move).toBe('4"')
  expect(now.hit({ name: 'bolt rifle', atk: 4, hit: '3+', dmg: '3/4' })).toBe('4+')
  // Injured is Move and Hit only — never APL, never Save. `injured`'s own docstring says so.
  expect(now.apl).toBe(gunner.apl)
  expect(now.save).toBe(gunner.save)
})

test('a dead operative is not injured, however few wounds it has', () => {
  const g = initialGame()
  const o = teamOps(g, 'dw')[0]
  const dead = reduce(g, { type: 'dead', opId: o.id, dead: true })
  expect(liveStats(dead, o, dead.ops[o.id]).hurt).toBe(false)
})

test('the tough toggle drops the whole penalty, and a datacard rule drops its own half', () => {
  const g = initialGame()
  const o = teamOps(g, 'dw').find((x) => x.name === 'Gunner')!
  const hurt = reduce(g, { type: 'wound', opId: o.id, delta: -10 })
  const off = reduce(hurt, { type: 'tough', opId: o.id, value: true })
  const now = liveStats(off, o, off.ops[o.id])
  expect(now.ignoring).toBe('all')
  expect(now.move).toBe(o.move)
  expect(now.hit({ name: 'x', atk: 4, hit: '3+', dmg: '3/4' })).toBe('3+')
  expect(now.hurt).toBe(true) // still below half — the wound bar and the badge both want to know

  // Angron's Implacable is weapons only: he keeps HIT 3+ and still loses the 2".
  const angron = { id: 'a1', name: 'Angron', apl: 5, move: '6"', save: '4+', w: 75 }
  const st = { hp: 20, expended: false, dead: false, order: 'engage' as const }
  const boss = liveStats(g, angron, st)
  expect(boss.ignoring).toBe('weapons')
  expect(boss.move).toBe('4"')
  expect(boss.hit({ name: 'x', atk: 5, hit: '3+', dmg: '6/8' })).toBe('3+')
})

test('every INJURY_IGNORES name resolves to a real datacard', async () => {
  // Keyed by name so the reducer needs no faction chunk loaded — which means a typo fails
  // silently. Same guard as GEAR_BONUS.
  const carded = new Set<string>()
  for (const f of FACTIONS) for (const d of (await loadFaction(f.id))?.datacards ?? []) carded.add(d.name)
  for (const name of Object.keys(INJURY_IGNORES)) expect(carded.has(name)).toBe(true)
})

test('the injury-ignoring rules this app does NOT model are all conditional', async () => {
  // Ten operatives have one. Only the flat, self-only, unconditional four are in the map; the
  // rest are auras ("within 6\"") or optional ("you can ignore"), and there is no board here.
  // If a future faction ships a flat one, it should land in the map rather than be silently lost.
  const loose: string[] = []
  for (const f of FACTIONS)
    for (const d of (await loadFaction(f.id))?.datacards ?? [])
      for (const a of d.abilities)
        if (
          /from being injured/i.test(a.text) &&
          !INJURY_IGNORES[d.name] &&
          !INJURY_GRANTS[d.name] &&
          !/within|whenever/i.test(a.text)
        )
          loose.push(`${f.id}/${d.name}/${a.name}`)
  expect(loose).toEqual([])
})

test("a roster-mate's rule can hand the whole team injury immunity", async () => {
  // Spiritual Chirurgy: the team has it "if you select this operative for the battle (even if
  // it's incapacitated later)" — a roster scan, not an aura, so no board is needed for it.
  const f = (await loadFaction('wolf-scouts'))!
  const pick = (n: RegExp) => f.operatives.find((o) => n.test(o.name))!
  const bearer = { ...pick(/Fangbearer/), id: 'ws-bearer' }
  const mate = { ...pick(/Wolf Scout (?!Fangbearer)/), id: 'ws-mate' }
  const wolf = { ...pick(/Fenrisian Wolf/), id: 'ws-wolf', name: 'Fenrisian Wolf' }

  const team = {
    id: 'ws', player: 'P', name: 'Wolf Scouts', short: 'WS', side: 'imperium',
    color: '#888', archetypes: [], faction: 'wolf-scouts', cp: 0, tacOp: '', tacVp: 0,
  }
  let g = reduce(initialGame(), { type: 'teamAdd', team, roster: [bearer, mate, wolf] })
  const hurtAll = (gg: Game) =>
    [bearer, mate, wolf].reduce((acc, o) => reduce(acc, { type: 'wound', opId: o.id, delta: -(o.w - 1) }), gg)
  g = hurtAll(g)

  expect(liveStats(g, mate, g.ops[mate.id]).ignoring).toBe('all')
  // ...and the card excludes the wolf by name, so it still takes the penalty.
  expect(liveStats(g, wolf, g.ops[wolf.id]).ignoring).toBeUndefined()
  expect(liveStats(g, wolf, g.ops[wolf.id]).move).not.toBe(wolf.move)

  // Nobody else's team is affected by it.
  expect(liveStats(g, teamOps(g, 'dw')[0], { hp: 1, expended: false, dead: false, order: 'engage' }).ignoring)
    .toBeUndefined()
})

/* ---------- effects: what is true right now ---------- */

const PLOY = { label: "Kau'yon", kind: 'strategy' as const, teamId: 'dw', until: 'tp' as const, fx: [] }
const w = { name: 'bolt rifle', atk: 4, hit: '3+', dmg: '3/4' }

test('a ploy in effect moves the numbers, and spends the CP', () => {
  const g = initialGame()
  const before = g.teams.dw.cp
  const on = reduce(g, { type: 'effectAdd', cost: 1, effect: { ...PLOY, fx: [{ apl: 1, hit: 1, rules: 'Balanced, Ceaseless' }] } })
  expect(on.teams.dw.cp).toBe(before - 1)

  const sgt = teamOps(on, 'dw')[0]
  const now = liveStats(on, sgt, on.ops[sgt.id])
  expect(now.apl).toBe(sgt.apl + 1)
  // Positive IMPROVES a roll stat in an effect, which is the opposite of `rollAfter`'s argument.
  expect(now.hit(w)).toBe('2+')
  expect(now.adds).toEqual(['Balanced', 'Ceaseless'])
  expect(now.from.map((e) => e.label)).toEqual(["Kau'yon"])
})

test('an effect reaches only its own team, and only its target when it has one', () => {
  const g = initialGame()
  const dw = teamOps(g, 'dw')
  const aimed = reduce(g, { type: 'effectAdd', effect: { ...PLOY, opId: dw[0].id, fx: [{ apl: 1 }] } })
  expect(liveStats(aimed, dw[0], aimed.ops[dw[0].id]).apl).toBe(dw[0].apl + 1)
  expect(liveStats(aimed, dw[1], aimed.ops[dw[1].id]).apl).toBe(dw[1].apl)
  // Another team is never touched, even one of the same faction.
  const dw2 = teamOps(g, 'dw2')[0]
  expect(liveStats(aimed, dw2, aimed.ops[dw2.id]).from).toEqual([])
})

test('effects stack, and the core rules floors still bind', () => {
  let g = initialGame()
  const sgt = teamOps(g, 'dw')[0]
  for (let i = 0; i < 3; i++) g = reduce(g, { type: 'effectAdd', effect: { ...PLOY, fx: [{ apl: 1, move: -1 }] } })
  const now = liveStats(g, sgt, g.ops[sgt.id])
  // "APL changes can never total more than +1", however many ploys say otherwise.
  expect(now.apl).toBe(sgt.apl + 1)
  // ...and Move never drops below 4".
  expect(now.move).toBe('4"')
})

test('injury and a ploy compose on the same weapon', () => {
  const g = initialGame()
  const sgt = teamOps(g, 'dw')[0]
  let hurt = reduce(g, { type: 'wound', opId: sgt.id, delta: -(sgt.w - 1) })
  expect(liveStats(hurt, sgt, hurt.ops[sgt.id]).hit(w)).toBe('4+') // injured alone
  hurt = reduce(hurt, { type: 'effectAdd', effect: { ...PLOY, fx: [{ hit: 1 }] } })
  expect(liveStats(hurt, sgt, hurt.ops[sgt.id]).hit(w)).toBe('3+') // the ploy cancels it out
})

test('a turning point ends everything but a battle-long effect', () => {
  let g = initialGame()
  const sgt = teamOps(g, 'dw')[0]
  for (const until of ['activation', 'tp', 'battle'] as const)
    g = reduce(g, { type: 'effectAdd', effect: { ...PLOY, until, label: until } })
  expect(g.effects.length).toBe(3)
  expect(reduce(g, { type: 'nextTp' }).effects.map((e) => e.label)).toEqual(['battle'])

  // An activation effect aimed at an operative ends when that operative activates...
  const aimed = reduce(g, { type: 'effectAdd', effect: { ...PLOY, until: 'activation', opId: sgt.id, label: 'aimed' } })
  const gone = reduce(aimed, { type: 'activate', opId: sgt.id })
  expect(gone.effects.some((e) => e.label === 'aimed')).toBe(false)
  // ...and readying it again is a correction, not an activation, so it ends nothing.
  const other = teamOps(g, 'dw')[1]
  const kept = reduce(aimed, { type: 'activate', opId: other.id })
  expect(kept.effects.some((e) => e.label === 'aimed')).toBe(true)
})

test('ending an effect does not refund the CP, and cannot resurrect one', () => {
  const g = reduce(initialGame(), { type: 'effectAdd', cost: 1, effect: PLOY })
  const spent = g.teams.dw.cp
  const off = reduce(g, { type: 'effectRemove', id: g.effects[0].id })
  expect(off.effects).toEqual([])
  expect(off.teams.dw.cp).toBe(spent) // a ploy that was used was used
  expect(reduce(off, { type: 'effectRemove', id: 'nonsense' }).effects).toEqual([])
})

test('deleting a team or an operative takes its effects with it', () => {
  const g = initialGame()
  const sgt = teamOps(g, 'dw')[0]
  let with2 = reduce(g, { type: 'effectAdd', effect: PLOY })
  with2 = reduce(with2, { type: 'effectAdd', effect: { ...PLOY, opId: sgt.id, label: 'aimed' } })
  expect(with2.effects.length).toBe(2)
  // `normalize` prunes them, so a dangling effect can never buff a re-minted id that happens to match.
  expect(reduce(with2, { type: 'teamRemove', teamId: 'dw' }).effects).toEqual([])
  // The roster cases bypass `normalize` on purpose, so dropping the operative an effect names
  // leaves it stored — and `effectsFor` heals it at read time, the way `pairUsed` is left inert.
  const cut = reduce(with2, { type: 'setRoster', teamId: 'dw', ops: teamOps(with2, 'dw').slice(1) })
  expect(effectsFor(cut, 'dw').map((e) => e.label)).toEqual(["Kau'yon"])
  expect(liveStats(cut, sgt, { hp: 1, expended: false, dead: false, order: 'engage' }).from).toEqual([])
})

test('a mapped ploy applies its effect with no one typing a number', () => {
  const g = initialGame()
  const atsknf = factionData('dw')!.cards.find((c) => c.name === 'And They Shall Know No Fear')!
  const g2 = reduce(g, ployEffect('dw', atsknf, 'dw'))
  expect(g2.teams.dw.cp).toBe(g.teams.dw.cp - 1)

  const sgt = teamOps(g2, 'dw')[0]
  const hurt = reduce(g2, { type: 'wound', opId: sgt.id, delta: -(sgt.w - 1) })
  const now = liveStats(hurt, sgt, hurt.ops[sgt.id])
  // "You can ignore any changes to the stats of friendly DEATHWATCH operatives from being
  // injured" — flat, whole-team, no trigger. The one shape this app can apply and be right about.
  expect(now.hurt).toBe(true)
  expect(now.ignoring).toBe('all')
  expect(now.move).toBe(sgt.move)
})

test('an unmapped ploy still applies, carrying its own printed text', () => {
  const g = initialGame()
  const card = factionData('dw')!.cards.find((c) => c.name === 'The Long Vigil')!
  const g2 = reduce(g, ployEffect('dw', card, 'dw'))
  const e = g2.effects[0]
  expect(e.label).toBe('The Long Vigil')
  expect(e.kind).toBe('strategy')
  expect(e.text).toBe(card.text) // what the player actually reads
  // Its whole effect is a defence re-roll, so it moves no number — it is a rider carrying its
  // own trigger, which is the honest result for most ploys in the game.
  const sgt = teamOps(g2, 'dw')[0]
  const now = liveStats(g2, sgt, g2.ops[sgt.id])
  expect(now.apl).toBe(sgt.apl)
  expect(now.adds).toEqual([])
  expect(now.riders.length).toBeGreaterThan(0)
  expect(now.riders[0].fx.when).toBeTruthy()
})

test('a ploy defaults to the duration its kind almost always has', () => {
  const g = initialGame()
  const cards = factionData('dw')!.cards
  const strat = reduce(g, ployEffect('dw', cards.find((c) => c.kind === 'strategy')!, 'dw'))
  const fire = reduce(g, ployEffect('dw', cards.find((c) => c.kind === 'firefight')!, 'dw'))
  expect(strat.effects[0].until).toBe('tp')
  expect(fire.effects[0].until).toBe('activation')
})

test('every mapped card name exists on the faction that claims it', async () => {
  // `src/fx/` is hand-written beside the GENERATED `src/factions/`, so a renamed or re-extracted
  // card would silently stop matching and the effect would just never apply.
  for (const [faction, cards] of Object.entries(MAPPED)) {
    const d = await loadFaction(faction)
    const names = new Set((d?.cards ?? []).map((c) => c.name))
    for (const name of Object.keys(cards)) expect([faction, name, names.has(name)]).toEqual([faction, name, true])
  }
})

test('every mapped faction covers all of its ploys and equipment', async () => {
  // Partial coverage is the trap: a player sees three of four ploys explain themselves and
  // assumes the fourth does nothing.
  for (const [faction, cards] of Object.entries(MAPPED)) {
    const d = await loadFaction(faction)
    const want = (d?.cards ?? []).filter((c) => c.kind !== 'faction').map((c) => c.name)
    for (const name of want) expect([faction, name, !!cards[name]]).toEqual([faction, name, true])
  }
})

test('a mapped modifier only moves the numbers when it is unconditional and unscoped', () => {
  for (const [faction, cards] of Object.entries(MAPPED))
    for (const [name, list] of Object.entries(cards))
      for (const f of list) {
        // A scoped or conditional entry is a rider. It may still carry numbers — they are for
        // the player to read and apply — but it must never be silently folded into a stat.
        const applied = !f.when && !f.scope
        if (applied) {
          // An applied entry has to actually say something, or it is a mapping mistake.
          const says = [f.apl, f.move, f.hit, f.save, f.atk, f.rules, f.tough].some((x) => x !== undefined)
          expect([faction, name, says]).toEqual([faction, name, true])
        }
      }
})

test('no applied effect comes from a card that names a single operative', async () => {
  // An applied entry lands on the WHOLE TEAM — the app is never told which model a ploy was
  // used on. This caught Raw Physiology, which reads "a friendly SCOUT SQUAD operative … add 1"
  // to its Move stat" and would otherwise have moved all nine Scouts.
  // "Whenever a friendly X operative is shooting" means ANY of them, so the singular there is
  // generic and applying is right — *Crucible of Battle* is exactly that. What is not safe is a
  // ploy that SELECTS one at the moment of use, which never says "whenever".
  const SINGULAR = /\ba friendly [A-Z][^.]{0,60}?\boperative\b(?!s)/
  const GENERIC = /\bwhenever a friendly\b/i
  const loose: string[] = []
  for (const [faction, cards] of Object.entries(MAPPED)) {
    const d = await loadFaction(faction)
    for (const [name, list] of Object.entries(cards)) {
      const text = d?.cards.find((c) => c.name === name)?.text ?? ''
      if (!SINGULAR.test(text) || GENERIC.test(text)) continue
      if (list.some((f) => !f.when && !f.scope)) loose.push(`${faction}:${name}`)
    }
  }
  expect(loose).toEqual([])
})

test('a scoped or conditional mapping is a rider and never moves a number', () => {
  const g = initialGame()
  // Waaagh! grants Balanced to MELEE weapons, and the app cannot tell a melee weapon from a
  // ranged one — the glyph is a graphic the PDFs never gave up. So it prints, it does not apply.
  const waaagh = factionData('kom')!.cards.find((c) => c.name === 'Waaagh!')!
  const on = reduce(g, ployEffect('kom', waaagh, 'kom'))
  const boss = teamOps(on, 'kom')[0]
  const now = liveStats(on, boss, on.ops[boss.id])
  expect(now.adds).toEqual([]) // nothing folded into the weapon table
  expect(now.riders.map((r) => [r.label, r.fx.scope, r.fx.rules])).toEqual([['Waaagh!', 'melee', 'Balanced']])
})

test("equipment the team took is always on, with no Effect record at all", () => {
  const g = initialGame()
  // Gear is chosen, not used — so its mapped effects ride along off `team.gear` rather than
  // needing anyone to activate anything.
  const kit = factionData('kom')!.cards.find((c) => c.kind === 'equipment')!
  const armed = reduce(g, { type: 'gear', teamId: 'kom', names: [kit.name] })
  const boss = teamOps(armed, 'kom')[0]
  const now = liveStats(armed, boss, armed.ops[boss.id])
  expect(armed.effects).toEqual([]) // nothing was "used"
  expect(now.riders.some((r) => r.label === kit.name)).toBe(true)
})

test('all thirteen mapped factions are wired into the index', () => {
  // The index is hand-written, like `src/factions/index.ts` — a module that exists but is not
  // registered simply never applies, silently.
  expect(Object.keys(MAPPED).sort()).toEqual(
    ['angron', 'aod', 'canoptek-circle', 'companions', 'dreadnought', 'dw', 'farsight',
     'kasrkin', 'kom', 'rav', 'relic-seekers', 'sct', 'xv26'].sort(),
  )
})

test('a snapshot whose effects predate `fx` is repaired, not fatal', () => {
  // `replace` merges over `initialGame()` at the top level only — nothing defaults a field
  // nested inside an array. This shipped once and white-screened the console: a stale save's
  // effects had no `fx`, and `liveStats` died on `e.fx.some`.
  const g = initialGame()
  const stale = { ...g, effects: [{ id: 'e-old', label: 'Old Ploy', teamId: 'dw', until: 'tp' }] } as unknown as Game
  const fixed = reduce(g, { type: 'replace', game: stale })
  expect(fixed.effects[0].fx).toEqual([])
  const sgt = teamOps(fixed, 'dw')[0]
  expect(() => liveStats(fixed, sgt, fixed.ops[sgt.id])).not.toThrow()
})

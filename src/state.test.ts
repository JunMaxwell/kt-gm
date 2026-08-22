import { expect, test } from 'bun:test'

import {
  ARCHETYPES,
  CATALOGUE,
  CRIT_OPS,
  TAC_OPS,
  TEAMS,
  blankOperative,
  fromCatalogue,
  killThresholds,
  tacOp,
  teamTacOps,
  teamsWithArchetype,
} from './rules'
import {
  canMove,
  counteract,
  currentTeamId,
  rotation,
  type Game,
  initialGame,
  killGrade,
  kills,
  objectiveCounts,
  orderCounts,
  reduce,
  scores,
  sideOps,
  suggestedCrit,
  teamOps,
  teamsOf,
} from './state'

const ids = (g: Game, teamId: string) => teamOps(g, teamId).map((o) => o.id)
const killOff = (g: Game, opIds: string[]) =>
  opIds.reduce((acc, opId) => reduce(acc, { type: 'dead', opId, dead: true }), g)

test('sides start at 25 vs 28 operatives across seven players', () => {
  const g = initialGame()
  expect(TEAMS.length).toBe(7)
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
  let g = initialGame() // initiative: imperium
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
  expect(g.ops['kom-extra-boy']).toEqual({ hp: 10, expended: false, dead: false, order: 'conceal' })
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
  let g = reduce(initialGame(), { type: 'activate', opId: teamOps(initialGame(), 'dw')[0].id })
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

/* ---------- orders ---------- */

test('the extra Deathwatch team shares the archetypes and tac ops of the first', () => {
  expect(teamTacOps('dw2').map((o) => o.name)).toEqual(teamTacOps('dw').map((o) => o.name))
  expect(teamsWithArchetype('Security').map((t) => t.id)).toEqual(['dw', 'aod', 'dw2'])
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
  expect(objectiveCounts(g)).toEqual({ imperium: 1, xenos: 1, neutral: 3 })
  g = reduce(g, { type: 'objective', index: 0, value: null })
  expect(objectiveCounts(g)).toEqual({ imperium: 0, xenos: 1, neutral: 4 })
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
  for (const t of TEAMS) {
    const mine = teamTacOps(t.id)
    expect(mine.length).toBe(6)
    expect(new Set(mine.map((o) => o.archetype))).toEqual(new Set(t.archetypes))
  }
})

test('teams sharing an archetype pair share a tac op list', () => {
  const names = (id: string) => teamTacOps(id).map((o) => o.name)
  expect(names('dw')).toEqual(names('aod')) // both Seek & Destroy + Security
  expect(names('dw')).toEqual(names('dw2'))
  expect(names('sct')).toEqual(names('xv26')) // both Infiltration + Recon
  expect(names('rav')).toEqual(names('kom')) // both Seek & Destroy + Infiltration
  expect(names('dw')).not.toEqual(names('sct'))
})

test('a team cannot reach a tac op outside its archetypes', () => {
  // Scouts are Infiltration + Recon, so no Seek & Destroy or Security ops
  const scouts = teamTacOps('sct').map((o) => o.name)
  expect(scouts).not.toContain('Rout')
  expect(scouts).not.toContain('Plant Banner')
  // and Deathwatch cannot take a Recon op
  expect(teamTacOps('dw').map((o) => o.name)).not.toContain('Flank')
})

test('every archetype is covered by at least one team', () => {
  for (const a of ARCHETYPES) expect(teamsWithArchetype(a).length).toBeGreaterThan(0)
  expect(teamsWithArchetype('Security').map((t) => t.id)).toEqual(['dw', 'aod', 'dw2'])
  expect(teamsWithArchetype('Recon').map((t) => t.id)).toEqual(['sct', 'xv26'])
})

test('setCritVp writes an absolute value and respects the per-TP cap', () => {
  let g = initialGame()
  g = reduce(g, { type: 'setCritVp', side: 'xenos', tp: 1, value: 9 })
  expect(g.crit.xenos[1]).toBe(3)
  g = reduce(g, { type: 'setCritVp', side: 'xenos', tp: 1, value: 2 })
  expect(g.crit.xenos[1]).toBe(2)
})

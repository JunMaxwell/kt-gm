import { expect, test } from 'bun:test'
import { renderToStaticMarkup as R } from 'react-dom/server'

import { blankOperative, presetRoster } from '../rules'
import { datacardOf, factionData, FACTIONS, loadFaction } from '../factions'
import { allTeams, initialGame, reduce, teamOps } from '../state'
import { Scoreboard } from './Scoreboard'
import { Objectives } from './Objectives'
import { ActivationOrder } from './ActivationOrder'
import { TurnBar } from './TurnBar'
import { TeamCard } from './TeamCard'
import { Setup } from './Setup'
import { Compendium, CompendiumBrowser, OperativeCard } from './Compendium'
import { OpsBrowser } from './OpsBrowser'

const noop = () => {}
const net = { room: null, viewer: false, create: noop, join: noop, leave: noop, save: noop, saves: [], load: noop } as never

const panels = (g: ReturnType<typeof initialGame>) =>
  [
    R(<TurnBar game={g} dispatch={noop} editing={false} setEditing={noop} net={net} canUndo />),
    R(<Scoreboard game={g} dispatch={noop} />),
    R(<Objectives game={g} dispatch={noop} />),
    R(<ActivationOrder game={g} dispatch={noop} />),
    R(<OpsBrowser game={g} />),
    R(<CompendiumBrowser game={g} />),
    R(<Setup game={g} dispatch={noop} />),
    ...allTeams(g).map((t) => R(<TeamCard teamId={t.id} game={g} dispatch={noop} editing={false} />)),
    ...allTeams(g).map((t) => R(<TeamCard teamId={t.id} game={g} dispatch={noop} editing />)),
    ...allTeams(g).map((t) => R(<Compendium game={g} teamId={t.id} />)),
  ].join('')

test('every panel renders for the default two-alliance match', () => {
  const html = panels(initialGame())
  expect(html).toContain('Imperium')
  expect(html).toContain('Xenos')
  expect(html).toContain('Deathwatch')
})

test('every panel renders for a three-alliance match with a custom team', () => {
  let g = reduce(initialGame(), { type: 'sideAdd' })
  const third = g.sides[2].id
  g = reduce(g, { type: 'sidePatch', id: third, patch: { name: 'Chaos', color: '#7b4fa8' } })
  g = reduce(g, { type: 'teamPatch', teamId: 'sct', patch: { side: third } })
  const team = { id: 'home', player: 'P8', name: 'Homebrew', short: 'HB', side: third, color: '#333', archetypes: [], cp: 0, tacOp: '', tacVp: 0 }
  g = reduce(g, { type: 'teamAdd', team, roster: presetRoster('dw', 'home') })
  const html = panels(g)
  expect(html).toContain('Chaos')
  expect(html).toContain('Homebrew')
  // The scoreboard is one BLOCK per alliance now, not one column: every side's name appears
  // as its own heading, which is what stops three alliances squeezing into a fixed panel.
  for (const side of g.sides) expect(html).toContain(side.name)
  // and a team that is not up is collapsed to its summary strip rather than a full card
  expect(html).toContain('Click to open')
})

test('every panel renders for a one-team-per-side match with no cards', () => {
  let g = initialGame()
  for (const id of ['aod', 'dw2', 'sct', 'xv26', 'kom']) g = reduce(g, { type: 'teamRemove', teamId: id })
  g = reduce(g, { type: 'teamPatch', teamId: 'dw', patch: { faction: undefined, archetypes: [] } })
  expect(() => panels(g)).not.toThrow()
})

test('the spectator view survives a snapshot whose teams it does not know', () => {
  const g = reduce(initialGame(), { type: 'teamRemove', teamId: 'dw' })
  expect(() => R(<Compendium game={g} teamId="dw" />)).not.toThrow()
})

test('a team on a lazily-loaded faction renders before and after its chunk arrives', async () => {
  const f = FACTIONS.find((x) => !x.preset)!
  let g = initialGame()
  const team = {
    id: 'lazy', player: 'P8', name: f.name, short: 'LZ', side: 'xenos',
    color: f.color, archetypes: [...f.archetypes], faction: f.id, cp: 0, tacOp: '', tacVp: 0,
  }
  g = reduce(g, { type: 'teamAdd', team, roster: [] })
  // before the chunk resolves the deck is empty — the same state a hand-built team is in
  expect(() => R(<Compendium game={g} teamId="lazy" />)).not.toThrow()
  const data = await loadFaction(f.id)
  expect(data!.cards.length).toBeGreaterThan(0)
  // the deck that opens depends on the phase, so assert some card of this faction landed
  const html = R(<Compendium game={g} teamId="lazy" />)
  expect(data!.cards.some((c) => html.includes(c.name))).toBe(true)
})

test('every faction in the picker can actually be loaded', async () => {
  for (const f of FACTIONS) {
    const min = f.custom ? 1 : 8 // homebrew is not held to the printed 4/4/4 format
    expect((await loadFaction(f.id))!.cards.length).toBeGreaterThan(min)
  }
})

test('a GM-authored card reaches the player view, ahead of the faction deck', () => {
  let g = initialGame()
  g = reduce(g, { type: 'cardAdd', teamId: 'rav', kind: 'faction' })
  const id = g.teams.rav.cards![0].id
  g = reduce(g, {
    type: 'cardPatch',
    teamId: 'rav',
    cardId: id,
    patch: { name: 'Angron', text: 'The Red Angel strikes twice.' },
  })
  // Compendium is the whole player view now, so this is the only channel a boss has
  const html = R(<Compendium game={g} teamId="rav" />)
  expect(html).toContain('Angron')
  expect(html).toContain('The Red Angel strikes twice.')
})

test('a hand-built team with only GM cards gets a working deck instead of a dead one', () => {
  const team = {
    id: 'boss', player: 'GM', name: 'Angron', short: 'ANG', side: 'xenos',
    color: '#8a1111', archetypes: [], cp: 0, tacOp: '', tacVp: 0,
  }
  let g = reduce(initialGame(), { type: 'teamAdd', team, roster: [] })
  expect(R(<Compendium game={g} teamId="boss" />)).not.toContain('Blood for')
  g = reduce(g, { type: 'cardAdd', teamId: 'boss', kind: 'faction' })
  const id = g.teams.boss.cards![0].id
  g = reduce(g, { type: 'cardPatch', teamId: 'boss', cardId: id, patch: { name: 'Butcher', text: 'Blood for the Blood God.' } })
  expect(R(<Compendium game={g} teamId="boss" />)).toContain('Blood for the Blood God.')
})

test("a player can read their own operatives' stats in the player view", () => {
  // Strip the rules so `ops` is the only deck this team owns — it must then be the one that
  // opens, rather than falling through to the universal equipment everybody shares.
  const g = reduce(initialGame(), { type: 'teamPatch', teamId: 'dw', patch: { faction: undefined, archetypes: [] } })
  const html = R(<Compendium game={g} teamId="dw" />)
  expect(html).toContain('Watch Sergeant')
  expect(html).toContain('Wounds')
  expect(html).toContain('15/15') // hp over starting wounds, straight off the snapshot
  expect(html).not.toContain('Ladder')
})

test("an operative's card carries its weapons, abilities and unique actions", () => {
  const g = initialGame()
  const kom = factionData('kom')
  const nob = teamOps(g, 'kom').find((o) => o.name === 'Boss Nob')!
  const html = R(<OperativeCard o={nob} st={g.ops[nob.id]} card={datacardOf(kom, nob.name)} kicker="Ork Kommandos" />)
  expect(html).toContain('Power klaw') // weapon, with its ATK/HIT/DMG row
  expect(html).toContain('5/7')
  expect(html).toContain('Brutal, Shock') // the weapon rules column
  expect(html).toContain('Krumpin') // ability
  expect(html).toContain('1AP') // unique action, with its cost
  expect(html).toContain('LEADER') // keywords line
})

// A hand-built team and the homebrew factions have no PDF, so no datacards. The card must
// still render — it simply shows less.
test('an operative with no datacard still renders its stats', () => {
  const g = initialGame()
  const nob = teamOps(g, 'kom')[0]
  const html = R(<OperativeCard o={nob} st={g.ops[nob.id]} kicker="Ork Kommandos" />)
  expect(html).toContain(nob.name)
  expect(html).toContain('Wounds')
  expect(html).not.toContain('Power klaw')
})

test('a boss operative renders in the roster editor with its kill value', () => {
  const boss = { ...blankOperative('rav'), name: 'Angron', w: 45, kv: 8 }
  const g = reduce(initialGame(), { type: 'addOp', teamId: 'rav', op: boss })
  const html = R(<TeamCard teamId="rav" game={g} dispatch={noop} editing />)
  expect(html).toContain('Angron')
  expect(html).toContain('45')
})

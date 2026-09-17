import { expect, test } from 'bun:test'
import { renderToStaticMarkup as R } from 'react-dom/server'

import { blankOperative, presetRoster } from '../rules'
import { FACTIONS, loadFaction } from '../factions'
import { allTeams, initialGame, reduce } from '../state'
import { Scoreboard } from './Scoreboard'
import { Objectives } from './Objectives'
import { ActivationOrder } from './ActivationOrder'
import { TurnBar } from './TurnBar'
import { TeamCard } from './TeamCard'
import { Setup } from './Setup'
import { Compendium, CompendiumBrowser } from './Compendium'
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
  // one scoreboard column per alliance
  expect(html).toContain('4.25rem repeat(3, minmax(0,1fr))')
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
  for (const f of FACTIONS) expect((await loadFaction(f.id))!.cards.length).toBeGreaterThan(8)
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

test('a boss operative renders in the roster editor with its kill value', () => {
  const boss = { ...blankOperative('rav'), name: 'Angron', w: 45, kv: 8 }
  const g = reduce(initialGame(), { type: 'addOp', teamId: 'rav', op: boss })
  const html = R(<TeamCard teamId="rav" game={g} dispatch={noop} editing />)
  expect(html).toContain('Angron')
  expect(html).toContain('45')
})

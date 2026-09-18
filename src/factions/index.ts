// The faction library: every Kill Team the app knows, from the official team rules PDFs.
//
// The six the preset match uses are imported STATICALLY, because `initialGame()` builds a
// roster at boot and cannot await. Every other faction is a dynamic import, so 40-odd
// factions of rules prose stay out of the initial bundle — Vite gives each its own chunk.
//
// A faction whose module is statically imported is folded into the main bundle rather than
// split, which is exactly what the preset six want, so the two maps below do not conflict.
import type { Archetype, Operative } from '../rules'
import type { Datacard, RefCard } from '../compendium'

import * as aod from './aod'
import * as dw from './dw'
import * as kom from './kom'
import * as rav from './rav'
import * as sct from './sct'
import * as xv26 from './xv26'

/** `datacards` is optional: a hand-written faction has none, and that is a normal state. */
export type FactionData = { cards: RefCard[]; operatives: Operative[]; datacards?: Datacard[] }
export type FactionMeta = {
  id: string
  name: string
  archetypes: Archetype[]
  color: string
  ink?: boolean
  /** Bundled rather than fetched: the preset match needs it before the first paint. */
  preset?: boolean
  /** Hand-written homebrew rather than extracted from an official PDF. */
  custom?: boolean
}

/**
 * Metadata for all of them. Small enough to always ship — the Setup picker needs it.
 *
 * This file is MAINTAINED BY HAND. `tools/kt_generate.py` writes the per-faction modules but
 * never this list, so a hand-written faction registered here survives regeneration — and a
 * newly extracted one has to be added here by hand.
 */
export const FACTIONS: FactionMeta[] = [
  // NEMESIS operatives, built with the official Custom Builder. See src/factions/nemesis.ts.
  { id: 'angron', name: 'Angron (Large Nemesis)', archetypes: ['Seek & Destroy'], color: '#8a1111', custom: true },
  { id: 'farsight', name: 'Commander Farsight (Small Nemesis)', archetypes: ['Seek & Destroy', 'Security'], color: '#b8621a', custom: true },
  // Homebrew kill team from KTDash. See the header of src/factions/companions.ts.
  { id: 'companions', name: 'Companions of the Emperor', archetypes: ['Seek & Destroy', 'Security'], color: '#c8a03c', custom: true },
  { id: 'relic-seekers', name: "Nocturne's Relic Seekers", archetypes: ['Seek & Destroy', 'Recon'], color: '#1c6b3a', custom: true },
  { id: 'aod', name: "Angels of Death", archetypes: ['Security', 'Seek & Destroy'], color: '#0066a5', preset: true },
  { id: 'battleclade', name: "Battleclade", archetypes: ['Infiltration', 'Recon'], color: '#5a5a7a' },
  { id: 'blades-of-khaine', name: "Blades of Khaine", archetypes: ['Seek & Destroy', 'Security', 'Infiltration', 'Recon'], color: '#5a5a7a' },
  { id: 'blooded', name: "Blooded", archetypes: ['Infiltration', 'Seek & Destroy'], color: '#8a5a2b' },
  { id: 'brood-brothers', name: "Brood Brothers", archetypes: ['Infiltration', 'Security'], color: '#7a2f3f' },
  { id: 'canoptek-circle', name: "Canoptek Circle", archetypes: ['Recon', 'Security'], color: '#6b2f5a' },
  { id: 'celestian-insidiants', name: "Celestian Insidiants", archetypes: ['Security', 'Seek & Destroy'], color: '#8a4f6b' },
  { id: 'chaos-cult', name: "Chaos Cult", archetypes: ['Infiltration', 'Seek & Destroy'], color: '#4f7a5a' },
  { id: 'corsair-voidscarred', name: "Corsair Voidscarred", archetypes: ['Infiltration', 'Recon'], color: '#6b4f8a' },
  { id: 'death-korps', name: "Death Korps", archetypes: ['Security', 'Seek & Destroy'], color: '#2f5a6b' },
  { id: 'dw', name: "Deathwatch", archetypes: ['Seek & Destroy', 'Security'], color: '#8a97a8', ink: true, preset: true },
  { id: 'elucidian-starstriders', name: "Elucidian Starstriders", archetypes: ['Recon', 'Security'], color: '#5a5a7a' },
  { id: 'exaction-squad', name: "Exaction Squad", archetypes: ['Security', 'Seek & Destroy'], color: '#3d5a80' },
  { id: 'exodite-dragon-masters', name: "Exodite Dragon Masters", archetypes: ['Recon', 'Seek & Destroy'], color: '#7a6b4f' },
  { id: 'farstalker-kinband', name: "Farstalker Kinband", archetypes: ['Infiltration', 'Recon'], color: '#5a5a7a' },
  { id: 'fellgor-ravagers', name: "Fellgor Ravagers", archetypes: ['Recon', 'Seek & Destroy'], color: '#6b4f8a' },
  { id: 'gellerpox-infected', name: "Gellerpox Infected", archetypes: ['Security', 'Seek & Destroy'], color: '#7a2f3f' },
  { id: 'goremongers', name: "Goremongers", archetypes: ['Recon', 'Seek & Destroy'], color: '#6b4f8a' },
  { id: 'hand-of-the-archon', name: "Hand of the Archon", archetypes: ['Recon', 'Seek & Destroy'], color: '#2f6f6f' },
  { id: 'hearthkyn-salvagers', name: "Hearthkyn Salvagers", archetypes: ['Recon', 'Security'], color: '#3d5a80' },
  { id: 'hernkyn-yaegirs', name: "Hernkyn Yaegirs", archetypes: ['Infiltration', 'Seek & Destroy'], color: '#3d5a80' },
  { id: 'hierotek-circle', name: "Hierotek Circle", archetypes: ['Recon', 'Security'], color: '#8a5a2b' },
  { id: 'hunter-clade', name: "Hunter Clade", archetypes: ['Recon', 'Seek & Destroy'], color: '#4f6b8a' },
  { id: 'imperial-navy-breachers', name: "Imperial Navy Breachers", archetypes: ['Security', 'Seek & Destroy'], color: '#4f7a5a' },
  { id: 'inquisitorial-agents', name: "Inquisitorial Agents", archetypes: ['Seek & Destroy', 'Security', 'Infiltration', 'Recon'], color: '#2f6f6f' },
  { id: 'kasrkin', name: "Kasrkin", archetypes: ['Security', 'Seek & Destroy'], color: '#6f7a2f' },
  { id: 'kom', name: "Kommandos", archetypes: ['Infiltration', 'Seek & Destroy'], color: '#3f8f29', preset: true },
  { id: 'legionaries', name: "Legionaries", archetypes: ['Security', 'Seek & Destroy'], color: '#6f7a2f' },
  { id: 'mandrakes', name: "Mandrakes", archetypes: ['Infiltration', 'Recon'], color: '#8a5a2b' },
  { id: 'murderwing', name: "Murderwing", archetypes: ['Recon', 'Seek & Destroy'], color: '#6f7a2f' },
  { id: 'nemesis-claw', name: "Nemesis Claw", archetypes: ['Infiltration', 'Seek & Destroy'], color: '#2f6b4f' },
  { id: 'novitiates', name: "Novitiates", archetypes: ['Recon', 'Security'], color: '#6b2f5a' },
  { id: 'pathfinders', name: "Pathfinders", archetypes: ['Infiltration', 'Recon'], color: '#6b2f5a' },
  { id: 'phobos-strike-team', name: "Phobos Strike Team", archetypes: ['Infiltration', 'Recon'], color: '#8a5a2b' },
  { id: 'plague-marines', name: "Plague Marines", archetypes: ['Security', 'Seek & Destroy'], color: '#8a4f6b' },
  { id: 'ratlings', name: "Ratlings", archetypes: ['Security', 'Infiltration'], color: '#2f5a6b' },
  { id: 'rav', name: "Raveners", archetypes: ['Infiltration', 'Seek & Destroy'], color: '#b83227', preset: true },
  { id: 'sanctifiers', name: "Sanctifiers", archetypes: ['Security', 'Seek & Destroy'], color: '#2f6b4f' },
  { id: 'sct', name: "Scout Squad", archetypes: ['Infiltration', 'Recon'], color: '#5c5f63', preset: true },
  { id: 'spectre-squad', name: "Spectre Squad", archetypes: ['Infiltration', 'Recon'], color: '#8a6f2f' },
  { id: 'tempestus-aquilons', name: "Tempestus Aquilons", archetypes: ['Recon', 'Seek & Destroy'], color: '#8a4f6b' },
  { id: 'vespid-stingwings', name: "Vespid Stingwings", archetypes: ['Recon', 'Seek & Destroy'], color: '#7a6b4f' },
  { id: 'voiddancer-troupe', name: "Void-Dancer Troupe", archetypes: ['Infiltration', 'Recon'], color: '#6f7a2f' },
  { id: 'warpcoven', name: "Warpcoven", archetypes: ['Recon', 'Security'], color: '#4f6b8a' },
  { id: 'wolf-scouts', name: "Wolf Scouts", archetypes: ['Recon', 'Seek & Destroy'], color: '#2f6b4f' },
  { id: 'wrecka-krew', name: "Wrecka Krew", archetypes: ['Security', 'Seek & Destroy'], color: '#6b2f5a' },
  { id: 'wyrmblade', name: "Wyrmblade", archetypes: ['Infiltration', 'Seek & Destroy'], color: '#2f6b4f' },
  { id: 'xv26', name: "XV26 Stealth Battlesuits", archetypes: ['Infiltration', 'Recon'], color: '#dfe3e8', ink: true, preset: true },
]

export const factionMeta = (id?: string) => FACTIONS.find((f) => f.id === id)

const BUNDLED: Record<string, FactionData> = {
  aod,
  dw,
  kom,
  rav,
  sct,
  xv26,
}

const CHUNKS: Record<string, () => Promise<FactionData>> = {
  angron: () => import('./angron'),
  companions: () => import('./companions'),
  farsight: () => import('./farsight'),
  'relic-seekers': () => import('./relic-seekers'),
  'battleclade': () => import('./battleclade'),
  'blades-of-khaine': () => import('./blades-of-khaine'),
  'blooded': () => import('./blooded'),
  'brood-brothers': () => import('./brood-brothers'),
  'canoptek-circle': () => import('./canoptek-circle'),
  'celestian-insidiants': () => import('./celestian-insidiants'),
  'chaos-cult': () => import('./chaos-cult'),
  'corsair-voidscarred': () => import('./corsair-voidscarred'),
  'death-korps': () => import('./death-korps'),
  'elucidian-starstriders': () => import('./elucidian-starstriders'),
  'exaction-squad': () => import('./exaction-squad'),
  'exodite-dragon-masters': () => import('./exodite-dragon-masters'),
  'farstalker-kinband': () => import('./farstalker-kinband'),
  'fellgor-ravagers': () => import('./fellgor-ravagers'),
  'gellerpox-infected': () => import('./gellerpox-infected'),
  'goremongers': () => import('./goremongers'),
  'hand-of-the-archon': () => import('./hand-of-the-archon'),
  'hearthkyn-salvagers': () => import('./hearthkyn-salvagers'),
  'hernkyn-yaegirs': () => import('./hernkyn-yaegirs'),
  'hierotek-circle': () => import('./hierotek-circle'),
  'hunter-clade': () => import('./hunter-clade'),
  'imperial-navy-breachers': () => import('./imperial-navy-breachers'),
  'inquisitorial-agents': () => import('./inquisitorial-agents'),
  'kasrkin': () => import('./kasrkin'),
  'legionaries': () => import('./legionaries'),
  'mandrakes': () => import('./mandrakes'),
  'murderwing': () => import('./murderwing'),
  'nemesis-claw': () => import('./nemesis-claw'),
  'novitiates': () => import('./novitiates'),
  'pathfinders': () => import('./pathfinders'),
  'phobos-strike-team': () => import('./phobos-strike-team'),
  'plague-marines': () => import('./plague-marines'),
  'ratlings': () => import('./ratlings'),
  'sanctifiers': () => import('./sanctifiers'),
  'spectre-squad': () => import('./spectre-squad'),
  'tempestus-aquilons': () => import('./tempestus-aquilons'),
  'vespid-stingwings': () => import('./vespid-stingwings'),
  'voiddancer-troupe': () => import('./voiddancer-troupe'),
  'warpcoven': () => import('./warpcoven'),
  'wolf-scouts': () => import('./wolf-scouts'),
  'wrecka-krew': () => import('./wrecka-krew'),
  'wyrmblade': () => import('./wyrmblade'),
}

const cache: Record<string, FactionData> = { ...BUNDLED }

/** What is already in memory. Returns undefined for a faction still to be fetched. */
export const factionData = (id?: string): FactionData | undefined => (id ? cache[id] : undefined)

/**
 * Fetch a faction's cards and datacards. Resolves immediately for a bundled one.
 * Unknown ids resolve to undefined rather than throwing — a hand-built team has no
 * faction at all, and that is a normal state, not an error.
 */
export const loadFaction = async (id?: string): Promise<FactionData | undefined> => {
  if (!id) return undefined
  if (cache[id]) return cache[id]
  const chunk = CHUNKS[id]
  if (!chunk) return undefined
  const mod = await chunk()
  cache[id] = { cards: mod.cards, operatives: mod.operatives, datacards: mod.datacards }
  return cache[id]
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

/**
 * The datacard for a roster operative, or undefined.
 *
 * The join is by name because the two conventions differ and neither can move: the preset six
 * keep the SHORT hand-curated `CATALOGUE` names the default rosters are built from ("Aegis"),
 * while the PDFs print the full one ("Deathwatch Aegis Veteran"). So a name matches when its
 * words appear as a contiguous run in the datacard's, and the SHORTEST such datacard wins —
 * without that, "Boy" matches every Kommando from Breacha to Snipa.
 *
 * Verified against the real data: every `CATALOGUE` entry and every `DEFAULT_ROSTER` operative
 * across all six preset factions resolves to exactly one datacard.
 */
export const datacardOf = (data: FactionData | undefined, name: string): Datacard | undefined => {
  const cards = data?.datacards
  if (!cards?.length) return undefined
  // a roster duplicate is "Warrior 2"; its datacard is just "Warrior"
  const want = words(name.replace(/\s+\d+$/, ''))
  if (!want.length) return undefined

  let best: Datacard | undefined
  let bestLen = Infinity
  for (const c of cards) {
    const have = words(c.name)
    if (have.length >= bestLen) continue
    if (have.some((_, i) => want.every((w, k) => have[i + k] === w))) {
      best = c
      bestLen = have.length
    }
  }
  return best
}

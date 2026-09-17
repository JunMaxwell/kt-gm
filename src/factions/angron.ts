// HAND-WRITTEN — not generated, unlike the extracted modules in this directory.
//
// Angron built with the official Nemesis Custom Builder from Kill Team: Nemesis Operatives:
// step 1 allegiance (CHAOS), step 2 size (Large), step 4 weapons (3 selections), step 5 traits
// (one allegiance trait, one nemesis trait), step 7 core rules.
//
// The statline is not a choice — Large is Control 6 / Move 6" / Save 4+ / 75W / 3 weapons,
// straight off the size table. His durability is wounds plus the extra defence dice, NOT a good
// save; an earlier draft of this file gave him 50W and a 2+, which is not a legal nemesis
// operative and made him far harder to hurt than the format intends.
//
// Weapon names are his 10th-edition Warhammer 40,000 wargear mapped onto the builder's profiles:
// Spinegrinder is a chain weapon, Samni'arius a power weapon, and the third selection is Paired
// weapon, which is how the builder represents two weapons chained to his wrists.
//
// The allegiance trait text is NOT in the dossier — the book defers to separate allegiance cards.
// It came from KTDash's API (see CLAUDE.md).
import type { Datacard, RefCard } from '../compendium'
import type { Operative } from '../rules'
import { nemesisCore } from './nemesis'

// Each trait is written once and used by both the Rules card and the datacard below. Two
// copies of a rules paragraph is two things to keep in step — the same reason nemesis.ts exists.
const ALLEGIANCE = {
  name: 'Let the Galaxy Burn',
  text: 'Allegiance trait — CHAOS.\nWhenever a friendly CHAOS NEMESIS operative is wholly within enemy territory, its weapons have the Balanced weapon rule.',
}
const TRAIT = {
  name: 'Fury',
  text: 'Nemesis trait.\nThis operative’s melee weapons have the Ceaseless weapon rule; if a weapon already has that rule, it has the Relentless weapon rule instead. Worsen the Hit stat of this operative’s ranged weapons by 1 — Angron carries none, so this costs him nothing.',
}

export const cards: RefCard[] = [
  {
    kind: 'faction',
    name: 'Angron, the Red Angel',
    text: 'CONTROL 6 · MOVE 6" · SAVE 4+ · 75 WOUNDS.\nKeywords: CHAOS, KHORNE, DAEMON, NEMESIS, ANGRON.\n— Spinegrinder (chain weapon): ATK 5, HIT 3+, DMG 5/6. Brutal, Rending.\n— Samni’arius (power weapon): ATK 4, HIT 3+, DMG 5/7. Lethal 5+.\nHis third weapon selection is Paired weapon: Spinegrinder’s ATK already includes the +1 it grants. Both weapons are chained to his wrists in true Nucerian style.',
  },
  nemesisCore('Large'),
  { kind: 'faction', ...ALLEGIANCE },
  { kind: 'faction', ...TRAIT },
]

// The same shape the extractor emits for a printed datacard, so the player's Ops deck shows
// Angron the way it shows everyone else. Without this the two bosses — the operatives whose
// rules matter most — would be the only ones reduced to four bare numbers.
export const datacards: Datacard[] = [
  {
    name: 'Angron',
    weapons: [
      { name: 'Spinegrinder (chain weapon)', atk: 5, hit: '3+', dmg: '5/6', wr: 'Brutal, Rending' },
      { name: 'Samni’arius (power weapon)', atk: 4, hit: '3+', dmg: '5/7', wr: 'Lethal 5+' },
    ],
    abilities: [
      TRAIT,
      ALLEGIANCE,
      {
        name: 'Paired Weapon',
        text: 'His third weapon selection. Spinegrinder’s ATK already includes the +1 it grants — both weapons are chained to his wrists in true Nucerian style.',
      },
    ],
    actions: [],
    keywords: ['CHAOS', 'KHORNE', 'DAEMON', 'NEMESIS', 'ANGRON', 'TOWERING'],
  },
]

export const operatives: Operative[] = [
  // `apl` carries the CONTROL stat: the app has one stat slot and the datacard card explains
  // the difference. `acts: 2` is the core rule, not a special case.
  { id: 'angron:angron', name: 'Angron', apl: 6, move: '6"', save: '4+', w: 75, acts: 2, lockOrder: 'engage', kv: 10 },
]

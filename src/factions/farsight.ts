// HAND-WRITTEN — not generated, unlike the extracted modules in this directory.
//
// Commander Farsight built with the official Nemesis Custom Builder: allegiance T'AU EMPIRE,
// size Medium (Control 5 / Move 6" / Save 4+ / 50W / 2 weapons), two weapon selections, one
// allegiance trait and one nemesis trait.
//
// Deliberately the same core rules and save as Angron — the two bosses differ by TIER, not by
// invention. Farsight is two-thirds the wounds, one fewer weapon, and trades Angron's melee
// trait for a gun and a close-range shooting trait.
//
// His 10th-edition wargear mapped onto builder profiles: the high-intensity plasma rifle is a
// plasma gun (both firing modes), the Dawn Blade a power weapon. He is modelled with a shield
// generator too — swap the nemesis trait to Shielded if you would rather represent that than
// Way of the Short Blade.
import type { Datacard, RefCard } from '../compendium'
import type { Operative } from '../rules'
import { nemesisCore } from './nemesis'

// Written once, used by both the Rules card and the datacard below — see angron.ts.
const ALLEGIANCE = {
  name: 'Supporting Fire',
  text: 'Allegiance trait — T’AU EMPIRE.\nWhenever a friendly T’AU EMPIRE NEMESIS operative is within 3" of another friendly T’AU EMPIRE operative, that NEMESIS operative’s ranged weapons have the Accurate 1 weapon rule.',
}
const TRAIT = {
  name: 'Close-range Lethality',
  text: 'Nemesis trait.\nWhenever this operative is shooting the closest valid target within 8" of it, its ranged weapons have the Lethal 5+ weapon rule; if the weapon already has that rule, it also has the Severe weapon rule.\nThis is the Way of the Short Blade: Farsight closes to a range no other T’au commander would accept.',
}

export const cards: RefCard[] = [
  {
    kind: 'faction',
    name: 'Commander Farsight',
    text: 'CONTROL 5 · MOVE 6" · SAVE 4+ · 50 WOUNDS.\nKeywords: T’AU EMPIRE, FARSIGHT ENCLAVES, BATTLESUIT, NEMESIS, COMMANDER FARSIGHT.\n— High-intensity plasma rifle (standard): ATK 4, HIT 3+, DMG 4/6. Piercing 1.\n— High-intensity plasma rifle (supercharge): ATK 4, HIT 3+, DMG 5/6. Hot, Lethal 5+, Piercing 1.\n— Dawn Blade (power weapon): ATK 4, HIT 3+, DMG 5/7. Lethal 5+.\nThe Dawn Blade is a mystery even to the Enclaves: a blade that should not cut what it cuts.',
  },
  nemesisCore('Medium'),
  { kind: 'faction', ...ALLEGIANCE },
  { kind: 'faction', ...TRAIT },
]

export const datacards: Datacard[] = [
  {
    name: 'Commander Farsight',
    weapons: [
      { name: 'High-intensity plasma rifle (standard)', atk: 4, hit: '3+', dmg: '4/6', wr: 'Piercing 1' },
      { name: 'High-intensity plasma rifle (supercharge)', atk: 4, hit: '3+', dmg: '5/6', wr: 'Hot, Lethal 5+, Piercing 1' },
      { name: 'Dawn Blade (power weapon)', atk: 4, hit: '3+', dmg: '5/7', wr: 'Lethal 5+' },
    ],
    abilities: [TRAIT, ALLEGIANCE],
    actions: [],
    keywords: ['T’AU EMPIRE', 'FARSIGHT ENCLAVES', 'BATTLESUIT', 'NEMESIS', 'COMMANDER FARSIGHT', 'TOWERING'],
  },
]

export const operatives: Operative[] = [
  { id: 'farsight:farsight', name: 'Commander Farsight', apl: 5, move: '6"', save: '4+', w: 50, acts: 2, lockOrder: 'engage', kv: 7 },
]

// HAND-WRITTEN — not generated, unlike the extracted modules in this directory.
//
// Commander Farsight built with the official Nemesis Custom Builder: allegiance T'AU EMPIRE,
// size Small (Control 4 / Move 6" / Save 4+ / 35W / 2 weapons), two weapon selections, one
// allegiance trait and one nemesis trait.
//
// SMALL IS THE BOOK'S OWN ANSWER FOR THIS MODEL. The dossier's worked example (pgs 26-27) is an
// XV8 Crisis Battlesuit — Farsight's exact chassis, same 50mm base — and it is built at Size:
// Small, 4/6"/4+/35, "as it will be fighting alongside an XV26 STEALTH BATTLESUIT kill team". It
// even takes Shielded for its countermeasures. He was Medium here only while he was a solo
// one-model team with nothing to escort him.
//
// HE IS PAIRED WITH THE XV26 TEAM, and that is what pays for Small. Per the team-size reduction
// table (pg 35), XV26's normal starting size of 7 drops to 5 alongside a Small nemesis operative.
// The app cannot put him inside another team's roster — the operative picker only offers
// CATALOGUE[faction] — so he stays his own team in XV26's alliance, and the pairing is expressed
// by giving both teams the same `player`. `teams[].player` is free text precisely for this.
//
// Deliberately the same core rules and save as Angron — the two bosses differ by TIER, not by
// invention. Angron is Large and alone; Farsight is Small and escorted.
//
// His 10th-edition wargear mapped onto builder profiles: the high-intensity plasma rifle is a
// plasma gun (both firing modes), the Dawn Blade a power weapon. He is modelled with a shield
// generator too — swap the nemesis trait to Shielded if you would rather represent that than
// Way of the Short Blade — which is what the book's own XV8 example does.
//
// The ploys below are HOMEBREW, like Angron's, and for the same reason: the Custom Builder has no
// ploy step, and a boss modelled as a standalone team has no accompanying kill team to borrow from.
// They are deliberately nothing like Angron's. He is a solo monster who pays in blood; Farsight is
// a COMMANDER who pays in position, so half his deck reaches other teams.
//
// Three of them say "an operative from Farsight's alliance" rather than "a friendly operative".
// That is not flavour: he is his own one-model team, so "friendly" would mean only himself and the
// card would do nothing. `Game.sides` is what an alliance means here, and the GM referees it. Those
// three are the cards the XV26 pairing switches on — at 35W he needs the escort those cards assume.
import type { Datacard, RefCard } from '../compendium'
import type { Operative } from '../rules'
import { nemesisCore } from './nemesis'

// Written once, used by both the Rules card and the datacard below — see angron.ts.
const ALLEGIANCE = {
  name: 'Supporting Fire',
  text: 'Allegiance trait — T’AU EMPIRE.\nWhenever a friendly T’AU EMPIRE NEMESIS operative is within 3" of another friendly T’AU EMPIRE operative, that T’AU EMPIRE operative’s ranged weapons have the Accurate 1 weapon rule.',
}
const TRAIT = {
  name: 'Close-range Lethality',
  text: 'Nemesis trait.\nWhenever this operative is shooting the closest valid target within 8" of it, its ranged weapons have the Lethal 5+ weapon rule; if the weapon already has that rule, it also has the Severe weapon rule.\nThis is the Way of the Short Blade: Farsight closes to a range no other T’au commander would accept.',
}

export const cards: RefCard[] = [
  {
    kind: 'faction',
    name: 'Commander Farsight',
    text: 'CONTROL 4 · MOVE 6" · SAVE 4+ · 35 WOUNDS.\nKeywords: T’AU EMPIRE, FARSIGHT ENCLAVES, BATTLESUIT, NEMESIS, COMMANDER FARSIGHT.\n— High-intensity plasma rifle (standard): ATK 4, HIT 3+, DMG 4/6. Piercing 1.\n— High-intensity plasma rifle (supercharge): ATK 4, HIT 3+, DMG 5/6. Hot, Lethal 5+, Piercing 1.\n— Dawn Blade (power weapon): ATK 4, HIT 3+, DMG 5/7. Lethal 5+.\nHE CAN BE SHOT WHILE LOCKED IN COMBAT — Towering Size means being within control range of other operatives never stops him being a valid target for the Shoot action.\nThe Dawn Blade is a mystery even to the Enclaves: a blade that should not cut what it cuts.',
  },
  nemesisCore('Small'),
  { kind: 'faction', ...ALLEGIANCE },
  { kind: 'faction', ...TRAIT },

  {
    kind: 'strategy',
    name: 'Mont’ka',
    text: 'Use this strategy ploy. Select one enemy operative visible to Farsight — the Killing Blow is declared before it lands. Until the end of the turning point, whenever an operative from Farsight’s alliance is shooting that operative, its ranged weapons have the Balanced weapon rule.',
  },
  {
    kind: 'strategy',
    name: 'Thrust Vector',
    text: 'Use this strategy ploy. Until the end of the turning point, the Fall Back action costs Farsight 1 less AP and he can move an additional 3" during it. No T’au commander stays in a melee he has already won.',
  },
  {
    kind: 'strategy',
    name: 'Interposing Drones',
    text: 'Use this strategy ploy. Until the end of the turning point, whenever an operative is shooting Farsight, you can retain one of your defence dice as a normal success without rolling it. This is the cover his TOWERING SIZE denies him, bought back with drones rather than terrain.',
  },
  {
    kind: 'strategy',
    cp: 0,
    name: 'Command Uplink',
    text: 'This strategy ploy costs 0CP. If Farsight is within 3" of another operative from his alliance, gain 1CP. You can use this ploy only once per turning point — he commands, and command is worth something.',
  },

  {
    kind: 'firefight',
    name: 'Unerring Aim',
    text: 'Use this firefight ploy when Farsight is shooting, in the Roll Attack Dice step. You can retain one of your attack dice as a critical success without rolling it.',
  },
  {
    kind: 'firefight',
    name: 'Dawn Blade',
    text: 'Use this firefight ploy when Farsight is fighting or retaliating, at the start of the Roll Attack Dice step. Until the end of that sequence, the Dawn Blade has the Brutal and Rending weapon rules — a blade that should not cut what it cuts.',
  },
  {
    kind: 'firefight',
    name: 'Covering Volley',
    text: 'Use this firefight ploy when an enemy operative ends the Charge action within control range of an operative from Farsight’s alliance that is within 6" of Farsight. Interrupt that action: Farsight can immediately perform a free Shoot action against that enemy operative with his high-intensity plasma rifle (standard).',
  },
  {
    kind: 'firefight',
    name: 'Reactive Protocols',
    text: 'Use this firefight ploy when Farsight counteracts. He can perform two 1AP actions instead of one, and the 2" movement limit does not apply to the first of them. As a one-model kill team he runs dry early and banks counteracts while the enemy is still activating — this is what he does with them.',
  },
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
  { id: 'farsight:farsight', name: 'Commander Farsight', apl: 4, move: '6"', save: '4+', w: 35, acts: 2, lockOrder: 'engage', kv: 5 },
]

// HAND-WRITTEN — not generated, unlike the extracted modules in this directory.
//
// Angron built with the official Nemesis Custom Builder from Kill Team: Nemesis Operatives:
// step 1 allegiance (CHAOS), step 2 size (Large), step 4 weapons, step 5 traits, step 7 core rules.
//
// The statline is not a choice — Large is Control 6 / Move 6" / Save 4+ / 75W / 3 weapons,
// straight off the size table. His durability is wounds plus the extra defence dice, NOT a good
// save; an earlier draft of this file gave him 50W and a 2+, which is not a legal nemesis
// operative and made him far harder to hurt than the format intends.
//
// Weapon names are his 10th-edition Warhammer 40,000 wargear mapped onto the builder's profiles:
// Spinegrinder is a chain weapon and Samni'arius a power weapon.
//
// Large grants THREE weapon selections and he spends only two. That is deliberate, not an
// oversight: pg 16 and pg 19 both state that a weapon selection you do not use converts into an
// extra nemesis trait selection, which is where Implacable comes from. He used to spend the third
// on Paired weapon (+1 Atk to one other melee weapon), which is why Spinegrinder was ATK 5 here
// and is ATK 4 now — the printed chain weapon stat.
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
  text: 'Allegiance trait — CHAOS.\nWhenever a friendly CHAOS operative is wholly within enemy territory, its weapons have the Balanced weapon rule.',
}
const FURY = {
  name: 'Fury',
  text: 'Nemesis trait.\nThis operative’s melee weapons have the Ceaseless weapon rule; if a weapon already has that rule, it has the Relentless weapon rule instead. Worsen the Hit stat of this operative’s ranged weapons by 1.',
}
// The one ability that is NOT also spread into `cards`. Fury, Implacable and the allegiance trait
// appear in both because they are format rules a player needs beside the core-rules card; No Escape
// is just something Angron does, so it lives on his datacard and nowhere else. The Rules deck was
// six cards deep and this is the one that belongs with his weapons instead.
const NO_ESCAPE = {
  name: 'No Escape',
  text: 'Whenever an enemy operative within this operative’s control range performs the Fall Back action, before that operative moves, this operative can perform a free Fight action against it. Nothing disengages from Angron by walking away.',
}
const IMPLACABLE = {
  name: 'Implacable',
  text: 'Ignore any changes to this operative’s weapon stats from being injured. Angron keeps HIT 3+ on both weapons all the way down to his last wound; Injured still costs him the 2" of Move.',
}

export const cards: RefCard[] = [
  {
    kind: 'faction',
    name: 'Angron, the Red Angel',
    text: 'CONTROL 6 · MOVE 6" · SAVE 4+ · 75 WOUNDS.\nKeywords: CHAOS, KHORNE, DAEMON, NEMESIS, ANGRON.\n— Spinegrinder (chain weapon): ATK 4, HIT 3+, DMG 5/6. Brutal, Rending.\n— Samni’arius (power weapon): ATK 4, HIT 3+, DMG 5/7. Lethal 5+.\nHE CAN BE SHOT WHILE LOCKED IN COMBAT — Towering Size means being within control range of other operatives never stops him being a valid target for the Shoot action.',
  },
  nemesisCore('Large'),
  { kind: 'faction', ...ALLEGIANCE },
  { kind: 'faction', ...FURY },
  { kind: 'faction', ...IMPLACABLE },

  // HOMEBREW, and outside the Nemesis format — the builder gives a nemesis operative an
  // allegiance trait and a nemesis trait, not ploys of its own. It assumes the operative joins a
  // kill team and spends that team's ploys; here Angron IS the team, so without these his player
  // banks CP every turning point with nothing to spend it on.
  //
  // Every one names Angron rather than a keyword: he has NO FACTION KEYWORD (see the core rules
  // card), so a ploy worded "a friendly X operative" could never select him.
  //
  // 1CP each like every 2024 ploy, and his player earns 1–2CP a turning point — so this is a menu
  // of four, not a combo engine. Only the heal carries an extra cap, at the user's request.
  // The strategy four. Each solves a different one of Angron's four real problems — he dies on
  // the way in, the enemy hides from him, downing him hands the enemy ten kills, and his player
  // is permanently broke — and the set is deliberately NOT four wound-trades: two of them bleed
  // him, which is the theme, and four would just kill him.
  {
    kind: 'strategy',
    cp: 0,
    name: 'Blood Tithe',
    text: 'This strategy ploy costs 0CP. Inflict 5 damage on Angron, then gain 2CP. You cannot use this ploy unless he has MORE wounds remaining than that damage, and you can use it only once per turning point.',
  },
  {
    kind: 'strategy',
    name: 'Heedless Onslaught',
    text: 'Use this strategy ploy. Until the end of the turning point, add 2" to Angron’s Move stat, and whenever he performs the Charge action he can move an additional 3". However, until the end of the turning point, worsen his Save stat by 1 — he is not defending himself, he is closing.',
  },  {
    kind: 'strategy',
    name: 'No Sanctuary',
    text: 'Use this strategy ploy. Until the end of the turning point, whenever you determine an enemy operative\u2019s order, if it is within 6" of Angron you cannot select Conceal. Nothing hides from the Red Angel.',
  },

  {
    kind: 'strategy',
    name: 'Bring Down the Walls',
    text: 'Use this strategy ploy. Select one terrain feature within 6" of Angron that he cannot move through. Until the end of the turning point, at the end of each enemy operative’s activation, if that operative is wholly within that terrain feature, inflict D3+3 damage on it. He cannot reach them, so he brings the building down on them instead.',
  },

  {
    kind: 'firefight',
    cp: 0,
    name: 'Reborn from Blood',
    text: 'Use this firefight ploy the first time Angron would be incapacitated during a turning point, before he is removed from the killzone. Spend all your remaining CP. If you do, he is not incapacitated: set his wounds remaining to 20. Once per battle.',
  },
  {
    kind: 'firefight',
    name: 'Blood for the Blood God',
    text: 'Use this firefight ploy once per turning point, when Angron incapacitates an enemy operative. He immediately regains D3+3 lost wounds.',
  },
  {
    kind: 'firefight',
    name: 'Relentless Carnage',
    text:
      'Use this firefight ploy at the end of Angron’s activation. Select one option below, then inflict that many damage on Angron and resolve its effect. You cannot select an option unless he has MORE wounds remaining than it costs — the Butcher’s Nails take their due before the enemy does. Measure his control range for this ploy using the 1" horizontal and 4" vertical distances from his BULKY rule, so he reaches up into the floor above him as readily as across the one he stands on.\n' +
      '• 3 damage — inflict D3+3 damage on each enemy operative within his control range.\n' +
      '• 6 damage — inflict D3+3 damage TWICE on each enemy operative within his control range.\n' +
      '• 10 damage — as the 6 damage option, but on each enemy operative within 4" of him instead of his control range. This use of the ploy costs 0CP, and you can select this option only once per turning point.',
  },
  {
    kind: 'firefight',
    name: 'Butcher’s Frenzy',
    text: 'Use this firefight ploy when Angron is fighting or retaliating, at the start of the Roll Attack Dice step. Add 3 to the Atk stat of the melee weapon he is using until the end of that sequence. The Nails do not let him stop: until the end of the turning point he cannot perform the Fall Back action.',
  },]

// The same shape the extractor emits for a printed datacard, so the player's Ops deck shows
// Angron the way it shows everyone else. Without this the two bosses — the operatives whose
// rules matter most — would be the only ones reduced to four bare numbers.
export const datacards: Datacard[] = [
  {
    name: 'Angron',
    weapons: [
      { name: 'Spinegrinder (chain weapon)', atk: 4, hit: '3+', dmg: '5/6', wr: 'Brutal, Rending' },
      { name: 'Samni’arius (power weapon)', atk: 4, hit: '3+', dmg: '5/7', wr: 'Lethal 5+' },
    ],
    abilities: [FURY, IMPLACABLE, NO_ESCAPE, ALLEGIANCE],
    actions: [],
    keywords: ['CHAOS', 'KHORNE', 'DAEMON', 'NEMESIS', 'ANGRON', 'TOWERING'],
  },
]

export const operatives: Operative[] = [
  // `apl` carries the CONTROL stat: the app has one stat slot and the datacard card explains
  // the difference. `acts: 2` is the core rule, not a special case.
  { id: 'angron:angron', name: 'Angron', apl: 6, move: '6"', save: '4+', w: 75, acts: 2, lockOrder: 'engage', kv: 10 },
]

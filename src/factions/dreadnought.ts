// HAND-WRITTEN — not generated, unlike the extracted modules in this directory.
//
// A Brutalis Dreadnought built with the official Nemesis Custom Builder from Kill Team: Nemesis
// Operatives: step 1 allegiance (IMPERIUM), step 2 size (Large), step 4 weapons, step 5 traits,
// step 7 core rules. Step 3 is behaviour and is NPO-only, so it is skipped, exactly as it is for
// Angron and Farsight.
//
// THE FLAVOUR SOURCE IS A KTDASH HOMEBREW, THE RULES ARE NOT. The user supplied
// ktdash.app/killteams/HBR-tPn5gs-5 ("dreadnoughts" by great-angel), which is flagged WIP and is
// not a legal nemesis build: APL 6, Save 2+, 60W, no ploys, untitled abilities, and all thirteen
// of its "equipment" entries are the universal deck the app already ships — the same trap
// companions.ts and relic-seekers.ts hit, recorded in CLAUDE.md. A 2+ save is specifically the
// mistake an early Angron made and had corrected: pg 15 fixes EVERY nemesis size at 4+, and a
// boss's durability is wounds plus the extra defence dice, never a good save. So the statline,
// the weapons and the traits below all come off the dossier's own tables. What the KTDash team
// contributed is the chassis, the kit and three ideas, each credited where it is used.
//
// SIZE LARGE: Move 6" / Save 4+ / 75W / 3 weapon selections, off the pg 15 table. CONTROL is 5
// here where the table prints 6 for Large — the same divergence Angron and Farsight carry, at the
// user's standing request. Both places that state it (the faction card and `apl` below) say 5.
//
// TWO OF THREE WEAPON SELECTIONS ARE SPENT, and the third is left deliberately unspent. Pg 16 and
// pg 19 both state that an unused weapon selection converts into an extra nemesis trait selection,
// which is what pays for the second trait. Angron is built the same way.
//
// • Brutalis talons — the pg 18 POWER FIST profile, whose printed alternative is "Crushing claw".
// • Twin heavy bolter — the pg 16 HEAVY BOLTER profile. Note it does NOT carry Ceaseless: the
//   "Twinned weapon" selection on pg 17 grants that, and buying it would have cost the spare
//   selection that pays for Crushing Impact. The model has a twin weapon, the profile is the
//   single one — pg 16 explicitly allows ignoring the less significant of what a model carries.
//   The Twin-Linked Discipline ploy is that selection rented for one shooting sequence instead.
//
// TRAITS: Blitz and Crushing Impact, both of which trigger on the Charge action. That is the whole
// build — this is a boss that has to close, and every card below either helps it close or pays off
// once it has. Checked against `nemesisCore` and the full pg 19 trait table, per CLAUDE.md:
//
// • Blitz grants Severe AND Shock on a charge, and the talons already print Shock. So in practice
//   Blitz adds Severe here. That is a known, accepted overlap, not an oversight — the two traits
//   share a trigger on purpose and the alternative was a weaker melee profile. Do not "fix" it by
//   swapping the fist for a chain weapon; the overlap is one rule, the damage loss would be 6/8
//   down to 5/6.
// • Crushing Impact fires when it FINISHES MOVING during a Charge, which is not the Fight action —
//   so Bulky's widened 1"/4" control range does NOT apply to it, and it is the normal control
//   range. This is the same trap Angron's Relentless Carnage documents from the other side.
//
// THE ALLEGIANCE TRAIT TEXT IS NOT IN THE DOSSIER — the book defers to separate allegiance cards.
// It came from KTDash's API (killteams/SPEC-NEM), the same route Angron's CHAOS trait took.
//
// THE PLOYS AND EQUIPMENT ARE HOMEBREW, for the reason recorded in angron.ts: the Custom Builder
// has no ploy or equipment step, a nemesis operative is meant to ACCOMPANY a kill team and borrow
// that team's deck, and this app models a boss as a standalone one-model team — so there is no
// accompanying team to borrow from, and without these its player banks CP with nothing to spend it
// on and opens an empty Gear tab. Every card names the Dreadnought rather than a keyword, because
// it has NO FACTION KEYWORD and a card worded "a friendly X operative" could never select it.
//
// ITS AXIS IS THE ONE NEITHER OTHER BOSS USES. Angron pays in blood and reaches nobody; Farsight
// pays in position and half his deck reaches his alliance. This one pays in NOTHING and reaches
// nobody — it is a machine, so its deck is about the two modes it can commit an activation to,
// gun platform or wrecking ball, and about the three limits the mission packs put on a nemesis
// operative. It deliberately has no CP generator (Angron's Blood Tithe, Farsight's Command Uplink)
// and no self-repair, which would have collided with Blood for the Blood God.
//
// THE 12" CAP IS REAL AND IS WHY FULL THROTTLE EXISTS. Both mission packs print the same limit —
// Joint Ops pg 36, Nemesis Ops pg 47 — and it is the tightest one on this model: "It cannot move
// more than 12" per turning point and each player cannot spend more than 5AP for it in total per
// turning point." At Move 6" and two activations, 12" is exactly two plain Repositions, so a boss
// that must charge is capped before it starts.
//
// ONE CARD WAS WRITTEN AND CUT, and the reason is worth keeping. The same rule also says a nemesis
// operative "cannot activate a second time until all other friendly operatives are expended", and
// a ploy lifting that gate reads well — but the gate counts FRIENDLY operatives, meaning others in
// its own kill team, and a boss modelled as a one-model team has none. The card would do nothing.
import type { Datacard, RefCard } from '../compendium'
import type { Operative } from '../rules'
import { nemesisCore } from './nemesis'

// Each trait is written once and used by both the Rules card and the datacard below. Two copies of
// a rules paragraph is two things to keep in step — the same reason nemesis.ts exists.
const ALLEGIANCE = {
  name: 'Defenders of the Imperium',
  text: 'Allegiance trait — IMPERIUM.\nWhenever an operative is shooting a friendly IMPERIUM NEMESIS operative, if that IMPERIUM operative is wholly within its territory, one of its defence dice can be retained as a normal success without rolling it (in addition to a cover save, if any).',
}
const BLITZ = {
  name: 'Blitz',
  text: 'Nemesis trait.\nWhenever this operative performs the Charge action during its activation, its melee weapons have the Severe and Shock weapon rules until the end of that activation. Note the Brutalis talons already have Shock, so in practice this grants them Severe.',
}
const CRUSHING_IMPACT = {
  name: 'Crushing Impact',
  text: 'Nemesis trait.\nWhen this operative finishes moving during the Charge action, inflict D3+3 damage on one enemy operative within its control range. This triggers on the move, not on the Fight action, so BULKY’s widened 1" horizontal / 4" vertical control range does not apply — use the normal control range.',
}

export const cards: RefCard[] = [
  {
    kind: 'faction',
    name: 'Brutalis Dreadnought',
    text: 'CONTROL 5 · MOVE 6" · SAVE 4+ · 75 WOUNDS.\nKeywords: IMPERIUM, ADEPTUS ASTARTES, WALKER, NEMESIS, BRUTALIS DREADNOUGHT.\n— Brutalis talons (power fist): ATK 4, HIT 3+, DMG 6/8. Brutal, Shock.\n— Twin heavy bolter: ATK 5, HIT 3+, DMG 4/5. Piercing Crits 1, Torrent 1".\nIT CAN BE SHOT WHILE LOCKED IN COMBAT — Towering Size means being within control range of other operatives never stops it being a valid target for the Shoot action.\nIT CANNOT MOVE MORE THAN 12" IN A TURNING POINT, and its player cannot spend more than 5AP on it in total per turning point.\nA wounded battle-brother too broken to live and too valuable to lose, sealed into a sarcophagus and woken only for war.',
  },
  nemesisCore('Large'),
  { kind: 'faction', ...ALLEGIANCE },
  { kind: 'faction', ...BLITZ },
  { kind: 'faction', ...CRUSHING_IMPACT },

  // STRATEGY — each of the four answers a different real weakness, the way Angron's do. It is
  // slow and the 12" cap binds; it can take neither cover nor Vantage; it folds the moment it is
  // injured; and it is one model that a kill team can simply walk around.
  {
    kind: 'strategy',
    name: 'Full Throttle',
    text: 'Use this strategy ploy. Until the end of the turning point, this operative can move up to 15" rather than 12", and the first Charge action it performs during each of its activations costs 1 less AP.\nAt Move 6" and two activations, the mission pack’s 12" limit is exactly two plain Repositions — this is what it costs to arrive anywhere.',
  },
  {
    kind: 'strategy',
    name: 'Fire Support Doctrine',
    // Translated from the KTDash Ballistus's "if this operative remains stationary before shooting
    // its ranged weapons gain piercing 1 and seek light" — the one idea in that team that was
    // already written in the game's own weapon rules.
    text: 'Use this strategy ploy. Until the end of the turning point, whenever this operative is shooting and has not performed a Charge, Reposition or Dash action during that activation, its ranged weapons have the Seek Light and Piercing 1 weapon rules.\nBULKY bars it from Vantage and TOWERING SIZE denies it cover, so a Dreadnought that plants its feet shoots past the terrain it cannot use instead.',
  },
  {
    kind: 'strategy',
    cp: 0,
    name: 'Duty Eternal',
    text: 'This strategy ploy costs 0CP. Use it when this operative becomes injured. It immediately performs a free Shoot or Fight action. You can use this ploy only once per turning point.\nInjured is where this build lives: it costs the Dreadnought 2" of Move and, per its core rules, the extra defence dice. The ancient inside answers by firing.',
  },
  {
    kind: 'strategy',
    name: 'Immovable Object',
    text: 'Use this strategy ploy. Until the end of the turning point, add 2 to this operative’s CONTROL stat for the purposes of determining control of markers, and enemy operatives within its control range do not contest markers.\nCONTROL is the stat that stands in for APL everywhere except spending action points, so a Dreadnought standing on an objective is very hard to argue with.',
  },

  // FIREFIGHT — two melee, two shooting, matching the two modes an activation can commit to.
  {
    kind: 'firefight',
    name: 'Through the Wall',
    // The KTDash Brutalis's signature ability, priced. There it was free, permanent and worded
    // loosely; here it is 1CP for one charge and the D6 makes it a gamble rather than a guarantee.
    // Deliberately NOT a second Bring Down the Walls: Angron's ploy damages whoever shelters in
    // terrain he cannot enter, and his Crushing Impact equipment deletes a feature at 12" and puts
    // him in its footprint. This one is a movement risk taken mid-charge and inflicts nothing.
    text: 'Use this firefight ploy when this operative performs the Charge action. During that move it can move through one Heavy terrain feature. Roll one D6: on a 4+ it continues its move and that terrain feature is removed from the battle; otherwise its move ends at that terrain feature.\nIt weighs as much as the building.',
  },
  {
    kind: 'firefight',
    name: 'Piston Slam',
    text: 'Use this firefight ploy when this operative is fighting or retaliating, at the start of the Roll Attack Dice step. Until the end of that sequence, its melee weapons have the Devastating 3 weapon rule.',
  },
  {
    kind: 'firefight',
    name: 'Twin-Linked Discipline',
    // This is the pg 17 "Twinned weapon" selection the build deliberately did not buy, rented for
    // one sequence — see the weapons note in the header.
    text: 'Use this firefight ploy when this operative is shooting with its twin heavy bolter, in the Roll Attack Dice step. You can re-roll any number of your attack dice.\nBoth barrels are laid on the same target by the same machine spirit. It does not miss twice.',
  },
  {
    kind: 'firefight',
    name: 'Blessed Autoloaders',
    // The KTDash team's shared "two Shoot or two Fight actions per activation" rule, which there
    // was permanent and free on all three chassis. Priced at 1CP for one extra Shoot, gated to a
    // different weapon, and still bounded by the pack's 5AP-per-turning-point limit.
    text: 'Use this firefight ploy when this operative performs the Shoot action. It can immediately perform a second Shoot action for 1 less AP, and must select a different weapon for it.\nIts 5AP per turning point still caps how often this can matter.',
  },

  // EQUIPMENT — two actions and two passives, the same split Angron carries and for the same
  // reason: 5AP across two activations, and its own Shoot and Charge want most of it. Both
  // passives buy back something its own core rules take away, rather than inventing a defence:
  // neither re-implements Armoured, Tough or Shielded, which it could simply have selected as a
  // nemesis trait, and neither touches its Save or the Hit stat of shots at it — worsening that
  // would soft-undo TOWERING SIZE, which is the documented counter-play that makes a boss killable.
  {
    kind: 'equipment',
    name: 'Atomantic Shielding',
    text: 'The Extra Defence core rule applies to this operative even while it is injured.\nIts core rules collect an additional defence dice against shooting "unless it is injured" — this is the clause, bought back. The reactor field does not care how much of the hull is left.',
  },
  {
    kind: 'equipment',
    name: 'Ironclad Ceramite',
    text: 'The Devastating and Blast weapon rules have no effect against this operative.\nThose are the two rules that get damage past defence dice rather than through them, which is exactly what a walking tank should shrug off. Note this is armour, not a field: Piercing still works normally, and so does a fist.',
  },
  {
    kind: 'equipment',
    name: 'Hunter-Killer Missile',
    text: 'This operative can perform the following unique action.\nHUNTER-KILLER MISSILE (1AP): Perform a Shoot action with the following weapon — ATK 4, HIT 3+, DMG 5/7, Piercing 1, Seek Light. This operative can perform this action only once during the battle.\nOne missile, bolted to the hull before deployment and never reloaded.',
  },
  {
    kind: 'equipment',
    name: 'Underslung Heavy Flamer',
    text: 'This operative can perform the following unique action.\nHEAVY FLAMER (1AP): Perform a Shoot action with the following weapon — ATK 5, HIT 2+, DMG 3/3, Range 8", Saturate, Torrent 2". This operative can perform this action only once during each turning point.\nThe heavy flamer is a printed option on this chassis, but the build spent its weapon selections elsewhere — this is how it reaches the datacard.',
  },
]

export const datacards: Datacard[] = [
  {
    name: 'Brutalis Dreadnought',
    weapons: [
      { name: 'Twin heavy bolter', atk: 5, hit: '3+', dmg: '4/5', wr: 'Piercing Crits 1, Torrent 1"' },
      { name: 'Brutalis talons (power fist)', atk: 4, hit: '3+', dmg: '6/8', wr: 'Brutal, Shock' },
    ],
    abilities: [BLITZ, CRUSHING_IMPACT, ALLEGIANCE],
    actions: [],
    keywords: ['IMPERIUM', 'ADEPTUS ASTARTES', 'WALKER', 'NEMESIS', 'BRUTALIS DREADNOUGHT', 'TOWERING'],
    // No `img`: there is no PDF to cut one from (a nemesis operative is a paid expansion) and no
    // promo shot was supplied, unlike Angron's and Farsight's. A card with no photo is a normal
    // state — the field is simply absent, which is what the generator does for the same case.
  },
]

export const operatives: Operative[] = [
  // kv 10 by the house rule of thumb, wounds ÷ 7 — the same as Angron, who is also 75W. Downing
  // it is worth ten kills toward the enemy's kill grade, which is what makes a boss worth shooting.
  { id: 'dreadnought:brutalis', name: 'Brutalis Dreadnought', apl: 5, move: '6"', save: '4+', w: 75, acts: 2, lockOrder: 'engage', kv: 10 },
]

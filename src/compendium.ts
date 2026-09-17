// The phases of a turning point, and which kinds of card each puts in play.
//
// The card TEXT no longer lives here: 697 cards across 48 factions would bury this file, so
// each faction's deck is generated into `src/factions/<id>.ts` from the official Warhammer
// Community PDFs. What stays here is the phase model, the card type, and the one list that
// belongs to no faction — universal equipment.
//
// Flavour paragraphs are dropped on extraction; only rules text is kept, because nobody
// reads flavour while seven people wait.
//
// Every ploy costs 1CP flat in the 2024 edition — the cards print no cost, which is why none
// is stored here. Equipment that lets a ploy be used "for 0CP" says so in its own text.

export type PhaseId = 'initiative' | 'strategy' | 'firefight'
export type RefKind = 'faction' | 'strategy' | 'firefight' | 'equipment'

/**
 * One card: a faction rule, a ploy, or a piece of equipment.
 *
 * `cp` overrides `PLOY_CP` for the rare ploy that does not cost the flat 1. Absent means 1,
 * which is every printed 2024 ploy — the field exists for homebrew, and it is not cosmetic:
 * `RefCardView` dims a ploy the team cannot afford, so a 0CP ploy without this greys itself out
 * at exactly 0CP, which is when you would reach for one.
 */
export type RefCard = { name: string; kind: RefKind; text: string; cp?: number }

/** One line of an operative's weapon table. `wr` is the weapon rules column, absent when "-". */
export type Weapon = { name: string; atk: number; hit: string; dmg: string; wr?: string }

/**
 * Everything a datacard prints below the stat row. Deliberately NOT part of `Operative`:
 * a roster rides in every relay snapshot and localStorage save, and this is reference text
 * nobody edits. It is joined back onto an operative by name — see `datacardOf`.
 */
export type Datacard = {
  name: string
  weapons: Weapon[]
  abilities: { name: string; text: string }[]
  actions: { name: string; ap: number; text: string }[]
  keywords?: string[]
}

export const PLOY_CP = 1

export const KIND_LABEL: Record<RefKind, string> = {
  faction: 'Faction rule',
  strategy: 'Strategy ploy',
  firefight: 'Firefight ploy',
  equipment: 'Equipment',
}

/** Which kinds of card a phase puts in play. The only place that mapping lives. */
export const PHASES: { id: PhaseId; label: string; hint: string; use: RefKind[] }[] = [
  {
    id: 'initiative',
    label: 'Initiative',
    hint: 'Roll off. The winner picks who has initiative — nothing to spend yet.',
    use: [],
  },
  {
    id: 'strategy',
    label: 'Strategy',
    hint: 'Gain CP, then alternate Strategy Ploys, initiative side first.',
    use: ['strategy'],
  },
  {
    id: 'firefight',
    label: 'Firefight',
    hint: 'Alternate activations. Firefight Ploys whenever their condition is met.',
    use: ['firefight'],
  },
]

export const phaseMeta = (id: PhaseId) => PHASES.find((p) => p.id === id)!

/* ---------- Deathwatch (dw + dw2) ---------- */

export const UNIVERSAL_EQUIPMENT: RefCard[] = [
  { kind: 'equipment', name: "Ammo Cache (1x)", text: "Before the battle, you can set up one of your Ammo Cache markers wholly within your territory. Friendly operatives can perform the following mission action during the battle.\nAMMO RESUPPLY (0AP): One of your Ammo Cache markers the active operative controls is used during this turning point. Until the start of the next turning point, whenever this operative is shooting with a weapon from its datacard, you can re‑roll one of your attack dice. An operative cannot perform this action while within control range of an enemy operative, if that marker isn’t yours, or if that marker has been used this turning point." },
  { kind: 'equipment', name: "Comms Device (1x)", text: "Before the battle, you can set up one of your Comms Device markers wholly within your territory. While a friendly operative controls this marker, add 3\" to the distance requirements of its SUPPORT rules that refer to friendly operatives (e.g. ‘select one friendly operative within 6\"’ would be 9\" instead). Note that you cannot benefit from your opponent’s Comms Device markers." },
  { kind: 'equipment', name: "Razor Wire (1x)", text: "Before the battle, you can set it up wholly within your territory, on the killzone floor and more than 2\" from other equipment terrain features, access points and Accessible terrain. Obstructing: Whenever an operative would cross over this terrain feature within 1\" of it, treat the distance as an additional 1\"." },
  { kind: 'equipment', name: "Mines (1x)", text: "Before the battle, you can set up one of your Mines markers wholly within your territory and more than 2\" from other markers, access points and Accessible terrain. The first time that marker is within an operative’s control range, remove that marker and inflict D3+3 damage on that operative." },
  { kind: 'equipment', name: "Light Barricades (2x)", text: "Before the battle, you can set up any of them wholly within your territory, on the killzone floor and more than\n2\" from other equipment terrain features, access points and Accessible terrain.\n1X HEAVY BARRICADE A redoubtable slab of plasteel and adamantine, this layered protective barrier provides shelter amidst the fiercest firefights. A heavy barricade is Heavy terrain. Before the battle, you can set it up wholly within 4\" of your drop zone, on the killzone floor and more than 2\" from other equipment terrain features, access points and Accessible terrain." },
  { kind: 'equipment', name: "Utility Grenades", text: "When you select this equipment, select two utility grenades (2 smoke, 2 stun, or 1 smoke and 1 stun). Each selection is a unique action your operatives can perform, but your kill team can only perform that action a total number of times during the battle equal to your selection.\nSTUN GRENADE (1AP): Select one enemy operative visible to and within 6\" of this operative. That operative and each other operative within 1\" of it takes a stun test. For an operative to take a stun test, roll one D6: on a 3+, subtract 1 from its APL stat until the end of its next activation. An operative cannot perform this action while within control range of an enemy operative, or if you have reached the total number of times your kill team can perform it.\nWhen you select this equipment, select two utility grenades (2 smoke, 2 stun, or 1 smoke and 1 stun). Each selection is a unique action your operatives can perform, but your kill team can only perform that action a total number of times during the battle equal to your selection.\nRULE CONTINUES ON OTHER SIDE" },
  { kind: 'equipment', name: "Ladders (2x)", text: "Before the battle, you can set up any of them as follows:\n• Wholly within your territory.\n• Upright against terrain that’s at least 2\" tall.\n• More than 2\" from other equipment terrain features.\n• More than 1\" from doors and access points. Once per action, whenever an operative is climbing the terrain feature a ladder is placed against, treat the vertical distance as 1\" if the ladder is within that operative’s control range during that entire climb." },
  { kind: 'equipment', name: "Explosive Grenades", text: "When you select this equipment, select two explosive grenades (2 frag, 2 krak, or 1 frag and 1 krak). Each selection is a ranged weapon your operatives can use, but your kill team can only use that weapon a total number of times during the battle equal to your selection. — Frag grenade: ATK 4, HIT 4+, DMG 2/4\nWR Range 6\", Blast 2\", Saturate — Krak grenade: ATK 4, HIT 4+, DMG 4/5\nWR Range 6\", Piercing 1, Saturate" },
  { kind: 'equipment', name: "Breaching Charge", text: "Once per battle, when a friendly operative performs the Breach action, you can use this rule. If you do, that operative can perform that action for 1 less AP (to a minimum of 1AP) as though it had the word ‘breach marker’ on its datacard.\nPortable: This terrain feature only provides cover while an operative is connected to it and if the shield is intervening (ignore its feet). Operatives connected to the inside of it can perform the following unique action during the battle.\nMOVE WITH BARRICADE (1AP): The same as the Reposition action, except the active operative can move no more than its Move stat minus 2\" and cannot climb, drop, jump or use any kill team’s rules that remove it and set it back up again (e.g. HEARTHKYN SALVAGER FLY, MANDRAKE SHADOW PASSAGE).\nBefore this operative moves, remove the portable barricade it’s connected to. After it moves, set up the portable barricade so it’s connected again, but the portable barricade cannot be set up within 2\" of other equipment terrain features, access points or Accessible terrain. If this is not possible, the portable barricade is not set up again. This action is treated as a Reposition action. An operative cannot perform this action while within control range of an enemy operative, or during the same activation in which it performed the Fall Back or Charge action." },
  { kind: 'equipment', name: "Portable Barricade (1x)", text: "Before the battle, you can set it up wholly within your territory, on the killzone floor and more than 2\" from other equipment terrain features, access points and Accessible terrain. Protective: While an operative is in cover from this terrain feature, improve its Save stat by 1 (to a maximum of 2+).\nRULE CONTINUES ON OTHER SIDE" },
]


/** Cards of one kind out of a faction's deck. A faction still loading has none yet. */
export const cardsOfKind = (cards: RefCard[] | undefined, kind: RefKind) =>
  (cards ?? []).filter((c) => c.kind === kind)

/** What this phase unlocks, in the order the cards should be read. */
export const phaseCards = (cards: RefCard[] | undefined, phase: PhaseId) =>
  phaseMeta(phase).use.flatMap((kind) => cardsOfKind(cards, kind))

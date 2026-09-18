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
  /** The miniature's cut-out from the PDF's name band, under public/ops. Written by tools/kt_photos.py. */
  img?: string
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

/**
 * The universal weapon rules, from the 2024 Appendix
 * (https://wahapedia.ru/kill-team3/the-rules/appendix/).
 *
 * These are NOT in any faction PDF — the extractor never sees them, which is why a datacard
 * prints "Piercing 1, Saturate" and nothing anywhere said what that meant. Restated rather
 * than transcribed: the source was read through a fetch tool that caps verbatim quoting, so
 * every stat name, distance and keyword is exact but the connective prose is ours.
 *
 * Two clauses that apply to all of them and are not worth repeating per card: a weapon gains
 * nothing from carrying the same rule twice UNLESS the rule has an x, in which case you pick
 * which x to use; and when several would take effect at once, you choose the order.
 *
 * Keyed by the bare name. A weapon prints them with x filled in ("Blast 2""), sometimes with a
 * leading distance ("1" Devastating 2"), and marks a faction's OWN bespoke rule with a trailing
 * asterisk ("Poison*") — that one is written out in the operative's abilities, so `weaponRules`
 * skips it rather than guessing.
 */
export const WEAPON_RULES: Record<string, string> = {
  Accurate: 'Retain up to x of your attack dice as normal successes without rolling them.',
  Balanced: 'Re-roll one of your attack dice.',
  Blast:
    'The operative you select is the primary target. After shooting it, shoot this weapon against each secondary target in an order of your choice — every other operative visible to and within x of the primary. They are valid targets regardless of a Conceal order, and are in cover and obscured if the primary was.',
  Brutal: 'Your opponent can only block with critical successes.',
  Ceaseless: 'Re-roll any of your attack dice that rolled one particular result (e.g. all your 2s).',
  Devastating:
    'Each retained critical success immediately inflicts x damage, and is not discarded for it — the same success can still be resolved later in the sequence. Written with a leading distance (1" Devastating 2) it also inflicts that damage on each other operative visible to and within that distance.',
  Heavy:
    'Cannot be used in an activation or counteraction in which the operative moved, and it cannot move in one in which it used this weapon. Heavy (Dash only) permits that one move.',
  Hot: 'After using this weapon, roll one D6. On a result lower than the weapon’s Hit stat, it inflicts twice that result in damage on the operative using it. One D6 however many times the weapon was used in that action.',
  Lethal: 'Your successes of x or more are critical successes.',
  Limited:
    'Once the operative has used this weapon x times in the battle, it no longer has it. Several uses in one action count as one.',
  Piercing:
    'The defender collects x fewer defence dice. Piercing Crits x only comes into effect if you retained a critical success.',
  Punishing: 'If you retained any critical success, retain one of your fails as a normal success instead of discarding it.',
  Range: 'Only operatives within x can be valid targets.',
  Relentless: 'Re-roll any of your attack dice.',
  Rending: 'If you retained any critical success, retain one of your normal successes as a critical success instead.',
  Saturate: 'The defender cannot retain cover saves.',
  Seek:
    'When selecting a valid target, operatives cannot use terrain for cover — Seek Light, only Light terrain. That can make them targetable if they are visible, but it does not remove their cover save.',
  Severe:
    'If you retained no critical successes, change one of your normal successes into one. Devastating and Piercing Crits still take effect; Punishing and Rending do not.',
  Shock:
    'The first time you strike with a critical success in each sequence, also discard one of your opponent’s unresolved normal successes — or a critical success if they have no normal ones left.',
  Silent: 'The operative can perform the Shoot action with this weapon while it has a Conceal order.',
  Stun: 'If you retained any critical success, subtract 1 from the APL stat of the operative this weapon is used against, until the end of its next activation.',
  Torrent:
    'Select a valid target as normal as the primary, then any number of other valid targets within x of it that are not within control range of friendly operatives. Shoot against all of them in an order of your choice.',
}

const RULE_NAMES = Object.keys(WEAPON_RULES)
// Matched as a whole word anywhere in the token, not as a prefix: several weapons print the
// distance first ("1" Devastating 3"), and "Piercing Crits 1" and "Seek Light" are variants
// folded into their parent rule's text rather than entries of their own.
const RULE_RE = new RegExp(`\\b(${RULE_NAMES.join('|')})\\b`, 'i')

/**
 * A weapon rule the FACTION defines, footnoted on its own datacard rather than universal.
 * Most teams mark these with a trailing asterisk; the Sanctifiers use a superscript instead
 * (`Wreathed¹`, `Twin Torrent¹`), which is the same convention in a different glyph.
 */
export const OWN_RULE = /[*\u00b9\u00b2\u00b3\u2070-\u209f\u2020\u2021]$/

/**
 * A rule a card GRANTS rather than a weapon printing it — "its weapons have the Balanced weapon
 * rule", "gains the weapon rule of Ceaseless". Half these names are ordinary English words, so
 * this is anchored on the literal phrase `weapon rule` and reads only the short run in front of
 * it: a bare scan would match "within control range" and "heavy bolter" on nearly every card.
 * The window stops at sentence punctuation, and the name must be Capitalised as the cards print
 * it. Over-reading is harmless here — an extra rule in the appendix is a line nobody needed,
 * where a missing one is a player with no definition.
 */
const GRANTED = /\b([A-Z][a-z]+)\b(?=[^.!?]{0,48}weapon rule)|weapon rules? of (?:the )?([A-Z][a-z]+)\b/g

/**
 * The universal rules one operative's weapons use, deduped, in the order declared above.
 *
 * `prose` is rules text to read as well — a team's cards and its operatives' abilities. Without
 * it the appendix covers only what a weapon table PRINTS, so a team whose ploy hands out Balanced
 * (the Relic Seekers do it twice, and Vulkan He'stan a third time) offers no definition of it
 * anywhere. That is the same gap that once printed `Saturate` on a datacard with nothing to say
 * what it did, one step further out.
 */
export const weaponRules = (weapons: Weapon[] = [], prose: string[] = []): [string, string][] => {
  const used = new Set<string>()
  for (const w of weapons)
    for (const token of (w.wr ?? '').split(',')) {
      const t = token.trim()
      if (OWN_RULE.test(t)) continue // a faction's own rule; its text is on the operative
      const hit = RULE_RE.exec(t)
      const name = hit && RULE_NAMES.find((n) => n.toLowerCase() === hit[1].toLowerCase())
      if (name) used.add(name)
    }
  for (const text of prose)
    for (const m of text.matchAll(GRANTED)) {
      const word = m[1] ?? m[2]
      if (RULE_NAMES.includes(word)) used.add(word)
    }
  return RULE_NAMES.filter((n) => used.has(n)).map((n) => [n, WEAPON_RULES[n]])
}

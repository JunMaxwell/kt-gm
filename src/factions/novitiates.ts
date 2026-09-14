// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Acts of Faith", text: "In the Ready step of each Strategy phase, you gain a number of Faith points equal to half the number of friendly NOVITIATE operatives that haven’t been incapacitated (rounding up). Whenever a friendly NOVITIATE operative is shooting, fighting or retaliating, or an operative is shooting it, in the Roll Attack Dice (or Roll Defence Dice step if an operative is shooting it), you can spend your Faith points to use one ACT OF FAITH. You cannot use more than one ACT OF FAITH per sequence, and their costs and effects are as follows (see other side of card):" },
  { kind: 'strategy', name: "Ardent Vengeance", text: "Whenever a friendly NOVITIATE operative is shooting against, fighting against or retaliating against an expended enemy operative, that friendly operative’s weapons have the Punishing weapon rule." },
  { kind: 'strategy', name: "Blessed Rejuvenation", text: "Whenever you spend Faith points, at the end of that action, the friendly operative you spent them on can regain up to D3 lost wounds. Note this ploy has no effect if that friendly operative was incapacitated during that action, or if the ACT OF FAITH doesn’t cost any Faith points, e.g. Auto-chastisers equipment." },
  { kind: 'strategy', name: "Defenders of the Faith", text: "Whenever an operative is shooting against, fighting against or retaliating against a friendly NOVITIATE operative that contests an objective marker, in the Resolve Attack Dice step of that sequence, you can halve the damage inflicted (rounding up and to a minimum of 2) on that friendly operative from one success." },
  { kind: 'strategy', name: "Righteous Advance", text: "Up to one third of the friendly NOVITIATE operatives in the killzone (rounding down, to a minimum of 1) can immediately perform a free Dash action in an order of your choice, but each that does so must end that move closer to its closest enemy operative, its closest objective marker or your opponent’s drop zone (you can choose separately for each). You cannot use this ploy during the first turning point." },
  { kind: 'firefight', name: "Glorious Martyrdom", text: "Use this firefight ploy when a friendly NOVITIATE operative is incapacitated, before it’s removed from the killzone. For each enemy operative visible to and within 2\" of it, you gain 1 Faith point and inflict D3 damage on that enemy operative (roll separately for each)." },
  { kind: 'firefight', name: "Blinding Aura", text: "Use this firefight ploy when an enemy operative is performing the Shoot action and selects a friendly NOVITIATE operative as the valid target. Until the end of that activation/counteraction, while that friendly operative is more than 2\" from that enemy operative, your opponent cannot select it as a valid target. If there are no other valid targets that your opponent can select, that action ends (it’s not cancelled, so that operative has still performed it). Note this ploy has no effect if it’s not the selected operative, e.g. if it’s a secondary target from the Blast weapon rule." },
  { kind: 'firefight', name: "Blazing Inferno", text: "Use this firefight ploy when a friendly NOVITIATE operative is shooting with a Ministorum flamer and you inflict damage with any critical successes. The target gains one of your Blaze tokens (if it doesn’t already have one). Whenever an operative that has one of your Blaze tokens is activated:\n• Inflict D3 damage on it.\n• Its controlling player can subtract 1 from that operative’s APL stat until the end of that activation to remove that token. Note that this must be done before that operative performs any actions during that activation." },
  { kind: 'firefight', name: "Guided by Faith", text: "Use this firefight ploy when a friendly NOVITIATE operative is performing the Shoot action and you’re selecting a ranged weapon. Until the end of that action, whenever that operative is shooting an operative within 6\" of it, that weapon has the Seek Light weapon rule." },
  { kind: 'equipment', name: "Icon of Faith", text: "Once per turning point, you can use up to two ACTS OF FAITH during a sequence, but each one must be different. This takes precedence over the normal ACTS OF FAITH rules." },
  { kind: 'equipment', name: "Auto-chastisers", text: "Once per turning point, when a friendly NOVITIATE operative is shooting, fighting or retaliating, in the Roll Attack Dice step, you can inflict 1-3 damage on that friendly operative (but not enough to incapacitate it). If you do, you can use one ACT OF FAITH for free during that sequence with a Faith points cost no more than the damage you inflicted from this rule." },
  { kind: 'equipment', name: "Sanctified Rounds", text: "Whenever a friendly NOVITIATE operative is shooting with an autogun, autopistol, relic bolt pistol or relic boltgun, if you spend a Faith point, that weapon has the Piercing Crits 1 weapon rule until the end of that sequence." },
  { kind: 'equipment', name: "Holy Embrocations", text: "You can ignore any changes to the Move stat of friendly NOVITIATE operatives from being injured." },
]

export const operatives: Operative[] = [
  { id: "novitiates:novitiate-superior", name: "Novitiate Superior", apl: 3, move: "6\"", save: "3+", w: 9 },
  { id: "novitiates:novitiate-condemnor", name: "Novitiate Condemnor", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-dialogus", name: "Novitiate Dialogus", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-duellist", name: "Novitiate Duellist", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-exactor", name: "Novitiate Exactor", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-hospitaller", name: "Novitiate Hospitaller", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-militant", name: "Novitiate Militant", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-penitent", name: "Novitiate Penitent", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-preceptor", name: "Novitiate Preceptor", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-pronatus", name: "Novitiate Pronatus", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-purgatus", name: "Novitiate Purgatus", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "novitiates:novitiate-reliquarius", name: "Novitiate Reliquarius", apl: 2, move: "6\"", save: "4+", w: 7 },
]

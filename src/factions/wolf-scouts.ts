// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Hunting Astartes", text: "During each friendly WOLF SCOUT operative’s activation, it can perform either two Shoot actions or two Fight actions. If it’s two Shoot actions:\n• 1 additional AP must be spent for the second action if both actions are using a plasma gun or plasma pistol.\n• You cannot select two PSYCHIC ranged weapons. Each friendly WOLF SCOUT operative can counteract regardless of its order. Whenever it does so within your STORM, you can change its order first, or change its order instead of performing an action (for the latter, still treat it as having counteracted this turning point)." },
  { kind: 'faction', name: "Elemental Storm", text: "STRATEGIC GAMBIT. Remove your Storm marker from the killzone (if any), then place it in the killzone. Whenever an operative is wholly within 6\" horizontally of your Storm marker, it’s wholly within your STORM. Each friendly WOLF SCOUT operative can perform the Charge action while it has a Conceal order if it ends that action wholly within your STORM." },
  { kind: 'strategy', name: "Cloaked by the Storm", text: "Whenever an operative is shooting a friendly WOLF SCOUT operative that’s wholly within your STORM, you can re-roll one of your defence dice." },
  { kind: 'strategy', name: "Storm’s Bite", text: "Whenever a friendly WOLF SCOUT operative is fighting against an enemy operative that’s wholly within your STORM, subtract 1 from the Atk stat of that enemy operative’s melee weapons (to a minimum of 3)." },
  { kind: 'strategy', name: "Tempestuous Wrath", text: "Whenever a friendly WOLF SCOUT operative is fighting or retaliating, if it’s wholly within your STORM or was wholly within your STORM at the start of the activation, its melee weapons have the Balanced weapon rule." },
  { kind: 'strategy', name: "Savage Fighters", text: "Whenever a friendly WOLF SCOUT operative finishes retaliating, if it wasn’t incapacitated and is still within control range of the enemy operative in that sequence, you can inflict D3+1 damage on that enemy operative." },
  { kind: 'firefight', name: "Acute Senses", text: "Use this firefight ploy when a friendly WOLF SCOUT operative performs the Shoot action and you’re selecting a valid target. Until the end of that action, that friendly operative’s ranged weapons have the Range 6\" and Seek Light weapon rules and enemy operatives cannot be obscured." },
  { kind: 'firefight', name: "Touched by Lokyar", text: "Use this firefight ploy after rolling your attack dice for a friendly WOLF SCOUT operative (excluding FENRISIAN WOLF), if it’s fighting more than 5\" from other friendly operatives. You can re-roll any of your attack dice." },
  { kind: 'firefight', name: "Counterattack", text: "Use this firefight ploy at the end of an enemy operative’s activation, or after an enemy operative performs the Fight action. One friendly WOLF SCOUT operative can immediately perform a free Fight action, but you cannot select any other enemy operative to fight against during that action." },
  { kind: 'firefight', name: "Transhuman Physiology", text: "Use this firefight ploy when an operative is shooting a friendly WOLF SCOUT operative (excluding FENRISIAN WOLF), in the Roll Defence Dice step. You can retain one of your normal successes as a critical success instead." },
  { kind: 'equipment', name: "Frost Weapons", text: "Whenever a friendly WOLF SCOUT operative is wholly within your STORM, its combat blade (if any) has the Lethal 5+ weapon rule." },
  { kind: 'equipment', name: "Wolfteeth Necklaces", text: "Once per turning point, when a friendly WOLF SCOUT operative (excluding FENRISIAN WOLF) is shooting, fighting or retaliating, if you roll two or more fails, you can discard one of them to retain another as a normal success instead." },
  { kind: 'equipment', name: "Runic Charms", text: "Once per turning point, when an operative is shooting a friendly WOLF SCOUT operative (excluding FENRISIAN WOLF) that’s wholly within your STORM, at the start of the Roll Defence Dice step, you can use this rule. If you do, worsen the x of the Piercing weapon rule by 1 (if any) until the end of that sequence. Note that Piercing 1 would therefore be ignored." },
  { kind: 'equipment', name: "Talismanic Trophies", text: "Whenever a friendly WOLF SCOUT operative\n(excluding FENRISIAN WOLF) that’s wholly within your STORM is fighting or retaliating, in the Resolve Attack Dice step, you can subtract 1 from the damage inflicted on it from one normal success." },
]

export const operatives: Operative[] = [
  { id: "wolf-scouts:wolf-scout-pack-leader", name: "Wolf Scout Pack Leader", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "wolf-scouts:wolf-scout-fangbearer", name: "Wolf Scout Fangbearer", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "wolf-scouts:wolf-scout-frosteye", name: "Wolf Scout Frosteye", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "wolf-scouts:wolf-scout-gunner", name: "Wolf Scout Gunner", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "wolf-scouts:wolf-scout-hunter", name: "Wolf Scout Hunter", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "wolf-scouts:wolf-scout-rune-priest-skjald", name: "Wolf Scout Rune Priest Skjald", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "wolf-scouts:wolf-scout-trapmaster", name: "Wolf Scout Trapmaster", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "wolf-scouts:wolf-scout-fenrisian-wolf", name: "Wolf Scout Fenrisian Wolf", apl: 2, move: "8\"", save: "5+", w: 9 },
]

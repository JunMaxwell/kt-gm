// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Power from Pain", text: "After a friendly HAND OF THE ARCHON operative performs an action, it gains one of your Pain tokens if:\n• An enemy operative was injured during that action, but was not incapacitated.\n• An enemy operative was incapacitated during that action. If that enemy operative had a Wounds stat of 12 or more, that friendly operative gains two of your Pain tokens instead.\nYou can spend friendly operatives’ Pain tokens on invigorations when the ‘when’ condition is met. You cannot use more than one invigoration per activation or counteraction, except Stimulated Senses, which can be used once per activation or counteraction in addition to another invigoration." },
  { kind: 'faction', name: "Rifles", text: "Whenever a friendly HAND OF THE ARCHON operative is shooting with a splinter rifle during an activation in which it hasn’t performed the Charge, Fall Back or Reposition action, that weapon has the Accurate 1 weapon rule. Note that operative isn’t restricted from performing those actions after shooting." },
  { kind: 'strategy', name: "Blade Artists", text: "Friendly HAND OF THE ARCHON operatives' melee weapons have the Rending weapon rule." },
  { kind: 'strategy', name: "Merciless Sadists", text: "Whenever a friendly HAND OF THE ARCHON operative is shooting against or fighting against a wounded enemy operative, that friendly operative’s weapons have the Balanced weapon rule." },
  { kind: 'strategy', name: "From Darkness, Death", text: "Whenever a friendly HAND OF THE ARCHON operative is activated, before you determine its order, you can select one enemy operative that friendly operative isn’t a valid target for. Until the end of that activation, the first time that friendly operative is shooting against or fighting against that enemy operative, you can retain one of your normal successes as a critical success instead." },
  { kind: 'firefight', name: "Cruel Deception", text: "Use this firefight ploy during a friendly HAND OF THE ARCHON operative’s activation, before or after it performs an action. During that activation, that operative can perform the Fall Back action for 1 less AP." },
  { kind: 'strategy', name: "Denizens of Night", text: "Whenever an enemy operative is shooting a friendly HAND OF THE ARCHON operative that’s more than 2\" from enemy operatives, if Heavy or Light terrain is intervening, or any part of that friendly operative’s base is underneath Vantage terrain, you can re-roll one of your defence dice." },
  { kind: 'firefight', name: "Devious Scheme", text: "Use this firefight ploy after an opponent uses a firefight ploy (excluding one that costs 0CP). The next time they would use that ploy, they must spend 1 additional CP to do so (at which point this effect ends). You cannot use this ploy again during the battle until its effect has ended." },
  { kind: 'firefight', name: "Heinous Arrogance", text: "Use this firefight ploy when it’s your turn to activate a friendly operative. You can skip that activation." },
  { kind: 'equipment', name: "Chain Snare", text: "Whenever an enemy operative would perform the Fall Back action while within control range of a friendly HAND OF THE ARCHON operative, if no other enemy operatives are within that friendly operative’s control range, you can use this rule. If you do, roll two D6, or one D6 if that enemy operative has a higher Wounds stat than that friendly operative. If any result is a 4+, that enemy operative cannot perform that action during that activation/counteraction (no AP are spent on it), and you cannot use this rule again during this turning point." },
  { kind: 'firefight', name: "Prey on the Wounded", text: "Use this firefight ploy after rolling your attack dice for a friendly HAND OF THE ARCHON operative, if it’s shooting against or fighting against a wounded enemy operative. You can re-roll any of your attack dice." },
  { kind: 'equipment', name: "Wicked Blades", text: "Add 1 to the Atk stat of friendly HAND OF THE ARCHON operatives’ array of blades." },
  { kind: 'equipment', name: "Toxin Coating", text: "Up to twice per turning point, whenever a friendly HAND OF THE ARCHON operative is fighting or retaliating and you’re selecting a melee weapon, you can use this rule. If you do, until the end of that sequence, that operative’s melee weapon has the Lethal 5+ weapon rule." },
  { kind: 'equipment', name: "Refined Poison", text: "Up to twice per turning point, whenever a friendly HAND OF THE ARCHON operative is performing the Shoot action and you select a shardcarbine, splinter cannon, splinter pistol, splinter rifle or stinger pistol, you can use this rule. If you do, until the end of that action, add 1 to the Normal Dmg stat of that weapon." },
]

export const operatives: Operative[] = [
  { id: "hand-of-the-archon:kabalite-archsybarite", name: "Kabalite Archsybarite", apl: 2, move: "7\"", save: "4+", w: 9 },
  { id: "hand-of-the-archon:kabalite-agent", name: "Kabalite Agent", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "hand-of-the-archon:kabalite-crimson-duellist", name: "Kabalite Crimson Duellist", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "hand-of-the-archon:kabalite-disciple-of-yaelindra", name: "Kabalite Disciple of Yaelindra", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "hand-of-the-archon:kabalite-elixicant", name: "Kabalite Elixicant", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "hand-of-the-archon:kabalite-flayer", name: "Kabalite Flayer", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "hand-of-the-archon:kabalite-gunner", name: "Kabalite Gunner", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "hand-of-the-archon:kabalite-heavy-gunner", name: "Kabalite Heavy Gunner", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "hand-of-the-archon:kabalite-skysplinter-assassin", name: "Kabalite Skysplinter Assassin", apl: 2, move: "7\"", save: "4+", w: 8 },
]

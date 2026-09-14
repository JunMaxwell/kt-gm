// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Chapter Tactics", text: "When selecting your kill team, select a primary and secondary CHAPTER TACTIC for friendly ANGEL OF DEATH operatives to gain for the battle. Multiple instances of the same CHAPTER TACTIC aren’t cumulative.\nDesigner’s Note: If you’re playing a series of games, i.e. a campaign or tournament, you must select the same primary and secondary CHAPTER TACTIC for every battle (you can still change the secondary with the Adaptive Tactics strategy ploy)." },
  { kind: 'faction', name: "Chapter Tactics 1. Aggressive", text: "This operative’s melee weapons have the Rending weapon rule.\n2. DUELLER Whenever this operative is fighting or retaliating, each of your normal successes can block one unresolved critical success (unless the enemy operative’s weapon has the Brutal weapon rule).\n3. RESOLUTE You can ignore any changes to this operative’s APL stat and it isn’t affected by enemy operatives’ Shock weapon rule." },
  { kind: 'faction', name: "Astartes", text: "During each friendly ANGEL OF DEATH operative’s activation, it can perform either two Shoot actions or two Fight actions. If it’s two Shoot actions, a bolt weapon must be selected for at least one of them, and if it’s a bolt sniper rifle or heavy bolter, 1 additional AP must be spent for the second action if both actions are using that weapon.\nEach friendly ANGEL OF DEATH operative can counteract regardless of its order." },
  { kind: 'strategy', name: "Combat Doctrine", text: "Select one COMBAT DOCTRINE from those presented below. Whenever a friendly ANGEL OF DEATH operative is x, its weapons have the Balanced weapon rule. X is the COMBAT DOCTRINE you selected.\n• Devastator Doctrine: Shooting an operative more than 6\" from it.\n• Tactical Doctrine: Shooting an operative within 6\" of it.\n• Assault Doctrine: Fighting or retaliating." },
  { kind: 'strategy', name: "And They Shall Know No Fear", text: "You can ignore any changes to the stats of friendly ANGEL OF DEATH operatives from being injured (including their weapons’ stats)." },
  { kind: 'strategy', name: "Indomitus", text: "Whenever an operative is shooting a friendly ANGEL OF DEATH operative, if you roll two or more fails, you can discard one of them to retain another as a normal success instead." },
  { kind: 'strategy', name: "Adaptive Tactics", text: "Change your secondary CHAPTER TACTIC. Note this ploy only lasts until the end of the turning point, at which point your original secondary CHAPTER TACTIC returns." },
  { kind: 'firefight', name: "Adjust Doctrine", text: "Use this firefight ploy during a friendly ANGEL OF DEATH operative’s activation, before or after it performs an action. If you’ve used the Combat Doctrine strategy ploy during this turning point, change the COMBAT DOCTRINE you selected." },
  { kind: 'firefight', name: "Transhuman Physiology", text: "Use this firefight ploy when an operative is shooting a friendly ANGEL OF DEATH operative, in the Roll Defence Dice step. You can retain one of your normal successes as a critical success instead." },
  { kind: 'firefight', name: "Wrath of Vengeance", text: "Use this firefight ploy when a friendly ANGEL OF DEATH operative is counteracting. It can perform an additional 1AP action for free during that counteraction, but both actions must be different." },
  { kind: 'firefight', name: "Shock Assault", text: "Use this firefight ploy when a friendly ANGEL OF DEATH operative is performing the Fight action during an activation in which it performed the Charge action, at the start of the Resolve Attack Dice step. Until the end of that action:\n• Its melee weapon has the Shock weapon rule.\n• The first time you strike during that sequence, inflict 1 additional damage (to a maximum of 7)." },
  { kind: 'equipment', name: "Purity Seals", text: "Once per turning point, when a friendly ANGEL OF DEATH operative is shooting, fighting or retaliating, if you roll two or more fails, you can discard one of them to retain another as a normal success instead." },
  { kind: 'equipment', name: "Chapter Reliquaries", text: "You can use the Wrath of Vengeance firefight ploy for 0CP if the specified friendly operative has an Engage order." },
  { kind: 'equipment', name: "Auspex", text: "Once per turning point, when a friendly ANGEL OF DEATH operative performs the Shoot action and you’re selecting a valid target, you can use this rule. If you do, until the end of the activation/ counteraction, enemy operatives within 8\" of that friendly operative cannot be obscured." },
  { kind: 'equipment', name: "Tilting Shields", text: "Once per turning point, when a friendly ANGEL OF DEATH operative is fighting or retaliating, after your opponent rolls their attack dice, but before re-rolls, you can use this rule. If you do, your opponent cannot retain attack dice results of less than 6 as critical successes during that sequence (e.g. as a result of the Lethal, Rending or Severe weapon rules).\nNOTES:" },
]

export const operatives: Operative[] = [
  { id: "aod:space-marine-captain", name: "Space Marine Captain", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "aod:assault-intercessor-sergeant", name: "Assault Intercessor Sergeant", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "aod:intercessor-sergeant", name: "Intercessor Sergeant", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "aod:assault-intercessor-grenadier", name: "Assault Intercessor Grenadier", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "aod:assault-intercessor-warrior", name: "Assault Intercessor Warrior", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "aod:heavy-intercessor-gunner", name: "Heavy Intercessor Gunner", apl: 3, move: "5\"", save: "3+", w: 18 },
  { id: "aod:intercessor-gunner", name: "Intercessor Gunner", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "aod:intercessor-warrior", name: "Intercessor Warrior", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "aod:eliminator-sniper", name: "Eliminator Sniper", apl: 3, move: "7\"", save: "3+", w: 12 },
]

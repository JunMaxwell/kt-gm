// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Special Issue Ammunition", text: "Once per turning point, when a friendly DEATHWATCH operative is performing the Shoot action, in the Select Weapon step, you can use this rule. If you do, select one of the following weapon rules for that operative’s ranged weapons to have until the end of the action. This rule cannot be used with explosive grenades (see universal equipment) or melta bombs.\n• Blast 1\" (you cannot select this if the weapon profile being used has the Torrent weapon rule)\n• Devastating 1\n• Lethal 5+\n• Piercing Crits 1\n• Saturate\n• Severe" },
  { kind: 'faction', name: "Veteran Astartes", text: "During each friendly DEATHWATCH operative’s activation, it can perform either two Shoot actions or two Fight actions. If it’s two Shoot actions and an auxiliary grenade launcher, frag cannon, heavy plasma incinerator, infernus heavy bolter, plasma pistol or stalker bolt rifle is selected for both, or if a melta bomb is selected for either, 1 additional AP must be spent for the second action.\nEach friendly DEATHWATCH operative can counteract regardless of its order. Whenever it does, it can perform an additional 1AP action for free during that counteraction, but both actions must be different and you cannot perform a Fight and Shoot action during the same counteraction." },
  { kind: 'strategy', name: "Mission Tactics", text: "Select Conceal or Engage. Whenever a friendly DEATHWATCH operative is shooting against, fighting against, or retaliating against an enemy operative that has that order, that friendly operative’s weapons have the Balanced weapon rule." },
  { kind: 'strategy', name: "The Shield That Slays", text: "Whenever a friendly DEATHWATCH operative is wholly within your opponent’s territory, Normal Dmg of 4 or more inflicts 1 less damage on it." },
  { kind: 'strategy', name: "The Long Vigil", text: "Whenever an operative is shooting a friendly DEATHWATCH operative that’s wholly within your territory, you can re-roll one of your defence dice." },
  { kind: 'strategy', name: "And They Shall Know No Fear", text: "You can ignore any changes to the stats of friendly DEATHWATCH operatives from being injured (including their weapons’ stats)." },
  { kind: 'firefight', name: "Suffer Not the Alien", text: "Use this firefight ploy after rolling your attack dice for a friendly DEATHWATCH operative, if it’s shooting against, fighting against, or retaliating against an operative that doesn’t have the CHAOS or IMPERIUM keyword. You can re-roll any of your attack dice." },
  { kind: 'firefight', name: "Advanced Auspex Scan", text: "Use this firefight ploy when a friendly DEATHWATCH operative performs the Shoot action. Until the end of the activation/ counteraction, its ranged weapons have the Saturate weapon rule and enemy operatives cannot be obscured." },
  { kind: 'firefight', name: "Auspicator Tracking", text: "Use this firefight ploy when a friendly DEATHWATCH operative is counteracting, before it performs any actions. You can change its order." },
  { kind: 'firefight', name: "Transhuman Physiology", text: "Use this firefight ploy when an operative is shooting a friendly DEATHWATCH operative, in the Roll Defence Dice step. You can retain one of your normal successes as a critical success instead." },
  { kind: 'equipment', name: "Digital Weapons", text: "Once per turning point, when a friendly\nDEATHWATCH operative performs the Fight action, at the start of the Roll Attack Dice step, you can use this rule. If you do, inflict 1 damage on the enemy operative in that sequence." },
  { kind: 'equipment', name: "Sanctus-v Bioscryer Cuffs", text: "Once during each friendly DEATHWATCH operative’s activation, before or after it performs an action, if it’s not within control range of enemy operatives, you can use this rule. If you do, select one of the following:\n• That friendly operative regains up to D3 lost wounds.\n• Remove any changes to that friendly operative’s APL stat.\n• Remove one of the following tokens that friendly operative has (before that token’s activation effects are resolved, if relevant): Neutron Fragment, Poison, Terrorchem." },
  { kind: 'equipment', name: "Scrutavore Servo-thrall", text: "Once per turning point, during a friendly DEATHWATCH operative’s activation, you can use this rule. If you do, during that activation, that operative can perform a mission action for 1 less AP. Having an enemy operative within its control range doesn’t prevent that friendly operative from performing that mission action. However, in such an instance, after it does so, you and your opponent roll-off. If your opponent wins, you cannot use this equipment for the rest of the battle." },
  { kind: 'equipment', name: "Ammunition Reserve", text: "Once per battle, you can use the Special Issue Ammunition faction rule for up to two Shoot actions during one turning point, but you must select different weapon rules for both uses. This takes precedence over the normal Special Issue Ammunition rules." },
]

export const operatives: Operative[] = [
  { id: "dw:deathwatch-watch-sergeant", name: "Deathwatch Watch Sergeant", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "dw:deathwatch-aegis-veteran", name: "Deathwatch Aegis Veteran", apl: 3, move: "6\"", save: "2+", w: 15 },
  { id: "dw:deathwatch-blademaster-veteran", name: "Deathwatch Blademaster Veteran", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "dw:deathwatch-bombard-veteran", name: "Deathwatch Bombard Veteran", apl: 3, move: "5\"", save: "3+", w: 18 },
  { id: "dw:deathwatch-breacher-veteran", name: "Deathwatch Breacher Veteran", apl: 3, move: "5\"", save: "3+", w: 18 },
  { id: "dw:deathwatch-demolisher-veteran", name: "Deathwatch Demolisher Veteran", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "dw:deathwatch-disruptor-veteran", name: "Deathwatch Disruptor Veteran", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "dw:deathwatch-gunner-veteran", name: "Deathwatch Gunner Veteran", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "dw:deathwatch-headtaker-veteran", name: "Deathwatch Headtaker Veteran", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "dw:deathwatch-horde-slayer-veteran", name: "Deathwatch Horde-slayer Veteran", apl: 3, move: "5\"", save: "3+", w: 18 },
  { id: "dw:deathwatch-marksman-veteran", name: "Deathwatch Marksman Veteran", apl: 3, move: "6\"", save: "3+", w: 15 },
]

// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Omni-scrambler", text: "STRATEGIC GAMBIT if a friendly INFILTRATOR operative is in the killzone. Select one enemy operative visible to a friendly INFILTRATOR operative, or within 6\" of a friendly VOXBREAKER operative. In the Firefight phase of this turning point, that enemy operative cannot be activated or perform actions until one of the following is true:\n• Your opponent has activated a number of enemy operatives equal to the number of friendly INFILTRATOR operatives in the killzone when this STRATEGIC GAMBIT was used.\n• It’s the last enemy operative to be activated." },
  { kind: 'faction', name: "Terror", text: "Whenever an enemy operative is within 3\" of friendly REIVER operatives, your opponent must spend 1 additional AP for that enemy operative to perform the Pick Up Marker and mission actions.\nWhenever determining control of a marker, treat the total APL stat of enemy operatives that contest it as 1 lower if at least one of those enemy operatives is within 3\" of friendly REIVER operatives. Note this isn’t a change to the APL stat, so any changes are cumulative with this." },
  { kind: 'faction', name: "Astartes", text: "During each friendly PHOBOS STRIKE TEAM operative’s activation, it can perform either two Shoot actions or two Fight actions. If it’s two Shoot actions, a bolt weapon must be selected for at least one of them. A bolt weapon is any ranged weapon that includes ‘bolt’ in its name, e.g. marksman bolt carbine, special issue bolt pistol, etc. Each friendly PHOBOS STRIKE TEAM operative can counteract regardless of its order." },
  { kind: 'faction', name: "Multi-spectrum Array", text: "Whenever a friendly INCURSOR operative is shooting, enemy operatives cannot be obscured." },
  { kind: 'strategy', name: "Guerrilla Warfare", text: "Friendly PHOBOS STRIKE TEAM operatives can perform the following unique action:\nGUERRILLA WARFARE (1AP): Change this operative’s order.\nAn operative cannot perform this action while within control range of an enemy operative." },
  { kind: 'strategy', name: "And They Shall Know No Fear", text: "You can ignore any changes to the stats of friendly PHOBOS STRIKE TEAM operatives from being injured (including their weapons’ stats)." },
  { kind: 'strategy', name: "Lethal Assaults", text: "Whenever a friendly PHOBOS STRIKE TEAM operative is fighting, its melee weapons have the Balanced weapon rule. If that friendly operative is doing so during an activation in which it performed the Charge action, its melee weapons also have the Lethal 5+ weapon rule." },
  { kind: 'strategy', name: "Deadly Shots", text: "Whenever a friendly PHOBOS STRIKE TEAM operative is shooting during an activation in which it hasn’t performed the Charge, Fall Back or Reposition action, or against an operative that isn’t in cover and is more than 6\" from it, that friendly operative’s ranged weapons have the Balanced weapon rule. Note that for the first requirement, that operative isn’t restricted from performing those actions after shooting." },
  { kind: 'firefight', name: "Patient Ambush", text: "Use this firefight ploy when it’s your turn to activate a friendly operative. You can skip that activation." },
  { kind: 'firefight', name: "Critical Shot", text: "Use this firefight ploy when you resolve a critical success for a friendly PHOBOS STRIKE TEAM operative that’s shooting with a bolt weapon. Inflict D3 additional damage." },
  { kind: 'firefight', name: "Stealth Assault", text: "Use this firefight ploy when a friendly PHOBOS STRIKE TEAM operative that has a Conceal order is activated, is given an Engage order, performs the Charge and then the Fight action, and you’re resolving your first attack dice from this activation. After doing so, you can immediately resolve another of your attack dice (before your opponent). The operative cannot have performed any other actions during this activation (but can do so after resolving this ploy)." },
  { kind: 'firefight', name: "Transhuman Physiology", text: "Use this firefight ploy when an operative is shooting a friendly PHOBOS STRIKE TEAM operative, in the Roll Defence Dice step. You can retain one of your normal successes as a critical success instead." },
  { kind: 'equipment', name: "Purity Seals", text: "Once per turning point, when a friendly PHOBOS STRIKE TEAM operative is shooting, fighting or retaliating, if you roll two or more fails, you can discard one of them to retain another as a normal success instead." },
  { kind: 'equipment', name: "Additional Utility Grenades", text: "You cannot also select that equipment as normal (i.e. to give you six)." },
  { kind: 'equipment', name: "Special Issue Ammunition", text: "Once per turning point, when a friendly PHOBOS STRIKE TEAM operative is performing the Shoot action and you select a bolt carbine, marksman bolt carbine or occulus bolt carbine, you can use this rule. If you do, until the end of the turning point, that weapon has the Piercing 1 weapon rule." },
  { kind: 'equipment', name: "Combat Blades", text: "Friendly PHOBOS STRIKE TEAM operatives have the following melee weapon — Combat blade: ATK 5, HIT 3+, DMG 3/4.\nNOTES:" },
]

export const operatives: Operative[] = [
  { id: "phobos-strike-team:infiltrator-sergeant", name: "Infiltrator Sergeant", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "phobos-strike-team:infiltrator-commsman", name: "Infiltrator Commsman", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:infiltrator-helix-adept", name: "Infiltrator Helix Adept", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:infiltrator-saboteur", name: "Infiltrator Saboteur", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:infiltrator-veteran", name: "Infiltrator Veteran", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:infiltrator-voxbreaker", name: "Infiltrator Voxbreaker", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:infiltrator-warrior", name: "Infiltrator Warrior", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:incursor-sergeant", name: "Incursor Sergeant", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "phobos-strike-team:incursor-marksman", name: "Incursor Marksman", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:incursor-minelayer", name: "Incursor Minelayer", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:incursor-warrior", name: "Incursor Warrior", apl: 3, move: "7\"", save: "3+", w: 12 },
  { id: "phobos-strike-team:reiver-sergeant", name: "Reiver Sergeant", apl: 3, move: "7\"", save: "3+", w: 13 },
  { id: "phobos-strike-team:reiver-warrior", name: "Reiver Warrior", apl: 3, move: "7\"", save: "3+", w: 12 },
]

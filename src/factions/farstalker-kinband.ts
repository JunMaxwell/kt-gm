// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Farstalker", text: "In the Ready step of each Strategy phase, you can change the order of up to three friendly FARSTALKER KINBAND operatives that are not within control range of enemy operatives. Whenever it’s your turn to counteract, you can change the order of one friendly FARSTALKER KINBAND operative that’s not within control range of enemy operatives instead. This still counts as you counteracting (so activation alternates back to your opponent afterwards), but doesn’t count as that friendly operative’s counteraction for this turning point." },
  { kind: 'strategy', name: "Cut-throats", text: "Add 1 to the Atk stat of friendly FARSTALKER KINBAND operatives’ melee weapons (to a maximum of 5)." },
  { kind: 'strategy', name: "Prey", text: "When a Kroot Farstalker has selected their target, the hunter’s focus is directed fully towards bringing down their chosen prey.\nWhenever a friendly FARSTALKER KINBAND operative is shooting during an activation in which it hasn’t performed the Charge, Fall Back or Reposition action, its ranged weapons have the Balanced and Severe weapon rules; if the weapon already has the Balanced weapon rule, it has the Ceaseless and Severe weapon rules instead. Note that operative isn’t restricted from performing those actions after shooting." },
  { kind: 'strategy', name: "Rogue", text: "Whenever an operative is shooting a friendly FARSTALKER KINBAND operative:\n• Ignore the Saturate weapon rule.\n• If you can retain any cover saves, you can retain one additional cover save, or you can retain one cover save as a critical success instead. This isn’t cumulative with improved cover saves from Vantage terrain." },
  { kind: 'strategy', name: "Bound", text: "During each friendly FARSTALKER KINBAND operative’s activation, you can ignore the first vertical distance of 2\" they move during one climb up." },
  { kind: 'firefight', name: "Savage Ambush", text: "Use this firefight ploy during the Fight action when a ready friendly FARSTALKER KINBAND operative that has Light or Heavy terrain within its control range is selected to fight against. In the Resolve Attack Dice step of that sequence, you resolve the first attack dice (i.e. defender instead of attacker)." },
  { kind: 'firefight', name: "Poach", text: "Use this firefight ploy during a friendly FARSTALKER KINBAND operative’s activation. Until the end of that activation, that operative doesn’t have to control a marker to perform the Pick Up Marker or mission actions that usually require this (this takes precedence over that action’s conditions – it only needs to contest the marker)." },
  { kind: 'firefight', name: "Slip Away", text: "Use this firefight ploy during a friendly FARSTALKER KINBAND operative's activation, before or after it performs an action. During that activation, that operative can perform the Fall Back action for 1 less AP." },
  { kind: 'firefight', name: "Vengeance for the Kinband", text: "Use this firefight ploy when a friendly FARSTALKER KINBAND operative is incapacitated by an enemy operative. Until the end of the battle, whenever another friendly FARSTALKER KINBAND operative is shooting against, fighting against or retaliating against that enemy operative, that other friendly operative's weapons have the Relentless weapon rule. You cannot use this ploy again during the battle until that enemy operative is incapacitated." },
  { kind: 'equipment', name: "Piercing Shot", text: "Once per turning point, when a friendly FARSTALKER KINBAND operative is performing the Shoot action and you select a Kroot rifle, Kroot scattergun or dual Kroot pistols (focused), you can use this rule. If you do, until the end of that action, that weapon has the Piercing 1 weapon rule. You cannot use the Piercing Shot and Toxin Shot rule during the same action." },
  { kind: 'equipment', name: "Meat", text: "Once per turning point, when a friendly FARSTALKER KINBAND operative (excluding HOUND) is activated, if it’s not within control range of enemy operatives, you can use this rule. If you do, that friendly operative regains up to D3+1 lost wounds." },
  { kind: 'equipment', name: "Toxin Shot", text: "Once per turning point, when a friendly FARSTALKER KINBAND operative is performing the Shoot action and you select a Kroot rifle, Kroot scattergun or dual Kroot pistols (focused), you can use this rule. If you do, until the end of that action, that weapon has the Lethal 5+ and Stun weapon rules. You cannot use the Piercing Shot and Toxin Shot rule during the same action." },
  { kind: 'equipment', name: "Trophy", text: "Once per battle, during a friendly FARSTALKER KINBAND operative’s activation (excluding HOUND), before or after it performs an action, if it’s not within control range of enemy operatives, you can use this rule. If you do, add 1 to that friendly operative’s APL stat until the end of its activation." },
]

export const operatives: Operative[] = [
  { id: "farstalker-kinband:kroot-kill-broker", name: "Kroot Kill-broker", apl: 2, move: "6\"", save: "5+", w: 9 },
  { id: "farstalker-kinband:kroot-bow-hunter", name: "Kroot Bow-hunter", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "farstalker-kinband:kroot-cold-blood", name: "Kroot Cold-blood", apl: 2, move: "6\"", save: "5+", w: 9 },
  { id: "farstalker-kinband:kroot-cut-skin", name: "Kroot Cut-skin", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "farstalker-kinband:kroot-heavy-gunner", name: "Kroot Heavy Gunner", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "farstalker-kinband:kroot-hound", name: "Kroot Hound", apl: 2, move: "8\"", save: "5+", w: 7 },
  { id: "farstalker-kinband:kroot-long-sight", name: "Kroot Long-sight", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "farstalker-kinband:kroot-pistolier", name: "Kroot Pistolier", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "farstalker-kinband:kroot-stalker", name: "Kroot Stalker", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "farstalker-kinband:kroot-tracker", name: "Kroot Tracker", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "farstalker-kinband:kroot-warrior", name: "Kroot Warrior", apl: 2, move: "6\"", save: "5+", w: 8 },
]

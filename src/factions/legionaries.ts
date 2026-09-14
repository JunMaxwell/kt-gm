// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Marks of Chaos", text: "Whenever you select a LEGIONARY operative for the battle, you must select one of the following keywords for it to have for that battle: KHORNE, NURGLE, SLAANESH, TZEENTCH, UNDIVIDED. Each operative’s keyword can be different, but a BALEFIRE ACOLYTE operative cannot have the KHORNE keyword. Friendly LEGIONARY operatives have an additional rule determined by this keyword. In addition, LEGIONARY ploys have additional benefits for operatives with the relevant keyword.\nKHORNE Wrathful Onslaught This operative’s melee weapons have the Severe weapon rule." },
  { kind: 'faction', name: "Marks of Chaos Nurgle", text: "Disgusting Vigour Whenever Normal Dmg of 3 or more is inflicted on this operative, roll one D6: on a 5+, subtract 1 from that inflicted damage." },
  { kind: 'faction', name: "Marks of Chaos Tzeentch", text: "Empyreal Guidance This operative’s ranged weapons have the Severe weapon rule." },
  { kind: 'faction', name: "Marks of Chaos Slaanesh", text: "Unnatural Agility Add 1\" to this operative’s Move stat." },
  { kind: 'faction', name: "Marks of Chaos Undivided", text: "Vicious Reavers Whenever this operative is shooting against, fighting against or retaliating against an enemy operative within 6\" of it, this operative’s weapons have the Ceaseless weapon rule." },
  { kind: 'faction', name: "Astartes", text: "During each friendly LEGIONARY operative’s activation, it can perform either two Shoot actions or two Fight actions. If it’s two Shoot actions, a bolt pistol, boltgun or tainted bolt pistol must be selected for at least one of them. Each friendly LEGIONARY operative can counteract regardless of its order." },
  { kind: 'strategy', name: "Blood for the Blood God", text: "Whenever a friendly LEGIONARY operative (excluding KHORNE) is fighting, the first time you strike during that sequence, inflict 1 additional damage (to a maximum of 7).\nAdd 1 to both Dmg stats of friendly LEGIONARY KHORNE operatives’ melee weapons (to a maximum of 7)." },
  { kind: 'strategy', name: "Implacable", text: "Whenever an operative is shooting a friendly LEGIONARY operative, weapons with the Piercing 1 weapon rule have the Piercing Crits 1 weapon rule instead.\nYou can ignore any changes to the stats of friendly LEGIONARY NURGLE operatives from being injured (including their weapons’ stats)." },
  { kind: 'strategy', name: "Quicksilver Speed", text: "Whenever a friendly LEGIONARY operative that performed an action in which it moved during this turning point is fighting, worsen the Hit stat of the enemy operative’s melee weapons by 1. Whenever an operative is shooting a friendly LEGIONARY SLAANESH operative more than 6\" from it that performed an action in which it moved during this turning point, worsen the Hit stat of the enemy operative’s weapons by 1. In all cases for this ploy, this isn’t cumulative with being injured." },
  { kind: 'firefight', name: "Unending Bloodshed", text: "Use this firefight ploy when a friendly LEGIONARY KHORNE operative is incapacitated while fighting or retaliating. You can strike the enemy operative in that sequence with one of your unresolved successes before it’s removed from the killzone." },
  { kind: 'strategy', name: "Fickle Fates", text: "Whenever a friendly LEGIONARY operative is shooting a ready enemy operative, that friendly operative’s ranged weapons have the Balanced weapon rule. Whenever an operative is shooting a ready friendly LEGIONARY TZEENTCH operative, in the Roll Defence Dice step, if you retain any critical successes, you can retain one of your fails as a normal success instead of discarding it." },
  { kind: 'firefight', name: "Mutability and Change", text: "Use this firefight ploy when a friendly LEGIONARY TZEENTCH operative is activated. Until the end of that operative’s activation, add 1 to its APL stat, but it cannot perform the same action more than once during that activation. If it’s a WARRIOR operative, that operative’s Marks of Chaos keyword cannot be changed during this turning point (see Infernal Pact additional rule)." },
  { kind: 'firefight', name: "Malignant Aura", text: "Use this firefight ploy when a friendly LEGIONARY NURGLE operative is performing the Shoot action, when you select a valid target. Until the end of that action, whenever that friendly operative is shooting an enemy operative within 3\" of it (i.e. including secondary targets, if any), that friendly operative’s ranged weapons have the Piercing 1 weapon rule." },
  { kind: 'equipment', name: "Warded Armour", text: "STRATEGIC GAMBIT. Select one friendly LEGIONARY operative. Until the Ready step of the next Strategy phase, change that operative’s Save stat to 2+." },
  { kind: 'firefight', name: "Sickening Captivation", text: "Use this firefight ploy during a friendly LEGIONARY SLAANESH operative’s activation, before or after it performs an action. Select one enemy operative visible to and within 4\" of that friendly operative. Until the end of that enemy operative’s next activation, subtract 1 from its APL stat." },
  { kind: 'equipment', name: "Tainted Rounds", text: "Once per turning point, when a friendly LEGIONARY operative is performing the Shoot action and you select a bolt pistol or boltgun, you can use this rule. If you do, until the end of that action, that weapon has the Rending weapon rule." },
  { kind: 'equipment', name: "Chaos Talismans", text: "STRATEGIC GAMBIT. Select one Marks of Chaos keyword. Once during each of their activations, when a friendly LEGIONARY operative that has that keyword is shooting, fighting or retaliating, if you roll two or more fails, you can inflict D3 damage on that friendly operative to discard one of them and retain the other as a normal success instead. Note that if it’s the Shoot action and that damage incapacitates that friendly operative, the action doesn’t end (continue the sequence with your successful attack dice)." },
  { kind: 'equipment', name: "Malefic Blades", text: "Friendly LEGIONARY operatives have the following melee weapon:\nNAME ATK HIT DMG\nMalefic blade 5 3+ 3/4" },
]

export const operatives: Operative[] = [
  { id: "legionaries:legionary-aspiring-champion", name: "Legionary Aspiring Champion", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "legionaries:legionary-chosen", name: "Legionary Chosen", apl: 3, move: "6\"", save: "3+", w: 15 },
  { id: "legionaries:legionary-anointed", name: "Legionary Anointed", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "legionaries:legionary-balefire-acolyte", name: "Legionary Balefire Acolyte", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "legionaries:legionary-butcher", name: "Legionary Butcher", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "legionaries:legionary-gunner", name: "Legionary Gunner", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "legionaries:legionary-heavy-gunner", name: "Legionary Heavy Gunner", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "legionaries:legionary-icon-bearer", name: "Legionary Icon Bearer", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "legionaries:legionary-shrivetalon", name: "Legionary Shrivetalon", apl: 3, move: "6\"", save: "3+", w: 14 },
  { id: "legionaries:legionary-warrior", name: "Legionary Warrior", apl: 3, move: "6\"", save: "3+", w: 14 },
]

// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Skill at Arms", text: "STRATEGIC GAMBIT. Select a SKILL AT ARMS for friendly KASRKIN operatives to have until the Ready step of the next Strategy phase.\nFriendly KASRKIN operatives’ ranged weapons have the Severe weapon rule.\nWhenever a friendly KASRKIN operative is performing the Reposition action, add 1\" to its Move stat.\nAdd 1 to the Atk stat of friendly KASRKIN operatives’ melee weapons (to a maximum of 4). Whenever a friendly KASRKIN operative is fighting, the first time you strike during that sequence, inflict 1 additional damage.\nWhenever a friendly KASRKIN operative is fighting or retaliating, or an operative is shooting it, the first time an attack dice inflicts Normal Dmg of 3 or more on this operative during that sequence, that dice inflicts 1 less damage on it." },
  { kind: 'faction', name: "Rapid Fire", text: "Each friendly KASRKIN operative that doesn’t perform an action in which it moves during its activation can perform two Shoot actions (excluding Guard) during that activation, but a bolt pistol, hot-shot lasgun or hot-shot laspistol must be selected for both of those actions." },
  { kind: 'strategy', name: "Engage from Cover", text: "Whenever an operative is shooting a friendly KASRKIN operative that’s in cover, you can re-roll one of your defence dice." },
  { kind: 'strategy', name: "Elimination Pattern", text: "Whenever a friendly KASRKIN operative is shooting with a hot-shot weapon against an operative that cannot retain any cover saves or is being scanned (see RECON-TROOPER), that weapon has the Piercing Crits 1 weapon rule, or Piercing 1 instead if it’s a hot-shot volley gun." },
  { kind: 'strategy', name: "Clearance Sweep", text: "Place your Clearance Sweep marker in the killzone. Whenever a friendly KASRKIN operative within 5\" horizontally of that marker is shooting an operative also within 5\" horizontally of that marker, that friendly operative’s weapons have the Ceaseless weapon rule. In the Ready step of the next Strategy phase, remove that marker." },
  { kind: 'strategy', name: "Relocate", text: "Select one friendly KASRKIN operative that’s more than 3\" from enemy operatives. That operative, and each other friendly KASRKIN operative that’s both within 3\" of that operative and more than 3\" from enemy operatives, can immediately perform a free Dash action in an order of your choice. You cannot use this ploy during the first turning point." },
  { kind: 'firefight', name: "Cover Retreat", text: "Use this firefight ploy when a friendly KASRKIN operative performs the Fall Back action while visible to and within 6\" of another friendly KASRKIN operative that’s not within control range of enemy operatives. After that friendly operative has finished moving, but before that Fall Back action ends, that other friendly operative can immediately perform a free Shoot action (you can change its order to Engage to do so)." },
  { kind: 'firefight', name: "Seize the Initiative", text: "Use this firefight ploy at the start of the Firefight phase. One friendly KASRKIN operative can immediately perform a 1AP action for free, but it cannot move during that action. You cannot use this ploy if you’re the player with initiative." },
  { kind: 'firefight', name: "Neutralise Target", text: "Use this firefight ploy after rolling your attack dice for a friendly KASRKIN operative, if it’s shooting an operative that either cannot retain any cover saves or is being scanned (see RECON-TROOPER). You can re-roll any of your attack dice." },
  { kind: 'firefight', name: "Give No Ground", text: "Use this firefight ploy during a friendly KASRKIN operative’s activation, or at the end of the Firefight phase. Select one of your mission markers or an objective marker. Until the end of that activation or until the start of the next turning point respectively, if the total APL of friendly KASRKIN operatives that contest that marker is 2, and the total APL of enemy operatives that contest it is the same, friendly KASRKIN operatives control that marker." },
  { kind: 'equipment', name: "Long-range Scope", text: "Whenever a friendly KASRKIN operative is shooting an operative more than 6\" from it, that friendly operative’s hot-shot weapons have the Saturate weapon rule." },
  { kind: 'equipment', name: "Foregrip", text: "Whenever a friendly KASRKIN operative is shooting an operative within 3\" of it, ranged weapons on its datacard (excluding weapons that include ‘pistol’ in their name, e.g. hot-shot laspistol, all profiles of a plasma pistol, etc.) have the Accurate 1 weapon rule." },
  { kind: 'equipment', name: "Relics of Cadia", text: "Once per turning point, when a friendly KASRKIN operative is shooting, fighting or retaliating, if you roll two or more fails, you can discard one of them to retain another as a normal success instead." },
  { kind: 'equipment', name: "Combat Daggers", text: "Friendly KASRKIN operatives have the following melee weapon — Combat dagger: ATK 3, HIT 4+, DMG 3/4." },
]

export const operatives: Operative[] = [
  { id: "kasrkin:kasrkin-sergeant", name: "Kasrkin Sergeant", apl: 3, move: "6\"", save: "4+", w: 9 },
  { id: "kasrkin:kasrkin-combat-medic", name: "Kasrkin Combat Medic", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "kasrkin:kasrkin-demo-trooper", name: "Kasrkin Demo-trooper", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "kasrkin:kasrkin-gunner", name: "Kasrkin Gunner", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "kasrkin:kasrkin-recon-trooper", name: "Kasrkin Recon-trooper", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "kasrkin:kasrkin-sharpshooter", name: "Kasrkin Sharpshooter", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "kasrkin:kasrkin-trooper", name: "Kasrkin Trooper", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "kasrkin:kasrkin-vox-trooper", name: "Kasrkin Vox-trooper", apl: 2, move: "6\"", save: "4+", w: 8 },
]

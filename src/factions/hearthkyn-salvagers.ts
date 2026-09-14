// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Grudge", text: "If a particular foe shames or insults the Kin gravely enough, they will become the subject of a Grudge. To destroy this most hated enemy, the Kin will go to any lengths, even if it is to their own detriment.\nWhenever an enemy operative incapacitates a friendly HEARTHKYN SALVAGER operative, that enemy operative gains one of your Grudge tokens for the battle.\nWhenever a friendly HEARTHKYN SALVAGER operative is shooting against, fighting against or retaliating against an enemy operative, for each of your Grudge tokens that enemy operative has, you can retain one of your normal successes as a critical success instead (including any normal successes already retained as a result of the Accurate weapon rule). Note that Grudge tokens aren’t removed when you do this." },
  { kind: 'strategy', name: "Need Keeps", text: "Select one objective marker or one of your mission markers.\n• Whenever determining control of that marker, treat the total APL stat of friendly HEARTHKYN SALVAGER operatives that contest it as 1 higher if at least one friendly HEARTHKYN SALVAGER operative contests that marker. Note this isn’t a change to the APL stat, so any changes are cumulative with this.\n• Whenever a friendly HEARTHKYN SALVAGER operative is within 3\" of that marker, add 1 to the Atk stat of its melee weapons (to a maximum of 4); if the weapon already has an Atk stat of 4, it has the Balanced weapon rule." },
  { kind: 'strategy', name: "Wrought Defence", text: "Whenever an operative is shooting a friendly HEARTHKYN SALVAGER operative, if you rolled one or less successes (including any re-rolls), you can retain one of your fails as a normal success instead of discarding it." },
  { kind: 'strategy', name: "Toil Earns", text: "Select one objective marker or one of your mission markers. Whenever an enemy operative is within 3\" of that marker, treat it as having one additional Grudge token." },
  { kind: 'strategy', name: "Proximate Firepower", text: "Whenever a friendly HEARTHKYN SALVAGER operative is shooting an enemy operative within 6\" of it, improve the Hit stat of that friendly operative’s ranged weapons by 1 (to a maximum of 3+). This can allow you to apply or remove the Hit stat change during an action (this takes precedence over the core rules)." },
  { kind: 'firefight', name: "The Ancestors Are Watching", text: "Use this firefight ploy during a friendly HEARTHKYN SALVAGER operative’s activation. Until the end of that activation, that operative can perform either a free Shoot or a free Fight action and you can ignore any changes to that operative’s weapon stats from being injured." },
  { kind: 'firefight', name: "Sturdy", text: "Use this firefight ploy when an operative is shooting a friendly HEARTHKYN SALVAGER operative, when you collect your defence dice. Change the attacker’s retained critical successes to normal successes (any weapon rules they’ve already resolved aren’t affected, e.g. Piercing Crits)." },
  { kind: 'firefight', name: "Worth It", text: "Use this firefight ploy when a friendly HEARTHKYN SALVAGER operative is incapacitated. It can perform a free mission action before it’s removed from the killzone." },
  { kind: 'firefight', name: "Engage to Acquire", text: "Use this firefight ploy after rolling your attack dice for a friendly HEARTHKYN SALVAGER operative, if it’s shooting against or fighting against an enemy operative that controls an objective marker or one of your mission markers. You can re-roll any of your attack dice." },
  { kind: 'equipment', name: "Plasma Knives", text: "Friendly HEARTHKYN SALVAGER operatives have the following melee weapon. Note that the FIELD MEDIC operative already has this weapon but with better stats; in that instance, use the better version.\nNAME ATK HIT DMG\nPlasma knife 3 4+ 3/5 WR Lethal 5+" },
  { kind: 'equipment', name: "Excavation Tools", text: "Friendly HEARTHKYN SALVAGER operatives can perform the Pick Up Marker action for 1 less AP, and don’t have to control the marker to do so (this takes precedence over that action’s conditions – they only need to contest the marker)." },
  { kind: 'equipment', name: "Climbing Rigs", text: "During each friendly HEARTHKYN SALVAGER operative’s activation, you can do one of the following:\n• When that operative is climbing up, you can treat the vertical distance as 2\" (regardless of how far the operative actually moves vertically).\n• When that operative is dropping, ignore the vertical distance." },
  { kind: 'equipment', name: "Writ of Claim", text: "When the Salvagers of a League have staked their claim, they will defend their due with steadfast determination.\nOnce per battle, if friendly HEARTHKYN SALVAGER operatives contest two or more objective markers, after rolling off to decide initiative, you can use this rule. If you do, you can re-roll your dice." },
]

export const operatives: Operative[] = [
  { id: "hearthkyn-salvagers:hearthkyn-theyn", name: "Hearthkyn Theyn", apl: 2, move: "5\"", save: "3+", w: 9 },
  { id: "hearthkyn-salvagers:hearthkyn-d-zr", name: "Hearthkyn Dôzr", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-field-medic", name: "Hearthkyn Field Medic", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-grenadier", name: "Hearthkyn Grenadier", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-gunner", name: "Hearthkyn Gunner", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-jump-pack-warrior", name: "Hearthkyn Jump Pack Warrior", apl: 2, move: "8\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-kinlynk", name: "Hearthkyn Kinlynk", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-kognit-ar", name: "Hearthkyn Kognitâar", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-lok-tr", name: "Hearthkyn Lokâtr", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-lugger", name: "Hearthkyn Lugger", apl: 2, move: "5\"", save: "3+", w: 8 },
  { id: "hearthkyn-salvagers:hearthkyn-warrior", name: "Hearthkyn Warrior", apl: 2, move: "5\"", save: "3+", w: 8 },
]

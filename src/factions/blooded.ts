// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Blooded", text: "• In the Ready step of each Strategy phase.\n• The first time an enemy operative is incapacitated during each turning point.\n• The first time a friendly operative is incapacitated within 6\" of an enemy operative during each turning point." },
  { kind: 'strategy', name: "Reckless Aspirant", text: "Whenever a friendly BLOODED operative that’s wholly within your opponent’s territory and doesn’t have one of your Blooded tokens is shooting or fighting, its weapons have the Accurate 1 weapon rule.\nWhenever a friendly BLOODED operative that has one of your Blooded tokens is wholly within your opponent’s territory, its weapons have the Punishing weapon rule." },
  { kind: 'strategy', name: "Glory Kill", text: "Select one enemy operative. Until the end of the turning point, whenever a friendly BLOODED operative is shooting against, fighting against or retaliating against that enemy operative, that shooting, fighting or retaliating operative’s weapons have the Ceaseless weapon rule, or Relentless if it has one of your Blooded tokens." },
  { kind: 'strategy', name: "Malevolent Grit", text: "Whenever an operative is shooting a friendly BLOODED operative that has one of your Blooded tokens or is wholly within your opponent’s territory, you can re-roll one of your defence dice." },
  { kind: 'strategy', name: "Bitter Demise", text: "Whenever a friendly BLOODED operative is incapacitated, before it’s removed from the killzone, roll one D3: on a 3 (or 2+ if that friendly operative has one of your Blooded tokens), inflict damage equal to the result on one enemy operative visible to and within 2\" of that friendly operative." },
  { kind: 'firefight', name: "Moment of Repute", text: "Use this firefight ploy during the activation of a friendly BLOODED operative that’s under the GAZE OF THE GODS, before or after it performs an action. Until the end of that operative’s activation, add 1 to its APL stat." },
  { kind: 'firefight', name: "Callous Disregard", text: "Use this firefight ploy when a friendly BLOODED operative performs the Shoot action and you’re selecting a valid target. Having other friendly BLOODED operatives within an enemy operative’s control range doesn’t prevent that enemy operative from being selected. Until the end of that action, whenever you discard an attack dice as a fail, inflict damage equal to the dice result on one friendly operative of your choice within control range of the target." },
  { kind: 'firefight', name: "Reward Earned", text: "Use this firefight ploy when an enemy operative is incapacitated by a friendly BLOODED operative within 2\" of it that has one of your Blooded tokens. You gain one Blooded token." },
  { kind: 'firefight', name: "Dark Favour", text: "Use this firefight ploy when a friendly BLOODED operative that has one of your Blooded tokens is selected as the valid target of a Shoot action or to fight against during the Fight action. Select one other friendly BLOODED operative visible to and within 3\" of that first friendly operative to become the valid target or to be fought against (as appropriate) instead (even if it wouldn’t normally be valid for this). If it’s the Fight action, treat that other operative as being within the fighting operative’s control range for the duration of that action. If it’s the Shoot action, that other operative is only in cover or obscured if the original target was. This ploy has no effect if it’s the Shoot action and the ranged weapon has the Blast or Torrent weapon rule." },
  { kind: 'equipment', name: "Sinister Trophies", text: "Whenever an enemy operative is shooting against, fighting against or retaliating against a friendly BLOODED operative that has one of your Blooded tokens and is within 2\" of it, your opponent cannot re-roll their attack dice results of 1." },
  { kind: 'equipment', name: "Chaos Sigil", text: "The disquieting sigils carried by the Blooded bend reality and thin the veil between realspace and the ever-shifting tides of the warp.\nThe Reward Earned firefight ploy costs you 0CP." },
  { kind: 'equipment', name: "Symbols of Bloody Worship", text: "Whenever a friendly BLOODED operative ends an action, if it wasn’t incapacitated but inflicted damage on any enemy operatives during that action, it regains 1 lost wound." },
  { kind: 'equipment', name: "Wicked Blades", text: "Add 1 to both Dmg stats of each friendly BLOODED operative’s bayonet, bayonet & shield and improvised blade for the battle." },
]

export const operatives: Operative[] = [
  { id: "blooded:traitor-chieftain", name: "Traitor Chieftain", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "blooded:traitor-brimstone-grenadier", name: "Traitor Brimstone Grenadier", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "blooded:traitor-butcher", name: "Traitor Butcher", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "blooded:traitor-corpseman", name: "Traitor Corpseman", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "blooded:traitor-commsman", name: "Traitor Commsman", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "blooded:traitor-enforcer", name: "Traitor Enforcer", apl: 2, move: "6\"", save: "4+", w: 9 },
  { id: "blooded:traitor-flenser", name: "Traitor Flenser", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "blooded:traitor-gunner", name: "Traitor Gunner", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "blooded:traitor-ogryn", name: "Traitor Ogryn", apl: 2, move: "6\"", save: "5+", w: 16 },
  { id: "blooded:traitor-sharpshooter", name: "Traitor Sharpshooter", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "blooded:traitor-thug", name: "Traitor Thug", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "blooded:traitor-trench-sweeper", name: "Traitor Trench Sweeper", apl: 2, move: "6\"", save: "4+", w: 9 },
  { id: "blooded:traitor-trooper", name: "Traitor Trooper", apl: 2, move: "6\"", save: "5+", w: 7 },
]

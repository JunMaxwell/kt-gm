// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Throat Slittas", text: "Each friendly KOMMANDO operative (excluding BOMB SQUIG) can perform the Charge action while it has a Conceal order." },
  { kind: 'strategy', name: "Dakka! Dakka! Dakka!", text: "Friendly KOMMANDO operatives’ ranged weapons have the Punishing weapon rule." },
  { kind: 'strategy', name: "Waaagh!", text: "Friendly KOMMANDO operatives’ melee weapons have the Balanced weapon rule." },
  { kind: 'strategy', name: "Sssshhhh!", text: "Each friendly KOMMANDO operative that’s not a valid target for enemy operatives, or has a Conceal order and is more than 6\" from enemy operatives, can immediately perform a free Dash action. You cannot use this ploy during the first turning point." },
  { kind: 'strategy', name: "Skulk About", text: "Whenever an enemy operative is shooting a friendly KOMMANDO operative that has a Conceal order, you can retain one of your defence dice as a normal success without rolling it (in addition to a cover save, if any)." },
  { kind: 'firefight', name: "Just a Scratch", text: "Use this firefight ploy when an attack dice inflicts Normal Dmg on a friendly KOMMANDO operative (excluding BOMB SQUIG and GROT). Ignore that inflicted damage." },
  { kind: 'firefight', name: "Krump ’em!", text: "Use this firefight ploy at the end of the Firefight phase. Select one friendly KOMMANDO operative. It can immediately perform a free Fight action." },
  { kind: 'firefight', name: "Shake It Off", text: "Use this firefight ploy when a friendly KOMMANDO operative is activated, or when its APL stat is changed. Until the start of the next turning point, you can ignore any changes to its APL stat." },
  { kind: 'firefight', name: "Kunnin’ But Brutal", text: "Use this firefight ploy when a friendly KOMMANDO operative that has a Conceal order is fighting during an activation in which it performed the Charge action, you’re resolving the first attack dice, and it’s a strike with a normal success. Treat that normal success as a critical success instead." },
  { kind: 'equipment', name: "Choppas", text: "Friendly KOMMANDO operatives (excluding BOMB SQUIG and GROT) have the following melee weapon — Choppa: ATK 3, HIT 3+, DMG 4/5. Note that some operatives already have this weapon but with better stats; in that instance, use the better version." },
  { kind: 'equipment', name: "Dynamite", text: "Once per battle, a friendly KOMMANDO operative (excluding BOMB SQUIG and GROT) can use the following ranged weapon — Dynamite: ATK 5, HIT 4+, DMG 4/5. WR Range 4\", Blast 1\", Heavy (Reposition only), Saturate." },
  { kind: 'equipment', name: "Collapsible Stocks", text: "Remove the Range weapon rule from the following ranged weapons friendly KOMMANDO operatives have:\n• Shokka pistol\n• Slugga" },
  { kind: 'equipment', name: "Harpoon", text: "Once per turning point, a friendly KOMMANDO operative (excluding BOMB SQUIG and GROT) can use the following ranged weapon — Harpoon: ATK 4, HIT 4+, DMG 4/5. WR Range 8\", Lethal 5+, Stun.\nNOTES:" },
]

export const operatives: Operative[] = [
  { id: "kom:kommando-boss-nob", name: "Kommando Boss Nob", apl: 3, move: "6\"", save: "5+", w: 14 },
  { id: "kom:kommando-bomb-squig", name: "Kommando Bomb Squig", apl: 2, move: "6\"", save: "5+", w: 5 },
  { id: "kom:kommando-boy", name: "Kommando Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "kom:kommando-breacha-boy", name: "Kommando Breacha Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "kom:kommando-burna-boy", name: "Kommando Burna Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "kom:kommando-comms-boy", name: "Kommando Comms Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "kom:kommando-dakka-boy", name: "Kommando Dakka Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "kom:kommando-grot", name: "Kommando Grot", apl: 2, move: "6\"", save: "5+", w: 5 },
  { id: "kom:kommando-rokkit-boy", name: "Kommando Rokkit Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "kom:kommando-slasha-boy", name: "Kommando Slasha Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "kom:kommando-snipa-boy", name: "Kommando Snipa Boy", apl: 2, move: "6\"", save: "5+", w: 10 },
]

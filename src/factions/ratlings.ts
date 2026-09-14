// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Scarper", text: "After each enemy operative’s activation, before the next operative is activated, one friendly RATLING operative (excluding BULLGRYN, OGRYN and SNEAK) can perform a free Dash action, but it cannot end that move within 3\" of an enemy operative unless it’s not visible to every enemy operative when it ends that move. Each friendly operative can only do this once per turning point, and cannot do so after the final activation of the turning point." },
  { kind: 'strategy', name: "Sniper Positions", text: "Whenever a friendly RATLING operative is more than 6\" from enemy operatives and within 1\" of Heavy terrain, the stationary profile of its rifle (if any) has the Silent weapon rule." },
  { kind: 'strategy', name: "Shifty", text: "Whenever a friendly RATLING operative (excluding OGRYN or BULLGRYN) has a Conceal order and is in cover, it cannot be selected as a valid target, taking precedence over all other rules (e.g. Seek, Vantage terrain) except being within 2\"." },
  { kind: 'strategy', name: "Crack Shots", text: "Whenever a friendly RATLING operative is shooting an enemy operative more than 6\" from it, if that friendly operative hasn’t performed the Charge, Fall Back or Reposition action during the activation, or if it’s a counteraction, its rifle (if any) has the Balanced weapon rule. Note that operative isn’t restricted from performing those actions after shooting." },
  { kind: 'strategy', name: "Frontline Assault", text: "Whenever a friendly RATLING BULLGRYN or friendly RATLING OGRYN operative within your opponent’s territory or within 3\" of an objective marker is shooting, fighting or retaliating, its weapons have the Balanced weapon rule." },
  { kind: 'firefight', name: "Survival Instincts", text: "Use this firefight ploy when an enemy operative is shooting against or fighting against a friendly RATLING operative (excluding OGRYN or BULLGRYN) and you’re allocating a dice to block. If it’s a normal success, it can block one unresolved critical success; if it’s a critical success, it can block two unresolved successes (normal or critical)." },
  { kind: 'firefight', name: "Larcenous", text: "Use this firefight ploy during a friendly RATLING operative’s activation (excluding OGRYN or BULLGRYN). Until the end of that activation, that operative doesn’t have to control a marker to perform the Pick Up Marker or mission actions that usually require this (this takes precedence over that action’s conditions – it only needs to contest the marker), and having an enemy operative within its control range doesn’t prevent it from doing so." },
  { kind: 'firefight', name: "Sharpshot", text: "Use this firefight ploy when a friendly RATLING operative is performing the Shoot action with a rifle and you’re selecting a valid target. Having other friendly RATLING operatives within an enemy operative’s control range doesn’t prevent that enemy operative from being selected." },
  { kind: 'firefight', name: "Shoot and Hide", text: "Use this firefight ploy after a friendly RATLING operative that has an Engage order performs the Shoot action with a rifle. If it’s more than 3\" from enemy operatives, or not visible to every enemy operative, you can change its order to Conceal." },
  { kind: 'equipment', name: "Purloined Rations", text: "Once per turning point, when a friendly RATLING operative is shooting with a rifle and you’ve rolled your attack dice, you can use this rule. If you do, improve the Hit stat of its rifle by 1 until the end of that sequence. This can allow you to apply the Hit stat change during an action (this takes precedence over the core rules)." },
  { kind: 'equipment', name: "Stolen Goods", text: "At the end of the Select Operatives step, roll one D3. If the result is:\n• 1, you lose 1CP.\n• 2, you gain 1CP.\n• 3, your opponent loses 1CP." },
  { kind: 'equipment', name: "Lucky Round", text: "Once per turning point, when a friendly RATLING operative is shooting with a rifle and you’ve rolled your attack dice, you can use this rule. If you do, that weapon has the Severe weapon rule until the end of that sequence." },
  { kind: 'equipment', name: "Improvised Armour", text: "Whenever an operative is shooting a friendly RATLING BULLGRYN or friendly RATLING\nOGRYN operative, defence dice results of 5+ are critical successes." },
]

export const operatives: Operative[] = [
  { id: "ratlings:ratling-fixer", name: "Ratling Fixer", apl: 2, move: "5\"", save: "5+", w: 7 },
  { id: "ratlings:ratling-battlemutt", name: "Ratling Battlemutt", apl: 2, move: "6\"", save: "5+", w: 4 },
  { id: "ratlings:bullgryn", name: "Bullgryn", apl: 2, move: "6\"", save: "4+", w: 16 },
  { id: "ratlings:ogryn", name: "Ogryn", apl: 2, move: "6\"", save: "5+", w: 16 },
  { id: "ratlings:ratling-big-shot", name: "Ratling Big Shot", apl: 2, move: "5\"", save: "5+", w: 6 },
  { id: "ratlings:ratling-bomber", name: "Ratling Bomber", apl: 2, move: "5\"", save: "4+", w: 6 },
  { id: "ratlings:ratling-hardbit", name: "Ratling Hardbit", apl: 2, move: "5\"", save: "5+", w: 6 },
  { id: "ratlings:ratling-raider", name: "Ratling Raider", apl: 2, move: "5\"", save: "5+", w: 6 },
  { id: "ratlings:ratling-sneak", name: "Ratling Sneak", apl: 2, move: "5\"", save: "5+", w: 6 },
  { id: "ratlings:ratling-sniper", name: "Ratling Sniper", apl: 2, move: "5\"", save: "5+", w: 6 },
  { id: "ratlings:ratling-spotter", name: "Ratling Spotter", apl: 2, move: "5\"", save: "5+", w: 6 },
  { id: "ratlings:ratling-stashmaster", name: "Ratling Stashmaster", apl: 2, move: "5\"", save: "5+", w: 6 },
  { id: "ratlings:ratling-vox-thief", name: "Ratling Vox-thief", apl: 2, move: "5\"", save: "5+", w: 6 },
]

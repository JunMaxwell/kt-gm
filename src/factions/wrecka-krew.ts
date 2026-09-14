// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Tanked Up", text: "The first time a friendly WRECKA KREW operative (excluding BOMB SQUIG) that has an Engage order performs either the Charge, Shoot or Fight action (excluding Guard) during each of its activations/counteractions, add 1 to its APL stat until the start of its next activation." },
  { kind: 'faction', name: "Wrecka Rampage", text: "Whenever a friendly WRECKA KREW operative is shooting, fighting or retaliating, in the Roll Attack Dice step:\n• For each attack dice result of 6 you retain, you gain one Wrecka point.\n• You can spend up to 2 of your Wrecka points\n(unless it’s a BOMB SQUIG, then you cannot spend any). For each point you spend this way, retain one of your fails as a normal success instead of discarding it.\nYou cannot have more than 6 Wrecka points at once. You can gain and spend Wrecka points during the same action and can do so in an order of your choice, unless you started the action with 6, in which case you can only spend them." },
  { kind: 'strategy', name: "Waaagh!", text: "When the Wrecka Krew’s violent rampage reaches its crescendo, a rage overcomes them. They bellow the infamous Ork battle cry as they set upon their enemies with hammer and fist.\nFriendly WRECKA KREW operatives’ melee weapons have the Balanced weapon rule." },
  { kind: 'strategy', name: "Destruction", text: "If an enemy takes cover, this just provides Wrecka Krews with the opportunity to blow more stuff up.\nFriendly WRECKA KREW operatives’ ranged weapons have the Saturate weapon rule." },
  { kind: 'strategy', name: "Tuff Gitz", text: "Whenever an operative is shooting a friendly WRECKA KREW operative that has an Engage order, you can re-roll one of your defence dice." },
  { kind: 'strategy', name: "Amped Up", text: "Each friendly WRECKA KREW operative that has an Engage order can immediately regain up to D3+1 lost wounds (roll separately for each)." },
  { kind: 'firefight', name: "Just a Scratch", text: "Use this firefight ploy when an attack dice inflicts Normal Dmg on a friendly WRECKA KREW operative (excluding BOMB SQUIG). Ignore that inflicted damage." },
  { kind: 'firefight', name: "Proppa Scrap", text: "Use this firefight ploy during a friendly WRECKA KREW BREAKA BOY or WRECKA KREW BOSS NOB operative’s activation. During that activation, that operative can perform two Fight actions." },
  { kind: 'firefight', name: "Demolition Job", text: "Use this firefight ploy after a friendly WRECKA KREW operative performs the Shoot or Fight action, just before incapacitated operatives are removed (if any). Place one of your Demolition markers within the target’s control range (if it’s using a Blast weapon, the primary target). Whenever a friendly WRECKA KREW operative (excluding BOMB SQUIG) is shooting against, fighting against or retaliating against an operative that’s within 3\" of that marker, you can spend a Wrecka point for free (even if you have none). In the Ready step of the next Strategy phase, remove that marker." },
  { kind: 'firefight', name: "Kaboom!", text: "Use this firefight ploy when a friendly WRECKA KREW operative performs the Shoot action and a weapon with the Blast weapon rule is selected. Until the end of that action, add 1\" to that weapon’s Blast and it has the Severe weapon rule when shooting the primary target. You cannot use this ploy and the Drill Rokkits rule (see faction equipment) during the same action. Note that Severe doesn’t generate a Wrecka point (as it’s not a 6)." },
  { kind: 'equipment', name: "Drill Rokkits", text: "Once per turning point, when a friendly WRECKA KREW operative is performing the Shoot action and you select a rokkit launcha or ’eavy rokkit launcha, you can use this rule. If you do, until the end of that action, that weapon loses the Blast weapon rule but has the Piercing 1 weapon rule." },
  { kind: 'equipment', name: "Engine Oil", text: "Once per turning point, when a friendly WRECKA KREW operative (excluding BOMB SQUIG) is activated, you can use this rule. If you do, until the end of that activation, you can ignore any changes to that operative’s stats from being injured (including its weapons’ stats)." },
  { kind: 'equipment', name: "Extra Armour", text: "Subtract 1\" from the Move stat of friendly WRECKA KREW operatives and improve their Save stat by 1. This excludes BOMB SQUIG operatives and isn’t cumulative with the Protective rule of a Portable Barricade from universal equipment." },
  { kind: 'equipment', name: "Glyphs", text: "When this item of equipment is selected, also select the Waaagh! or Destruction strategy ploy. The first time you would use that ploy during the battle, it costs you 0CP; whenever you would use it thereafter, it costs you 0CP if you have any Wrecka points." },
]

export const operatives: Operative[] = [
  { id: "wrecka-krew:wrecka-boss-nob", name: "Wrecka Boss Nob", apl: 2, move: "6\"", save: "4+", w: 14 },
  { id: "wrecka-krew:wrecka-bomb-squig", name: "Wrecka Bomb Squig", apl: 2, move: "6\"", save: "5+", w: 5 },
  { id: "wrecka-krew:breaka-boy-demolisha", name: "Breaka Boy Demolisha", apl: 2, move: "6\"", save: "4+", w: 12 },
  { id: "wrecka-krew:breaka-boy-fighter", name: "Breaka Boy Fighter", apl: 2, move: "6\"", save: "4+", w: 12 },
  { id: "wrecka-krew:breaka-boy-krusha", name: "Breaka Boy Krusha", apl: 2, move: "6\"", save: "4+", w: 12 },
  { id: "wrecka-krew:tankbusta-gunner", name: "Tankbusta Gunner", apl: 2, move: "6\"", save: "4+", w: 12 },
  { id: "wrecka-krew:tankbusta-rokkiteer", name: "Tankbusta Rokkiteer", apl: 2, move: "6\"", save: "4+", w: 12 },
]

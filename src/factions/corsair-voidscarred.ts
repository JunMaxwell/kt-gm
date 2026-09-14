// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Rifles", text: "Whenever a friendly CORSAIR VOIDSCARRED operative is shooting with a shuriken rifle or ranger long rifle during an activation in which it hasn’t performed the Charge, Fall Back or Reposition action, that weapon has the Accurate 1 weapon rule. Note that operative isn’t restricted from performing those actions after shooting." },
  { kind: 'faction', name: "Aeldari Raiders", text: "Each friendly CORSAIR VOIDSCARRED operative can perform a free Dash action during their activation." },
  { kind: 'strategy', name: "Piratical Profiteers", text: "Whenever a friendly CORSAIR VOIDSCARRED operative is shooting, fighting or retaliating, if it or the enemy operative in that sequence contests an objective marker or one of your mission markers, that friendly operative’s weapons have the Balanced weapon rule." },
  { kind: 'strategy', name: "Plunderers", text: "Up to D3 friendly CORSAIR VOIDSCARRED operatives can immediately perform a free Dash action in an order of your choice. This turning point, each that does so cannot perform the Dash action during their activation. You cannot use this ploy during the first turning point." },
  { kind: 'strategy', name: "Mobile Engagement", text: "Whenever an operative is shooting a friendly CORSAIR VOIDSCARRED operative that performed an action in which it moved during this turning point, you can re-roll one of your defence dice." },
  { kind: 'strategy', name: "Outcasts", text: "Whenever a friendly CORSAIR VOIDSCARRED operative is more than 5\" from other friendly operatives, its weapons have the Punishing weapon rule." },
  { kind: 'firefight', name: "Light Fingers", text: "Use this firefight ploy during a friendly CORSAIR VOIDSCARRED operative’s activation. Until the end of that activation, having an enemy operative within its control range doesn’t prevent that friendly operative from performing the Pick Up Marker or mission actions." },
  { kind: 'firefight', name: "Opportunistic Fighters", text: "Use this firefight ploy when an enemy operative performs the Fall Back action. Before it moves, inflict 2D3 damage on that operative for each friendly CORSAIR VOIDSCARRED operative within its control range." },
  { kind: 'firefight', name: "Capricious Flight", text: "Use this firefight ploy during a friendly CORSAIR VOIDSCARRED operative’s activation, before or after it performs an action. During that activation, that operative can perform the Fall Back action for 1 less AP." },
  { kind: 'firefight', name: "Contemptuous Adventurer", text: "Use this firefight ploy when the first friendly\nCORSAIR VOIDSCARRED operative is activated during the turning point, if it’s more than 5\" from other friendly operatives. The first time that operative performs either the Shoot or Fight action during that activation, its weapons have the Relentless weapon rule. Note this ploy cannot come into effect more than once per activation (you cannot use it during both the Shoot and Fight action in the same activation)." },
  { kind: 'equipment', name: "Mistfield", text: "Once per turning point, when an operative is shooting a friendly CORSAIR VOIDSCARRED operative more than 3\" from it, at the start of the Roll Defence Dice step, you can use this rule. If you do, worsen the x of the Piercing weapon rule by 1 (if any) until the end of that sequence. Note that Piercing 1 would therefore be ignored." },
  { kind: 'equipment', name: "Diuturnal Mantles", text: "Whenever an operative is shooting a friendly\nCORSAIR VOIDSCARRED operative, if the ranged weapon in that sequence has the Blast or Torrent weapon rule, you can re-roll one of your defence dice. In addition, friendly CORSAIR VOIDSCARRED operatives aren’t affected by the x\" Devastating x weapon rule (i.e. Devastating with a distance) unless they are the target during that sequence." },
  { kind: 'equipment', name: "Runes of Guidance", text: "Once per turning point, when a friendly CORSAIR VOIDSCARRED WAY SEEKER or CORSAIR VOIDSCARRED SOUL WEAVER operative is performing a PSYCHIC unique action (excluding Warp Fold), you can use this rule. If you do, until the end of that action, add 3\" to its distance requirement. Note this has no effect on PSYCHIC weapons (e.g. the Devastating distance requirement of lightning strike)." },
  { kind: 'equipment', name: "Star Charts", text: "STRATEGIC GAMBIT. Roll one D3: if the result is higher than the number of the current turning point, you gain 1CP and cannot use this STRATEGIC GAMBIT for the rest of the battle." },
]

export const operatives: Operative[] = [
  { id: "corsair-voidscarred:voidscarred-felarch", name: "Voidscarred Felarch", apl: 2, move: "7\"", save: "4+", w: 9 },
  { id: "corsair-voidscarred:voidscarred-fate-dealer", name: "Voidscarred Fate Dealer", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-gunner", name: "Voidscarred Gunner", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-heavy-gunner", name: "Voidscarred Heavy Gunner", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-kurnathi", name: "Voidscarred Kurnathi", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-kurnite-hunter", name: "Voidscarred Kurnite Hunter", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-shade-runner", name: "Voidscarred Shade Runner", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-soul-weaver", name: "Voidscarred Soul Weaver", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-starstorm-duellist", name: "Voidscarred Starstorm Duellist", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-warrior", name: "Voidscarred Warrior", apl: 2, move: "7\"", save: "4+", w: 8 },
  { id: "corsair-voidscarred:voidscarred-way-seeker", name: "Voidscarred Way Seeker", apl: 2, move: "7\"", save: "4+", w: 8 },
]

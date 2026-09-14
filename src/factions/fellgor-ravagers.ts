// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Frenzy", text: "Whenever a friendly FELLGOR RAVAGER operative that doesn’t have one of your Frenzy tokens would be incapacitated during the battle, it’s not incapacitated and it gains one of your Frenzy tokens. All remaining attack dice are discarded (including yours if this operative is fighting or retaliating). If it has a Conceal order, change it to Engage.\nWhenever a friendly FELLGOR RAVAGER operative has one of your Frenzy tokens:\n• It’s only incapacitated as detailed overleaf.\n• It cannot have a Conceal order.\n• It’s injured.\n• It cannot perform the Pick Up Marker, unique\n(excluding Sweeping Blow, see VANDAL) or mission actions (excluding Operate Hatch).\n• For the purpose of determining control of markers and areas of the killzone, treat its\nAPL stat as 1. This takes precedence over any stat changes." },
  { kind: 'strategy', name: "Violent Temperament", text: "Whenever a friendly FELLGOR RAVAGER operative is fighting or retaliating, after rolling your attack dice, you can use this rule. If you do, you must re-roll all of your attack dice (you cannot only re-roll some)." },
  { kind: 'strategy', name: "Pelting Firepower", text: "Whenever a friendly FELLGOR RAVAGER operative is shooting an enemy operative that’s been shot by another friendly FELLGOR RAVAGER operative during this turning point, that first friendly operative’s ranged weapons have the Ceaseless weapon rule; if the enemy operative has been shot by more than one other friendly FELLGOR RAVAGER operative during this turning point, that first friendly operative’s ranged weapons have the Relentless weapon rule instead." },
  { kind: 'strategy', name: "Ambush", text: "Whenever a friendly FELLGOR RAVAGER operative is activated, if its order is changed from Conceal to Engage, it’s ambushing for that activation. Whenever a friendly FELLGOR RAVAGER operative that’s ambushing is fighting, you can retain one of your normal successes as a critical success instead. Note that an operative that has one of your Frenzy tokens cannot ambush." },
  { kind: 'strategy', name: "Reckless Determination", text: "Whenever an enemy operative is shooting an expended friendly FELLGOR RAVAGER operative, if you cannot retain any cover saves, you can retain one of your defence dice as a normal success without rolling it." },
  { kind: 'firefight', name: "Ruthless Rampage", text: "Use this firefight ploy after a friendly FELLGOR RAVAGER operative performs the Fight action, if it's no longer within control range of enemy operatives. That friendly operative can immediately perform a free Charge action (even if it’s already performed the Charge action during that activation), but cannot move more than 3\" during that action." },
  { kind: 'firefight', name: "Animalistic Fury", text: "Use this firefight ploy when a friendly FELLGOR RAVAGER operative is fighting or retaliating and you strike with a critical success. Inflict 1 additional damage with that strike." },
  { kind: 'firefight', name: "Wild Rage", text: "Use this firefight ploy when a friendly FELLGOR RAVAGER operative is activated. Until the end of that operative’s activation, add 1\" to its Move stat." },
  { kind: 'firefight', name: "Bloodsense", text: "Use this firefight ploy during a friendly FELLGOR RAVAGER operative’s activation, when it incapacitates an enemy operative within its control range. Select one other ready friendly FELLGOR RAVAGER operative that’s visible to and within 3\" of the incapacitated enemy operative. When that first friendly operative is expended, you can activate that other friendly operative before your opponent activates. When that other operative is expended, your opponent then activates as normal." },
  { kind: 'equipment', name: "Brass Adornments", text: "Once per battle, you can use the Animalistic Fury and Wild Rage firefight ploys for 0CP each." },
  { kind: 'equipment', name: "Chaos Sigil", text: "Once per turning point, when an operative is shooting a friendly FELLGOR RAVAGER operative, at the start of the Roll Defence Dice step, you can use this rule. If you do, worsen the x of the Piercing weapon rule by 1 (if any) until the end of that sequence. Note that Piercing 1 would therefore be ignored." },
  { kind: 'equipment', name: "Gore Marks", text: "Once per turning point, when a friendly FELLGOR RAVAGER operative is fighting or retaliating, you can use this rule. If you do, inflict 1 damage on that friendly operative and re-roll one of your attack dice. If the result is a fail, inflict 1 additional damage on that friendly operative." },
  { kind: 'equipment', name: "War Paint", text: "You can ignore any changes to the Move stat of friendly FELLGOR RAVAGER operatives from being injured." },
]

export const operatives: Operative[] = [
  { id: "fellgor-ravagers:fellgor-ironhorn", name: "Fellgor Ironhorn", apl: 2, move: "6\"", save: "5+", w: 11 },
  { id: "fellgor-ravagers:fellgor-deathknell", name: "Fellgor Deathknell", apl: 2, move: "6\"", save: "4+", w: 10 },
  { id: "fellgor-ravagers:fellgor-fluxbray", name: "Fellgor Fluxbray", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-gnarlscar", name: "Fellgor Gnarlscar", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-gorehorn", name: "Fellgor Gorehorn", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-herd-goad", name: "Fellgor Herd-goad", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-mangler", name: "Fellgor Mangler", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-shaman", name: "Fellgor Shaman", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-toxhorn", name: "Fellgor Toxhorn", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-vandal", name: "Fellgor Vandal", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "fellgor-ravagers:fellgor-warrior", name: "Fellgor Warrior", apl: 2, move: "6\"", save: "5+", w: 10 },
]

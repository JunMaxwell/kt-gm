// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Drop Insertion", text: "When setting up a TEMPESTUS AQUILON kill team before the battle, the first third of your kill team must be set up as normal. Each third thereafter can be set up above: place them to one side instead of in the killzone. For each third that’s set up above, you must set up the whole third in this way (not some of them), then place one of your Drop markers wholly within your drop zone.\nAs a STRATEGIC GAMBIT in the first and second turning point, you can move your Drop markers up to 4\" horizontally. In a killzone that uses the close quarters rules (e.g. Killzone: Tomb World), this can be measured and moved through Wall terrain.\nIn the Firefight phase, friendly TEMPESTUS AQUILON operatives set up above are activated as normal. When you do, you can either expend or land that operative. If it lands, set it up in the killzone in a location it can be placed as follows (it’s no longer set up above):" },
  { kind: 'faction', name: "Grav‑chute", text: "Whenever a friendly TEMPESTUS AQUILON operative is dropping, ignore the vertical distance." },
  { kind: 'strategy', name: "Sudden Offensive", text: "Count the number of friendly TEMPESTUS AQUILON operatives that aren’t incapacitated, then halve the result (rounding up) to give you x. Until the end of their activation, friendly TEMPESTUS AQUILON operatives’ weapons have the Balanced weapon rule if they are the first friendly operatives activated this turning point equal to x. For example, if you have five operatives, the first three friendly operatives activated will benefit." },
  { kind: 'strategy', name: "Maintain Momentum", text: "Whenever a friendly TEMPESTUS AQUILON operative is shooting against or fighting against a ready enemy operative, that friendly operative’s weapons have the Severe weapon rule." },
  { kind: 'strategy', name: "Eye Above", text: "Select one enemy operative. That operative and each other enemy operative within 3\" of it gains one of your Detected tokens until the end of the turning point. Whenever an enemy operative that has one of your Detected tokens:\n• Is shooting a friendly TEMPESTUS AQUILON operative, you can re‑roll one of your defence dice.\n• Is fighting or retaliating against a friendly TEMPESTUS AQUILON operative, one of your blocks can be allocated to block two unresolved successes (instead of one)." },
  { kind: 'firefight', name: "Hot Drop", text: "Use this firefight ploy after rolling your attack dice for a friendly TEMPESTUS AQUILON operative that’s wholly within your opponent’s territory, or either landed or dropped from Vantage terrain at least 2\" higher than the killzone floor during this activation. If the target is within 6\" of it, you can re‑roll any of your attack dice." },
  { kind: 'strategy', name: "Drop and Secure", text: "Select one marker.\n• Until the Ready step of the next Strategy phase, when determining control of that marker, treat the total APL stat of friendly\nTEMPESTUS AQUILON operatives that contest it as 1 higher if at least one friendly TEMPESTUS AQUILON operative contests that marker. Note this isn’t a change to the APL stat, so any changes are cumulative with this.\n• Whenever a friendly TEMPESTUS AQUILON operative is within 3\" of that marker, add 1 to the Atk stat of its melee weapons (to a maximum of 4)." },
  { kind: 'firefight', name: "Adjust Coordinates", text: "Use this firefight ploy when a friendly TEMPESTUS AQUILON operative lands. You can set it up within 5\" horizontally of one of your Drop markers, taking precedence over the normal distance requirement. It cannot perform the Dash, Shoot or Fight actions during this turning point." },
  { kind: 'firefight', name: "Tempestus Exemplars", text: "Use this firefight ploy during a friendly\nTEMPESTUS AQUILON operative’s activation (excluding SERVO‑SENTRY and any operative that has an APL stat higher than 2). During that activation, that operative can perform the Pick Up Marker, Place Marker or a mission action for 1 less AP." },
  { kind: 'equipment', name: "Tempestus Daggers", text: "Friendly TEMPESTUS AQUILON operatives (excluding SERVO‑SENTRY) have the following melee weapon — Tempestus dagger: ATK 3, HIT 4+, DMG 3/4." },
  { kind: 'firefight', name: "Progena", text: "Use this firefight ploy when a friendly TEMPESTUS AQUILON operative (excluding SERVO‑SENTRY) is activated. It regains up to 2D3 lost wounds, and during that activation you can ignore any changes to its APL stat." },
  { kind: 'equipment', name: "Combat Stimms", text: "You can ignore any changes to the Move stat of friendly TEMPESTUS AQUILON operatives from being injured." },
  { kind: 'equipment', name: "Drop Augury", text: "Once per battle, when a friendly TEMPESTUS AQUILON operative that’s set up above is activated, before expending or landing that operative, you can move one of your Drop markers again. However, it cannot be moved closer to your opponent’s drop zone." },
  { kind: 'equipment', name: "Remote Overseer", text: "Once per battle, after rolling off to decide initiative, you can re‑roll your dice." },
]

export const operatives: Operative[] = [
  { id: "tempestus-aquilons:aquilon-tempestor", name: "Aquilon Tempestor", apl: 3, move: "6\"", save: "4+", w: 9 },
  { id: "tempestus-aquilons:aquilon-grenadier", name: "Aquilon Grenadier", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "tempestus-aquilons:aquilon-gunfighter", name: "Aquilon Gunfighter", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "tempestus-aquilons:aquilon-gunner", name: "Aquilon Gunner", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "tempestus-aquilons:aquilon-marksman", name: "Aquilon Marksman", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "tempestus-aquilons:aquilon-precursor", name: "Aquilon Precursor", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "tempestus-aquilons:aquilon-servo-sentry", name: "Aquilon Servo‑sentry", apl: 2, move: "4\"", save: "3+", w: 10 },
  { id: "tempestus-aquilons:aquilon-trooper", name: "Aquilon Trooper", apl: 2, move: "6\"", save: "4+", w: 8 },
]

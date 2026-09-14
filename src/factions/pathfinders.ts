// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Markerlights", text: "Some PATHFINDER operatives (indicated on their datacard) can perform the Markerlight unique action:\nMARKERLIGHT (1AP): Select one enemy operative visible to this operative. That enemy operative gains one of your Markerlight tokens (to a maximum of four). An operative cannot perform this action while within control range of an enemy operative. If an operative (excluding MB3 RECON) would perform the Shoot action (excluding Guard) and this action during the same activation, only the target of that Shoot action can be selected for this action (and vice versa)." },
  { kind: 'strategy', name: "Recon Sweep", text: "Select one killzone edge (excluding your own). Each friendly PATHFINDER operative that’s wholly within 6\" of that edge can immediately perform a free Dash action in an order of your choice, but each that does so must end that move wholly within 6\" of a killzone edge (excluding your own). You cannot use this ploy during the first turning point." },
  { kind: 'strategy', name: "Suppressing Fire", text: "Whenever an enemy operative is performing the Shoot action, if the target (the primary target if the weapon has the Blast or Torrent weapon rules) isn’t the closest valid target, your opponent cannot re-roll their attack dice. Ignore friendly PATHFINDER operatives that have a Conceal order or are obscured when determining this." },
  { kind: 'strategy', name: "Bonded", text: "Whenever a friendly PATHFINDER operative (excluding DRONE) is shooting or retaliating with a ranged weapon (see Point-Blank Fusillade firefight ploy), if it’s within 3\" of another friendly PATHFINDER operative (excluding DRONE), that first friendly operative’s ranged weapons have the Accurate 1 weapon rule." },
  { kind: 'firefight', name: "A Worthy Cause", text: "Use this firefight ploy at the start of the Firefight phase. One friendly PATHFINDER operative (excluding DRONE) can immediately perform a free mission action." },
  { kind: 'strategy', name: "Take Cover", text: "Whenever an operative is shooting a friendly PATHFINDER operative, if you can retain any cover saves, improve that friendly operative’s Save stat by 1." },
  { kind: 'firefight', name: "Supporting Fire", text: "Use this firefight ploy when a friendly PATHFINDER operative is performing the Shoot action and you’re selecting a valid target within 6\" of it. Having other friendly PATHFINDER operatives within an enemy operative’s control range doesn’t prevent that enemy operative from being selected." },
  { kind: 'firefight', name: "Saviour Protocols", text: "Use this firefight ploy when a friendly PATHFINDER operative (excluding DRONE) is selected as the valid target of a Shoot action. Select one friendly PATHFINDER DRONE operative visible to and within 3\" of that first friendly operative to become the valid target instead (even if it wouldn’t normally be valid for this). That friendly DRONE operative is only in cover or obscured if the original target was. This ploy has no effect if the ranged weapon has the Blast or Torrent weapon rule." },
  { kind: 'equipment', name: "Target Analysis Optic", text: "Once per turning point, when a friendly PATHFINDER operative (excluding DRONE) is performing the Shoot action and you’re selecting a valid target, you can use this rule. If you do, until the end of that action, if the target has at least one of your Markerlight tokens, it's treated as having one more. If the ranged weapon has the Blast or Torrent weapon rule, only the primary target is affected." },
  { kind: 'firefight', name: "Point-blank Fusillade", text: "Use this firefight ploy when a friendly PATHFINDER operative (excluding DRONE) is retaliating, if it wasn’t within control range of enemy operatives at the start of that activation/ counteraction. You can use one of its ranged weapons as a melee weapon (excluding a weapon that has the word ‘grenade’ in its name) during that sequence. If you do, you cannot block during that sequence, and the following weapon rules have no effect on its weapons until the end of that sequence: Devastating, Piercing, Torrent. If that friendly operative is ready, has an Engage order and is retaliating with a pulse weapon, you resolve the first attack dice (i.e. defender instead of attacker)." },
  { kind: 'equipment', name: "High-intensity Markerlight", text: "Up to twice per turning point, when a friendly PATHFINDER operative (excluding MV7 MARKER DRONE) performs the Markerlight action, you can use this rule. If you do, the enemy operative you select gains two of your Markerlight tokens (instead of one)." },
  { kind: 'equipment', name: "Photon Grenade", text: "Once per turning point, a friendly PATHFINDER operative that has the Markerlight action on their datacard (excluding DRONE) can perform the following unique action:\nPHOTON GRENADE (1AP): Select one enemy operative visible to this operative and roll one D6: on a 3+, until the end of that operative’s next activation, subtract 2\" from its Move stat. An operative cannot perform this action while within control range of an enemy operative." },
  { kind: 'equipment', name: "Orbital Survey Uplink", text: "Once per turning point, when a friendly PATHFINDER operative performs the Markerlight action, you can use this rule. If you do, you can select one enemy operative in the killzone to gain one of your Markerlight tokens instead (it doesn’t need to be visible). This isn’t cumulative with the High-intensity Markerlight or Analyse rules." },
]

export const operatives: Operative[] = [
  { id: "pathfinders:shas-ui-pathfinder", name: "Shas’ui Pathfinder", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "pathfinders:assault-grenadier-pathfinder", name: "Assault Grenadier Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:blooded-pathfinder", name: "Blooded Pathfinder", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "pathfinders:comms-specialist-pathfinder", name: "Comms Specialist Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:drone-controller-pathfinder", name: "Drone Controller Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:marksman-pathfinder", name: "Marksman Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:medical-technician-pathfinder", name: "Medical Technician Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:shas-la-pathfinder", name: "Shas’la Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:transpectral-interference-pathfinder", name: "Transpectral Interference Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:weapons-expert-pathfinder", name: "Weapons Expert Pathfinder", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "pathfinders:mb3-recon-drone", name: "MB3 Recon Drone", apl: 3, move: "6\"", save: "4+", w: 12 },
  { id: "pathfinders:mv1-gun-drone", name: "MV1 Gun Drone", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "pathfinders:mv4-shield-drone", name: "MV4 Shield Drone", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "pathfinders:mv7-marker-drone", name: "MV7 Marker Drone", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "pathfinders:mv31-pulse-accelerator-drone", name: "MV31 Pulse Accelerator Drone", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "pathfinders:mv33-grav-inhibitor-drone", name: "MV33 Grav-inhibitor Drone", apl: 2, move: "6\"", save: "4+", w: 7 },
]

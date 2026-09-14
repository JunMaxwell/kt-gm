// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Inquisitorial Requisition", text: "REQUISITIONED operatives can be taken from one of the following groups to supplement an INQUISITORIAL AGENT kill team, as specified in this kill team’s selection rules:\n• DEATH KORPS\n• EXACTION SQUAD\n• IMPERIAL NAVY BREACHER\n• KASRKIN\n• SISTER OF SILENCE\n• TEMPESTUS SCION" },
  { kind: 'strategy', name: "Denounce", text: "Select one enemy operative and roll one D3. In the Firefight phase of this turning point, that enemy operative cannot be activated or perform actions until it's the last enemy operative to be activated, or your opponent has activated a number of enemy operatives equal to the result of the D3 (whichever comes first). This ploy costs you 1 additional CP for each previous time you’ve used it during the battle (e.g. 1CP the first time you would use it, 2CP the second time, etc.)." },
  { kind: 'strategy', name: "Intense Scrutiny", text: "Whenever you’re selecting a valid target for a friendly INQUISITORIAL AGENT operative, enemy operatives within 4\" of it cannot be in cover (instead of 2\"). While this can allow such operatives to be targeted (assuming they’re visible), it doesn’t remove their cover save (if any), unless the friendly INQUISITORIAL AGENT operative is within 2\" as normal." },
  { kind: 'strategy', name: "Quarry", text: "Select one enemy operative to be your quarry for the turning point. Whenever a friendly INQUISITORIAL AGENT operative is shooting against, fighting against or retaliating against your quarry, that friendly operative’s weapons have the Ceaseless weapon rule. Whenever your quarry is incapacitated, you can select a new enemy operative to be your quarry (and can continue to do so during this turning point)." },
  { kind: 'firefight', name: "Absolute Authority", text: "Use this firefight ploy during the battle, when an opponent uses a strategy or firefight ploy (excluding Command Re-roll or one that costs 0CP). Their ploy isn’t used, the CP spent on it is refunded and they cannot use that ploy again during this turning point. This ploy cannot be used to stop the same ploy more than once per battle." },
  { kind: 'strategy', name: "Irrefutable Jurisdiction", text: "Whenever an operative is shooting a friendly INQUISITORIAL AGENT operative that’s within 3\" of an objective marker, you can re-roll one of your defence dice. If that friendly operative contests that marker, you can re-roll any of your defence dice results of one result instead (e.g. results of 2)." },
  { kind: 'firefight', name: "Relentless in Pursuit", text: "Use this firefight ploy when an enemy operative within 2\" of a ready friendly INQUISITORIAL AGENT operative performs an action in which it moves. After it moves, that friendly INQUISITORIAL AGENT operative can either perform a free Reposition action, but must end that move within 2\" of that enemy operative, or a free Charge action, but must end that move within control range of that enemy operative. If neither is possible, that friendly operative cannot perform those actions, this ploy isn’t used and the CP spent on it is refunded." },
  { kind: 'firefight', name: "The Emperor's Will", text: "Use this firefight ploy when a friendly INQUISITORIAL AGENT operative is activated. Until the end of that operative’s activation, you can ignore any changes to its stats (including its weapons’ stats)." },
  { kind: 'equipment', name: "Inquisitorial Rosette", text: "Once per battle, when a friendly INQUISITORIAL AGENT operative is activated, if you’ve used the Quarry strategy ploy during this turning point, you can use this rule. If you do, you can select a new enemy operative to be your quarry until the end of the turning point." },
  { kind: 'firefight', name: "Intimidating Presence", text: "Use this firefight ploy when an enemy operative visible to and within 3\" of a friendly INQUISITORIAL AGENT operative, or visible to and within 6\" of a friendly MYSTIC operative, performs the Pick Up Marker or a mission action (excluding Operate Hatch). Your opponent must spend 1 additional AP for that enemy operative to perform that action (if they cannot or choose not to, the AP spent on it is refunded)." },
  { kind: 'equipment', name: "Combat Daggers", text: "In the press of melee combat, a simple dagger can be the difference between life and death. Friendly INQUISITORIAL AGENT operatives have the following melee weapon — Combat dagger: ATK 3, HIT 4+, DMG 3/4. Whenever a friendly SISTER OF SILENCE operative is using it, add 1 to its Atk stat." },
  { kind: 'equipment', name: "Armoured Bodysuits", text: "Whenever an operative is shooting a friendly INQUISITORIAL AGENT operative (excluding TOME-SKULL) that has a 5+ Save stat, you can retain one of your defence dice results of 4 as a normal success." },
  { kind: 'equipment', name: "Servo-skull", text: "Once per battle, one friendly INQUISITORIAL AGENT operative can perform a mission action for 1 less AP." },
]

export const operatives: Operative[] = [
  { id: "inquisitorial-agents:interrogator-agent", name: "Interrogator Agent", apl: 2, move: "6\"", save: "5+", w: 8 },
  { id: "inquisitorial-agents:tome-skull", name: "Tome-skull", apl: 2, move: "6\"", save: "5+", w: 5 },
  { id: "inquisitorial-agents:autosavant-agent", name: "Autosavant Agent", apl: 2, move: "6\"", save: "4+", w: 7 },
  { id: "inquisitorial-agents:death-world-veteran-agent", name: "Death World Veteran Agent", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "inquisitorial-agents:enlightener-agent", name: "Enlightener Agent", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "inquisitorial-agents:hexorcist-agent", name: "Hexorcist Agent", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "inquisitorial-agents:mystic-agent", name: "Mystic Agent", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "inquisitorial-agents:penal-legionnaire-agent", name: "Penal Legionnaire Agent", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "inquisitorial-agents:pistolier-agent", name: "Pistolier Agent", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "inquisitorial-agents:questkeeper-agent", name: "Questkeeper Agent", apl: 2, move: "6\"", save: "5+", w: 7 },
  { id: "inquisitorial-agents:requisitioned-gun-servitor", name: "Requisitioned Gun Servitor", apl: 1, move: "5\"", save: "4+", w: 11 },
  { id: "inquisitorial-agents:sister-of-silence-prosecutor", name: "Sister of Silence Prosecutor", apl: 2, move: "6\"", save: "3+", w: 8 },
  { id: "inquisitorial-agents:sister-of-silence-vigilator", name: "Sister of Silence Vigilator", apl: 2, move: "6\"", save: "3+", w: 8 },
  { id: "inquisitorial-agents:sister-of-silence-witchseeker", name: "Sister of Silence Witchseeker", apl: 2, move: "6\"", save: "3+", w: 8 },
  { id: "inquisitorial-agents:tempestus-scion-gunner", name: "Tempestus Scion Gunner", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "inquisitorial-agents:tempestus-scion-medic", name: "Tempestus Scion Medic", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "inquisitorial-agents:tempestus-scion-trooper", name: "Tempestus Scion Trooper", apl: 2, move: "6\"", save: "4+", w: 8 },
  { id: "inquisitorial-agents:tempestus-scion-vox-operator", name: "Tempestus Scion Vox-operator", apl: 2, move: "6\"", save: "4+", w: 8 },
]

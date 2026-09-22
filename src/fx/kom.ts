/**
 * Kommandos — what each ploy and each piece of equipment does.
 *
 * **Nothing here moves a number**, and the two cards that look like they should are the reason
 * `scope` exists: *Dakka! Dakka! Dakka!* and *Waaagh!* are flat, unconditional and last a whole
 * turning point — but one hits ranged weapons and the other melee, and this app cannot tell the
 * two apart. Applying either would put Punishing on a choppa. They print as riders instead.
 *
 * The three weapon cards grant a weapon rather than modify one, which `Fx` has no shape for, so
 * each carries its profile in the rider text. See `dw.ts` for the shape and the reasoning.
 */
import type { Fx } from '../compendium'

export const kom: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Dakka! Dakka! Dakka!': [{ rules: 'Punishing', scope: 'ranged' }],
  'Waaagh!': [{ rules: 'Balanced', scope: 'melee' }],
  'Sssshhhh!': [{ when: 'not TP1: a free Dash for every hidden operative' }],
  'Skulk About': [{ when: 'shot on Conceal: retain one defence dice' }],

  /* ---------- firefight ploys ---------- */

  'Just a Scratch': [{ when: 'ignore one attack dice’s Normal Dmg' }],
  'Krump ’em!': [{ when: 'end of the Firefight phase: a free Fight' }],
  'Shake It Off': [{ when: 'ignore every change to its APL until next TP' }],
  'Kunnin’ But Brutal': [{ when: 'first strike after a Charge on Conceal: crit' }],

  /* ---------- equipment ---------- */

  'Choppas': [{ when: 'grants Choppa — ATK 3, HIT 3+, DMG 4/5' }],
  'Dynamite': [{ when: 'once per battle: Dynamite — 5, 4+, 4/5, Blast 1"' }],
  'Collapsible Stocks': [{ when: 'shokka pistol and slugga lose Range' }],
  'Harpoon': [{ when: 'once per TP: Harpoon — 4, 4+, 4/5, Lethal 5+' }],
}

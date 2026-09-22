/**
 * Kasrkin — what each ploy and each piece of equipment does.
 *
 * **Nothing here moves a number.** Every card is gated on something the app cannot see: cover,
 * a marker, a range band, a scanned target, or whether the enemy can retain a cover save. Two
 * grant a weapon rule to *hot-shot* weapons, which is a name the operative's own weapon table
 * makes obvious and `scope` cannot express — a volley gun prints two profiles, a marksman rifle
 * three — so that qualifier lives in the trigger. See `dw.ts` for the shape and the reasoning.
 */
import type { Fx } from '../compendium'

export const kasrkin: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Engage from Cover': [{ when: 'shot while in cover: re-roll one defence dice' }],

  // Piercing Crits 1 on a hot-shot weapon, or flat Piercing 1 on the volley gun.
  'Elimination Pattern': [
    { rules: 'Piercing Crits 1', when: 'hot-shot, vs no cover save or scanned' },
    { rules: 'Piercing 1', when: 'volley gun, vs no cover save or scanned' },
  ],

  'Clearance Sweep': [{ rules: 'Ceaseless', when: 'both within 5" of the Clearance marker' }],
  'Relocate': [{ when: 'not TP1: a free Dash for operatives within 3"' }],

  /* ---------- firefight ploys ---------- */

  'Cover Retreat': [{ when: 'it Falls Back: a free Shoot for an ally' }],
  'Seize the Initiative': [{ when: 'without initiative: a free 1AP action, no moving' }],
  'Neutralise Target': [{ when: 'vs no cover save or scanned: re-roll attacks' }],
  'Give No Ground': [{ when: 'one marker: a tie at APL 2 is yours' }],

  /* ---------- equipment ---------- */

  'Long-range Scope': [{ rules: 'Saturate', when: 'hot-shot, shooting over 6" away' }],
  'Foregrip': [{ rules: 'Accurate 1', scope: 'ranged', when: 'within 3", excluding pistols' }],
  'Relics of Cadia': [{ when: 'once per TP: discard a fail to retain another' }],
  'Combat Daggers': [{ when: 'grants Combat dagger — ATK 3, HIT 4+, DMG 3/4' }],
}

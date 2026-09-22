/**
 * Deathwatch — what each ploy and each piece of equipment does.
 *
 * The exemplar for the other twelve modules. Three things decide every entry:
 *
 *   1. **No `when` and no `scope` → the numbers move, on every operative in the team.** Only for
 *      an effect that is flat, unconditional, applies to every weapon, and is not aimed at one
 *      model — "a friendly X operative" in the singular is a rider, because the app is never
 *      told which one.
 *   2. **`when` is the card's trigger, shortened to a phrase that fits on a phone.** Setting it
 *      makes the entry display-only, which is right: this app has no board and no dice.
 *   3. **`scope` is `'melee'`, `'ranged'`, or a weapon's own name.** The first two are printed,
 *      never resolved — the app cannot tell one from the other.
 *
 * A card with nothing structured to say gets no entry at all. It still applies as a named, timed
 * effect carrying its printed text, and that is the honest result for most ploys in the game.
 */
import type { Fx } from '../compendium'

export const dw: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  // "Select Conceal or Engage. Whenever a friendly DEATHWATCH operative is shooting against,
  // fighting against, or retaliating against an enemy operative that has that order, that
  // friendly operative's weapons have the Balanced weapon rule."
  'Mission Tactics': [{ rules: 'Balanced', when: 'vs the order you named' }],

  // "Whenever a friendly DEATHWATCH operative is wholly within your opponent's territory,
  // Normal Dmg of 4 or more inflicts 1 less damage on it." Damage taken — no stat to move.
  'The Shield That Slays': [{ when: 'in enemy territory: Normal Dmg 4+ inflicts 1 less' }],

  // "…you can re-roll one of your defence dice." A dice re-roll, which this app never models.
  'The Long Vigil': [{ when: 'defending in your territory: re-roll one defence dice' }],

  // Flat, whole team, no trigger. The one shape that can simply be applied.
  'And They Shall Know No Fear': [{ tough: true }],

  /* ---------- firefight ploys ---------- */

  'Suffer Not the Alien': [{ when: 'vs a non-CHAOS, non-IMPERIUM target: re-roll any attack dice' }],
  'Advanced Auspex Scan': [{ rules: 'Saturate', scope: 'ranged', when: 'the Shoot action it was used on' }],
  'Auspicator Tracking': [{ when: 'counteracting: change its order' }],
  'Transhuman Physiology': [{ when: 'defending a shot: retain a normal success as a critical' }],

  /* ---------- equipment ---------- */

  // "Once per turning point … you can re-roll one of your attack dice."
  'Digital Weapons': [{ when: 'once per TP: re-roll one attack dice' }],
  'Sanctus-v Bioscryer Cuffs': [{ when: 'once per activation: see the card' }],
  'Scrutavore Servo-thrall': [{ when: 'once per TP: see the card' }],
  'Ammunition Reserve': [{ when: 'once per battle: see the card' }],
}

/**
 * Raveners — what each ploy and each piece of equipment does.
 *
 * Same three rules as `dw.ts`, the exemplar: no `when` and no `scope` means the numbers move,
 * a `when` is the card's trigger shortened to a phone-width phrase, a `scope` names the weapons.
 *
 * **Nothing here moves a number**, and that is the honest reading of the deck rather than a gap:
 * every Ravener card is keyed to the TUNNEL, to the Burrow action or to a dice roll, and the app
 * tracks none of the three. Two cards add a weapon rule under a condition; the rest are riders.
 */
import type { Fx } from '../compendium'

export const rav: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Death from Below': [
    { rules: 'Balanced', scope: 'melee', when: 'after a Burrow this activation' },
    { rules: 'Ceaseless', scope: 'melee', when: 'while on your TUNNEL' },
  ],

  // Two different re-rolls off two different conditions, so two riders — collapsing them would
  // lose which one is "one dice" and which is "any of one result".
  'Whipcord Emergence': [
    { when: 'defending after a Burrow this TP: re-roll one dice' },
    { when: 'defending on your TUNNEL: re-roll any of one result' },
  ],

  'Tunnel Lurkers': [{ when: 'on your TUNNEL: in cover, unless within 2"' }],
  'Writhe Out of Sight': [{ when: 'a free Burrow, plus a free move near your TUNNEL' }],

  /* ---------- firefight ploys ---------- */

  'Slithering Evasion': [{ when: 'Fall Back for 1 less AP; can Charge out of combat' }],
  'Subterranean Horror': [{ when: 'fought on your TUNNEL: you resolve the first dice' }],
  'Death Frenzy': [{ when: 'when incapacitated: D3 to each enemy in range' }],
  'Burrowing Strike': [{ when: 'on a Burrow: D3+1 to each enemy in control range' }],

  /* ---------- equipment ---------- */

  'Chromatospore Camouflage': [{ when: 'defending a shot: retain one more cover save' }],
  'Acid Blood': [{ when: 'wounded in melee: a 5+ inflicts 1 back' }],
  'Heightened Senses': [{ when: 'once per battle: re-roll the initiative roll-off' }],
  'Metamorphic Flesh': [{ when: 'on activation: regain up to D3 lost wounds' }],
}

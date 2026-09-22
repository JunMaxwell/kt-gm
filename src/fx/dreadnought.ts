/**
 * Brutalis Dreadnought — what each ploy and each piece of equipment does.
 *
 * Two cards look like they move a number and do not:
 *
 *   - ***Full Throttle*** raises 12" to 15". That is the mission pack's per-turning-point movement
 *     limit for a NEMESIS operative, not the Move stat — `move: 3` would put 9" on its card.
 *   - ***Immovable Object*** adds 2 to CONTROL. This app stores a boss's Control in the APL slot,
 *     and the core rules cap an APL change at ±1, so `apl: 2` is not a legal number to print.
 *
 * Both ride instead. The two equipment passives buy back a clause its own core rules take away,
 * and neither is expressible as a delta either.
 */
import type { Fx } from '../compendium'

export const dreadnought: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Full Throttle': [{ when: '15" per TP, and the first Charge costs 1 less AP' }],
  'Fire Support Doctrine': [
    { rules: 'Seek Light, Piercing 1', scope: 'ranged', when: 'if it has not moved this activation' },
  ],
  'Duty Eternal': [{ when: 'once per TP, on becoming injured: a free action' }],
  'Immovable Object': [{ when: '+2 CONTROL for markers; enemies do not contest' }],

  /* ---------- firefight ploys ---------- */

  'Through the Wall': [{ when: 'Charging: through one Heavy terrain on a 4+' }],
  'Piston Slam': [{ rules: 'Devastating 3', scope: 'melee', when: 'fighting or retaliating, that sequence' }],
  'Twin-Linked Discipline': [{ when: 'twin heavy bolter: re-roll any attack dice' }],
  'Blessed Autoloaders': [{ when: 'after a Shoot: a second one, different weapon' }],

  /* ---------- equipment ---------- */

  // NOT `tough`. That flag is the Injured stat penalty — the 2" of Move and the Hit. This is the
  // Extra Defence dice, a separate core rule with no field of its own.
  'Atomantic Shielding': [{ when: 'Extra Defence applies even while injured' }],
  'Ironclad Ceramite': [{ when: 'Devastating and Blast do nothing against it' }],
  'Hunter-Killer Missile': [{ when: 'HUNTER-KILLER MISSILE (1AP): once per battle' }],
  'Underslung Heavy Flamer': [{ when: 'HEAVY FLAMER (1AP): once per TP' }],
}

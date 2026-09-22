/**
 * XV26 Stealth Battlesuits — what each ploy and each piece of equipment does.
 *
 * **Nothing here moves a number.** Every one of the twelve cards is either conditional (an
 * expended target, a marker, a nearby ally, a range band) or a thing this app has no model for
 * (a discarded success, an interrupted Charge, a redirected shot). That is the honest result
 * for a team whose whole deck is positional — see `dw.ts` for the shape and the reasoning.
 */
import type { Fx } from '../compendium'

export const xv26: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  // Two riders, because the card grants two rules to two different scopes.
  'Patient Hunters': [
    { rules: 'Balanced', when: 'vs an expended enemy operative' },
    { rules: 'Saturate', scope: 'ranged', when: 'vs an expended enemy operative' },
  ],

  'Prepare Ambush': [{ rules: 'Seek', scope: 'ranged', when: 'target within 2" of your Ambush marker' }],

  // Ignores APL changes AND one of the two injury penalties, the player's pick. `tough` would
  // print "ignores Injured", which is half of it — so this stays prose.
  'Bonds of Unity': [{ when: 'near an ally: ignore APL, and Move or Hit injury' }],

  'Holowave Countermeasures': [{ when: 'shot from over 6": attacker discards a success' }],

  /* ---------- firefight ploys ---------- */

  'Vectored Retro-thrusters': [{ when: 'charged: free 3" Fall Back, then they Reposition' }],
  'Engage Jet Pack': [{ when: 'activating: ignore one climb and one drop' }],
  'Ghostshroud': [{ when: 'end of activation: change Engage to Conceal' }],
  'Saviour Protocols': [{ when: 'targeted: a DRONE within 3" is hit instead' }],

  /* ---------- equipment ---------- */

  // Torrent 2", or Torrent 3" at the cost of a single secondary target. Only the first is a
  // plain rule, so the second stays in the card's own text.
  'XV26 Multitrackers': [
    { rules: 'Torrent 2"', scope: 'Burst cannon (sweeping)', when: 'once per TP (or 3", one target)' },
  ],

  'Advanced Blacksun Filters': [{ when: 'vs an obscured target: discard no success' }],
  'Counter-network Jammers': [{ when: 'GAMBIT: one marker, enemy APL counts 1 lower' }],
  'Hardwired Target Locks': [{ when: 'counteract on Conceal over 3" away: Shoot only' }],
}

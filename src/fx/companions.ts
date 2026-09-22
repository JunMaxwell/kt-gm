/**
 * Companions of the Emperor — what each ploy and each piece of equipment does.
 *
 * A defensive deck, which is why so little of it is structured: retaining a success, downgrading
 * critical damage and discarding a fail are all dice events, and this app has no dice.
 *
 * *Unwavering Sentinels* is the one card that simply applies — the whole team ignores the Injured
 * penalty, flat, for the turning point, which is exactly the `tough` flag.
 */
import type { Fx } from '../compendium'

export const companions: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Aegis of the Emperor': [{ when: 'defending: crit damage becomes normal damage' }],
  'Unwavering Sentinels': [{ tough: true }],
  'Manoevre and Fire': [{ when: 'one operative: Fall Back for 1 less AP, Charge out' }],
  'Relentless Prosecution': [{ when: 'over 6" from enemies: free Dash or change order' }],

  /* ---------- firefight ploys ---------- */

  'Arcane Genetic Alchemy': [{ when: 'shot at: retain a normal success as a critical' }],
  'Avenge the Fallen': [{ rules: 'Balanced', when: 'vs the operative that killed an ally' }],
  'Brotherhood of Demigods': [{ when: 'counteracting: change order, a second free action' }],
  'Final Word': [{ when: 'end of the Firefight phase: a free Counteract' }],

  /* ---------- equipment ---------- */

  'Misericordias': [{ when: 'once per TP after a fight: D6 3+, 2 mortal wounds' }],

  // Three stances, one chosen per pick and only one usable per turning point, so nothing here is
  // unconditional. Only Rendax has anything structured to say.
  "Martial Ka'tah": [
    { when: 'one stance per TP — see the card' },
    { rules: 'Severe', scope: 'melee', when: 'the Rendax stance, until the end of the TP' },
  ],

  // The 2" comes off the TARGET's Move, so it cannot be `move: -2` on the thrower's own card.
  'Tanglefoot Grenade': [{ when: 'TANGLEFOOT GRENADE (1AP), 8": -2" to its Move' }],

  'Oath Parchments': [{ when: 'once per TP: discard a fail to retain another' }],
}

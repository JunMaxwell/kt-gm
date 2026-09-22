/**
 * Canoptek Circle — what each ploy and each piece of equipment does.
 *
 * Extracted, not homebrew, and almost the whole deck hangs off one thing the app cannot see: the
 * OBELISK NODE MATRIX, the triangle its three markers describe on the table. Every card that
 * cares whether something is inside it, or whether it intervenes, is a position test — so a
 * position is the condition, and every one of these rides.
 *
 * The one weapon rule here, *Transdynamic Amplification*'s Ceaseless, is gated the same way.
 */
import type { Fx } from '../compendium'

export const canoptekCircle: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Hypershielding': [{ when: 'in or behind the NODE MATRIX: re-roll defence dice' }],
  'Cryptogravitic Repulsion': [{ when: 'enemies moving into the NODE MATRIX pay +1"' }],
  'Transdynamic Amplification': [
    { rules: 'Ceaseless', scope: 'ranged', when: 'shooting through or into the NODE MATRIX' },
  ],

  // The Dmg comes off the ENEMY's melee weapons, so there is nothing of ours to move.
  'Souldrain': [{ when: 'in the NODE MATRIX: -1 Dmg to enemy melee' }],

  /* ---------- firefight ploys ---------- */

  'Shield Flare': [{ when: 'in the NODE MATRIX: ignore that Normal Dmg' }],
  'Nodal Response': [{ when: 'change or use a strategy ploy mid-activation' }],
  'Animate Obelisk Nodes': [{ when: 'instead of activating: move the NODE markers 6"' }],
  'Sacrificial Thrall': [{ when: 'a GEOMANCER targeted: redirect it within 3"' }],

  /* ---------- equipment ---------- */

  'Matrix Manipulator': [{ when: 'once per battle: the GEOMANCER is a fourth node' }],
  'Nanoscarab Caskets': [{ when: 'on activating: regain up to D3 lost wounds' }],
  'Awakened Obelisk Nodes': [{ when: 'D3 free uses of Animate Obelisk Nodes' }],
  'Phase Shifter': [{ when: 'a GEOMANCER shot at: -1 to enemy Piercing' }],
}

/**
 * Angron — what each ploy and each piece of equipment does.
 *
 * Homebrew, because the format leaves a standalone NEMESIS operative with no deck at all. Almost
 * none of it moves a number: his four strategy ploys trade wounds for CP or for area damage, and
 * three of the four firefight ploys are a heal, a resurrection or a dice event. Two things here
 * are structured, and both are scoped or conditional — *Heedless Onslaught*'s half that is flat,
 * and the Severe his own Nails give him once he is bleeding.
 */
import type { Fx } from '../compendium'

export const angron: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  // "Inflict 5 damage on Angron, then gain 2CP." Wounds and CP, neither of which is a stat.
  'Blood Tithe': [{ when: 'once per TP: 5 damage, gain 2CP' }],

  // The only card of his that moves the stat row, and only half of it does. +2" Move and a
  // worsened Save are flat for the turning point; the extra 3" is Charge-only, so it rides.
  'Heedless Onslaught': [
    { move: 2, save: -1 },
    { when: 'Charge: he can move a further 3"' },
  ],

  'No Sanctuary': [{ when: 'enemies within 6" cannot take Conceal' }],
  'Bring Down the Walls': [{ when: 'an enemy ending wholly in that terrain: D3+3' }],

  /* ---------- firefight ploys ---------- */

  'Reborn from Blood': [{ when: 'once per battle: spend all CP, he survives' }],
  'Blood for the Blood God': [{ when: 'once per TP, on a kill: regain D3+3 wounds' }],
  'Relentless Carnage': [{ when: 'end of activation: pay wounds for area damage' }],

  // "Add 3 to the Atk stat of the melee weapon he is using until the end of that sequence."
  // One sequence, one weapon — a rider on both counts. Its cost is its own line.
  'Butcher’s Frenzy': [
    { atk: 3, scope: 'melee', when: 'fighting or retaliating, that sequence' },
    { when: 'then he cannot Fall Back this TP' },
  ],

  /* ---------- equipment ---------- */

  // The Balanced and Severe this grants land on the operative he DRAGGED, not on him, so they
  // must not become weapon rules here — the card would put an enemy's buff on his own table.
  'Chains of the Red Angel': [{ when: 'BARBED CHAIN (1AP), 8": drag a target to him' }],
  'Crushing Impact': [{ when: 'CRUSHING IMPACT (1AP), 12": once per battle' }],
  'The Butcher’s Nails': [{ rules: 'Severe', scope: 'melee', when: 'while he is injured' }],

  // Ignoring an incoming weapon rule is not a change to any stat of his.
  'Warp-Forged Bronze': [{ when: 'shot at: ignore the shooter’s Piercing' }],
}

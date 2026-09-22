/**
 * Angels of Death — what each ploy and each piece of equipment does.
 *
 * Same three rules as `dw.ts`, the exemplar: no `when` and no `scope` means the numbers move,
 * a `when` is the card's trigger shortened to a phone-width phrase, a `scope` names the weapons.
 *
 * Only one card here moves anything. Every other Angels of Death card is a dice manipulation or
 * a conditional weapon rule, and the app has neither dice nor a board to resolve them against.
 */
import type { Fx } from '../compendium'

export const aod: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  // "Whenever a friendly ANGEL OF DEATH operative is x, its weapons have the Balanced weapon
  // rule." Every weapon, but only against the doctrine's own condition. Deathwatch's Mission
  // Tactics is the same card with a different trigger.
  'Combat Doctrine': [{ rules: 'Balanced', when: 'attacking as the doctrine you named' }],

  // Flat, whole team, no trigger. The one shape that can simply be applied.
  'And They Shall Know No Fear': [{ tough: true }],

  'Indomitus': [{ when: 'defending a shot: discard a fail, retain a success' }],

  // Changes a CHAPTER TACTIC, which this app does not model at all — the pick lives on the
  // faction card's text, not in any field.
  'Adaptive Tactics': [{ when: 'change your secondary CHAPTER TACTIC' }],

  /* ---------- firefight ploys ---------- */

  'Adjust Doctrine': [{ when: 'change the COMBAT DOCTRINE you selected' }],
  'Transhuman Physiology': [{ when: 'defending a shot: retain a normal success as a critical' }],
  'Wrath of Vengeance': [{ when: 'counteracting: one extra 1AP action, free' }],

  // Two effects, one trigger: a weapon rule the app can name, and a damage bump it cannot.
  'Shock Assault': [
    { rules: 'Shock', scope: 'melee', when: 'fighting after a Charge' },
    { when: 'fighting after a Charge: +1 dmg on the first strike' },
  ],

  /* ---------- equipment ---------- */

  'Purity Seals': [{ when: 'once per TP: discard a fail, retain a success' }],
  'Chapter Reliquaries': [{ when: 'Wrath of Vengeance for 0CP while on Engage' }],
  'Auspex': [{ when: 'once per TP: targets within 8" cannot be obscured' }],
  'Tilting Shields': [{ when: 'once per TP in melee: no crits on results under 6' }],
}

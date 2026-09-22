/**
 * Scout Squad — what each ploy and each piece of equipment does.
 *
 * Same three rules as `dw.ts`, the exemplar: no `when` and no `scope` means the numbers move,
 * a `when` is the card's trigger shortened to a phone-width phrase, a `scope` names the weapons.
 *
 * Grouped by kind rather than by the deck's own order, which interleaves the two ploy types.
 */
import type { Fx } from '../compendium'

export const sct: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Guerrilla Engagement': [{ when: 'defending in cover, 6"+ away: re-roll one dice' }],

  // Balanced normally, Ceaseless instead against an expended target. Both conditions ride on
  // the same "attacked from hiding" trigger, so each entry has to restate it — a rider is read
  // on its own, not as a bullet under the one above it.
  'Ambush': [
    { rules: 'Balanced', when: 'attacking unseen or from Conceal' },
    { rules: 'Ceaseless', when: 'unseen or from Conceal, vs an expended target' },
  ],

  'Adaptable Training': [{ when: 'change the order of D3 operatives 4"+ away' }],
  'Stealth Relocation': [{ when: 'after TP1: D3 Conceal operatives Dash free' }],

  /* ---------- firefight ploys ---------- */

  'Astartes Training': [{ when: 'this activation: two Fights, or two Shoots' }],

  // Flat and for a stated duration, but it names ONE operative — "a friendly SCOUT SQUAD
  // operative ... add 1" to its Move stat". An applied entry lands on the whole team, and the
  // app is never told which Scout it was, so it is a rider. The GM's own form can pin it to one
  // operative; a one-tap ploy cannot.
  'Raw Physiology': [{ move: 1, tough: true, when: 'the one operative, until its next activation' }],

  'Emboldened Aspirant': [{ when: 'first attack this TP or a tougher foe: keep a crit' }],
  'Covert Position': [{ when: 'on Conceal in cover: cannot be targeted past 2"' }],

  /* ---------- equipment ---------- */

  'Camo Cloak': [{ when: 'defending a shot: retain one more cover save' }],
  'Targeting Oculars': [
    { rules: 'Lethal 5+, Saturate', scope: 'ranged', when: 'twice per TP: the Shoot action it was used on' },
  ],

  // Grants a whole weapon rather than modifying one, so there is nothing for `scope` to select
  // and the stats go in the rider's own words.
  'Combat Blades': [{ when: 'adds Combat blade — ATK 3, HIT 3+, DMG 4/5' }],

  'Tactical Vox-link': [{ when: 'once per TP: 0CP while a SERGEANT is in the killzone' }],
}

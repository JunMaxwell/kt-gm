/**
 * Commander Farsight — what each ploy and each piece of equipment does.
 *
 * Nothing here is applied. Half the deck reaches *other* teams in his alliance rather than him,
 * and this app maps a card onto the operative reading it — so every one of those is a rider by
 * necessity as well as by the usual rule. The rest are dice events, free actions, AP and CP.
 *
 * `Ta'lissera` is the near miss worth naming: it ignores the Injured penalty, which IS a field,
 * but only within 3" of him and only for someone else. So it carries `tough` AND a `when`.
 */
import type { Fx } from '../compendium'

export const farsight: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Mont’ka': [{ rules: 'Balanced', scope: 'ranged', when: 'his alliance, shooting the marked target' }],
  'Thrust Vector': [{ when: 'Fall Back costs 1 less AP and moves +3"' }],
  'Interposing Drones': [{ when: 'shot at: retain one defence dice unrolled' }],
  'Command Uplink': [{ when: 'once per TP, within 3" of an ally: gain 1CP' }],

  /* ---------- firefight ploys ---------- */

  'Unerring Aim': [{ when: 'shooting: retain one attack dice as a crit' }],

  // Scope is the weapon's own printed name, so the rider lands on the right row of the table.
  'Dawn Blade': [
    { rules: 'Brutal, Rending', scope: 'Dawn Blade (power weapon)', when: 'fighting or retaliating, that sequence' },
  ],

  'Covering Volley': [{ when: 'an enemy Charges an ally within 6": free Shoot' }],
  'Reactive Protocols': [{ when: 'counteracting: two 1AP actions' }],

  /* ---------- equipment ---------- */

  // AP, not APL — a NEMESIS operative ignores changes to its APL, so `apl` would be a lie.
  'Chronophagic Alloy': [{ when: 'once per TP, a Dawn Blade kill: +1AP' }],
  'Puretide Engram Neurochip': [{ when: 'once per TP: free Dash as an enemy activates' }],
  'Ta’lissera Bonding Knife': [{ tough: true, when: 'his alliance, within 3" of him' }],
  'Target Designator': [{ when: 'MARKERLIGHT (1AP), 12": no cover, not obscured' }],
}

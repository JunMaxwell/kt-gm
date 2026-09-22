/**
 * Nocturne's Relic Seekers — what each ploy and each piece of equipment does.
 *
 * Two cards apply outright, which is two more than most factions manage:
 *
 *   - ***Crucible of Battle*** grants Balanced when shooting, fighting AND retaliating — that is
 *     every moment a weapon rule can matter, so there is no condition left to print.
 *   - ***Forged in Flames*** ignores the Injured penalty team-wide with no trigger at all.
 *
 * Everything else is a dice event, a Blaze token or a free action.
 */
import type { Fx } from '../compendium'

export const relicSeekers: Record<string, Fx[]> = {
  /* ---------- strategy ploys ---------- */

  'Crucible of Battle': [{ rules: 'Balanced' }],
  'Immolation Protocols': [{ when: 'shot at: discard a fail to retain another' }],

  // One of three rites, chosen on use. Only the second one is a number.
  'Rites of the Forgefather': [
    { move: 1, when: 'the Relentless Advance rite' },
    { when: 'or Incendiary Terror, or Onslaught of Fire' },
  ],

  'Forged in Flames': [{ tough: true }],

  /* ---------- firefight ploys ---------- */

  'Blazing Earth': [{ rules: 'Punishing', when: 'after a free 3" Fall Back out of a melee' }],
  'Transhuman Physiology': [{ when: 'shot at: retain a normal success as a critical' }],
  'Burning Vengeance': [{ when: 'shooting, after a kill: a free Dash' }],
  'Wrathful Inferno': [{ when: 'a Blaze token on an enemy: D3 as it activates' }],

  /* ---------- equipment ---------- */

  'Dragonrage Rounds': [{ rules: 'Blaze', when: 'once per TP: Torrent weapons, within 6"' }],

  // The -1 lands on the ENEMY's melee weapons, so it is not an `atk` delta on this card.
  'Draken Scale': [{ when: 'a Draken Scale token: -1 Atk to enemy melee' }],

  'Wrath of Prometheus': [{ when: 'once per TP: 3 successes, retain one as a crit' }],

  // A whole extra weapon rather than a modifier to one — no field fits, so the card prints it.
  'Promethean Tooth Dagger': [{ when: 'a melee weapon for all: ATK 5, HIT 3+, DMG 3/4' }],
}

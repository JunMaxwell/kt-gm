/**
 * What each card actually does, hand-mapped, one module per faction.
 *
 * `src/factions/` is GENERATED from the official PDFs and `tools/kt_generate.py` rewrites it, so
 * none of this can live there. It sits beside it instead, in the same one-module-per-faction
 * shape, with this index maintained by hand — exactly the arrangement `src/factions/index.ts`
 * uses and for the same reason.
 *
 * **Thirteen factions are mapped**: the six the preset match fields, the five hand-written
 * homebrew ones, plus Kasrkin and the Canoptek Circle. Everything else in the library still
 * works — a ploy applies as a named, timed effect carrying the card's own printed text, which is
 * what a player reads anyway. Mapping another faction is one new module and one line here.
 *
 * Keyed `card name` within a faction. Cards have no id — `kind:name` is the de-facto key
 * everywhere in this app, and within one faction the name alone is unique.
 */
import type { Fx } from '../compendium'

import { aod } from './aod'
import { angron } from './angron'
import { canoptekCircle } from './canoptek-circle'
import { companions } from './companions'
import { dreadnought } from './dreadnought'
import { dw } from './dw'
import { farsight } from './farsight'
import { kasrkin } from './kasrkin'
import { kom } from './kom'
import { rav } from './rav'
import { relicSeekers } from './relic-seekers'
import { sct } from './sct'
import { xv26 } from './xv26'

export type FactionFx = Record<string, Fx[]>

const FX: Record<string, FactionFx> = {
  aod,
  angron,
  'canoptek-circle': canoptekCircle,
  companions,
  dreadnought,
  dw,
  farsight,
  kasrkin,
  kom,
  rav,
  'relic-seekers': relicSeekers,
  sct,
  xv26,
}

/** What this card does, or nothing — an unmapped faction is a normal state, not an error. */
export const cardFx = (faction: string | undefined, name: string): Fx[] =>
  FX[faction ?? '']?.[name] ?? []

/** Every faction with a mapping, for the test that checks each key names a real card. */
export const MAPPED = FX

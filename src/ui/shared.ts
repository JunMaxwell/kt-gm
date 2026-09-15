// Non-component exports live here, not beside the components. A `.tsx` that exports a constant
// or a helper alongside its components loses React Fast Refresh for the whole file.

import { useEffect, useState } from 'react'
import type React from 'react'

import { type FactionData, factionData, loadFaction } from '../factions'
import type { useGame } from '../state'

export type Game = ReturnType<typeof useGame>[0]
export type Dispatch = ReturnType<typeof useGame>[1]
export type Net = ReturnType<typeof useGame>[2]

/**
 * The scoreboard row grid: label, then one column per side. The column count is a runtime
 * fact now, and Tailwind's JIT cannot see an interpolated arbitrary value — so the track
 * list arrives as a CSS variable, set once on the panel body by `rowVars`.
 */
export const ROW = 'grid grid-cols-(--kt-row) items-center gap-2'

/** Put this on the element wrapping a group of `ROW`s. */
export const rowVars = (n: number) =>
  ({ '--kt-row': `4.25rem repeat(${n}, minmax(0,1fr))` }) as React.CSSProperties

/** Only dispatch when the text actually parses to an integer. */
export const onInt = (fn: (n: number) => void) => (raw: string) => {
  const v = parseInt(raw, 10)
  if (Number.isFinite(v)) fn(v)
}

/**
 * A faction's cards and datacards, fetched on demand.
 *
 * The six factions the preset match uses are bundled, so this returns them on the first
 * render with no flicker. Everything else arrives a tick later — callers render an empty
 * deck meanwhile, which is the same state a hand-built team is in permanently.
 */
export function useFaction(id?: string): FactionData | undefined {
  const [, bump] = useState(0)
  const data = factionData(id)
  useEffect(() => {
    if (!id || data) return
    let live = true
    loadFaction(id).then(() => live && bump((n) => n + 1))
    return () => {
      live = false
    }
  }, [id, data])
  return data
}

/**
 * Warm the cache for every faction on the table, so a match set up before the players
 * arrive is fully readable once the venue's wifi is not. The app is meant to work at a
 * table with no internet — that is why the fonts are vendored too.
 */
export function usePrefetchFactions(ids: (string | undefined)[]) {
  const key = ids.filter(Boolean).sort().join(',')
  useEffect(() => {
    for (const id of key.split(',')) if (id) loadFaction(id)
  }, [key])
}

// Non-component exports live here, not beside the components. A `.tsx` that exports a constant
// or a helper alongside its components loses React Fast Refresh for the whole file.

import { useEffect, useState } from 'react'

import { type FactionData, factionData, loadFaction } from '../factions'
import type { useGame } from '../state'

export type Game = ReturnType<typeof useGame>[0]
export type Dispatch = ReturnType<typeof useGame>[1]
export type Net = ReturnType<typeof useGame>[2]

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

/* ---------- the faction glossary's deep link ----------
 *
 * A SEARCH param, not a hash, and that is load-bearing. `#/r/ABCD` is the only thing that makes
 * a spectator a spectator across a reload — `readRoom` deliberately never remembers a viewer
 * link — so writing `#/lib/dw` over it would quietly demote every player who opened the
 * glossary. `?team=dw` is orthogonal to the hash, the two coexist in one URL, and `readRoom`
 * already preserves `location.search` when it strips a GM token.
 */
const TEAM = 'team'

/** `location`/`history` do not exist under `bun test`, which renders these panels for real. */
export const teamInUrl = () =>
  typeof location === 'undefined' ? '' : (new URLSearchParams(location.search).get(TEAM) ?? '')

/** Rewrite the address bar in place, so the link is copyable and a reload lands back here. */
export const setTeamInUrl = (id: string) => {
  if (typeof history === 'undefined') return
  const url = new URL(location.href)
  if (id) url.searchParams.set(TEAM, id)
  else url.searchParams.delete(TEAM)
  history.replaceState(null, '', url)
}

/** The link to hand a player. Drops any room hash — this is reference, not a match. */
export const teamUrl = (id: string) => `${location.origin}${location.pathname}?${TEAM}=${id}`

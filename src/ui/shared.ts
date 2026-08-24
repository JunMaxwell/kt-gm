// Non-component exports live here, not beside the components. A `.tsx` that exports a constant
// or a helper alongside its components loses React Fast Refresh for the whole file.

import type { useGame } from '../state'

export type Game = ReturnType<typeof useGame>[0]
export type Dispatch = ReturnType<typeof useGame>[1]
export type Net = ReturnType<typeof useGame>[2]

export const SIDE_IDS = ['imperium', 'xenos'] as const
/** The scoreboard row grid: label, then one column per side. */
export const ROW = 'grid grid-cols-[4.25rem_1fr_1fr] items-center gap-2'

/** Only dispatch when the text actually parses to an integer. */
export const onInt = (fn: (n: number) => void) => (raw: string) => {
  const v = parseInt(raw, 10)
  if (Number.isFinite(v)) fn(v)
}

/** Like `onInt`, but the board inspector works in half-inches. */
export const onNum = (fn: (n: number) => void) => (raw: string) => {
  const v = parseFloat(raw)
  if (Number.isFinite(v)) fn(v)
}

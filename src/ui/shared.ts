// Non-component exports live here, not beside the components. A `.tsx` that exports a constant
// or a helper alongside its components loses React Fast Refresh for the whole file.

import type React from 'react'

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

/** Like `onInt`, but the board inspector works in half-inches. */
export const onNum = (fn: (n: number) => void) => (raw: string) => {
  const v = parseFloat(raw)
  if (Number.isFinite(v)) fn(v)
}

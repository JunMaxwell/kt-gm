import { useState } from 'react'

import { CHEAT_SHEET } from './rules'
import { phaseMeta } from './compendium'
import { allTeams, scores, teamsOf, useGame } from './state'
import { type Dispatch, type Game, type Net, usePrefetchFactions } from './ui/shared'
import { ActivationOrder } from './ui/ActivationOrder'
import { Compendium, CompendiumBrowser } from './ui/Compendium'
import { Objectives } from './ui/Objectives'
import { OpsBrowser } from './ui/OpsBrowser'
import { Scoreboard } from './ui/Scoreboard'
import { Setup } from './ui/Setup'
import { TeamCard } from './ui/TeamCard'
import { TurnBar } from './ui/TurnBar'

/* ---------- page ---------- */

const ME_KEY = 'killteam-gm/me' // which team this device is playing; never part of `Game`

/** Team columns either side of the fixed 26rem centre column. */
const columns = (n: number) =>
  [
    ...Array(Math.ceil(n / 2)).fill('minmax(0,1fr)'),
    '26rem',
    ...Array(Math.floor(n / 2)).fill('minmax(0,1fr)'),
  ].join(' ')

/**
 * The spectator's phone. Five of seven players watch on one of these, so the console's three
 * columns are the wrong shape — they get their own cards and nothing else.
 *
 * Read-only is structural, not a flag: `Compendium` takes no `dispatch` and so is incapable of
 * writing. A stray tap could not do damage anyway — the server rejects writes without the token,
 * and the next relay message overwrites any local divergence.
 */
function Viewer({ game, net }: { game: Game; net: Net }) {
  const teams = allTeams(game)
  const [saved, setSaved] = useState(() => localStorage.getItem(ME_KEY) ?? '')
  // Checked every render: the GM can delete a team in setup, and the relay will ship that
  // snapshot straight to this phone. A stale pick must fall back, not crash.
  const me = teams.some((t) => t.id === saved) ? saved : (teams[0]?.id ?? '')
  const ph = phaseMeta(game.phase)

  const pick = (id: string) => {
    setSaved(id)
    localStorage.setItem(ME_KEY, id)
  }

  // The shell owns the viewport and only the active tab scrolls, so the phase banner and the
  // deck chips never leave the screen. A player should be reading, not hunting.
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <div className="shrink-0 bg-card text-white">
        <p className="display flex items-center gap-2 bg-amber-400 px-3 py-1 text-xs text-ink">
          <span className="truncate">Room {net.room!.code} — read only</span>
          <select
            value={me}
            onChange={(e) => pick(e.target.value)}
            className="display ml-auto min-w-0 max-w-[55%] rounded bg-black/15 px-1.5 py-0.5 text-xs text-ink"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.player}
              </option>
            ))}
          </select>
        </p>

        <div className="flex items-baseline gap-x-2 px-3 pt-1.5">
          <b className="display text-2xl text-amber-300">{ph.label}</b>
          <span className="display text-xs text-white/55">
            TP{game.tp}/{game.tpCount} · {game.teams[me]?.cp ?? 0} CP
          </span>
          <span className="display ml-auto flex shrink-0 gap-1 text-xs">
            {game.sides.map((x) => (
              <span key={x.id} style={{ color: x.color }}>
                {x.name.slice(0, 3).toUpperCase()} {scores(game, x.id).total}
              </span>
            ))}
          </span>
        </div>

        <p className="truncate px-3 pt-0.5 pb-2 text-[11px] text-white/45">{ph.hint}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2">
        <Compendium game={game} teamId={me} />
      </div>
    </div>
  )
}

export default function App() {
  const [game, dispatch, net, canUndo] = useGame()
  const [editing, setEditing] = useState(false)
  // Fetch the chunk for every faction on the table up front. The app is meant to survive a
  // venue with no wifi, so a match set up beforehand must not need the network to be read.
  usePrefetchFactions(allTeams(game).map((t) => t.faction))

  if (net.viewer) return <Viewer game={game} net={net} />
  if (game.setup) return <Setup game={game} dispatch={dispatch} />

  return (
    <Console game={game} dispatch={dispatch} net={net} editing={editing} setEditing={setEditing} canUndo={canUndo} />
  )
}

function Console({
  game,
  dispatch,
  net,
  editing,
  setEditing,
  canUndo,
}: {
  game: Game
  dispatch: Dispatch
  net: Net
  editing: boolean
  setEditing: (v: boolean) => void
  canUndo: boolean
}) {
  return (
    <div className="min-h-screen">
      <TurnBar game={game} dispatch={dispatch} editing={editing} setEditing={setEditing} net={net} canUndo={canUndo} />

      {/*
        One team column per alliance, flanking the sticky scoreboard: even-indexed sides to
        its left, odd to its right. At two sides that is exactly the original three-column
        layout. Tailwind's JIT cannot see an interpolated track list, so the columns arrive
        as a CSS variable — which, unlike an inline style, the `xl:` breakpoint can still gate.
        Past four alliances the columns are too narrow to read, so it just stacks.
      */}
      <main
        className={`grid gap-4 p-4 ${game.sides.length <= 4 ? 'xl:grid-cols-(--kt-cols)' : ''}`}
        style={{ '--kt-cols': columns(game.sides.length) } as React.CSSProperties}
      >
        <div
          className="order-1 mx-auto w-full min-w-0 max-w-xl xl:order-none xl:max-w-none"
          style={{ order: Math.ceil(game.sides.length / 2) }}
        >
          <div className="space-y-4 xl:sticky xl:top-32">
            <Scoreboard game={game} dispatch={dispatch} />
            <Objectives game={game} dispatch={dispatch} />
            <ActivationOrder game={game} dispatch={dispatch} />
          </div>
        </div>

        {game.sides.map((side, i) => (
          <div
            key={side.id}
            className="grid min-w-0 content-start gap-4 sm:grid-cols-2 xl:grid-cols-1"
            style={{ order: i % 2 ? Math.ceil(game.sides.length / 2) + 1 + Math.floor(i / 2) : Math.floor(i / 2) }}
          >
            {game.sides.length > 2 && (
              <p className="display kt-rule px-1 text-sm" style={{ color: side.color }}>
                {side.name}
              </p>
            )}
            {teamsOf(game, side.id).map((t) => (
              <TeamCard key={t.id} teamId={t.id} game={game} dispatch={dispatch} editing={editing} />
            ))}
          </div>
        ))}
      </main>

      <OpsBrowser game={game} />

      <CompendiumBrowser game={game} />

      <details className="mx-4 mb-8 overflow-hidden border border-rule bg-paper shadow-sm">
        <summary className="display cursor-pointer kt-rule bg-card px-3 py-2 text-xl text-white">Rules cheat sheet</summary>
        <div className="grid gap-4 p-3 md:grid-cols-2 xl:grid-cols-3">
          {CHEAT_SHEET.map((s) => (
            <div key={s.title}>
              <h4 className="display border-b border-rule pb-1 text-base">{s.title}</h4>
              <ul className="mt-1 space-y-0.5 text-sm text-ink/70">
                {s.lines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <footer className="mx-4 mb-8 text-center text-xs leading-relaxed text-ink/45">
        Card styling after the official Kill Team rules cards; side and archetype colours after{' '}
        <a className="underline" href="https://github.com/tiltos/kill-team-critical-ops" target="_blank" rel="noreferrer">
          tiltos/kill-team-critical-ops
        </a>
        .<br />
        Kill Team is a trademark of Games Workshop. Unofficial fan tool for one homebrew match.
      </footer>
    </div>
  )
}

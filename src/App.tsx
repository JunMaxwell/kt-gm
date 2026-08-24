import { useState } from 'react'

import { CHEAT_SHEET, TEAMS } from './rules'
import { phaseMeta } from './compendium'
import { scores, useGame } from './state'
import { type Dispatch, type Game, type Net } from './ui/shared'
import { ActivationOrder } from './ui/ActivationOrder'
import { Compendium, CompendiumBrowser } from './ui/Compendium'
import { MapBuilder } from './ui/MapBuilder'
import { Objectives } from './ui/Objectives'
import { OpsBrowser } from './ui/OpsBrowser'
import { Scoreboard } from './ui/Scoreboard'
import { TeamCard } from './ui/TeamCard'
import { TurnBar } from './ui/TurnBar'

/* ---------- page ---------- */

const ME_KEY = 'killteam-gm/me' // which team this device is playing; never part of `Game`

type Tab = 'cards' | 'board'

/**
 * The spectator's phone. Five of seven players watch on one of these, so the console's three
 * columns are the wrong shape — they get their own cards first and the rest behind a tab.
 *
 * The Cards tab is deliberately OUTSIDE `inert`: `inert` blocks keyboard and pointer alike, so
 * a `<details>` inside it can never be opened and the whole panel would be dead weight. The
 * two read-only tabs keep the wrapper. A stray programmatic click still can't do damage — the
 * server rejects writes without the token, and the next relay message overwrites any local
 * divergence.
 */
function Viewer({ game, dispatch, net }: { game: Game; dispatch: Dispatch; net: Net }) {
  const [tab, setTab] = useState<Tab>('cards')
  const [me, setMe] = useState(() => {
    const saved = localStorage.getItem(ME_KEY)
    return saved && TEAMS.some((t) => t.id === saved) ? saved : TEAMS[0].id
  })
  const ph = phaseMeta(game.phase)

  const pick = (id: string) => {
    setMe(id)
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
            {TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {game.teams[t.id].player}
              </option>
            ))}
          </select>
        </p>

        <div className="flex items-baseline gap-x-2 px-3 pt-1.5">
          <b className="display text-2xl text-amber-300">{ph.label}</b>
          <span className="display text-xs text-white/55">
            TP{game.tp}/{game.tpCount} · {game.teams[me].cp} CP
          </span>
          <span className="display ml-auto shrink-0 text-xs">
            <span className="text-imperium">IMP {scores(game, 'imperium').total}</span>
            <span className="px-1 text-white/25">·</span>
            <span className="text-xenos">XEN {scores(game, 'xenos').total}</span>
          </span>
        </div>

        <p className="truncate px-3 pt-0.5 text-[11px] text-white/45">{ph.hint}</p>

        <div className="flex gap-1 px-2 pt-1.5 pb-2">
          {(['cards', 'board'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`display flex-1 rounded px-2 py-1 text-sm capitalize ${
                tab === t ? 'bg-white text-ink' : 'bg-white/12 text-white/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Only the live tab mounts, so 53 board tokens never render twice. */}
      {tab === 'cards' && (
        <div className="flex min-h-0 flex-1 flex-col p-2">
          <Compendium game={game} teamId={me} />
        </div>
      )}
      {tab === 'board' && (
        <div inert className="min-h-0 flex-1 overflow-auto">
          <MapBuilder game={game} dispatch={dispatch} bare />
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [game, dispatch, net, canUndo] = useGame()
  const [editing, setEditing] = useState(false)

  if (net.viewer) return <Viewer game={game} dispatch={dispatch} net={net} />

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

      <main className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_26rem_minmax(0,1fr)]">
        <div className="order-1 mx-auto w-full min-w-0 max-w-xl xl:order-none xl:max-w-none">
          <div className="space-y-4 xl:sticky xl:top-32">
            <Scoreboard game={game} dispatch={dispatch} />
            <Objectives game={game} dispatch={dispatch} />
            <ActivationOrder game={game} dispatch={dispatch} />
          </div>
        </div>

        <div className="order-2 grid min-w-0 content-start gap-4 sm:grid-cols-2 xl:order-first xl:grid-cols-1">
          {TEAMS.filter((t) => t.side === 'imperium').map((t) => (
            <TeamCard key={t.id} teamId={t.id} game={game} dispatch={dispatch} editing={editing} />
          ))}
        </div>

        <div className="order-3 grid min-w-0 content-start gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {TEAMS.filter((t) => t.side === 'xenos').map((t) => (
            <TeamCard key={t.id} teamId={t.id} game={game} dispatch={dispatch} editing={editing} />
          ))}
        </div>
      </main>

      <MapBuilder game={game} dispatch={dispatch} />

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
        ; the board builder after{' '}
        <a className="underline" href="https://labrador.dev/layout-builder" target="_blank" rel="noreferrer">
          labrador.dev
        </a>
        .<br />
        Kill Team is a trademark of Games Workshop. Unofficial fan tool for one homebrew match.
      </footer>
    </div>
  )
}

import { useState } from 'react'

import {
  enemies,
  exportGame,
  killGrade,
  killValue,
  kills,
  saveMatch,
  scores,
  sideOps,
  teamsOf,
  thresholds,
} from '../state'
import { Btn, TeamPill } from './kit'
import { type Dispatch, type Game, type Net } from './shared'

/* ---------- the end screen ----------
 *
 * The battle's one moment of arithmetic nobody at the table can do in their head: four VP
 * sources, a primary-op bonus that is half of one of them, and a kill bonus that only pays on
 * a strict win over EVERY other alliance. The console shows all of that live in the scoreboard;
 * this shows it once, big, with the winner named.
 *
 * Nothing is derived here — every number comes from the same selectors the scoreboard uses, so
 * the two cannot disagree.
 */

export function EndScreen({ game, dispatch, net }: { game: Game; dispatch: Dispatch; net: Net }) {
  const { room } = net
  const [busy, setBusy] = useState('')

  const table = game.sides.map((side) => ({ side, s: scores(game, side.id) }))
  const best = Math.max(0, ...table.map((r) => r.s.total))
  const winners = table.filter((r) => r.s.total === best)

  const save = async () => {
    if (!room?.token) return
    setBusy('saving…')
    try {
      await saveMatch(room, `Final · ${game.sides.map((x) => x.name).join(' v ')}`, game)
      setBusy('saved')
    } catch {
      setBusy('offline — the match is safe locally')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-white shadow-lg">
        <h1 className="display mr-2 text-2xl">Battle over</h1>
        <span className="display text-xs text-white/50">
          {game.tpCount} turning points · {game.opCap} VP cap per op
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {busy && <span className="display text-xs text-amber-300">{busy}</span>}
          {room?.token && (
            <Btn className="display px-3 py-1" onClick={() => void save()}>
              Save match
            </Btn>
          )}
          {/* The result is about to be thrown away by "New game", and a save needs a room and
              a live relay. A file needs neither. */}
          <Btn
            className="display px-3 py-1"
            onClick={() => exportGame(game)}
            title="Download the finished match as a file"
          >
            Export match
          </Btn>
          <Btn
            className="display px-3 py-1"
            title="The battle is not over after all — this also restores the kill-op bonus to unscored"
            onClick={() => dispatch({ type: 'finish', finished: false })}
          >
            ← Back to the board
          </Btn>
          <Btn className="display px-3 py-1 text-base" onClick={() => dispatch({ type: 'stage', value: 'rooms' })}>
            New game
          </Btn>
        </span>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <section className="border border-rule bg-paper p-6 text-center shadow-sm">
          {winners.length === 1 ? (
            <>
              <p className="display text-sm text-ink/45">Winner</p>
              <h2 className="display text-5xl" style={{ color: winners[0].side.color }}>
                {winners[0].side.name}
              </h2>
              <p className="display mt-1 text-2xl tabular-nums">{best} VP</p>
            </>
          ) : (
            <>
              <p className="display text-sm text-ink/45">Drawn</p>
              <h2 className="display text-4xl">
                {winners.map((w) => (
                  <span key={w.side.id} style={{ color: w.side.color }} className="mx-2">
                    {w.side.name}
                  </span>
                ))}
              </h2>
              <p className="display mt-1 text-2xl tabular-nums">{best} VP each</p>
            </>
          )}
        </section>

        {table.map(({ side, s }) => {
          const grade = killGrade(game, side.id)
          const foeValue = enemies(game, side.id).reduce((n, e) => n + killValue(sideOps(game, e)), 0)
          // Same rule `scores` uses: strictly better than EVERY other alliance. A tie at the
          // top pays nobody, which is the only reading of "beat the enemy" that stays one bonus.
          const beat = enemies(game, side.id).every((e) => grade > killGrade(game, e))

          return (
            <section
              key={side.id}
              className="border-l-4 border border-rule bg-paper p-4 shadow-sm"
              style={{ borderLeftColor: side.color, background: `${side.color}0a` }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="display text-2xl" style={{ color: side.color }}>
                  {side.name}
                </h3>
                <span className="display ml-auto text-4xl leading-none tabular-nums">{s.total}</span>
                <span className="display text-xs text-ink/45">VP</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Cell label="Kill op" vp={s.kill}>
                  grade {grade} · {kills(game, side.id)} of {foeValue} down
                  <br />
                  ladder {thresholds(game, side.id).join(', ')}
                  {beat && <span className="text-flare"> · +1 for beating every alliance</span>}
                </Cell>

                <Cell label="Crit op" vp={s.crit}>
                  {(game.crit[side.id] ?? [])
                    .map((v, tp) => `TP${tp + 1} ${Math.min(game.critCap, v)}`)
                    .join(' · ')}
                </Cell>

                <Cell label="Tac ops" vp={s.tac}>
                  {s.tacRaw > s.tac && <span className="text-ink/40">capped from {s.tacRaw}. </span>}
                  <span className="mt-1 flex flex-wrap items-center gap-1">
                    {teamsOf(game, side.id).map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1">
                        <TeamPill team={t} />
                        <span className="tabular-nums">{t.tacVp}</span>
                      </span>
                    ))}
                  </span>
                </Cell>

                <Cell label="Primary bonus" vp={s.bonus}>
                  {game.primary[side.id]
                    ? `${game.primary[side.id]} op, half again rounded up`
                    : 'no primary op declared'}
                </Cell>
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}

function Cell({ label, vp, children }: { label: string; vp: number; children: React.ReactNode }) {
  return (
    <div>
      <p className="display text-xs tracking-wide text-ink/45 uppercase">{label}</p>
      <p className="display text-2xl tabular-nums">{vp}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-ink/50">{children}</p>
    </div>
  )
}

import { type OpKind } from '../rules'
import {
  enemies,
  killGrade,
  kills,
  killValue,
  scores,
  sideOps,
  suggestedCrit,
  teamsOf,
  thresholds,
} from '../state'
import { Btn, BufferedInput, Label, Stepper, TeamPill } from './kit'
import { type Dispatch, type Game } from './shared'

/* ---------- scoreboard ----------
 *
 * One BLOCK PER ALLIANCE, stacked. This used to be a grid with one COLUMN per alliance inside
 * the console's fixed 26rem centre column, which gave each alliance ~154px at two and ~102px
 * at three — too narrow for a Stepper, a five-number threshold field and three primary-op
 * buttons. Rows take the full width instead, and stop caring how many alliances there are.
 */

export function Scoreboard({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const sides = game.sides
  // Weighted, not counted — the ladder is derived the same way, so a boss must raise both
  // or the readout and the grade disagree.
  const foeValue = (side: string) => enemies(game, side).reduce((n, e) => n + killValue(sideOps(game, e)), 0)

  return (
    <section className="overflow-hidden border border-rule bg-paper shadow-sm">
      <header className="flex items-baseline gap-3 kt-rule bg-card px-3 py-1.5 text-white">
        <h2 className="display text-xl">Scoreboard</h2>
        <span className="display text-[10px] text-white/45">
          VP cap {game.opCap} · crit/TP {game.critCap} · TP {game.tp}/{game.tpCount}
        </span>
      </header>

      <div className="flex flex-col gap-2 p-2.5">
        {sides.map((side) => {
          const s = scores(game, side.id)
          const grade = killGrade(game, side.id)
          const ladder = thresholds(game, side.id)
          const sug = suggestedCrit(game, side.id)
          return (
            <div
              key={side.id}
              className="border-l-4 px-2.5 py-2"
              style={{ borderColor: side.color, background: `${side.color}12` }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="display truncate text-lg" style={{ color: side.color }}>
                  {side.name}
                </h3>
                <span className="display ml-auto text-3xl leading-none">{s.total}</span>
              </div>

              {/* One line per op type. Each is label + value + its own controls, so nothing
                  has to fit a shared column width. */}
              <div className="mt-1.5 grid gap-x-4 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label>Kill op</Label>
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">{s.kill} VP</span>
                    <span className="text-ink/45"> · grade {grade}</span>
                  </p>
                  <p className="text-[10px] text-ink/45">
                    {kills(game, side.id)} of {foeValue(side.id)} down
                  </p>
                  <BufferedInput
                    className="mt-0.5 w-full text-[10px]"
                    value={ladder.join(', ')}
                    aria-label={`${side.name} kill grade thresholds`}
                    title="Kill grade thresholds — edit to retune, clear to re-derive from roster size"
                    onEdit={(raw) => {
                      const v = raw.split(',').map((n) => parseInt(n.trim(), 10))
                      dispatch({
                        type: 'thresholds',
                        side: side.id,
                        value: v.length === 5 && v.every(Number.isFinite) ? v : null,
                      })
                    }}
                  />
                </div>

                <div>
                  <Label>Crit op</Label>
                  <p className="text-sm font-semibold tabular-nums">{s.crit} VP</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1">
                    {/* `normalize` guarantees a row per side, but a missing one would white-screen
                        the whole console mid-game, so read it defensively. */}
                    {(game.crit[side.id] ?? []).map((v, tp) => (
                      <span key={tp} className="flex items-center gap-0.5">
                        <span
                          className={`text-[10px] ${tp === 0 ? 'text-ink/25 line-through' : 'text-ink/45'}`}
                          title={tp === 0 ? 'No crit op scores in the first turning point' : `Turning point ${tp + 1}`}
                        >
                          {tp + 1}
                        </span>
                        <Stepper
                          value={v}
                          max={game.critCap}
                          onChange={(delta) => dispatch({ type: 'critVp', side: side.id, tp, delta })}
                        />
                      </span>
                    ))}
                  </div>
                  {game.critOp && (
                    <p className="mt-0.5 text-[10px] text-ink/50">
                      {sug === null ? (
                        <span title="This crit op tracks points or named markers, so score it by hand">
                          markers — score by hand
                        </span>
                      ) : (
                        <>
                          markers suggest <span className="tabular-nums">{sug}</span>
                          {sug !== (game.crit[side.id] ?? [])[game.tp - 1] && (
                            <Btn
                              className="ml-1 px-1 py-0 text-[10px]"
                              onClick={() =>
                                dispatch({ type: 'setCritVp', side: side.id, tp: game.tp - 1, value: sug })
                              }
                            >
                              apply
                            </Btn>
                          )}
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Tac ops</Label>
                  <p className="text-sm font-semibold tabular-nums">
                    {s.tac} VP
                    {s.tacRaw > s.tac && <span className="font-normal text-ink/40"> (raw {s.tacRaw})</span>}
                  </p>
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {teamsOf(game, side.id).map((t) => (
                      <div key={t.id} className="flex min-w-0 items-center justify-between gap-1">
                        <TeamPill team={t} className="min-w-0 truncate" />
                        <Stepper
                          value={game.teams[t.id].tacVp}
                          max={game.opCap}
                          onChange={(delta) => dispatch({ type: 'tacVp', teamId: t.id, delta })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label title={`Secret primary op — half its VP again, rounded up, max ${Math.ceil(game.opCap / 2)}`}>
                    Primary
                  </Label>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {(['kill', 'crit', 'tac'] as OpKind[]).map((op) => (
                      <Btn
                        key={op}
                        on={game.primary[side.id] === op}
                        className="display px-1.5 py-0.5 text-[11px]"
                        onClick={() =>
                          dispatch({
                            type: 'primary',
                            side: side.id,
                            op: game.primary[side.id] === op ? null : op,
                          })
                        }
                      >
                        {op}
                      </Btn>
                    ))}
                  </div>
                  <p className="mt-0.5 text-[10px] tabular-nums text-ink/50">+{s.bonus} VP bonus</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

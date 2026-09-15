import { type OpKind } from '../rules'
import { enemies, killGrade, kills, maxTeamsPerSide, scores, sideOps, sideDef, suggestedCrit, teamsOf, thresholds } from '../state'
import { Btn, BufferedInput, Label, Stepper, TeamPill } from './kit'
import { type Dispatch, type Game, ROW, rowVars } from './shared'

/* ---------- scoreboard ---------- */

export function Scoreboard({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const sides = game.sides
  const s = Object.fromEntries(sides.map((x) => [x.id, scores(game, x.id)]))
  const foeOps = (side: string) => enemies(game, side).reduce((n, e) => n + sideOps(game, e).length, 0)

  return (
    <section className="overflow-hidden border border-rule bg-paper shadow-sm">
      <header className="flex items-stretch kt-rule bg-card text-white">
        <span className="display grid w-[4.25rem] shrink-0 place-items-center px-3 text-xs text-white/50">Total</span>
        {sides.map((x) => (
          <div key={x.id} className="min-w-0 flex-1 py-1.5 text-center" style={{ background: x.color }}>
            <p className="display truncate px-1 text-sm">{x.name}</p>
            <p className="display text-3xl">{s[x.id].total}</p>
          </div>
        ))}
      </header>

      <div className="p-3" style={rowVars(sides.length)}>
        {/* Kill op */}
        <div className={ROW}>
          <span className="display text-base">Kill op</span>
          {sides.map(({ id: side }) => (
            <p key={side} className="text-center text-sm">
              <span className="font-semibold tabular-nums">{s[side].kill} VP</span>
              <span className="text-ink/45"> · grade {killGrade(game, side)}</span>
            </p>
          ))}
        </div>
        <div className={ROW}>
          <span />
          {sides.map(({ id: side }) => {
            const ladder = thresholds(game, side)
            const grade = killGrade(game, side)
            return (
              <div key={side} className="text-center">
                <p className="text-[10px] text-ink/45">
                  {kills(game, side)} of {foeOps(side)} down
                </p>
                <p className="text-[10px] tabular-nums">
                  {ladder.map((t, i) => (
                    <span key={i} className={grade > i ? 'font-bold text-ink' : 'text-ink/30'}>
                      {t}
                      {i < ladder.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </p>
                <BufferedInput
                  className="mt-0.5 w-full text-[10px]"
                  value={ladder.join(', ')}
                  aria-label={`${sideDef(game, side)?.name} kill grade thresholds`}
                  title="Kill grade thresholds — edit to retune, clear to re-derive from roster size"
                  onEdit={(raw) => {
                    const v = raw.split(',').map((n) => parseInt(n.trim(), 10))
                    dispatch({ type: 'thresholds', side, value: v.length === 5 && v.every(Number.isFinite) ? v : null })
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Crit op */}
        <div className={`${ROW} mt-2 border-t border-rule pt-2`}>
          <span className="display text-base">Crit op</span>
          {sides.map(({ id: side }) => (
            <p key={side} className="text-center text-sm font-semibold tabular-nums">
              {s[side].crit} VP
            </p>
          ))}
        </div>
        {game.crit[sides[0].id].map((_, tp) => (
          <div key={tp} className={ROW}>
            <span
              className={`text-xs ${game.tp === tp + 1 ? 'font-semibold text-ink' : 'text-ink/45'} ${
                tp === 0 ? 'line-through decoration-ink/40' : ''
              }`}
              title={tp === 0 ? 'No crit op scores in the first turning point — its mission action is barred' : undefined}
            >
              TP {tp + 1}
            </span>
            {sides.map(({ id: side }) => (
              <div key={side} className="flex justify-center">
                <Stepper
                  value={game.crit[side][tp]}
                  max={game.critCap}
                  onChange={(delta) => dispatch({ type: 'critVp', side, tp, delta })}
                />
              </div>
            ))}
          </div>
        ))}
        {game.critOp && (
          <div className={ROW}>
            <Label title="What the objective markers are worth this turning point">markers</Label>
            {sides.map(({ id: side }) => {
              const sug = suggestedCrit(game, side)
              if (sug === null)
                return (
                  <p key={side} className="text-center text-[10px] text-ink/35" title="This crit op tracks points or named markers, so score it by hand">
                    score by hand
                  </p>
                )
              return (
                <div key={side} className="flex items-center justify-center gap-1 text-xs text-ink/50">
                  <span className="tabular-nums">suggests {sug}</span>
                  {sug !== game.crit[side][game.tp - 1] && (
                    <Btn
                      className="px-1 py-0 text-[10px]"
                      onClick={() => dispatch({ type: 'setCritVp', side, tp: game.tp - 1, value: sug })}
                    >
                      apply
                    </Btn>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tac ops */}
        <div className={`${ROW} mt-2 border-t border-rule pt-2`}>
          <span className="display text-base">Tac ops</span>
          {sides.map(({ id: side }) => (
            <p key={side} className="text-center text-sm font-semibold tabular-nums">
              {s[side].tac} VP
              {s[side].tacRaw > s[side].tac && <span className="font-normal text-ink/40"> (raw {s[side].tacRaw})</span>}
            </p>
          ))}
        </div>
        {/* one row per rotation slot — the sides can hold different numbers of players */}
        {Array.from({ length: maxTeamsPerSide(game) }, (_, i) => (
          <div key={i} className={ROW}>
            <span />
            {sides.map(({ id: side }) => {
              const t = teamsOf(game, side)[i]
              if (!t) return <span key={side} />
              return (
                <div key={side} className="flex min-w-0 items-center justify-between gap-1">
                  <TeamPill team={t} className="min-w-0 truncate" />
                  <Stepper
                    value={game.teams[t.id].tacVp}
                    max={game.opCap}
                    onChange={(delta) => dispatch({ type: 'tacVp', teamId: t.id, delta })}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {/* Primary op */}
        <div className={`${ROW} mt-2 border-t border-rule pt-2`}>
          <Label title={`Secret primary op — scores half its VP again, rounded up, max ${Math.ceil(game.opCap / 2)}`}>
            Primary
          </Label>
          {sides.map(({ id: side }) => (
            <div key={side} className="flex justify-center gap-1">
              {(['kill', 'crit', 'tac'] as OpKind[]).map((op) => (
                <Btn
                  key={op}
                  on={game.primary[side] === op}
                  className="display px-1.5 py-0.5 text-[11px]"
                  onClick={() => dispatch({ type: 'primary', side, op: game.primary[side] === op ? null : op })}
                >
                  {op}
                </Btn>
              ))}
            </div>
          ))}
        </div>
        <div className={ROW}>
          <Label>bonus</Label>
          {sides.map(({ id: side }) => (
            <p key={side} className="text-center text-xs tabular-nums text-ink/60">
              +{s[side].bonus} VP
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

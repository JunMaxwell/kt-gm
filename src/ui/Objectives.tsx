import { SIDE_COLOR, type SideId, SIDES } from '../rules'
import { objectiveCounts } from '../state'
import { DarkBtn } from './kit'
import { type Dispatch, type Game } from './shared'

/* ---------- objectives ---------- */

export function Objectives({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const counts = objectiveCounts(game)
  const cycle = (holder: SideId | null): SideId | null =>
    holder === null ? 'imperium' : holder === 'imperium' ? 'xenos' : null

  return (
    <section className="overflow-hidden border border-rule bg-paper shadow-sm">
      <header className="flex items-center justify-between kt-rule bg-card px-3 py-1.5 text-white">
        <h2 className="display text-xl">Objectives</h2>
        <span className="inline-flex items-center gap-1">
          <DarkBtn onClick={() => dispatch({ type: 'objectiveCount', value: game.objectives.length - 1 })} className="w-7">
            –
          </DarkBtn>
          <span className="w-5 text-center font-semibold tabular-nums">{game.objectives.length}</span>
          <DarkBtn onClick={() => dispatch({ type: 'objectiveCount', value: game.objectives.length + 1 })} className="w-7">
            +
          </DarkBtn>
        </span>
      </header>

      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {game.objectives.map((holder, i) => (
            <button
              key={i}
              onClick={() => dispatch({ type: 'objective', index: i, value: cycle(holder) })}
              title={`Marker ${i === 0 ? 'C (centre)' : i + 1} — ${
                holder ? SIDES[holder] : 'neutral'
              }. Click to cycle Imperium → Xenos → neutral.`}
              className="display grid h-10 w-10 place-items-center rounded-lg border text-lg"
              style={
                holder
                  ? { background: SIDE_COLOR[holder], borderColor: SIDE_COLOR[holder], color: '#fff' }
                  : { background: '#fff', borderColor: 'var(--color-rule)', color: 'rgba(40,44,52,.4)' }
              }
            >
              {i === 0 ? 'C' : i + 1}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-ink/50">
          <b style={{ color: SIDE_COLOR.imperium }}>{counts.imperium} Imperium</b> ·{' '}
          <b style={{ color: SIDE_COLOR.xenos }}>{counts.xenos} Xenos</b> · {counts.neutral} neutral
        </p>
        {!game.critOp && <p className="mt-1 text-xs text-recon">Pick a crit op above to score these.</p>}
      </div>
    </section>
  )
}

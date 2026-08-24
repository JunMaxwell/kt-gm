import { SIDE_COLOR, SIDES } from '../rules'
import { canMove, currentTeamId, readyCount, rotation, teamsOf } from '../state'
import { Btn, TeamPill } from './kit'
import { type Dispatch, type Game, SIDE_IDS } from './shared'

/* ---------- activation order ---------- */

export function ActivationOrder({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const seq = rotation(game)
  const currentId = currentTeamId(game)

  return (
    <section className="overflow-hidden border border-rule bg-paper shadow-sm">
      <header className="flex items-center justify-between kt-rule bg-card px-3 py-1.5 text-white">
        <h2 className="display text-xl">Activation order</h2>
        <span className="display text-xs text-white/50">{game.paired ? 'paired — order unused' : 'move within a side'}</span>
      </header>

      {game.paired ? (
        <div className="p-3">
          {SIDE_IDS.map((side) => (
            <div key={side} className="mb-2 last:mb-0">
              <p className="display text-sm" style={{ color: SIDE_COLOR[side] }}>
                {SIDES[side]}
                {side === game.sideTurn && <span className="ml-1 text-ink/45">· activating</span>}
              </p>
              <ul className="mt-1 space-y-0.5">
                {teamsOf(game, side).map((t) => {
                  const ready = readyCount(game, t.id)
                  const used = game.pairUsed.includes(t.id)
                  return (
                    <li key={t.id} className="flex items-center gap-2 text-xs">
                      <TeamPill team={t} className={used || !ready ? 'opacity-40' : ''} />
                      <span className="min-w-0 flex-1 truncate text-ink/55">{game.teams[t.id].player}</span>
                      <span className="text-ink/40">
                        {!ready ? 'nothing ready' : used ? 'gone this pair' : `${ready} ready`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <p className="mt-2 text-xs text-ink/45">
            Two operatives from two different players, then hand over. One player left on a side means single
            activations for the rest of the turning point.
          </p>
        </div>
      ) : (
      <ol className="p-3">
        {seq.map((t, i) => {
          const live = t.id === currentId
          const ready = readyCount(game, t.id)
          return (
            <li
              key={t.id}
              className={`flex items-center gap-2 rounded px-1 py-0.5 ${live ? 'bg-amber-200' : ''}`}
            >
              <span className="display w-4 text-right text-sm text-ink/40">{i + 1}</span>
              <TeamPill team={t} />
              <span className="min-w-0 flex-1 truncate text-xs text-ink/55">
                {game.teams[t.id].player}
                {!ready && <span className="text-ink/35"> · nothing ready</span>}
              </span>
              <Btn
                className="w-6 px-0 disabled:opacity-20"
                title={`Move ${t.name} earlier in the ${SIDES[t.side]} order`}
                disabled={!canMove(game, t.id, -1)}
                onClick={() => dispatch({ type: 'moveTeam', teamId: t.id, dir: -1 })}
              >
                ↑
              </Btn>
              <Btn
                className="w-6 px-0 disabled:opacity-20"
                title={`Move ${t.name} later in the ${SIDES[t.side]} order`}
                disabled={!canMove(game, t.id, 1)}
                onClick={() => dispatch({ type: 'moveTeam', teamId: t.id, dir: 1 })}
              >
                ↓
              </Btn>
            </li>
          )
        })}
      </ol>
      )}
      {!game.paired && (
        <p className="px-3 pb-3 text-xs text-ink/45">
          Sides alternate one operative per slot. Reordering a team moves it within its own side, and resets the cursor
          to the top of the cycle.
        </p>
      )}
    </section>
  )
}

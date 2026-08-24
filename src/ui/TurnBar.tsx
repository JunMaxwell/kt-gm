import { CRIT_OPS, type CritOpId, SIDE_COLOR, SIDES, TEAMS } from '../rules'
import { phaseMeta, PHASES } from '../compendium'
import { counteract, currentTeamId, enemy, pairEligible, pairTarget, readyCount, teamsOf } from '../state'
import { Btn, BufferedInput, DarkBtn, Label, TeamPill } from './kit'
import { type Dispatch, type Game, type Net, onInt, SIDE_IDS } from './shared'
import { RoomBar } from './RoomBar'

/* ---------- header ---------- */

export function TurnBar({
  game,
  dispatch,
  editing,
  setEditing,
  net,
  canUndo,
}: {
  game: Game
  dispatch: Dispatch
  editing: boolean
  setEditing: (v: boolean) => void
  net: Net
  canUndo: boolean
}) {
  const critOp = CRIT_OPS.find((c) => c.id === game.critOp)

  return (
    <header className="sticky top-0 z-10 bg-card px-4 py-3 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <h1 className="display mr-2 text-2xl">Kill Team GM</h1>

        <div className="flex items-center gap-2">
          <span className="display text-xs text-white/50">Turning point</span>
          {Array.from({ length: game.tpCount }, (_, i) => (
            <button
              key={i}
              onClick={() => dispatch({ type: 'setTp', value: i + 1 })}
              title={`Jump to turning point ${i + 1} (does not ready operatives or pay CP)`}
              className={`display grid h-7 w-7 place-items-center rounded text-lg ${
                game.tp === i + 1 ? 'bg-white text-ink' : 'bg-white/12 text-white/60 hover:bg-white/25'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <span className="inline-flex items-center gap-1">
            <DarkBtn onClick={() => dispatch({ type: 'tpCount', value: game.tpCount - 1 })} className="w-7">
              –
            </DarkBtn>
            <DarkBtn onClick={() => dispatch({ type: 'tpCount', value: game.tpCount + 1 })} className="w-7">
              +
            </DarkBtn>
          </span>
        </div>

        {/* The question five of seven players cannot answer for themselves. Every spectator's
            phone reads this off the same snapshot. */}
        <div className="flex items-center gap-2">
          <span className="display text-xs text-white/50">Phase</span>
          {PHASES.map((ph) => (
            <button
              key={ph.id}
              onClick={() => dispatch({ type: 'phase', value: ph.id })}
              title={ph.hint}
              className={`display rounded px-2 py-1 text-sm ${
                game.phase === ph.id ? 'bg-amber-400 text-ink' : 'bg-white/12 text-white/60 hover:bg-white/25'
              }`}
            >
              {ph.label}
            </button>
          ))}
        </div>

        <label
          className="display flex items-center gap-1 text-xs text-white/50"
          title="Max VP per op type. Official is 6 over four turning points — raise it if you add turning points, or the extra ones cannot score."
        >
          VP cap
          <BufferedInput
            dark
            className="w-10"
            inputMode="numeric"
            aria-label="Max VP per op type"
            value={String(game.opCap)}
            onEdit={onInt((value) => dispatch({ type: 'opCap', value }))}
          />
        </label>
        <label
          className="display flex items-center gap-1 text-xs text-white/50"
          title="Max crit op VP per turning point. The cards cap this at 2; this homebrew defaults to 3."
        >
          crit/TP
          <BufferedInput
            dark
            className="w-10"
            inputMode="numeric"
            aria-label="Max crit op VP per turning point"
            value={String(game.critCap)}
            onEdit={onInt((value) => dispatch({ type: 'critCap', value }))}
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="display text-xs text-white/50">Initiative</span>
          {SIDE_IDS.map((s) => (
            <button
              key={s}
              onClick={() => dispatch({ type: 'initiative', side: s })}
              className="display rounded px-2 py-1 text-sm"
              style={
                game.initiative === s
                  ? { background: SIDE_COLOR[s], color: '#fff' }
                  : { background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)' }
              }
            >
              {SIDES[s]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2">
          <span className="display text-xs text-white/50">Crit op</span>
          <select
            value={game.critOp ?? ''}
            onChange={(e) => dispatch({ type: 'critOp', id: e.target.value as CritOpId })}
            className="rounded bg-white/15 px-2 py-1 text-sm text-white"
          >
            <option value="">— roll D9 or agree —</option>
            {CRIT_OPS.map((c) => (
              <option key={c.id} value={c.id} className="text-ink">
                {c.n}. {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <DarkBtn
            onClick={() => dispatch({ type: 'undo' })}
            disabled={!canUndo}
            className="display disabled:opacity-30"
            title="Undo the last change (Ctrl/Cmd+Z). Fifty steps, this session only."
          >
            ↶ Undo
          </DarkBtn>
          <DarkBtn
            on={game.paired}
            onClick={() => dispatch({ type: 'paired', value: !game.paired })}
            className="display"
            title="House rule: each side activates two operatives from two different players, then hands over. Off = the official one-at-a-time alternation."
          >
            {game.paired ? 'Paired' : 'Single'}
          </DarkBtn>
          <DarkBtn on={editing} onClick={() => setEditing(!editing)} className="display">
            {editing ? 'Done editing' : 'Edit rosters'}
          </DarkBtn>
          <DarkBtn onClick={() => dispatch({ type: 'nextTp' })} className="display">
            Next TP · ready all + CP
          </DarkBtn>
          <DarkBtn on={game.finished} onClick={() => dispatch({ type: 'finish', finished: !game.finished })} className="display">
            End battle
          </DarkBtn>
          <DarkBtn
            onClick={() => confirm('Reset the whole game?') && dispatch({ type: 'reset' })}
            className="display text-red-200"
          >
            Reset
          </DarkBtn>
        </div>
      </div>

      <p className="mt-2 text-xs text-white/60">
        <b className="text-amber-300">{phaseMeta(game.phase).label} phase</b> · {phaseMeta(game.phase).hint}
      </p>

      {critOp && (
        <p className="mt-2 text-xs text-white/60">
          <b className="text-white">{critOp.name}</b> · {critOp.action} · {critOp.vp.join(' ')}{' '}
          <span className="text-amber-300">No crit VP in TP1.</span>
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {game.paired ? <PairedTurn game={game} dispatch={dispatch} /> : <SingleTurn game={game} dispatch={dispatch} />}
      </div>

      {!net.viewer && <RoomBar game={game} dispatch={dispatch} net={net} />}
    </header>
  )
}

/** Official alternation: one named team is up. */
export function SingleTurn({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const current = TEAMS.find((t) => t.id === currentTeamId(game))
  return (
    <>
      {current ? (
        <p className="flex items-baseline gap-2">
          <Label className="text-white/50">Activating</Label>
          <span
            className="display rounded px-2 py-0.5 text-xl"
            style={{ background: current.color, color: current.ink ? '#282c34' : '#fff' }}
          >
            {current.name} · {game.teams[current.id].player}
          </span>
          <span className="text-sm text-white/50">{readyCount(game, current.id)} ready</span>
        </p>
      ) : (
        <p className="display text-xl text-amber-300">Firefight phase over — start the next turning point</p>
      )}
      {current && (
        <DarkBtn onClick={() => dispatch({ type: 'skip' })} className="display">
          Skip / pass
        </DarkBtn>
      )}
      {SIDE_IDS.map((s) => [s, counteract(game, s)] as const)
        .filter(([, c]) => c.available)
        .map(([s, c]) => (
          <p key={s} className="rounded bg-amber-300 px-2 py-1 text-sm text-ink">
            {SIDES[s]} may <b>counteract</b>: one expended <b>Engage</b> operative, free 1AP action (not Guard), max 2"
            move. {c.eligible.length ? `${c.eligible.length} eligible on Engage.` : 'None on Engage — nobody can.'}
          </p>
        ))}
    </>
  )
}

/** Buddy System: the side is up, and two different players must each spend one. */
export function PairedTurn({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const target = pairTarget(game)
  const done = game.pairUsed.length
  const eligible = pairEligible(game)
  const foe = enemy(game.sideTurn)
  const foeDry = !teamsOf(game, foe).some((t) => readyCount(game, t.id) > 0)
  const banked = game.counteracts[foe]

  if (!target)
    return <p className="display text-xl text-amber-300">Firefight phase over — start the next turning point</p>

  return (
    <>
      <p className="flex flex-wrap items-baseline gap-2">
        <Label className="text-white/50">Activating</Label>
        <span
          className="display rounded px-2 py-0.5 text-xl"
          style={{ background: SIDE_COLOR[game.sideTurn], color: '#fff' }}
        >
          {SIDES[game.sideTurn]}
        </span>
        <span className="display text-lg text-white">
          {done}/{target}
        </span>
        {target === 1 && (
          <span className="display rounded bg-amber-300 px-1.5 text-xs text-ink" title="Only one player on this side still has ready operatives, so it reverts to single activations">
            lone wolf
          </span>
        )}
      </p>

      <p className="flex flex-wrap items-center gap-1">
        <Label className="text-white/40">{done ? 'still to go' : 'pick two'}</Label>
        {eligible.map((t) => (
          <TeamPill key={t.id} team={t} />
        ))}
        {game.pairUsed.map((id) => {
          const t = TEAMS.find((x) => x.id === id)
          return t ? <TeamPill key={id} team={t} className="opacity-30 line-through" /> : null
        })}
      </p>

      <DarkBtn onClick={() => dispatch({ type: 'passPair' })} className="display" title="Hand the turn over without spending the rest of this pair">
        Pass
      </DarkBtn>

      {foeDry && (
        <p className="flex items-center gap-2 rounded bg-amber-300 px-2 py-1 text-sm text-ink">
          <b>{SIDES[foe]} is out — Counteract:</b> per enemy activation, one expended <b>Engage</b> operative may
          perform any single 1AP action, moving at most 2".
          <span className="display">banked {banked}</span>
          <Btn className="w-6 px-0" onClick={() => dispatch({ type: 'counteractBank', side: foe, delta: -1 })} disabled={!banked}>
            –
          </Btn>
        </p>
      )}
    </>
  )
}

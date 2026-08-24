import { blankOperative, CATALOGUE, type Operative, slug, tacOp, TEAMS, teamTacOps } from '../rules'
import { currentTeamId, type Order, orderCounts, pairEligible, readyCount, teamOps } from '../state'
import { Btn, BufferedInput, Card, Label, Stepper } from './kit'
import { type Dispatch, type Game, onInt } from './shared'
import { TacOpCard } from './TacOpCard'

/* ---------- roster ---------- */

export function EditRow({ teamId, o, dispatch }: { teamId: string; o: Operative; dispatch: Dispatch }) {
  const edit = (patch: Partial<Operative>) => dispatch({ type: 'editOp', teamId, opId: o.id, patch })

  return (
    <li className="rounded bg-black/[0.03] px-2 py-1.5">
      <div className="flex items-center gap-2">
        <input
          value={o.name}
          onChange={(e) => edit({ name: e.target.value })}
          className="min-w-0 flex-1 rounded border border-rule bg-white px-2 py-0.5 text-sm"
          aria-label="Operative name"
        />
        <Btn onClick={() => dispatch({ type: 'removeOp', teamId, opId: o.id })} className="shrink-0 text-xenos" title="Remove operative">
          ×
        </Btn>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <label className="flex items-center gap-1 text-xs text-ink/45">
          APL
          <BufferedInput className="w-10" inputMode="numeric" value={String(o.apl)} onEdit={onInt((apl) => edit({ apl }))} />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink/45">
          Move
          <BufferedInput className="w-12" value={o.move} onEdit={(move) => edit({ move })} />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink/45">
          Save
          <BufferedInput className="w-12" value={o.save} onEdit={(save) => edit({ save })} />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink/45">
          W
          <BufferedInput className="w-12" inputMode="numeric" value={String(o.w)} onEdit={onInt((w) => edit({ w: Math.max(1, w) }))} />
        </label>
      </div>
    </li>
  )
}

export function PlayRow({ o, game, dispatch }: { o: Operative; game: Game; dispatch: Dispatch }) {
  const st = game.ops[o.id]
  if (!st) return null
  const injured = !st.dead && st.hp * 2 < o.w

  return (
    <li
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded px-1 py-0.5 text-sm ${
        st.dead ? 'text-ink/30 line-through' : st.expended ? 'bg-black/[0.04] text-ink/45' : ''
      }`}
    >
      <button
        onClick={() => dispatch({ type: 'activate', opId: o.id })}
        disabled={st.dead}
        className="min-w-0 flex-1 basis-24 truncate text-left font-medium hover:text-security"
        title={`${o.name} · ${o.apl}AP · Move ${o.move} · Save ${o.save} · ${o.w}W — ${
          st.expended ? 'expended, click to ready' : 'click when activated'
        }`}
      >
        {st.expended && !st.dead ? '· ' : ''}
        {o.name}
      </button>
      <button
        onClick={() => dispatch({ type: 'order', opId: o.id, value: st.order === 'conceal' ? 'engage' : 'conceal' })}
        disabled={st.dead}
        title={`${
          st.order === 'conceal'
            ? 'Conceal — cannot Shoot, Charge or counteract; not a valid target while in cover'
            : 'Engage — acts normally, can counteract'
        } (click to flip)`}
        className="display shrink-0 rounded px-1.5 text-xs text-white"
        style={{ background: st.order === 'conceal' ? '#0b6be1' : '#f05c22' }}
      >
        {st.order === 'conceal' ? 'CON' : 'ENG'}
      </button>
      <span className="shrink-0 text-xs tabular-nums text-ink/40" title={`${o.apl}AP · ${o.w}W`}>
        {o.move} {o.save}
      </span>
      {injured && <span className="display shrink-0 rounded bg-recon px-1 text-xs text-white">inj</span>}
      <Stepper value={st.hp} max={o.w} onChange={(delta) => dispatch({ type: 'wound', opId: o.id, delta })} />
      <Btn
        on={st.dead}
        onClick={() => dispatch({ type: 'dead', opId: o.id, dead: !st.dead })}
        className="shrink-0"
        title="Incapacitated"
      >
        ☠
      </Btn>
    </li>
  )
}

export function TeamCard({
  teamId,
  game,
  dispatch,
  editing,
}: {
  teamId: string
  game: Game
  dispatch: Dispatch
  editing: boolean
}) {
  const team = TEAMS.find((t) => t.id === teamId)!
  const p = game.teams[teamId]
  const ops = teamOps(game, teamId)
  const counts = orderCounts(game, teamId)
  const selectedTacOp = tacOp(p.tacOp)
  const isCurrent =
    !editing &&
    (game.paired ? pairEligible(game).some((t) => t.id === teamId) : currentTeamId(game) === teamId)

  const add = (value: string) => {
    if (!value) return
    const src = CATALOGUE[teamId].find((c) => c.id === value)
    const op: Operative = src
      ? { ...src, id: `${teamId}-${slug(src.name)}-${crypto.randomUUID().slice(0, 4)}` }
      : blankOperative(teamId)
    dispatch({ type: 'addOp', teamId, op })
  }

  return (
    <Card
      band={team.color}
      ink={team.ink}
      className={isCurrent ? 'ring-4 ring-amber-300' : ''}
      title={team.name}
      aside={
        <span className="display shrink-0 text-xs opacity-80">
          {team.archetypes.join(' · ')}
        </span>
      }
    >
      <div className="flex items-center gap-2">
        <input
          value={p.player}
          onChange={(e) => dispatch({ type: 'player', teamId, name: e.target.value })}
          className="min-w-0 flex-1 rounded border border-rule bg-white px-2 py-0.5 text-sm"
          aria-label="Player name"
        />
        <Label>CP</Label>
        <Stepper value={p.cp} onChange={(delta) => dispatch({ type: 'cp', teamId, delta })} />
      </div>

      {!editing && (
        <div className="mt-2 flex items-center gap-2">
          <Label>Set all</Label>
          {(['conceal', 'engage'] as Order[]).map((v) => (
            <Btn key={v} onClick={() => dispatch({ type: 'teamOrder', teamId, value: v })} className="display text-xs">
              {v === 'conceal' ? 'CON' : 'ENG'}
            </Btn>
          ))}
          <span className="display ml-auto text-xs tabular-nums">
            <span className="text-security">{counts.conceal} CON</span> ·{' '}
            <span className="text-recon">{counts.engage} ENG</span>
          </span>
        </div>
      )}

      <select
        value={p.tacOp}
        onChange={(e) => dispatch({ type: 'tacOp', teamId, value: e.target.value })}
        className="mt-2 w-full min-w-0 rounded border border-rule bg-white px-2 py-1 text-sm"
      >
        <option value="">— secret tac op —</option>
        {team.archetypes.map((arch) => (
          <optgroup key={arch} label={arch}>
            {teamTacOps(teamId)
              .filter((t) => t.archetype === arch)
              .map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {selectedTacOp && <TacOpCard op={selectedTacOp} className="mt-2" />}

      <ul className={`mt-2 ${editing ? 'space-y-1.5' : 'space-y-0.5'}`}>
        {ops.map((o) =>
          editing ? (
            <EditRow key={o.id} teamId={teamId} o={o} dispatch={dispatch} />
          ) : (
            <PlayRow key={o.id} o={o} game={game} dispatch={dispatch} />
          ),
        )}
      </ul>

      {editing ? (
        <div className="mt-2 flex items-center gap-2 border-t border-rule pt-2">
          <select
            value=""
            onChange={(e) => add(e.target.value)}
            className="w-0 min-w-0 flex-1 rounded border border-rule bg-white px-2 py-1 text-sm"
          >
            <option value="">+ add operative…</option>
            <optgroup label="Datacards">
              {CATALOGUE[teamId].map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.apl}AP {c.move} {c.save} {c.w}W
                </option>
              ))}
            </optgroup>
            <option value="__custom">Custom operative…</option>
          </select>
          <Btn
            onClick={() => confirm(`Reset ${team.name} to the default roster?`) && dispatch({ type: 'resetRoster', teamId })}
            className="display shrink-0"
          >
            Reset
          </Btn>
        </div>
      ) : (
        <p className="mt-2 text-xs text-ink/40">
          {ops.length} operatives · {readyCount(game, teamId)} ready ·{' '}
          {ops.length - readyCount(game, teamId)} expended or down
        </p>
      )}
    </Card>
  )
}

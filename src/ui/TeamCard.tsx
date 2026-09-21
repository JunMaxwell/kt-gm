import { useState } from 'react'

import { blankOperative, CATALOGUE, killWorth, type Operative, slug, tacOp, teamTacOps } from '../rules'
import { currentTeamId, liveStats, type Order, orderCounts, pairEligible, pairTarget, readyCount, teamOps } from '../state'
import { Btn, BufferedInput, Card, Label, Stepper } from './kit'
import { type Dispatch, type Game, onInt, useFaction } from './shared'
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
        <label className="flex items-center gap-1 text-xs text-ink/45" title="Activations per turning point. 1 for a normal model; a boss may get more.">
          Acts
          <BufferedInput
            className="w-10"
            inputMode="numeric"
            value={String(o.acts ?? 1)}
            onEdit={onInt((acts) => edit({ acts: Math.max(1, acts) }))}
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink/45" title="Kills this operative is worth when it goes down. 1 for a normal model; raise it for a boss.">
          Kill
          <BufferedInput
            className="w-10"
            inputMode="numeric"
            value={String(killWorth(o))}
            onEdit={onInt((kv) => edit({ kv: Math.max(1, kv) }))}
          />
        </label>
      </div>
    </li>
  )
}

export function PlayRow({ o, game, dispatch }: { o: Operative; game: Game; dispatch: Dispatch }) {
  const st = game.ops[o.id]
  if (!st) return null
  const acts = Math.max(1, o.acts ?? 1)
  const now = liveStats(game, o, st)

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
        title={`${o.name} · ${now.apl}AP · Move ${now.move} · Save ${now.save} · ${o.w}W${
          acts > 1 ? ` · ${acts} activations` : ''
        } — ${st.expended ? 'expended, click to ready' : 'click when activated'}`}
      >
        {st.expended && !st.dead ? '· ' : ''}
        {o.name}
        {/* Only a boss has more than one, and then the count is the thing you need to see. */}
        {acts > 1 && !st.dead && (
          <span className="display ml-1.5 rounded bg-black/10 px-1 text-[10px] tabular-nums text-ink/60">
            {st.used ?? 0}/{acts}
          </span>
        )}
      </button>
      <button
        onClick={() => dispatch({ type: 'order', opId: o.id, value: st.order === 'conceal' ? 'engage' : 'conceal' })}
        disabled={st.dead || !!o.lockOrder}
        title={`${
          st.order === 'conceal'
            ? 'Conceal — cannot Shoot, Charge or counteract; not a valid target while in cover'
            : 'Engage — acts normally, can counteract'
        }${o.lockOrder ? ' — locked by a rule on its datacard, it can never take the other order' : ' (click to flip)'}`}
        className={`display shrink-0 rounded px-1.5 text-xs text-white ${o.lockOrder ? 'cursor-default' : ''}`}
        style={{ background: st.order === 'conceal' ? '#0b6be1' : '#f05c22' }}
      >
        {st.order === 'conceal' ? 'CON' : 'ENG'}
        {/* A locked operative's chip is not a control — say so rather than look broken. */}
        {o.lockOrder && <span className="ml-0.5 opacity-70">*</span>}
      </button>
      {/* The same effective numbers the player's phone shows, from the same `liveStats` — three
          renderers printed the raw datacard before this, and they would drift apart again. */}
      <span
        className="shrink-0 text-xs tabular-nums text-ink/40"
        title={`${o.apl}AP · ${o.w}W${now.move !== o.move ? ` · prints ${o.move}` : ''}`}
      >
        {now.move} {now.save}
      </span>
      {now.hurt && (
        // The toggle for every injury rule the app cannot resolve on its own: the library's
        // others are auras ("within 6\" of this operative") or optional ("you can ignore"), and
        // there is no board here. Flipping it says "this one is ignoring the penalty".
        <button
          onClick={() => dispatch({ type: 'tough', opId: o.id, value: !st.tough })}
          title={
            now.ignoring === 'all'
              ? 'Ignoring the Injured penalty — click to apply it again'
              : now.ignoring === 'weapons'
                ? 'Its own rule keeps its weapons\u2019 Hit stat; it still loses the 2"'
                : 'Injured: \u22122" Move, \u22121 Hit. Click if a rule lets this one ignore it'
          }
          className={`display shrink-0 rounded px-1 text-xs ${
            now.ignoring === 'all' ? 'bg-black/10 text-ink/45 line-through' : 'bg-recon text-white'
          }`}
        >
          inj
        </button>
      )}
      <Stepper
        value={st.hp}
        max={o.w}
        onChange={(delta) => dispatch({ type: 'wound', opId: o.id, delta })}
        onSet={(v) => dispatch({ type: 'wound', opId: o.id, delta: v - st.hp })}
      />
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
  reveal,
}: {
  teamId: string
  game: Game
  dispatch: Dispatch
  editing: boolean
  /** Secret tac ops are hidden until the GM taps Reveal — see `Console`. */
  reveal: boolean
}) {
  // The team is the play state now — one object, not a preset plus a row beside it.
  const team = game.teams[teamId]
  const p = team
  // A preset faction keeps its hand-curated catalogue in rules.ts (shorter names, and the
  // default rosters are built from it); every other faction reads its datacards from the
  // generated library, which arrives a tick after the team first appears.
  const faction = useFaction(team.faction)
  const catalogue = CATALOGUE[team.faction ?? ''] ?? faction?.operatives ?? []
  const ops = teamOps(game, teamId)
  const counts = orderCounts(game, teamId)
  const selectedTacOp = tacOp(p.tacOp)
  // Auto-expand is capped at the pair target rather than every eligible team: a side with
  // four players had all four open at once, which is the crowding this redesign is for, and
  // the Buddy System only ever spends two. The rest are one click away and collapse again
  // as `pairUsed` fills.
  const isCurrent =
    !editing &&
    (game.paired
      ? pairEligible(game)
          .slice(0, pairTarget(game))
          .some((t) => t.id === teamId)
      : currentTeamId(game) === teamId)

  /**
   * Collapsed is the default, because nine expanded cards is the clutter. A card opens when
   * it can act — `pairEligible` / `currentTeamId` already decide that — so the console
   * follows the turn rather than showing every roster at once. `open` only ever *forces* a
   * card open; the GM can pin one without it snapping shut on the next hand-off.
   */
  const [open, setOpen] = useState(false)
  const expanded = editing || open || isCurrent
  const ready = readyCount(game, teamId)
  const live = ops.filter((o) => game.ops[o.id] && !game.ops[o.id].dead)
  const hp = live.reduce((n, o) => n + game.ops[o.id].hp, 0)
  const maxHp = live.reduce((n, o) => n + o.w, 0)
  // A nemesis operative's activation count is the thing you need on a collapsed card; for
  // everyone else the ready count says it.
  const multi = ops.find((o) => (o.acts ?? 1) > 1)

  if (!expanded)
    return (
      <button
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-2 border border-rule bg-paper px-2.5 py-2 text-left shadow-sm transition-colors hover:bg-black/[0.03] ${
          ready ? '' : 'opacity-50'
        }`}
        title={`${team.name} — ${team.player}. Click to open.`}
      >
        <span className="h-6 w-2 shrink-0 rounded-sm" style={{ background: team.color }} />
        <span className="display min-w-0 flex-1 truncate text-base">{team.name}</span>
        <span className="shrink-0 text-[10px] text-ink/45">
          {team.player} ·{' '}
          {multi
            ? `${game.ops[multi.id]?.used ?? 0}/${multi.acts} acts`
            : ready
              ? `${ready} ready`
              : 'nothing ready'}
        </span>
        {maxHp > 0 && (
          <span
            className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-black/10"
            title={`${hp} of ${maxHp} wounds`}
          >
            <span className="block h-full" style={{ width: `${(hp / maxHp) * 100}%`, background: team.color }} />
          </span>
        )}
        <span className="display shrink-0 text-xs text-ink/40">+</span>
      </button>
    )

  const add = (value: string) => {
    if (!value) return
    // A hand-built team has no faction, and so no datacards to pick from.
    const src = catalogue.find((c) => c.id === value)
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
        <span className="display flex shrink-0 items-center gap-2 text-xs opacity-80">
          {team.archetypes.join(' · ')}
          {!editing && !isCurrent && (
            <button onClick={() => setOpen(false)} title="Collapse" className="px-1 text-sm leading-none">
              –
            </button>
          )}
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

      {reveal ? (
        <>
          <select
            value={p.tacOp}
            onChange={(e) => dispatch({ type: 'tacOp', teamId, value: e.target.value })}
            className="mt-2 w-full min-w-0 rounded border border-rule bg-white px-2 py-1 text-sm"
          >
            <option value="">— secret tac op —</option>
            {team.archetypes.map((arch) => (
              <optgroup key={arch} label={arch}>
                {teamTacOps(team.archetypes)
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
        </>
      ) : (
        <p className="mt-2 border border-dashed border-rule px-2 py-1 text-center text-xs text-ink/40">
          Tac op hidden
        </p>
      )}

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
              {catalogue.map((c) => (
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

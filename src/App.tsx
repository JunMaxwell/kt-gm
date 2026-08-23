import { useEffect, useState } from 'react'

import {
  ARCHETYPES,
  ARCHETYPE_COLOR,
  type Archetype,
  CATALOGUE,
  CHEAT_SHEET,
  CRIT_OPS,
  type CritOpId,
  type OpKind,
  type Operative,
  SIDES,
  SIDE_COLOR,
  type SideId,
  TAC_OPS,
  TEAMS,
  type TacOp,
  blankOperative,
  slug,
  tacOp,
  teamTacOps,
  teamsWithArchetype,
} from './rules'
import {
  type Order,
  type SaveMeta,
  canMove,
  counteract,
  createRoom,
  currentTeamId,
  enemy,
  killGrade,
  kills,
  listSaves,
  loadSave,
  maxTeamsPerSide,
  objectiveCounts,
  orderCounts,
  pairEligible,
  pairTarget,
  readyCount,
  rotation,
  saveMatch,
  scores,
  sideOps,
  suggestedCrit,
  teamOps,
  teamsOf,
  thresholds,
  useGame,
  viewerUrl,
} from './state'

type Dispatch = ReturnType<typeof useGame>[1]
type Game = ReturnType<typeof useGame>[0]
type Net = ReturnType<typeof useGame>[2]

const SIDE_IDS = ['imperium', 'xenos'] as const
const ROW = 'grid grid-cols-[4.25rem_1fr_1fr] items-center gap-2'

/* ---------- shared bits ---------- */

const Btn = ({ on, ...p }: { on?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...p}
    className={`rounded px-2 py-1 text-sm tabular-nums transition-colors ${
      on ? 'bg-ink font-semibold text-white' : 'bg-black/5 text-ink hover:bg-black/12'
    } ${p.className ?? ''}`}
  />
)

/** Dark-chrome variant, for use inside the ink header bar. */
const DarkBtn = ({ on, ...p }: { on?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...p}
    className={`rounded px-2 py-1 text-sm tabular-nums transition-colors ${
      on ? 'bg-white font-semibold text-ink' : 'bg-white/12 text-white hover:bg-white/25'
    } ${p.className ?? ''}`}
  />
)

/**
 * Controlled input you can actually edit. The value it displays is owned by the
 * reducer, which clamps it — so a half-typed or empty field would otherwise be
 * rejected and snap back mid-keystroke. While focused we show the raw text and
 * push up whatever parses; blur drops the buffer and resyncs to real state.
 */
function BufferedInput({
  value,
  onEdit,
  dark,
  className = '',
  ...rest
}: {
  value: string
  onEdit: (raw: string) => void
  dark?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [buf, setBuf] = useState<string | null>(null)
  return (
    <input
      {...rest}
      value={buf ?? value}
      onChange={(e) => {
        setBuf(e.target.value)
        onEdit(e.target.value)
      }}
      onBlur={() => setBuf(null)}
      className={`rounded px-1 py-0.5 text-center text-xs tabular-nums ${
        dark ? 'bg-white/15 text-white' : 'border border-rule bg-white text-ink'
      } ${className}`}
    />
  )
}

/** Only dispatch when the text actually parses to an integer. */
const onInt = (fn: (n: number) => void) => (raw: string) => {
  const v = parseInt(raw, 10)
  if (Number.isFinite(v)) fn(v)
}

const Stepper = ({ value, onChange, max }: { value: number; onChange: (d: number) => void; max?: number }) => (
  <span className="inline-flex items-center gap-1">
    <Btn onClick={() => onChange(-1)} disabled={value <= 0} className="w-7 disabled:opacity-25">
      –
    </Btn>
    <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
    <Btn onClick={() => onChange(1)} disabled={max !== undefined && value >= max} className="w-7 disabled:opacity-25">
      +
    </Btn>
  </span>
)

/** White card with a coloured header band, as on the reference cards. */
function Card({
  band,
  ink,
  title,
  aside,
  children,
  className = '',
}: {
  band: string
  ink?: boolean
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-xl border bg-paper shadow-sm ${className}`}
      style={{ borderColor: band }}
    >
      <header
        className="flex items-center justify-between gap-2 px-3 py-1.5"
        style={{ background: band, color: ink ? '#282c34' : '#ffffff' }}
      >
        <h3 className="display truncate text-xl">{title}</h3>
        {aside}
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

/** Team identity as a filled pill — the only treatment that stays legible for the
 *  light bands (Deathwatch silver, XV26 white) against a white card. */
const TeamPill = ({
  team,
  className = '',
}: {
  team: (typeof TEAMS)[number]
  className?: string
}) => (
  <span
    className={`display rounded px-1.5 text-xs ${className}`}
    style={{ background: team.color, color: team.ink ? '#282c34' : '#fff' }}
    title={team.name}
  >
    {team.short}
  </span>
)

const Label = ({ children, ...p }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...p} className={`display text-xs text-ink/45 ${p.className ?? ''}`}>
    {children}
  </span>
)

/* ---------- header ---------- */

function TurnBar({
  game,
  dispatch,
  editing,
  setEditing,
  net,
}: {
  game: Game
  dispatch: Dispatch
  editing: boolean
  setEditing: (v: boolean) => void
  net: Net
}) {
  const critOp = CRIT_OPS.find((c) => c.id === game.critOp)

  return (
    <header className="sticky top-0 z-10 bg-ink px-4 py-3 text-white shadow-lg">
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
function SingleTurn({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
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
function PairedTurn({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
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

/* ---------- scoreboard ---------- */

function Scoreboard({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const s = { imperium: scores(game, 'imperium'), xenos: scores(game, 'xenos') }

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-paper shadow-sm">
      <header className="flex items-stretch bg-ink text-white">
        <span className="display grid w-[4.25rem] shrink-0 place-items-center px-3 text-xs text-white/50">Total</span>
        {SIDE_IDS.map((side) => (
          <div key={side} className="flex-1 py-1.5 text-center" style={{ background: SIDE_COLOR[side] }}>
            <p className="display text-sm">{SIDES[side]}</p>
            <p className="display text-3xl">{s[side].total}</p>
          </div>
        ))}
      </header>

      <div className="p-3">
        {/* Kill op */}
        <div className={ROW}>
          <span className="display text-base">Kill op</span>
          {SIDE_IDS.map((side) => (
            <p key={side} className="text-center text-sm">
              <span className="font-semibold tabular-nums">{s[side].kill} VP</span>
              <span className="text-ink/45"> · grade {killGrade(game, side)}</span>
            </p>
          ))}
        </div>
        <div className={ROW}>
          <span />
          {SIDE_IDS.map((side) => {
            const ladder = thresholds(game, side)
            const grade = killGrade(game, side)
            return (
              <div key={side} className="text-center">
                <p className="text-[10px] text-ink/45">
                  {kills(game, side)} of {sideOps(game, enemy(side)).length} down
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
                  aria-label={`${SIDES[side]} kill grade thresholds`}
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
          {SIDE_IDS.map((side) => (
            <p key={side} className="text-center text-sm font-semibold tabular-nums">
              {s[side].crit} VP
            </p>
          ))}
        </div>
        {game.crit.imperium.map((_, tp) => (
          <div key={tp} className={ROW}>
            <span
              className={`text-xs ${game.tp === tp + 1 ? 'font-semibold text-ink' : 'text-ink/45'} ${
                tp === 0 ? 'line-through decoration-ink/40' : ''
              }`}
              title={tp === 0 ? 'No crit op scores in the first turning point — its mission action is barred' : undefined}
            >
              TP {tp + 1}
            </span>
            {SIDE_IDS.map((side) => (
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
            <Label title="What the marker board is worth this turning point">markers</Label>
            {SIDE_IDS.map((side) => {
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
          {SIDE_IDS.map((side) => (
            <p key={side} className="text-center text-sm font-semibold tabular-nums">
              {s[side].tac} VP
              {s[side].tacRaw > s[side].tac && <span className="font-normal text-ink/40"> (raw {s[side].tacRaw})</span>}
            </p>
          ))}
        </div>
        {/* one row per rotation slot — the sides can hold different numbers of players */}
        {Array.from({ length: maxTeamsPerSide }, (_, i) => (
          <div key={i} className={ROW}>
            <span />
            {SIDE_IDS.map((side) => {
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
          {SIDE_IDS.map((side) => (
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
          {SIDE_IDS.map((side) => (
            <p key={side} className="text-center text-xs tabular-nums text-ink/60">
              +{s[side].bonus} VP
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- objectives ---------- */

function Objectives({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const counts = objectiveCounts(game)
  const cycle = (holder: SideId | null): SideId | null =>
    holder === null ? 'imperium' : holder === 'imperium' ? 'xenos' : null

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-paper shadow-sm">
      <header className="flex items-center justify-between bg-ink px-3 py-1.5 text-white">
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

/* ---------- activation order ---------- */

function ActivationOrder({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const seq = rotation(game)
  const currentId = currentTeamId(game)

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-paper shadow-sm">
      <header className="flex items-center justify-between bg-ink px-3 py-1.5 text-white">
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

/* ---------- ops cards ---------- */

function TacOpCard({ op, className = '', showTeams }: { op: TacOp; className?: string; showTeams?: boolean }) {
  const band = ARCHETYPE_COLOR[op.archetype]
  return (
    <div className={`overflow-hidden rounded-lg border bg-paper ${className}`} style={{ borderColor: band }}>
      <p className="display px-2 py-1 text-center text-sm text-white" style={{ background: band }}>
        {op.archetype}
      </p>
      <div className="p-2">
        <h5 className="opname border-b border-rule pb-1 text-center text-sm font-bold">{op.name}</h5>
        <p className="mt-1 text-xs text-ink/60">
          <Label>Reveal </Label>
          {op.reveal}
        </p>
        {op.select && (
          <p className="text-xs" style={{ color: ARCHETYPE_COLOR.Recon }}>
            <span className="display text-xs opacity-70">Nominate </span>
            {op.select}
          </p>
        )}
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {op.vp.map((v, i) => (
            <li key={i} className="text-xs text-ink/80">
              {v}
            </li>
          ))}
        </ul>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-ink/40">
          {op.cap && <span>max {op.cap}VP per TP</span>}
          {showTeams && (
            <span className="flex flex-wrap gap-1">
              {teamsWithArchetype(op.archetype).map((t) => (
                <TeamPill key={t.id} team={t} />
              ))}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

function OpsBrowser({ game }: { game: Game }) {
  const [arch, setArch] = useState<Archetype | 'all'>('all')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = TAC_OPS.filter(
    (o) =>
      (arch === 'all' || o.archetype === arch) &&
      (!needle || `${o.name} ${o.reveal} ${o.select ?? ''} ${o.vp.join(' ')}`.toLowerCase().includes(needle)),
  )
  const taken = new Map(TEAMS.filter((t) => game.teams[t.id].tacOp).map((t) => [game.teams[t.id].tacOp, t]))

  return (
    <details className="mx-4 mb-4 overflow-hidden rounded-xl border border-rule bg-paper shadow-sm">
      <summary className="display cursor-pointer bg-ink px-3 py-2 text-xl text-white">
        Crit ops &amp; tac ops ({CRIT_OPS.length + TAC_OPS.length} cards)
      </summary>

      <div className="p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CRIT_OPS.map((c) => {
            const live = game.critOp === c.id
            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-lg border bg-paper"
                style={{ borderColor: live ? '#f05c22' : 'var(--color-rule)' }}
              >
                <p
                  className="display flex items-center justify-between px-2 py-1 text-sm"
                  style={{ background: live ? '#f05c22' : '#282c34', color: '#fff' }}
                >
                  <span>Crit op {c.n}</span>
                  <span className="text-[10px] opacity-75">{live ? 'in play' : c.derive === 'holders' ? 'auto' : 'by hand'}</span>
                </p>
                <div className="p-2">
                  <h5 className="opname border-b border-rule pb-1 text-center text-sm font-bold">{c.name}</h5>
                  <p className="mt-1 text-xs font-bold" style={{ color: '#bd0003' }}>
                    {c.action}
                  </p>
                  <p className="text-xs text-ink/55">{c.actionText}</p>
                  {'extra' in c && <p className="mt-1 text-xs text-security">{c.extra}</p>}
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {c.vp.map((v, i) => (
                      <li key={i} className="text-xs text-ink/80">
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
          <Btn on={arch === 'all'} onClick={() => setArch('all')} className="display">
            All
          </Btn>
          {ARCHETYPES.map((a) => (
            <button
              key={a}
              onClick={() => setArch(a)}
              title={teamsWithArchetype(a)
                .map((t) => t.name)
                .join(', ')}
              className="display rounded px-2 py-1 text-sm"
              style={
                arch === a
                  ? { background: ARCHETYPE_COLOR[a], color: '#fff' }
                  : { background: 'rgba(0,0,0,.05)', color: ARCHETYPE_COLOR[a] }
              }
            >
              {a} ({teamsWithArchetype(a).length})
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search cards…"
            className="ml-auto w-40 rounded border border-rule bg-white px-2 py-1 text-sm"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((op) => {
            const owner = taken.get(op.name)
            return (
              <div key={op.name} className="relative">
                <TacOpCard op={op} showTeams className={owner ? 'ring-2 ring-ink' : ''} />
                {owner && <TeamPill team={owner} className="absolute -top-2 right-2 shadow" />}
              </div>
            )
          })}
          {!list.length && <p className="text-sm text-ink/40">Nothing matches that search.</p>}
        </div>
      </div>
    </details>
  )
}

/* ---------- roster ---------- */

function EditRow({ teamId, o, dispatch }: { teamId: string; o: Operative; dispatch: Dispatch }) {
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

function PlayRow({ o, game, dispatch }: { o: Operative; game: Game; dispatch: Dispatch }) {
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

function TeamCard({
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

/* ---------- rooms ---------- */

/**
 * The GM's share + save strip. Friends open the viewer link and watch; only this console
 * writes. Saving is explicit — the relay never touches Postgres.
 */
function RoomBar({ game, dispatch, net }: { game: Game; dispatch: Dispatch; net: Net }) {
  const { room, setRoom } = net
  const [saves, setSaves] = useState<SaveMeta[]>([])
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState('')

  // Only the saves list needs fetching; the room itself lives in localStorage.
  useEffect(() => {
    if (room?.token) listSaves(room).then(setSaves).catch(() => {})
  }, [room])

  const run = async (what: string, fn: () => Promise<unknown>) => {
    setBusy(what)
    try {
      await fn()
    } catch {
      setBusy('offline — the match is safe locally')
      return
    }
    setBusy('')
  }

  if (!room)
    return (
      <div className="mt-2 flex items-center gap-3">
        <DarkBtn
          className="display"
          onClick={() => run('opening', async () => setRoom(await createRoom()))}
          title="Create a room so friends can watch the scoreboard live from their own phones."
        >
          Share a room
        </DarkBtn>
        {busy && <span className="text-xs text-white/50">{busy}</span>}
      </div>
    )

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/50">
      <span className="display">Room</span>
      <code className="display rounded bg-white/15 px-2 py-1 text-lg tracking-[.2em] text-white">{room.code}</code>
      <DarkBtn className="display" onClick={() => navigator.clipboard?.writeText(viewerUrl(room.code))}>
        Copy viewer link
      </DarkBtn>

      <span className="ml-2 h-5 w-px bg-white/20" />

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="save as…"
        aria-label="Name for this saved match"
        className="w-36 rounded bg-white/15 px-2 py-1 text-sm text-white placeholder:text-white/40"
      />
      <DarkBtn
        className="display"
        onClick={() =>
          run('saving', async () => {
            await saveMatch(room, label || `TP${game.tp}`, game)
            setLabel('')
            setSaves(await listSaves(room))
          })
        }
      >
        Save match
      </DarkBtn>

      {saves.length > 0 && (
        <select
          defaultValue=""
          aria-label="Load a saved match"
          onChange={(e) => {
            const id = e.target.value
            e.target.value = ''
            if (id && confirm('Replace the current game with this save?'))
              run('loading', async () => dispatch({ type: 'replace', game: await loadSave(room, id) }))
          }}
          className="rounded bg-white/15 px-2 py-1 text-sm text-white"
        >
          <option value="">load a save…</option>
          {saves.map((s) => (
            <option key={s.id} value={s.id} className="text-ink">
              {s.label} · {new Date(s.saved_at).toLocaleString()}
            </option>
          ))}
        </select>
      )}

      {busy && <span>{busy}</span>}
    </div>
  )
}

/* ---------- page ---------- */

export default function App() {
  const [game, dispatch, net] = useGame()
  const [editing, setEditing] = useState(false)

  // Spectators get the real console, inert: no pointer, no keyboard, out of the a11y tree.
  // One attribute instead of threading `disabled` through 36 dispatch sites.
  if (net.viewer)
    return (
      <div className="min-h-screen">
        <p className="display sticky top-0 z-20 bg-amber-400 px-4 py-1.5 text-center text-sm text-ink">
          Watching room {net.room!.code} — live from the GM, read only
        </p>
        <div inert>
          <Console game={game} dispatch={dispatch} net={net} editing={false} setEditing={() => {}} />
        </div>
      </div>
    )

  return <Console game={game} dispatch={dispatch} net={net} editing={editing} setEditing={setEditing} />
}

function Console({
  game,
  dispatch,
  net,
  editing,
  setEditing,
}: {
  game: Game
  dispatch: Dispatch
  net: Net
  editing: boolean
  setEditing: (v: boolean) => void
}) {
  return (
    <div className="min-h-screen">
      <TurnBar game={game} dispatch={dispatch} editing={editing} setEditing={setEditing} net={net} />

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

      <OpsBrowser game={game} />

      <details className="mx-4 mb-8 overflow-hidden rounded-xl border border-rule bg-paper shadow-sm">
        <summary className="display cursor-pointer bg-ink px-3 py-2 text-xl text-white">Rules cheat sheet</summary>
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
    </div>
  )
}

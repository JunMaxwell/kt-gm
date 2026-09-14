import { useState } from 'react'

import {
  ARCHETYPES,
  type Archetype,
  CRIT_OPS,
  type CritOpId,
  DEFAULT_ROSTER,
  PRESET_TEAMS,
  type TeamDef,
  blankOperative,
  dropZone,
  presetRoster,
} from '../rules'
import { allTeams, teamOps, teamsOf } from '../state'
import { Btn, BufferedInput, Label } from './kit'
import { type Dispatch, type Game, onInt, onNum } from './shared'
import { TeamCard } from './TeamCard'

/* ---------- setup ----------
 * The match itself is data now, so this is where it gets built: who is fighting, in which
 * alliances, on what table, for how many VP. Everything here dispatches an ordinary action,
 * so the relay ships a half-built match to spectators exactly like a played one.
 *
 * It is reachable mid-match on purpose — players arrive late and teams get cut.
 */

const EDGE = ['top edge', 'bottom edge', 'left edge', 'right edge']

export function Setup({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const [add, setAdd] = useState('')
  const teams = allTeams(game)

  /** A new team, from a preset faction or blank. Ids are minted here — the reducer never
   *  invents one, so two teams of the same faction can never collide in `g.ops`. */
  const addTeam = (value: string) => {
    setAdd('')
    if (!value) return
    const tag = crypto.randomUUID().slice(0, 4)
    const side = game.sides[0].id
    const src = PRESET_TEAMS.find((t) => t.id === value)
    const team: TeamDef = src
      ? { ...src, id: `${src.id}-${tag}`, side, cp: 0, tacOp: '', tacVp: 0, player: 'New player' }
      : {
          id: `team-${tag}`,
          player: 'New player',
          name: 'New kill team',
          short: 'NEW',
          side,
          color: '#5f5f5f',
          archetypes: ['Seek & Destroy'],
          cp: 0,
          tacOp: '',
          tacVp: 0,
        }
    const roster = src ? presetRoster(src.id, team.id) : [blankOperative(team.id)]
    dispatch({ type: 'teamAdd', team, roster })
  }

  // What still stands between this and a playable match.
  const empty = teams.filter((t) => teamOps(game, t.id).length === 0)
  const bare = game.sides.filter((x) => teamsOf(game, x.id).length === 0)
  const blocked =
    game.sides.length < 2
      ? 'Add a second alliance — somebody has to be fought.'
      : bare.length
        ? `No teams in ${bare.map((x) => x.name).join(', ')}.`
        : empty.length
          ? `No operatives in ${empty.map((t) => t.name).join(', ')}.`
          : ''

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-white shadow-lg">
        <h1 className="display mr-2 text-2xl">Match setup</h1>
        <span className="display text-xs text-white/50">
          {game.sides.length} alliances · {teams.length} teams ·{' '}
          {teams.reduce((n, t) => n + teamOps(game, t.id).length, 0)} operatives
        </span>
        <span className="ml-auto flex items-center gap-2">
          {blocked && <span className="display text-xs text-amber-300">{blocked}</span>}
          <Btn
            className="display px-3 py-1 text-base"
            disabled={!!blocked}
            onClick={() => dispatch({ type: 'setup', value: false })}
          >
            Start match
          </Btn>
        </span>
      </header>

      <main className="grid gap-4 p-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Alliances">
            <p className="mb-2 text-xs text-ink/50">
              Order picks deployment: the first two take the long edges, a third and fourth the short ones.
            </p>
            {game.sides.map((x, i) => (
              <div key={x.id} className="mb-1.5 flex items-center gap-1.5">
                <input
                  type="color"
                  value={x.color}
                  onChange={(e) => dispatch({ type: 'sidePatch', id: x.id, patch: { color: e.target.value } })}
                  className="h-7 w-8 shrink-0 cursor-pointer rounded border border-rule bg-white"
                  aria-label={`${x.name} colour`}
                />
                <BufferedInput
                  className="min-w-0 flex-1"
                  value={x.name}
                  aria-label="Alliance name"
                  onEdit={(name) => dispatch({ type: 'sidePatch', id: x.id, patch: { name } })}
                />
                <span className="display shrink-0 text-[10px] text-ink/40">
                  {game.sides.length <= 4 ? EDGE[i] : 'strip'}
                </span>
                <Btn className="w-6 px-0" disabled={i === 0} onClick={() => dispatch({ type: 'sideMove', id: x.id, dir: -1 })}>
                  ↑
                </Btn>
                <Btn
                  className="w-6 px-0"
                  disabled={i === game.sides.length - 1}
                  onClick={() => dispatch({ type: 'sideMove', id: x.id, dir: 1 })}
                >
                  ↓
                </Btn>
                <Btn
                  className="w-6 px-0 text-xenos"
                  title="Remove this alliance and every team in it"
                  disabled={game.sides.length <= 1}
                  onClick={() =>
                    confirm(`Remove ${x.name} and its ${teamsOf(game, x.id).length} teams?`) &&
                    dispatch({ type: 'sideRemove', id: x.id })
                  }
                >
                  ×
                </Btn>
              </div>
            ))}
            <Btn className="mt-1" onClick={() => dispatch({ type: 'sideAdd' })}>
              + Add alliance
            </Btn>
          </Panel>

          <Panel title="Board">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Num label="Width" value={game.board.w} onEdit={(w) => dispatch({ type: 'board', patch: { w } })} />
              <Num label="Height" value={game.board.h} onEdit={(h) => dispatch({ type: 'board', patch: { h } })} />
              <Num label="Drop zone" value={game.board.drop} onEdit={(drop) => dispatch({ type: 'board', patch: { drop } })} />
              <span className="display text-xs text-ink/40">inches</span>
            </div>
            <svg viewBox={`0 0 ${game.board.w} ${game.board.h}`} className="mt-2 w-full border border-rule bg-white">
              {game.sides.map((x, i) => {
                const z = dropZone(game.board, i, game.sides.length)
                return <rect key={x.id} x={z.x} y={z.y} width={z.w} height={z.h} fill={x.color} fillOpacity={0.25} />
              })}
            </svg>
          </Panel>

          <Panel title="Scoring">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Num label="Turning points" value={game.tpCount} onEdit={(value) => dispatch({ type: 'tpCount', value })} int />
              <Num label="VP cap per op" value={game.opCap} onEdit={(value) => dispatch({ type: 'opCap', value })} int />
              <Num label="Crit VP per TP" value={game.critCap} onEdit={(value) => dispatch({ type: 'critCap', value })} int />
              <Num
                label="Objectives"
                value={game.objectives.length}
                onEdit={(value) => dispatch({ type: 'objectiveCount', value })}
                int
              />
              <Num
                label="CP — initiative"
                value={game.cpPerTp.lead}
                onEdit={(lead) => dispatch({ type: 'cpPerTp', patch: { lead } })}
                int
              />
              <Num
                label="CP — others"
                value={game.cpPerTp.other}
                onEdit={(other) => dispatch({ type: 'cpPerTp', patch: { other } })}
                int
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Label>Crit op</Label>
              <select
                value={game.critOp ?? ''}
                onChange={(e) => dispatch({ type: 'critOp', id: e.target.value as CritOpId })}
                className="min-w-0 flex-1 rounded border border-rule bg-white px-2 py-1 text-sm"
              >
                <option value="">— none chosen —</option>
                {CRIT_OPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.n}. {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Label>Activations</Label>
              <Btn on={game.paired} onClick={() => dispatch({ type: 'paired', value: true })}>
                Paired
              </Btn>
              <Btn on={!game.paired} onClick={() => dispatch({ type: 'paired', value: false })}>
                Single
              </Btn>
              <Label className="ml-2">Initiative</Label>
              {game.sides.map((x) => (
                <Btn key={x.id} on={game.initiative === x.id} onClick={() => dispatch({ type: 'initiative', side: x.id })}>
                  {x.name}
                </Btn>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Teams">
            <div className="mb-3 flex items-center gap-2">
              <select
                value={add}
                onChange={(e) => addTeam(e.target.value)}
                className="min-w-0 flex-1 rounded border border-rule bg-white px-2 py-1 text-sm"
              >
                <option value="">+ Add a kill team…</option>
                <optgroup label="Factions with datacards">
                  {PRESET_TEAMS.filter((t, i, a) => a.findIndex((x) => x.faction === t.faction) === i).map((t) => (
                    <option key={t.faction} value={t.id}>
                      {t.name} — {DEFAULT_ROSTER[t.id].length} operatives, cards and ploys
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Nothing built in">
                  <option value="__blank">Blank team — type the operatives in by hand</option>
                </optgroup>
              </select>
            </div>

            {game.sides.map((x) => (
              <div key={x.id} className="mb-3">
                <p className="display kt-rule mb-1.5 text-sm" style={{ color: x.color }}>
                  {x.name}
                </p>
                {teamsOf(game, x.id).map((t) => (
                  <TeamRow key={t.id} game={game} dispatch={dispatch} team={t} />
                ))}
                {!teamsOf(game, x.id).length && <p className="text-xs text-ink/40">No teams yet.</p>}
              </div>
            ))}
          </Panel>

          <Panel title="Rosters">
            <p className="mb-3 text-xs text-ink/50">
              Add, remove and restat operatives. A team built from a faction can be reset back to its datacard picks;
              one built by hand has nothing to go back to.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {teams.map((t) => (
                <TeamCard key={t.id} teamId={t.id} game={game} dispatch={dispatch} editing />
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  )
}

/** One team's identity. The roster lives in the panel below, via the existing `TeamCard`. */
function TeamRow({ game, dispatch, team }: { game: Game; dispatch: Dispatch; team: TeamDef }) {
  const patch = (p: Partial<TeamDef>) => dispatch({ type: 'teamPatch', teamId: team.id, patch: p })
  return (
    <div className="mb-1.5 border border-rule bg-white p-1.5">
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={team.color}
          onChange={(e) => patch({ color: e.target.value })}
          className="h-7 w-8 shrink-0 cursor-pointer rounded border border-rule bg-white"
          aria-label={`${team.name} colour`}
        />
        <BufferedInput className="min-w-0 flex-1" value={team.name} aria-label="Team name" onEdit={(name) => patch({ name })} />
        <BufferedInput
          className="w-16 shrink-0"
          value={team.short}
          aria-label="Short name"
          title="Short name, used on the pills and the board"
          onEdit={(short) => patch({ short })}
        />
        <select
          value={team.side}
          onChange={(e) => patch({ side: e.target.value })}
          className="min-w-0 shrink rounded border border-rule bg-white px-1 py-1 text-xs"
          aria-label="Alliance"
        >
          {game.sides.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <Btn
          className="w-6 shrink-0 px-0 text-xenos"
          title="Remove this team"
          onClick={() => confirm(`Remove ${team.name}?`) && dispatch({ type: 'teamRemove', teamId: team.id })}
        >
          ×
        </Btn>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <Label title="Its datacard's archetypes — these pick which tac ops it may take">tac ops</Label>
        {ARCHETYPES.map((a) => (
          <Btn
            key={a}
            on={team.archetypes.includes(a)}
            className="px-1.5 py-0 text-[11px]"
            onClick={() =>
              patch({
                archetypes: team.archetypes.includes(a)
                  ? team.archetypes.filter((x) => x !== a)
                  : [...team.archetypes, a as Archetype],
              })
            }
          >
            {a}
          </Btn>
        ))}
        <span className="display ml-auto text-[10px] text-ink/40">
          {teamOps(game, team.id).length} operatives
          {team.faction ? ` · ${team.faction} cards` : ' · no cards'}
        </span>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden border border-rule bg-paper shadow-sm">
      <header className="kt-rule bg-card px-3 py-1.5 text-white">
        <h2 className="display text-xl">{title}</h2>
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

function Num({
  label,
  value,
  onEdit,
  int,
}: {
  label: string
  value: number
  onEdit: (n: number) => void
  int?: boolean
}) {
  return (
    <label className="display flex items-center gap-1 text-xs text-ink/50">
      {label}
      <BufferedInput className="w-14" inputMode="numeric" aria-label={label} value={String(value)} onEdit={(int ? onInt : onNum)(onEdit)} />
    </label>
  )
}

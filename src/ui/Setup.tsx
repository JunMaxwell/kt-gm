import { useState } from 'react'

import {
  ARCHETYPES,
  type Archetype,
  CATALOGUE,
  CRIT_OPS,
  type CritOpId,
  DEFAULT_ROSTER,
  GEAR_LIMIT,
  type Operative,
  type OwnCard,
  STARTING_CP,
  type TeamDef,
  blankOperative,
  presetRoster,
  slug,
  tacOp,
  teamTacOps,
} from '../rules'
import { FACTIONS } from '../factions'
import { KIND_LABEL, type RefKind } from '../compendium'
import { type Stage, STEPS, allTeams, initialGame, teamOps, teamsOf } from '../state'
import { Btn, BufferedInput, DarkBtn, Label, TeamPill } from './kit'
import { type Dispatch, type Game, type Net, draftPool, onInt, useFaction } from './shared'
import { RoomBar } from './RoomBar'
import { Objectives } from './Objectives'
import { TacOpCard } from './TacOpCard'
import { TeamCard } from './TeamCard'

/* ---------- setup ----------
 * The match itself is data, so this is where it gets built: who is fighting, in which
 * alliances, on what table, for how many VP. Everything here dispatches an ordinary action,
 * so the relay ships a half-built match to spectators exactly like a played one.
 *
 * It is FOUR STEPS, one at a time, because five of seven players have never played and the
 * GM setting up in front of them should be answering one question at a time rather than
 * scanning four panels at once. Each step is self-contained; nothing overflows into the next.
 *
 * It stays reachable mid-match on purpose — players arrive late and teams get cut — which is
 * why every step also offers "To the match" once the gates pass. That needs no "is a match in
 * progress" concept: the button is simply there whenever the match is playable.
 */

const EDGE = ['top edge', 'bottom edge', 'left edge', 'right edge']

const STEP_LABEL: Record<string, string> = {
  alliances: 'Alliances',
  teams: 'Teams',
  config: 'Objectives',
  tacops: 'Tac ops',
}

export function Setup({ game, dispatch, net }: { game: Game; dispatch: Dispatch; net: Net }) {
  // `initialGame()` is stage `play`, and the escape hatch can land here from anywhere, so the
  // rendered step is clamped into the wizard's own range rather than trusted.
  const step: Stage = STEPS.includes(game.stage) ? game.stage : 'alliances'
  const at = STEPS.indexOf(step)
  const teams = allTeams(game)

  /** What still stands between this and a playable match, per step. The old single `blocked`
   *  ladder said all of it at once on one screen; each step now answers only for itself. */
  const empty = teams.filter((t) => teamOps(game, t.id).length === 0)
  const bare = game.sides.filter((x) => teamsOf(game, x.id).length === 0)
  const gate: Partial<Record<Stage, string>> = {
    alliances: game.sides.length < 2 ? 'Add a second alliance — somebody has to be fought.' : '',
    teams: bare.length
      ? `No teams in ${bare.map((x) => x.name).join(', ')}.`
      : empty.length
        ? `No operatives in ${empty.map((t) => t.name).join(', ')}.`
        : '',
  }
  const blocked = gate[step] ?? ''
  // The match is playable only when every step's gate passes, not just this one's.
  const playable = !STEPS.some((s) => gate[s])

  const go = (value: Stage) => dispatch({ type: 'stage', value })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-card px-4 py-3 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="display mr-2 text-2xl">Match setup</h1>

          {/* The rail. Every step is reachable directly — the GM is often here to fix one
              thing mid-match, not to walk the whole flow. */}
          <nav className="flex flex-wrap items-center gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => go(s)}
                className={`display rounded px-2.5 py-1 text-sm ${
                  s === step ? 'bg-amber-400 text-ink' : 'bg-white/12 text-white/60 hover:bg-white/25'
                }`}
              >
                <span className="tabular-nums opacity-60">{i + 1}</span> {STEP_LABEL[s]}
              </button>
            ))}
          </nav>

          <span className="display text-xs text-white/50">
            {game.sides.length} alliances · {teams.length} teams ·{' '}
            {teams.reduce((n, t) => n + teamOps(game, t.id).length, 0)} operatives
          </span>

          <span className="ml-auto flex items-center gap-2">
            {blocked && <span className="display text-xs text-amber-300">{blocked}</span>}
            <DarkBtn className="display px-3 py-1" disabled={at <= 0} onClick={() => go(STEPS[at - 1])}>
              ← Back
            </DarkBtn>
            {at < STEPS.length - 1 ? (
              <DarkBtn className="display px-3 py-1" disabled={!!blocked} onClick={() => go(STEPS[at + 1])}>
                Next →
              </DarkBtn>
            ) : (
              <DarkBtn className="display px-3 py-1 text-base" disabled={!playable} onClick={() => go('play')}>
                Start match
              </DarkBtn>
            )}
            {/* Always offered once the match holds together — this is the escape hatch's
                way home, and it needs no "already started" flag to know when to appear. */}
            {playable && at < STEPS.length - 1 && (
              <DarkBtn className="display px-3 py-1" onClick={() => go('play')} title="Back to the board">
                ▶ To the match
              </DarkBtn>
            )}
            <DarkBtn className="display px-3 py-1" onClick={() => go('rooms')} title="Rooms and saved games">
              Games
            </DarkBtn>
          </span>
        </div>

        {/* The room strip, the same one the board carries.
         *
         * It was missing here for as long as setup existed, and that was survivable only while
         * the players had nothing to do until the match began. It is not survivable now: the
         * draft happens DURING setup, so the viewer link is needed on the screen where the GM
         * is building the match, not one click past it. Getting it used to mean walking onto
         * the board — which is the very thing that used to close the draft.
         *
         * `Setup -> RoomBar` is the second panel-to-panel edge after `TurnBar -> RoomBar`, and
         * it is the same edge: `RoomBar` imports nothing but `state`, `kit` and `shared`, so it
         * is a leaf in everything but the table's labelling. */}
        <RoomBar game={game} dispatch={dispatch} net={net} />
      </header>

      <main className="p-4">
        {step === 'alliances' && <Alliances game={game} dispatch={dispatch} />}
        {step === 'teams' && <Teams game={game} dispatch={dispatch} />}
        {step === 'config' && <Config game={game} dispatch={dispatch} />}
        {step === 'tacops' && <TacOps game={game} dispatch={dispatch} />}
      </main>
    </div>
  )
}

/* ---------- step 1: alliances ---------- */

function Alliances({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const bare = !allTeams(game).length

  return (
    <div className="mx-auto max-w-3xl space-y-4">
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

      {/* Only while nothing has been built — offering to overwrite a half-built match is how
          you lose one. `replace` merges over `initialGame()` and clears undo, which is exactly
          right for "this is a new starting point". */}
      {bare && (
        <Panel title="Or start from the usual match">
          <p className="mb-2 text-xs text-ink/50">
            Imperium versus Xenos: seven kill teams, 53 operatives, rosters and cards already filled in.
            Everything stays editable afterwards.
          </p>
          <Btn
            onClick={() => dispatch({ type: 'replace', game: { ...initialGame(), stage: 'alliances' } })}
          >
            Load the usual match
          </Btn>
        </Panel>
      )}
    </div>
  )
}

/* ---------- step 2: teams ---------- */

function Teams({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const teams = allTeams(game)

  /** A new team, from a preset faction or blank. Ids are minted here — the reducer never
   *  invents one, so two teams of the same faction can never collide in `g.ops`. */
  const addTeam = (side: string, value: string) => {
    if (!value) return
    const tag = crypto.randomUUID().slice(0, 4)
    const f = FACTIONS.find((x) => x.id === value)
    const team: TeamDef = f
      ? {
          id: `${f.id}-${tag}`,
          player: 'New player',
          name: f.name,
          short: f.name.split(' ')[0].slice(0, 6),
          side,
          color: f.color,
          ink: f.ink,
          archetypes: [...f.archetypes],
          faction: f.id,
          cp: STARTING_CP,
          tacOp: '',
          tacVp: 0,
        }
      : {
          id: `team-${tag}`,
          player: 'New player',
          name: 'New kill team',
          short: 'NEW',
          side,
          color: '#5f5f5f',
          archetypes: ['Seek & Destroy'],
          cp: STARTING_CP,
          tacOp: '',
          tacVp: 0,
        }
    // Only the six bundled factions carry a default roster for this match. Everything else
    // starts empty and the GM picks from its datacards — there is no one legal composition.
    const roster = f && DEFAULT_ROSTER[f.id] ? presetRoster(f.id, team.id) : []
    // The draft limit is the team's own legal size, set once here so it cannot drift: the
    // player's picks BECOME the roster, so reading it back off `roster.length` later would
    // ratchet the limit down to whatever they last chose.
    dispatch({ type: 'teamAdd', team: { ...team, opLimit: roster.length }, roster })
  }

  return (
    <div className="space-y-4">
      {game.sides.map((x) => (
        <Panel key={x.id} title={x.name} band={x.color}>
          {/* One picker per alliance, so a team lands where the GM is looking. It used to be
              a single picker that always dropped into `sides[0]`. */}
          <select
            value=""
            aria-label={`Add a kill team to ${x.name}`}
            onChange={(e) => {
              addTeam(x.id, e.target.value)
              e.target.value = ''
            }}
            className="mb-3 w-full min-w-0 rounded border border-rule bg-white px-2 py-1 text-sm"
          >
            <option value="">+ Add a kill team to {x.name}…</option>
            <optgroup label="Ready rosters — operatives, cards and ploys already filled in">
              {FACTIONS.filter((f) => DEFAULT_ROSTER[f.id]).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {DEFAULT_ROSTER[f.id].length} operatives
                </option>
              ))}
            </optgroup>
            <optgroup label="Every other kill team — pick its operatives yourself">
              {FACTIONS.filter((f) => !DEFAULT_ROSTER[f.id]).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Nothing built in">
              <option value="__blank">Blank team — type the operatives in by hand</option>
            </optgroup>
          </select>

          {teamsOf(game, x.id).map((t) => (
            <TeamRow key={t.id} game={game} dispatch={dispatch} team={t} />
          ))}
          {!teamsOf(game, x.id).length && <p className="text-xs text-ink/40">No teams yet.</p>}
        </Panel>
      ))}

      <Panel title="Rosters">
        <p className="mb-3 text-xs text-ink/50">
          Add, remove and restat operatives. A team built from a faction can be reset back to its datacard picks;
          one built by hand has nothing to go back to.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {teams.map((t) => (
            <TeamCard key={t.id} teamId={t.id} game={game} dispatch={dispatch} editing reveal />
          ))}
        </div>
        {!teams.length && <p className="text-xs text-ink/40">No teams yet — add one above.</p>}
      </Panel>

      <Panel title="Player picks">
        <p className="mb-3 text-xs text-ink/50">
          What each player may choose on their own phone, and how much of it. Leave a team alone and its own roster
          is the list — they just tick which models they are fielding. Offer more than they can take and the choice
          becomes theirs.
          {!game.picks && <b className="text-flare"> The draft is closed; reopen it from the header.</b>}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {teams.map((t) => (
            <PlayerPicks key={t.id} game={game} dispatch={dispatch} team={t} />
          ))}
        </div>
        {!teams.length && <p className="text-xs text-ink/40">No teams yet — add one above.</p>}
      </Panel>
    </div>
  )
}

/* ---------- step 3: objectives, dials and cards ---------- */

function Config({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const [cardPick, setCardTeam] = useState('')
  const teams = allTeams(game)
  // Validated at render, not once at mount: a team can be deleted from the step before.
  const cardTeam = teams.some((t) => t.id === cardPick) ? cardPick : (teams[0]?.id ?? '')

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="space-y-4">
        {/* The live marker grid, so the count is set where the markers are shown rather than
            as a bare number two panels away. */}
        <Objectives game={game} dispatch={dispatch} />

        <Panel title="Scoring">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Num label="Turning points" value={game.tpCount} onEdit={(value) => dispatch({ type: 'tpCount', value })} />
            <Num label="VP cap per op" value={game.opCap} onEdit={(value) => dispatch({ type: 'opCap', value })} />
            <Num label="Crit VP per TP" value={game.critCap} onEdit={(value) => dispatch({ type: 'critCap', value })} />
            <Num
              label="CP — initiative"
              value={game.cpPerTp.lead}
              onEdit={(lead) => dispatch({ type: 'cpPerTp', patch: { lead } })}
            />
            <Num
              label="CP — others"
              value={game.cpPerTp.other}
              onEdit={(other) => dispatch({ type: 'cpPerTp', patch: { other } })}
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

      <Panel title="Cards">
        <p className="mb-3 text-xs text-ink/50">
          Rules you write yourself, shown to that team's players ahead of its faction deck. This is the only way
          to tell a player anything the app does not already know — a boss's statline and weapons included, since
          nothing else in the player view shows operative stats.
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-1">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setCardTeam(t.id)}
              className="display rounded px-2 py-1 text-sm"
              style={
                cardTeam === t.id
                  ? { background: t.color, color: t.ink ? '#282c34' : '#fff' }
                  : { background: 'rgba(0,0,0,.05)', color: '#282c34' }
              }
            >
              {t.name}
              {(game.teams[t.id].cards?.length ?? 0) > 0 && ` (${game.teams[t.id].cards!.length})`}
            </button>
          ))}
        </div>
        {cardTeam &&
          (game.teams[cardTeam].cards ?? []).map((c) => (
            <CardRow key={c.id} dispatch={dispatch} teamId={cardTeam} card={c} />
          ))}
        {cardTeam && !(game.teams[cardTeam].cards ?? []).length && (
          <p className="mb-2 text-xs text-ink/40">No cards yet.</p>
        )}
        {cardTeam ? (
          <Btn onClick={() => dispatch({ type: 'cardAdd', teamId: cardTeam, kind: 'faction' })}>+ Add card</Btn>
        ) : (
          <p className="text-xs text-ink/40">No teams yet.</p>
        )}
      </Panel>
    </div>
  )
}

/* ---------- step 4: tac ops ---------- */

/**
 * One picker per team, grouped by alliance. Its own step because a tac op is the one choice
 * every player makes for themselves, and burying it in a roster editor is how five first-time
 * players never learn they had one.
 *
 * Duplicates within a side are flagged, not blocked — tac ops are per *archetype*, so two
 * Deathwatch teams may legally take the same one, and the app has never enforced distinct picks.
 */
function TacOps({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  return (
    <div className="space-y-4">
      {game.sides.map((x) => {
        const mine = teamsOf(game, x.id)
        const count = new Map<string, number>()
        for (const t of mine) if (t.tacOp) count.set(t.tacOp, (count.get(t.tacOp) ?? 0) + 1)

        return (
          <Panel key={x.id} title={x.name} band={x.color}>
            <p className="mb-3 text-xs text-ink/50">
              A team may take one tac op from its own datacard's archetypes. It is secret — the players pick, the
              GM types it in. A side scores at most {game.opCap} VP from tac ops however many teams it has.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {mine.map((t) => {
                const picked = tacOp(t.tacOp)
                const options = teamTacOps(t.archetypes)
                return (
                  <div key={t.id} className="min-w-0 border border-rule bg-white p-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamPill team={t} className="min-w-0 truncate" />
                      <span className="truncate text-xs text-ink/45">{t.player}</span>
                    </div>
                    {options.length ? (
                      <select
                        value={t.tacOp}
                        aria-label={`${t.name} tac op`}
                        onChange={(e) => dispatch({ type: 'tacOp', teamId: t.id, value: e.target.value })}
                        className="mt-2 w-full min-w-0 rounded border border-rule bg-white px-2 py-1 text-sm"
                      >
                        <option value="">— not chosen —</option>
                        {t.archetypes.map((arch) => (
                          <optgroup key={arch} label={arch}>
                            {options
                              .filter((o) => o.archetype === arch)
                              .map((o) => (
                                <option key={o.name} value={o.name}>
                                  {o.name}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-2 text-xs text-ink/40">
                        No archetypes on this team, so no tac ops to pick. Give it one back in Teams.
                      </p>
                    )}
                    {picked && (count.get(picked.name) ?? 0) > 1 && (
                      <p className="mt-1 text-[11px] text-recon">
                        Also taken by another team on this side — legal, but they cannot both score it twice over.
                      </p>
                    )}
                    {picked && <TacOpCard op={picked} className="mt-2" />}
                  </div>
                )
              })}
              {!mine.length && <p className="text-xs text-ink/40">No teams in this alliance.</p>}
            </div>
          </Panel>
        )
      })}
    </div>
  )
}

/* ---------- shared bits ---------- */

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
          title="Short name, used on the scoreboard pills"
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

/**
 * One team's draft settings: the pool its player chooses from, and the two limits.
 *
 * The pool seeds from the team's current roster the first time the GM touches it, so the default
 * — do nothing — means "the list I already built, tick what you are fielding". `pool` is written
 * only on the first edit, which is also why `TeamDef.pool` is optional rather than mirrored on
 * every team: a match nobody curates carries no extra bytes through the relay.
 *
 * Candidates come from the same place `TeamCard`'s add-select does, and ids are minted the same
 * way, because a pool entry and a roster entry are the same kind of thing — that is what lets a
 * re-picked operative keep its wound track.
 */
function PlayerPicks({ game, dispatch, team }: { game: Game; dispatch: Dispatch; team: TeamDef }) {
  const faction = useFaction(team.faction)
  const catalogue = CATALOGUE[team.faction ?? ''] ?? faction?.operatives ?? []
  const roster = teamOps(game, team.id)
  // Same three tiers the player's phone sees, so the GM is never curating a different list.
  const pool = draftPool(team, faction, roster)
  const patch = (p: Partial<TeamDef>) => dispatch({ type: 'teamPatch', teamId: team.id, patch: p })

  const add = (value: string) => {
    if (!value) return
    const src = catalogue.find((c) => c.id === value)
    const op: Operative = src
      ? { ...src, id: `${team.id}-${slug(src.name)}-${crypto.randomUUID().slice(0, 4)}` }
      : blankOperative(team.id)
    patch({ pool: [...pool, op] })
  }

  return (
    <div className="border border-rule bg-wash/40 p-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <TeamPill team={team} />
        {team.claimed ? (
          <>
            <span className="text-xs text-ink/55">claimed by {team.player}</span>
            {/* The escape hatch: a player claims the wrong team and their phone then dies, and
                nothing else in the app can unstick it. */}
            <Btn onClick={() => dispatch({ type: 'claim', teamId: team.id, name: '' })}>Release</Btn>
          </>
        ) : (
          <span className="text-xs text-ink/40">unclaimed</span>
        )}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        {/* `||`, not `??`: a team added from the library has no roster, so `teamAdd` set its
            limit to 0 — which as a limit means "pick nothing" and is never what anyone wants. */}
        <Num label="Pick" value={team.opLimit || pool.length} onEdit={(n) => patch({ opLimit: Math.max(0, n) })} />
        <Num label="Gear" value={team.gearLimit ?? GEAR_LIMIT} onEdit={(n) => patch({ gearLimit: Math.max(0, n) })} />
        <span className="text-xs text-ink/40">of {pool.length} offered</span>
      </div>

      <ul className="mb-2 space-y-0.5">
        {pool.map((o) => (
          <li key={o.id} className="flex items-center gap-2 text-xs">
            <span className="min-w-0 flex-1 truncate">{o.name}</span>
            <span className="shrink-0 tabular-nums text-ink/40">{o.w}W</span>
            <button
              onClick={() => patch({ pool: pool.filter((x) => x.id !== o.id) })}
              aria-label={`Remove ${o.name} from the pool`}
              className="shrink-0 rounded px-1 text-xenos hover:bg-black/10"
            >
              ×
            </button>
          </li>
        ))}
        {!pool.length && (
          <li className="text-xs text-ink/40">Nothing to offer — this team has no roster and no datacards.</li>
        )}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value=""
          onChange={(e) => add(e.target.value)}
          className="min-w-0 flex-1 border border-rule bg-paper px-1 py-0.5 text-xs"
        >
          <option value="">+ offer another operative…</option>
          <optgroup label="Datacards">
            {catalogue.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.apl}AP {c.move} {c.save} {c.w}W
              </option>
            ))}
          </optgroup>
          <option value="__custom">Blank operative</option>
        </select>
        {team.pool && <Btn onClick={() => patch({ pool: undefined })}>Use roster</Btn>}
      </div>
    </div>
  )
}

function Panel({ title, band, children }: { title: string; band?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden border border-rule bg-paper shadow-sm">
      <header className="kt-rule bg-card px-3 py-1.5 text-white">
        <h2 className="display text-xl" style={band ? { color: band } : undefined}>
          {title}
        </h2>
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

function Num({
  label,
  value,
  onEdit,
}: {
  label: string
  value: number
  onEdit: (n: number) => void
}) {
  return (
    <label className="display flex items-center gap-1 text-xs text-ink/50">
      {label}
      <BufferedInput className="w-14" inputMode="numeric" aria-label={label} value={String(value)} onEdit={onInt(onEdit)} />
    </label>
  )
}

/** One GM-authored card. The body is a plain textarea — `BufferedInput` exists to make a
 *  reducer-clamped *number* editable, and its centred tabular styling is wrong for prose. */
function CardRow({ dispatch, teamId, card }: { dispatch: Dispatch; teamId: string; card: OwnCard }) {
  const patch = (p: Partial<Omit<OwnCard, 'id'>>) => dispatch({ type: 'cardPatch', teamId, cardId: card.id, patch: p })
  return (
    <div className="mb-2 border border-rule bg-white p-1.5">
      <div className="flex items-center gap-1.5">
        <select
          value={card.kind}
          onChange={(e) => patch({ kind: e.target.value as RefKind })}
          className="shrink-0 rounded border border-rule bg-white px-1 py-1 text-xs"
          aria-label="Card kind"
        >
          {(Object.keys(KIND_LABEL) as RefKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <BufferedInput
          className="min-w-0 flex-1 text-left"
          value={card.name}
          aria-label="Card name"
          onEdit={(name) => patch({ name })}
        />
        <Btn
          className="w-6 shrink-0 px-0 text-xenos"
          title="Remove this card"
          onClick={() => confirm(`Remove ${card.name}?`) && dispatch({ type: 'cardRemove', teamId, cardId: card.id })}
        >
          ×
        </Btn>
      </div>
      <textarea
        value={card.text}
        onChange={(e) => patch({ text: e.target.value })}
        rows={4}
        aria-label="Card text"
        placeholder="Rules text. Blank lines separate paragraphs; ALL-CAPS words are highlighted, as on the printed cards."
        className="mt-1 w-full rounded border border-rule bg-white px-2 py-1 text-xs leading-relaxed"
      />
    </div>
  )
}

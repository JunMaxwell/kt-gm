import { useState } from 'react'

import { CHEAT_SHEET } from './rules'
import { phaseMeta } from './compendium'
import { allTeams, scores, teamsOf, useGame } from './state'
import { type Dispatch, type Game, type Net, meInUrl, ployEffect, setMeInUrl, teamInUrl, usePrefetchFactions } from './ui/shared'
import { ActivationOrder } from './ui/ActivationOrder'
import { Compendium, CompendiumBrowser } from './ui/Compendium'
import { EffectList } from './ui/Effects'
import { Draft } from './ui/Draft'
import { EndScreen } from './ui/EndScreen'
import { Glossary } from './ui/Glossary'
import { Launcher } from './ui/Launcher'
import { Objectives } from './ui/Objectives'
import { OpsBrowser } from './ui/OpsBrowser'
import { Scoreboard } from './ui/Scoreboard'
import { Setup } from './ui/Setup'
import { TeamPicker } from './ui/TeamPicker'
import { TeamCard } from './ui/TeamCard'
import { TurnBar } from './ui/TurnBar'

/* ---------- page ---------- */

const ME_KEY = 'killteam-gm/me' // which team this device is playing; never part of `Game`

/**
 * The spectator's phone. Five of seven players watch on one of these, so the console's three
 * columns are the wrong shape — they get their own cards and nothing else.
 *
 * Read-only is structural, not a flag: `Compendium` takes no `dispatch` and so is incapable of
 * writing. A stray tap could not do damage anyway — the server rejects writes without the token,
 * and the next relay message overwrites any local divergence.
 *
 * The draft is the one exception, and it is a narrow one. `TeamPicker` and `Draft` take `net.ask`
 * — not `dispatch` — and between them may send three team-scoped requests the GM's client
 * validates and runs. The card deck still cannot write anything at all, so the bar for adding
 * something to THAT view is unchanged: it has to work with no write prop.
 */
function Viewer({ game, net, onGlossary }: { game: Game; net: Net; onGlossary: () => void }) {
  const teams = allTeams(game)
  // `?me=dw2` beside the room hash is the link a GM sends one player: it opens on their own
  // cards instead of the picker, which is the difference between "here is the room" and "here
  // is your kill team". It wins over the stored pick, and `pick` rewrites it so tapping
  // "Change" is not undone by the next reload.
  const [saved, setSaved] = useState(() => meInUrl() || (localStorage.getItem(ME_KEY) ?? ''))
  const [picking, setPicking] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [lost, setLost] = useState(false)
  // Checked every render: the GM can delete a team in setup, and the relay will ship that
  // snapshot straight to this phone. A stale pick falls back to NOTHING, not to the first team —
  // a silent default is how a first-time player reads someone else's cards for a whole match.
  const me = teams.some((t) => t.id === saved) ? saved : ''
  const ph = phaseMeta(game.phase)

  const pick = (id: string) => {
    setSaved(id)
    localStorage.setItem(ME_KEY, id)
    setMeInUrl(id)
    setPicking(false)
  }

  // Claiming is picking PLUS telling the table. It releases whatever this phone held before in
  // the same action, so a player who changes their mind never leaves a team locked behind them.
  const claim = (id: string, name: string) => {
    net.ask({ type: 'claim', teamId: id, name, from: me && me !== id ? me : undefined })
    if (!name) return // a release: they keep reading the team, they just no longer hold it
    pick(id)
    setDrafting(game.picks)
  }

  // Only offered where there is a socket to ask over. Without a room this screen is the old
  // read-only reader and there is nobody to hear a claim.
  const canAsk = !!net.room

  // Nothing chosen yet, or they tapped the band to change it. The picker IS the screen, the way
  // `Setup` is for the GM — no overlay, because what sits behind it is the deck they may be
  // reading by mistake. Without `onClose` it cannot be dismissed, which is the first-run case.
  if (!me || picking)
    return (
      <TeamPicker
        game={game}
        me={me}
        code={net.room?.code}
        onPick={pick}
        onClaim={canAsk ? claim : undefined}
        onClose={me ? () => setPicking(false) : undefined}
      />
    )

  const team = game.teams[me]

  // The draft closes itself when the GM starts the match, so a phone left on this screen does
  // not sit there editing a list nobody will accept. `picks` rides the snapshot, so that
  // happens on its own the moment the GM taps through.
  if (drafting && game.picks)
    return <Draft game={game} teamId={me} ask={net.ask} onClose={() => setDrafting(false)} />

  // The shell owns the viewport and only the active tab scrolls, so the phase banner and the
  // deck chips never leave the screen. A player should be reading, not hunting.
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <div className="shrink-0 bg-card text-white">
        {/* Who you are, in your own team's colour, filling the top edge — the same way a team's
            colour identifies it everywhere else. It is also the button back to the picker; the
            old control was an unlabelled `select` in the corner that nobody found. */}
        <button
          onClick={() => setPicking(true)}
          className="kt-band flex w-full items-baseline gap-2 px-3 pt-1.5 pb-3 text-left"
          style={{ background: team.color, color: team.ink ? '#282c34' : '#fff' }}
        >
          <b className="display min-w-0 flex-1 truncate text-lg">{team.name}</b>
          <span className="shrink-0 truncate text-[10px] opacity-70">
            {team.player} · {net.room!.code}
            {!game.picks && ' · read only'}
          </span>
          <span className="display shrink-0 rounded bg-black/20 px-2 py-0.5 text-[10px]">Change</span>
        </button>

        <div className="flex items-baseline gap-x-2 px-3 pt-1.5">
          <b className="display text-2xl text-amber-300">{ph.label}</b>
          <span className="display text-xs text-white/55">
            TP{game.tp}/{game.tpCount} · {team.cp} CP
          </span>
          <span className="display ml-auto flex shrink-0 gap-1 text-xs">
            {game.sides.map((x) => (
              <span key={x.id} style={{ color: x.color }}>
                {x.name.slice(0, 3).toUpperCase()} {scores(game, x.id).total}
              </span>
            ))}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 pt-0.5 pb-2">
          <p className="min-w-0 flex-1 truncate text-[11px] text-white/45">{ph.hint}</p>
          {/* Gone entirely once the GM closes the draft, rather than sitting there disabled:
              a control you cannot use is a question you have to ask someone. */}
          {canAsk && game.picks && (
            <button
              onClick={() => setDrafting(true)}
              className="display shrink-0 rounded bg-white/12 px-2 py-0.5 text-[10px] text-white/80"
            >
              My list
            </button>
          )}
          {/* Their own deck is the screen; every OTHER kill team lives one tap away. */}
          <button onClick={onGlossary} className="display shrink-0 rounded bg-white/12 px-2 py-0.5 text-[10px] text-white/80">
            All teams
          </button>
        </div>
      </div>

      {/* What is running on this team, said once at the top rather than hunted for card by
          card. A player needs to know a ploy is up while reading a different deck entirely. */}
      {!!game.effects.length && (
        <div className="shrink-0 border-b border-rule bg-paper px-2 py-1">
          <EffectList game={game} teamId={me} />
        </div>
      )}

      {/* An ask into a shut socket is silent, and the GM's browser is the only reducer there is,
          so a ploy that went nowhere has to say so rather than look spent. */}
      {lost && (
        <p className="shrink-0 bg-xenos px-2 py-1 text-center text-[11px] text-white">
          Could not reach the GM — that ploy was not used. Is the console open?
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col p-2">
        {/* Tapping a ploy uses it outright: the card's own effect, its text, and the CP, with the
            card's two-tap confirm as the only step in between. No form on a phone. */}
        <Compendium
          game={game}
          teamId={me}
          onPloy={canAsk ? (card) => setLost(!net.ask(ployEffect(team.faction, card, me))) : undefined}
        />
      </div>
    </div>
  )
}

/**
 * One reference drawer instead of three stacked collapsibles. Ops, ploys, the activation
 * order and the cheat sheet used to sit under `<main>` as separate `<details>`, so reaching
 * any of them meant scrolling past every roster. One panel, one tab row, closed by default.
 */
function Reference({ game, dispatch, reveal }: { game: Game; dispatch: Dispatch; reveal: boolean }) {
  const [tab, setTab] = useState<'ops' | 'cards' | 'order' | 'cheat' | null>(null)
  const tabs = [
    ['ops', 'Crit & tac ops'],
    ['cards', 'Ploys & equipment'],
    ['order', 'Activation order'],
    ['cheat', 'Cheat sheet'],
  ] as const

  return (
    <section className="mx-4 mb-8 overflow-hidden border border-rule bg-paper shadow-sm">
      <nav className="flex flex-wrap items-stretch kt-rule bg-card">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(tab === id ? null : id)}
            className={`display px-3.5 py-2 text-lg ${tab === id ? 'text-flare' : 'text-white/55 hover:text-white/85'}`}
          >
            {label}
          </button>
        ))}
        {tab && (
          <button onClick={() => setTab(null)} className="display ml-auto px-3.5 py-2 text-xs text-white/35">
            close
          </button>
        )}
      </nav>
      {tab === 'ops' && <OpsBrowser game={game} reveal={reveal} />}
      {tab === 'cards' && <CompendiumBrowser game={game} dispatch={dispatch} />}
      {tab === 'order' && <ActivationOrder game={game} dispatch={dispatch} />}
      {tab === 'cheat' && (
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
      )}
    </section>
  )
}

export default function App() {
  const [game, dispatch, net, canUndo] = useGame()
  const [editing, setEditing] = useState(false)
  // `?team=dw` opens straight onto that pack — the link a GM sends a player who only needs
  // their own kill team's cards. It sits beside a room hash rather than replacing it.
  const [lib, setLib] = useState(() => !!teamInUrl())
  // Fetch the chunk for every faction on the table up front. The app is meant to survive a
  // venue with no wifi, so a match set up beforehand must not need the network to be read.
  usePrefetchFactions(allTeams(game).map((t) => t.faction))

  // One stage cursor, five GM views. A spectator wins over all of them — `Viewer` is the
  // whole player experience and never sees a wizard, an end screen or a room list.
  // Device state, not a stage: a spectator's is overwritten by every relay snapshot, and a
  // shared one would drag all seven phones into the library at once. It wins over everything
  // else so a player can reach it too.
  if (lib) return <Glossary game={game} onClose={() => setLib(false)} />
  if (net.viewer) return <Viewer game={game} net={net} onGlossary={() => setLib(true)} />
  if (game.stage === 'rooms')
    return <Launcher game={game} dispatch={dispatch} net={net} onGlossary={() => setLib(true)} />
  if (game.stage === 'end') return <EndScreen game={game} dispatch={dispatch} net={net} />
  if (game.stage !== 'play') return <Setup game={game} dispatch={dispatch} net={net} />

  return (
    <Console
      game={game}
      dispatch={dispatch}
      net={net}
      editing={editing}
      setEditing={setEditing}
      canUndo={canUndo}
      onGlossary={() => setLib(true)}
    />
  )
}

function Console({
  game,
  dispatch,
  net,
  editing,
  setEditing,
  canUndo,
  onGlossary,
}: {
  game: Game
  dispatch: Dispatch
  net: Net
  editing: boolean
  setEditing: (v: boolean) => void
  canUndo: boolean
  onGlossary: () => void
}) {
  // A tac op is secret, and the GM's screen is the one everyone at the table can see. Hidden
  // by default, revealed with one button. Device state, never `Game`: the relay would ship a
  // reveal to all seven phones, and the players already see their own op on theirs.
  const [reveal, setReveal] = useState(false)

  return (
    <div className="min-h-screen">
      <TurnBar
        game={game}
        dispatch={dispatch}
        editing={editing}
        setEditing={setEditing}
        net={net}
        canUndo={canUndo}
        onGlossary={onGlossary}
        reveal={reveal}
        setReveal={setReveal}
      />

      {/*
        The command strip: everything the GM watches, full width, above the rosters. The old
        layout put these in a FIXED 26rem centre column with team columns either side, which
        is what crowded at three alliances — 416px of the 1280 went to the strip no matter
        what, leaving ~261px per team column. Nothing here is a fixed track any more.
      */}
      <div className="grid gap-4 p-4 pb-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <Scoreboard game={game} dispatch={dispatch} />
        <Objectives game={game} dispatch={dispatch} />
      </div>

      {/*
        One column per alliance, full width. Cards collapse themselves — see TeamCard.
        The track list is a CSS VARIABLE, not an inline `grid-template-columns`: an inline
        style cannot be gated by `xl:`, so it would force three ~110px columns onto a phone.
        One column on a phone, two from `md`, one per alliance from `xl`.
      */}
      <main
        className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-(--kt-cols)"
        style={{ '--kt-cols': `repeat(${Math.min(game.sides.length, 3)}, minmax(0,1fr))` } as React.CSSProperties}
      >
        {game.sides.map((side) => (
          <div key={side.id} className="flex min-w-0 flex-col gap-2">
            <p className="display kt-rule px-1 pb-0.5 text-sm" style={{ color: side.color }}>
              {side.name}
              {side.id === game.sideTurn && <span className="text-ink/45"> · activating</span>}
            </p>
            {teamsOf(game, side.id).map((t) => (
              <TeamCard key={t.id} teamId={t.id} game={game} dispatch={dispatch} editing={editing} reveal={reveal} />
            ))}
          </div>
        ))}
      </main>

      <Reference game={game} dispatch={dispatch} reveal={reveal} />

      <footer className="mx-4 mb-8 text-center text-xs leading-relaxed text-ink/45">
        Card styling after the official Kill Team rules cards; side and archetype colours after{' '}
        <a className="underline" href="https://github.com/tiltos/kill-team-critical-ops" target="_blank" rel="noreferrer">
          tiltos/kill-team-critical-ops
        </a>
        .<br />
        Kill Team is a trademark of Games Workshop. Unofficial fan tool for one homebrew match.
      </footer>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

import { UNIVERSAL_EQUIPMENT, cardsOfKind } from '../compendium'
import { datacardOf } from '../factions'
import { GEAR_LIMIT, type Operative } from '../rules'
import { teamOps } from '../state'
import { Btn, DarkBtn } from './kit'
import { Carousel, SLIDE_CARD } from './Carousel'
import { OperativeCard, RefCardView } from './cards'
import { type Game, draftPool, useFaction } from './shared'

type Tab = 'ops' | 'faction' | 'universal'

const TAB_LABEL: Record<Tab, string> = { ops: 'Operatives', faction: 'Faction gear', universal: 'Universal gear' }

/**
 * The player's list, built on their own phone.
 *
 * This is the only writable screen in the spectator half of the app, and it writes the way the
 * whole design allows: it takes an `ask` — not a `dispatch` — and may send exactly two of the
 * three whitelisted requests. `Compendium` next door still takes no write prop at all, so the
 * read-only bar the card deck sets is unchanged; this screen clears a different, deliberate one.
 *
 * **It is the same carousel the deck is, showing the same full cards** — the whole datacard for
 * an operative, the printed rules for a piece of equipment. A first cut listed them as one-line
 * rows reading `2AP · 6" · 5+ · 10W`, which is enough to identify a model you already know and
 * useless for choosing between two you do not. Five of seven players here have never played, so
 * the weapons, the abilities and the unique actions are the whole basis for the choice.
 *
 * Tabs rather than stacked sections, for the same reason the deck has a bottom bar: a phone fits
 * exactly one full card, and the counts still have to be visible at once. They live in the tab
 * labels, and an empty deck is not offered at all.
 *
 * **Faction and universal equipment are separate tabs sharing one budget.** They are different
 * things — four cards written for this kill team, and ten every team in the game can take — and
 * running them together buried the team's own gear among ladders and barricades, which is the
 * exact complaint that got universal equipment removed from the player's deck in the first place.
 * The limit is still one number across both, because that is the rule.
 */
export function Draft({
  game,
  teamId,
  ask,
  onClose,
}: {
  game: Game
  teamId: string
  /** Returns false when the socket is shut. The caller cannot fix that; this screen says so. */
  ask: (
    a: { type: 'setRoster'; teamId: string; ops: Operative[] } | { type: 'gear'; teamId: string; names: string[] },
  ) => boolean
  onClose: () => void
}) {
  const team = game.teams[teamId]
  const faction = useFaction(team?.faction)

  // GM's pool, else the roster, else the whole faction. See `draftPool`.
  const pool = team ? draftPool(team, faction, teamOps(game, teamId)) : []
  // Capped at what is actually offered: a limit above the pool can never be reached, and a
  // counter reading 11/20 just looks broken.
  const opLimit = Math.min(team?.opLimit || pool.length, pool.length)
  const gearLimit = team?.gearLimit ?? GEAR_LIMIT

  // The team's own gear: its faction's four, plus anything the GM wrote for it. Universal
  // equipment is the other tab — the ten cards in the core rules that belong to everybody.
  const ownGear = [...cardsOfKind(team?.cards ?? [], 'equipment'), ...cardsOfKind(faction?.cards ?? [], 'equipment')]
  const deckOf = (t: Tab) => (t === 'universal' ? UNIVERSAL_EQUIPMENT : ownGear)

  // An empty deck is a dead end, and landing on one reads as a broken screen — the player's own
  // card deck hides empty tabs for the same reason. Universal gear is always there, so this can
  // never come back empty.
  const tabs = ([['ops', pool.length], ['faction', ownGear.length], ['universal', 1]] as const)
    .filter(([, size]) => size > 0)
    .map(([t]) => t as Tab)
  const [want, setTab] = useState<Tab>('ops')
  const tab = tabs.includes(want) ? want : tabs[0]
  const [at, setAt] = useState(0)
  // Opens on the team's current roster — "here is your kill team, drop what you do not want",
  // which is the whole job when the GM has not curated anything. Truncated to the limit, because
  // a GM who lowers it below the roster would otherwise hand the player a list that is already
  // illegal and can only be removed from. Roster order, so a leader survives the cut.
  const [ops, setOps] = useState<string[]>(() =>
    teamOps(game, teamId)
      .map((o) => o.id)
      .slice(0, team?.opLimit || undefined),
  )
  const [gear, setGear] = useState<string[]>(() => team?.gear ?? [])
  const [full, setFull] = useState(false) // flash the counter rather than open a dialog
  const [sent, setSent] = useState<'' | 'sending' | 'lost'>('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // The ask went to the GM, who applies it and broadcasts the result back as an ordinary
  // snapshot — so the confirmation is the game state changing under us, not an HTTP 200.
  // Nothing comes back at all if the GM's tab is shut, which is exactly the case worth
  // reporting: without it the player taps Save and the screen simply sits there.
  //
  // Derived, not an effect: "did it land" is a question about the props we were just handed.
  // Landing beats the timeout, so a slow GM shows `Saved` rather than a stale error — the timer
  // only ever has to move us off `sending`, never to be right about what happened after.
  const landed =
    teamOps(game, teamId)
      .map((o) => o.id)
      .join() === ops.join() && (team?.gear ?? []).join() === gear.join()
  const status = landed && sent !== '' ? 'ok' : sent
  useEffect(() => () => clearTimeout(timer.current), [])

  const onOps = tab === 'ops'
  const chosen = onOps ? ops : gear
  const limit = onOps ? opLimit : gearLimit
  // One budget across both gear tabs, so `chosen` is the whole `gear` list on either of them.
  const keys = onOps ? pool.map((o) => o.id) : deckOf(tab).map((c) => c.name)
  const here = keys[Math.min(at, keys.length - 1)]
  const holding = chosen.includes(here)

  const toggle = () => {
    if (!here) return
    setSent('')
    const set = onOps ? setOps : setGear
    if (holding) return set(chosen.filter((x) => x !== here))
    if (chosen.length >= limit) {
      setFull(true)
      return setTimeout(() => setFull(false), 700)
    }
    set([...chosen, here])
  }

  const submit = () => {
    const picked = pool.filter((o) => ops.includes(o.id))
    const reached = ask({ type: 'setRoster', teamId, ops: picked }) && ask({ type: 'gear', teamId, names: gear })
    if (!reached) return setSent('lost')
    setSent('sending')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSent('lost'), 4000)
  }

  if (!team) return null

  const slides = onOps
    ? pool.map((o) => (
        <OperativeCard
          key={o.id}
          o={o}
          // A pool operative the player has not taken is not in `g.ops` and has no live state.
          // `OperativeCard` then prints the datacard's own wounds and no order chip, which is
          // exactly right for a model that is not on the table yet.
          st={game.ops[o.id]}
          card={datacardOf(faction, o.name)}
          kicker={team.name}
          className={SLIDE_CARD}
        />
      ))
    : deckOf(tab).map((c) => (
        <RefCardView
          key={c.name}
          card={c}
          kicker={tab === 'universal' ? 'Universal' : team.name}
          className={SLIDE_CARD}
        />
      ))

  /** How many of THIS deck are in the list. The shared gear budget lives in the subtitle. */
  const taken = (t: Tab) =>
    t === 'ops' ? ops.length : deckOf(t).filter((c) => gear.includes(c.name)).length

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-wash">
      <header
        className="flex shrink-0 items-center gap-3 px-4 py-3 shadow-lg"
        style={{ background: team.color, color: team.ink ? '#282c34' : '#fff' }}
      >
        <div className="min-w-0">
          <h1 className="display truncate text-xl">{team.name}</h1>
          <p className="truncate text-[11px] opacity-60">
            {onOps
              ? `Your list — pick ${opLimit}, each operative once.`
              : `Gear — ${gear.length} of ${gearLimit}${tabs.includes('faction') ? ' across both tabs' : ''}.`}
          </p>
        </div>
        <DarkBtn onClick={onClose} className="display ml-auto shrink-0">
          Back
        </DarkBtn>
      </header>

      {/* Keyed by tab: remounting resets the rail to card 1, so switching does not land you at
          whatever offset the other deck ended on. */}
      <Carousel
        key={tab}
        slides={slides}
        onAt={setAt}
        marked={keys.map((k) => chosen.includes(k))}
        empty={
          onOps
            ? 'No operatives to choose from — this team has no roster and no faction datacards.'
            : 'No equipment for this team.'
        }
        note={
          !onOps && gear.length >= gearLimit ? (
            <p className="border-t border-rule px-2 py-1 text-center text-[11px] text-flare">
              That is all {gearLimit} — drop something to take this instead.
            </p>
          ) : undefined
        }
      />

      {/* Acts on the card you are looking at. A carousel shows one card at a time by design, so
          the choice belongs beside the dots rather than on the card: a control inside the slide
          either scrolls out of reach on a long datacard or reflows the card it sits in — the
          same trap the `more ▾` pill documents. */}
      {!!here && (
        <button
          onClick={toggle}
          aria-pressed={holding}
          className={`display flex shrink-0 items-center justify-center gap-2 border-t px-3 py-2.5 text-sm transition-colors ${
            holding ? 'border-flare bg-flare text-white' : 'border-rule bg-paper text-ink hover:bg-black/[0.04]'
          }`}
        >
          <span
            aria-hidden
            className={`grid h-5 w-5 place-items-center rounded-sm border text-xs ${
              holding ? 'border-white/70' : 'border-rule text-transparent'
            }`}
          >
            ✓
          </span>
          {holding ? 'In your list — tap to drop' : 'Add to your list'}
        </button>
      )}

      {status !== '' && (
        <p
          className={`shrink-0 border-t border-rule px-3 py-1 text-center text-[11px] ${
            status === 'lost' ? 'bg-xenos text-white' : 'bg-paper text-ink/55'
          }`}
        >
          {status === 'ok'
            ? 'Saved — the GM has your list.'
            : status === 'lost'
              ? 'Could not reach the GM. Is the console open?'
              : 'Sending…'}
        </p>
      )}

      <nav className="flex shrink-0 items-center border-t-2 border-flare bg-card">
        {tabs.map((d) => {
          const on = tab === d
          // The operatives tab carries its own limit; the gear tabs carry only how many of that
          // deck you hold, because the budget they share is one number and belongs in one place.
          const over = full && (d === 'ops' ? ops.length >= opLimit : gear.length >= gearLimit)
          return (
            <button
              key={d}
              onClick={() => {
                setTab(d)
                setAt(0)
              }}
              aria-current={on}
              className={`display relative min-w-0 flex-1 px-1 pt-2 pb-1.5 text-center text-xs ${
                on ? 'text-flare' : 'text-white/55 hover:text-white/80'
              }`}
            >
              {on && <span className="absolute inset-x-0 top-0 h-0.5 bg-flare" />}
              <span className="block truncate">{TAB_LABEL[d]}</span>
              <span className={`block text-[11px] tabular-nums ${over ? 'text-xenos' : 'text-white/45'}`}>
                {d === 'ops' ? `${ops.length}/${opLimit}` : taken(d)}
              </span>
            </button>
          )
        })}
        <Btn onClick={submit} className="display mr-2 shrink-0 bg-white font-semibold text-ink hover:bg-white/80">
          {status === 'lost' ? 'Try again' : 'Save list'}
        </Btn>
      </nav>
    </div>
  )
}

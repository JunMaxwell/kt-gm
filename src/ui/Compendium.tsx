import { useState } from 'react'

import { tacOp, teamTacOps } from '../rules'
import { cardsOfKind, phaseCards, type RefCard, UNIVERSAL_EQUIPMENT } from '../compendium'
import { datacardOf } from '../factions'
import { allTeams, liveStats, teamOps } from '../state'
import { Carousel, SLIDE_CARD } from './Carousel'
import { OperativeCard, RefCardView } from './cards'
import { type Game, useFaction } from './shared'
import { TacOpCard } from './TacOpCard'

// `OperativeCard` and `RefCardView` moved to `./cards`, and the rail to `./Carousel`, so the
// player's draft can render the same cards without a panel importing a panel. Re-exported
// because the tests and the GM's browser already import them from here.
export { OperativeCard, RefCardView }

/* ---------- compendium ---------- */

/** One item in the bottom bar. `now` is whatever the current phase unlocks. */
type Deck = 'now' | 'ops' | 'strategy' | 'firefight' | 'equipment' | 'faction' | 'tac'

const DECK_LABEL: Record<Deck, string> = {
  now: 'Now',
  ops: 'Ops',
  strategy: 'Strat',
  firefight: 'Fire',
  equipment: 'Gear',
  faction: 'Rules',
  tac: 'Tac op',
}

/**
 * One player's cards: a swipe carousel per category, with the categories along the bottom the
 * way a native app puts its primary navigation under the thumb.
 *
 * The rail is CSS scroll-snap, not a carousel library and not touch handlers — that buys real
 * momentum swiping on a phone, trackpad swiping on a laptop, and keyboard scrolling, for free.
 * The only JS is reading `scrollLeft` back out to light the right dot.
 */
export function Compendium({ game, teamId }: { game: Game; teamId: string }) {
  // Teams can be deleted in setup, and a spectator's stored pick may name one that is gone.
  const team = game.teams[teamId] ?? allTeams(game)[0]
  const op = tacOp(team?.tacOp ?? '')
  // Their own op first, then the rest of the six their archetypes allow. A player who has not
  // been given one yet still needs to see what they are choosing between.
  const tacs = [...teamTacOps(team?.archetypes ?? [])].sort((a, b) => Number(b.name === team?.tacOp) - Number(a.name === team?.tacOp))

  // What the team actually fields, not what its faction could field — a restatted or hand-added
  // operative is the one on the table. `team` may be a fallback, so key off its id, not the prop.
  const ops = teamOps(game, team?.id ?? '')

  // A non-preset faction's deck arrives a tick later; until then every deck is empty.
  const faction = useFaction(team?.faction)
  // The GM's own cards come first: a boss's rules matter more than the stock deck, and for a
  // hand-built team they are the only cards there are.
  const cards = [...(team?.cards ?? []), ...(faction?.cards ?? [])]

  const [deck, setDeck] = useState<Deck>('now')

  // Gear is the one deck the player chose rather than inherited. Once they have drafted, it is
  // exactly their four cards — which is also how the ten universal ones get back in, having been
  // pulled out of here for burying a team's own rules under ladders and barricades.
  //
  // Falls back to the whole faction deck when nothing has been picked, so a GM-run team, a team
  // whose player never drafted and every stale save all read exactly as they did before.
  const chosenGear = team?.gear?.length
    ? team.gear
        .map((n) => [...cards, ...UNIVERSAL_EQUIPMENT].find((c) => c.kind === 'equipment' && c.name === n))
        .filter((c): c is RefCard => !!c)
    : null

  const cardsIn = (d: Deck): RefCard[] => {
    if (d === 'now') return phaseCards(cards, game.phase)
    if (d === 'tac' || d === 'ops') return []
    if (d === 'equipment' && chosenGear) return chosenGear
    return cardsOfKind(cards, d)
  }
  const size = (d: Deck) => (d === 'tac' ? tacs.length : d === 'ops' ? ops.length : cardsIn(d).length)

  // An empty deck would be a dead tab, so `now` only appears once the phase unlocks something.
  // `ops` sits second, right after the phase deck: it is the one a player reaches for most.
  const decks = (['now', 'ops', 'strategy', 'firefight', 'equipment', 'faction', 'tac'] as Deck[]).filter(
    (d) => size(d) > 0,
  )
  // Which deck opens when the chosen one is empty. GM-written cards win outright — they are why
  // anyone looked — and otherwise the first non-empty deck in the order above.
  //
  // There used to be a `hasOwn` guard here, to stop the fallback landing on the ten universal
  // equipment cards that belong to everybody rather than on the team's own rules. `Gear` is
  // the team's faction equipment, or the cards its player drafted — either way its own content,
  // so the guard is still gone.
  const ownFirst = team?.cards?.[0]?.kind
  const fallback = (ownFirst && decks.includes(ownFirst) ? ownFirst : decks[0]) ?? 'strategy'
  const live = decks.includes(deck) ? deck : fallback

  const slides =
    live === 'ops'
    ? ops.map((o) => (
        <OperativeCard
          key={o.id}
          o={o}
          st={game.ops[o.id]}
          card={datacardOf(faction, o.name)}
          kicker={team?.name ?? ''}
          now={liveStats(game, o, game.ops[o.id])}
          className={SLIDE_CARD}
        />
      ))
    : live === 'tac'
      ? tacs.map((t) => (
          <TacOpCard
            key={t.name}
            op={t}
            className={SLIDE_CARD}
            badge={t.name === team?.tacOp ? <span className="text-white">Yours</span> : undefined}
          />
        ))
      : cardsIn(live).map((c) => (
          <RefCardView
              key={`${c.kind}:${c.name}`}
              card={c}
              kicker={team?.name ?? ''}
              cp={team?.cp ?? 0}
              live={live === 'now'}
              className={SLIDE_CARD}
            />
        ))

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden border border-rule bg-paper shadow-sm">
      {/* Keyed by deck: remounting is what resets the rail to card 1, where setting an index
          left it at whatever offset the last deck ended on. */}
      <Carousel
        key={live}
        slides={slides}
        note={
          live === 'tac' && !op ? (
            <p className="border-t border-rule px-2 py-1 text-center text-[11px] text-flare">
              None picked yet — tell the GM which of these you want.
            </p>
          ) : undefined
        }
      />

      {/* Bottom navigation: the decks, under the thumb. */}
      <nav className="flex shrink-0 border-t-2 border-flare bg-card">
        {decks.map((d) => {
          const on = live === d
          return (
            <button
              key={d}
              onClick={() => setDeck(d)}
              aria-current={on}
              className={`display relative min-w-0 flex-1 px-1 pt-2 pb-1.5 text-center text-xs ${
                on ? 'text-flare' : 'text-white/55 hover:text-white/80'
              }`}
            >
              {on && <span className="absolute inset-x-0 top-0 h-0.5 bg-flare" />}
              <span className="block truncate">{DECK_LABEL[d]}</span>
              <span className={`block text-[10px] ${on ? 'text-flare/70' : 'text-white/30'}`}>{size(d)}</span>
            </button>
          )
        })}
      </nav>
    </section>
  )
}

/** The GM's copy: same cards, any team, in the reference drawer's Ploys & equipment tab. */
export function CompendiumBrowser({ game }: { game: Game }) {
  const teams = allTeams(game)
  const [pick, setTeamId] = useState('')
  // Validated at render, not once at mount: setup can delete the team under us.
  const teamId = teams.some((t) => t.id === pick) ? pick : (teams[0]?.id ?? '')

  return (
    <div className="p-3">
      <div className="mb-3 flex flex-wrap items-center gap-1">
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => setTeamId(t.id)}
            className="display rounded px-2 py-1 text-sm"
            style={
              teamId === t.id
                ? { background: t.color, color: t.ink ? '#282c34' : '#fff' }
                : { background: 'rgba(0,0,0,.05)', color: '#282c34' }
            }
          >
            {t.name}
          </button>
        ))}
      </div>
      {/*
        The phone gives `Compendium` a fixed viewport because the page there must not scroll. The
        GM's console already scrolls, so a fixed box here only ever hid card from him: at 26rem a
        third of Angron's Ops card was below the fold, and even at 40rem the Intercessor Sergeant
        (nine weapons and two long abilities) overflowed by 90px with nothing but a tiny `more`
        pill sitting on top of a line of body text to say so. No fixed height — the drawer grows to
        the card and the page takes the scroll, which is what a reference drawer should do. The cap
        is only so one pathological card cannot fill the screen.
      */}
      <div className="flex max-h-[85vh]">
        <Compendium game={game} teamId={teamId} />
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'

import { tacOp, teamTacOps, TEAMS } from '../rules'
import { CARDS, KIND_LABEL, phaseCards, PLOY_CP, type RefCard, teamCards, UNIVERSAL_EQUIPMENT } from '../compendium'
import { KtCard, Rules } from './kit'
import { type Game } from './shared'
import { TacOpCard } from './TacOpCard'

/* ---------- compendium ---------- */

/** One card, in the shape the printed sheets use: faction keyword, card type, then the name. */
export function RefCardView({
  card,
  kicker,
  cp,
  live,
  className = '',
}: {
  card: RefCard
  kicker: string
  cp?: number
  live?: boolean
  className?: string
}) {
  const ploy = card.kind === 'strategy' || card.kind === 'firefight'
  const broke = ploy && cp !== undefined && cp < PLOY_CP

  return (
    <KtCard
      kicker={kicker}
      title={KIND_LABEL[card.kind]}
      name={card.name}
      dim={broke}
      outline={live ? 'var(--color-flare)' : undefined}
      aside={ploy && <span className="text-white/60">{broke ? `need ${PLOY_CP}CP` : `${PLOY_CP}CP`}</span>}
      className={className}
    >
      <Rules text={card.text} />
    </KtCard>
  )
}

/** One item in the bottom bar. `now` is whatever the current phase unlocks. */
type Deck = 'now' | 'strategy' | 'firefight' | 'equipment' | 'faction' | 'tac'

const DECK_LABEL: Record<Deck, string> = {
  now: 'Now',
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
  const team = TEAMS.find((t) => t.id === teamId)!
  const p = game.teams[teamId]
  const op = tacOp(p.tacOp)
  // Their own op first, then the rest of the six their archetypes allow. A player who has not
  // been given one yet still needs to see what they are choosing between.
  const tacs = [...teamTacOps(teamId)].sort((a, b) => Number(b.name === p.tacOp) - Number(a.name === p.tacOp))

  const [deck, setDeck] = useState<Deck>('now')
  const [at, setAt] = useState(0)
  const rail = useRef<HTMLDivElement>(null)

  const cardsIn = (d: Deck): RefCard[] => {
    if (d === 'now') return phaseCards(teamId, game.phase)
    if (d === 'tac') return []
    if (d === 'equipment') return [...teamCards(teamId, 'equipment'), ...UNIVERSAL_EQUIPMENT]
    return teamCards(teamId, d)
  }
  const size = (d: Deck) => (d === 'tac' ? tacs.length : cardsIn(d).length)

  // An empty deck would be a dead tab, so `now` only appears once the phase unlocks something.
  const decks = (['now', 'strategy', 'firefight', 'equipment', 'faction', 'tac'] as Deck[]).filter((d) => size(d) > 0)
  const live = decks.includes(deck) ? deck : (decks[0] ?? 'strategy')

  const slides =
    live === 'tac'
      ? tacs.map((t) => (
          <TacOpCard
            key={t.name}
            op={t}
            className="flex-1"
            badge={t.name === p.tacOp ? <span className="text-white">Yours</span> : undefined}
          />
        ))
      : cardsIn(live).map((c) => (
          <RefCardView
              key={`${c.kind}:${c.name}`}
              card={c}
              kicker={team.name}
              cp={p.cp}
              live={live === 'now'}
              className="flex-1"
            />
        ))

  const goto = (i: number) => {
    const el = rail.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }
  const pick = (d: Deck) => {
    setDeck(d)
    setAt(0)
    rail.current?.scrollTo({ left: 0 })
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden border border-rule bg-paper shadow-sm">
      <div
        ref={rail}
        onScroll={(e) => {
          const el = e.currentTarget
          setAt(el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0)
        }}
        className="no-bar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {slides.length ? (
          slides.map((slide, i) => (
            <div key={i} className="flex w-full shrink-0 snap-center flex-col overflow-y-auto p-2">
              {slide}
            </div>
          ))
        ) : (
          <p className="p-3 text-sm text-ink/55">Nothing here.</p>
        )}
      </div>

      {live === 'tac' && !op && (
        <p className="border-t border-rule px-2 py-1 text-center text-[11px] text-flare">
          None picked yet — tell the GM which of these you want.
        </p>
      )}

      {/* Which card of how many, and a tap target per card for anyone not swiping. */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-rule py-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goto(i)}
              aria-label={`Card ${i + 1} of ${slides.length}`}
              aria-current={i === at}
              className={`h-1.5 rounded-full transition-all ${i === at ? 'w-5 bg-flare' : 'w-1.5 bg-black/20'}`}
            />
          ))}
          <span className="display ml-2 text-[10px] text-fade">
            {Math.min(at + 1, slides.length)}/{slides.length}
          </span>
        </div>
      )}

      {/* Bottom navigation: the decks, under the thumb. */}
      <nav className="flex shrink-0 border-t-2 border-flare bg-card">
        {decks.map((d) => {
          const on = live === d
          return (
            <button
              key={d}
              onClick={() => pick(d)}
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

/** The GM's copy: same cards, any team, tucked in a collapsible beside the ops browser. */
export function CompendiumBrowser({ game }: { game: Game }) {
  const [teamId, setTeamId] = useState(TEAMS[0].id)
  const total = Object.values(CARDS).flat().length - CARDS.dw.length // dw2 shares dw's deck

  return (
    <details className="mx-4 mb-4 overflow-hidden border border-rule bg-paper shadow-sm">
      <summary className="display cursor-pointer kt-rule bg-card px-3 py-2 text-xl text-white">
        Ploys &amp; equipment ({total} cards)
      </summary>
      <div className="p-3">
        <div className="mb-3 flex flex-wrap items-center gap-1">
          {TEAMS.map((t) => (
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
        {/* The carousel is flex-1, so inside a collapsible it needs a height to fill. */}
        <div className="flex h-[26rem]">
          <Compendium game={game} teamId={teamId} />
        </div>
      </div>
    </details>
  )
}

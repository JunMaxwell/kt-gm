import { useRef, useState } from 'react'

import { type Operative, tacOp, teamTacOps } from '../rules'
import { cardsOfKind, type Datacard, KIND_LABEL, phaseCards, PLOY_CP, type RefCard } from '../compendium'
import { datacardOf, FACTIONS } from '../factions'
import { allTeams, injured, type OpState, teamOps } from '../state'
import { KtCard, Rules } from './kit'
import { type Game, useFaction } from './shared'
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

/** The four stats a datacard prints across its header, in the order it prints them. */
const STATS = (o: Operative, hp: number) =>
  [
    ['APL', o.apl],
    ['Move', o.move],
    ['Save', o.save],
    ['Wounds', `${hp}/${o.w}`],
  ] as const

/**
 * One of the player's own operatives, in the card shape the rest of the deck uses: the printed
 * stat row, then the live state the GM is editing — wounds, order, injured.
 *
 * Read-only by construction. Like every other slide it takes no `dispatch`, which is what keeps
 * the spectator view structurally unable to write.
 */
export function OperativeCard({
  o,
  st,
  card,
  kicker,
  className = '',
}: {
  o: Operative
  st?: OpState
  card?: Datacard
  kicker: string
  className?: string
}) {
  const acts = Math.max(1, o.acts ?? 1)
  const hurt = !!st && injured(o, st)
  const hp = st?.hp ?? o.w
  // A boss is the only operative that activates more than once, and then the count is the thing
  // you need to see. Everyone else just needs to know whether they have gone yet.
  const state = !st ? '' : st.dead ? 'Incapacitated' : acts > 1 ? `${st.used ?? 0}/${acts} used` : st.expended ? 'Activated' : 'Ready'

  return (
    <KtCard
      kicker={kicker}
      title="Operative"
      name={o.name}
      dim={st?.dead}
      aside={state ? <span className="text-white/60">{state}</span> : undefined}
      className={className}
    >
      <dl className="grid grid-cols-4 gap-1 text-center">
        {STATS(o, hp).map(([k, v]) => (
          <div key={k} className="kt-strip px-1 py-1">
            <dt className="display text-[10px] text-fade">{k}</dt>
            <dd className="display text-lg leading-none tabular-nums text-card">{v}</dd>
          </div>
        ))}
      </dl>

      {st && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-black/10">
          <div
            className="h-full"
            style={{
              width: `${o.w ? Math.max(0, Math.min(100, (hp / o.w) * 100)) : 0}%`,
              background: st.dead ? 'var(--color-fade)' : hurt ? 'var(--color-recon)' : 'var(--color-flare)',
            }}
          />
        </div>
      )}

      {/* The two rules a first-time player keeps having to ask about, spelled out rather than named. */}
      {hurt && (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="display shrink-0 rounded bg-recon px-1.5 text-white">Injured</span>
          <span className="text-fade">&minus;2&quot; Move, and &minus;1 to its weapons&rsquo; Hit stat.</span>
        </p>
      )}
      {st && !st.dead && (
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span
            className="display shrink-0 rounded px-1.5 text-white"
            style={{ background: st.order === 'conceal' ? '#0b6be1' : '#f05c22' }}
          >
            {st.order === 'conceal' ? 'Conceal' : 'Engage'}
          </span>
          <span className="text-fade">
            {st.order === 'conceal'
              ? 'Cannot Shoot, Charge or counteract; not a valid target while in cover.'
              : 'Acts normally, and can counteract.'}
          </span>
        </p>
      )}

      {/* The rest of the printed datacard. Absent for a hand-built team, and for the homebrew
          factions, which have no PDF to extract — both are normal, so this simply renders less. */}
      {!!card?.weapons.length && (
        <table className="mt-2.5 w-full border-collapse">
          <thead>
            <tr className="display text-[10px] text-fade">
              <th className="border-b border-black/15 py-0.5 text-left font-normal">Weapon</th>
              <th className="border-b border-black/15 py-0.5 text-right font-normal">ATK</th>
              <th className="border-b border-black/15 py-0.5 text-right font-normal">HIT</th>
              <th className="border-b border-black/15 py-0.5 text-right font-normal">DMG</th>
            </tr>
          </thead>
          <tbody>
            {card.weapons.map((w) => (
              <tr key={w.name} className="align-baseline">
                <td className="py-0.5 pr-2">
                  {w.name}
                  {/* The weapon rules column is where the keywords live, so it gets the accent. */}
                  {w.wr && <Rules text={w.wr} className="text-[11px] text-fade" />}
                </td>
                <td className="py-0.5 text-right tabular-nums">{w.atk}</td>
                <td className="py-0.5 text-right tabular-nums">{w.hit}</td>
                <td className="py-0.5 text-right tabular-nums">{w.dmg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {card?.abilities.map((a) => (
        <div key={a.name} className="mt-2.5">
          <h6 className="display text-[11px] tracking-wider text-flare">{a.name}</h6>
          <Rules text={a.text} />
        </div>
      ))}

      {card?.actions.map((a) => (
        <div key={a.name} className="mt-2.5">
          <h6 className="display flex items-baseline gap-2 text-[11px] tracking-wider text-flare">
            <span>{a.name}</span>
            <span className="ml-auto shrink-0 rounded bg-card px-1.5 text-white">{a.ap}AP</span>
          </h6>
          <Rules text={a.text} />
        </div>
      ))}

      {!!card?.keywords?.length && (
        <p className="opname mt-2.5 border-t border-black/15 pt-1.5 text-[10px] text-fade">
          {card.keywords.join(' \u00b7 ')}
        </p>
      )}
    </KtCard>
  )
}

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
  const [at, setAt] = useState(0)
  const rail = useRef<HTMLDivElement>(null)

  const cardsIn = (d: Deck): RefCard[] => {
    if (d === 'now') return phaseCards(cards, game.phase)
    if (d === 'tac' || d === 'ops') return []
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
  // faction equipment only now, so every deck is the team's own content and the guard is gone.
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
          className="flex-1"
        />
      ))
    : live === 'tac'
      ? tacs.map((t) => (
          <TacOpCard
            key={t.name}
            op={t}
            className="flex-1"
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
  const teams = allTeams(game)
  const [pick, setTeamId] = useState('')
  // Validated at render, not once at mount: setup can delete the team under us.
  const teamId = teams.some((t) => t.id === pick) ? pick : (teams[0]?.id ?? '')
  const total = FACTIONS.length

  return (
    <details className="mx-4 mb-4 overflow-hidden border border-rule bg-paper shadow-sm">
      <summary className="display cursor-pointer kt-rule bg-card px-3 py-2 text-xl text-white">
        Ploys &amp; equipment ({total} factions)
      </summary>
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
        {/* The carousel is flex-1, so inside a collapsible it needs a height to fill. */}
        <div className="flex h-[26rem]">
          <Compendium game={game} teamId={teamId} />
        </div>
      </div>
    </details>
  )
}

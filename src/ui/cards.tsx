/**
 * The two card renderers Compendium and Draft both need.
 *
 * Their own file for the reason `TacOpCard.tsx` is: more than one panel draws them, and a panel
 * must never import another panel. Everything here is a leaf — it knows about `rules`, the
 * compendium types and `kit`, and nothing about the screens that use it.
 *
 * Neither takes a `dispatch`, and neither should. The player's deck is read-only by construction,
 * and the draft writes through `net.ask` at the screen level rather than from inside a card.
 */
import { useEffect, useState } from 'react'

import { type Datacard, KIND_LABEL, PLOY_CP, type RefCard, weaponRules } from '../compendium'
import type { Operative } from '../rules'
import { type Effect, type Live, type OpState } from '../state'
import type { Fx } from '../compendium'
import { KtCard, Rules } from './kit'

/** One card, in the shape the printed sheets use: faction keyword, card type, then the name. */
export function RefCardView({
  card,
  kicker,
  cp,
  live,
  going,
  onUse,
  footer,
  className = '',
}: {
  card: RefCard
  kicker: string
  cp?: number
  /** Belongs to the phase the table is in. NOT "in effect" — that is `going`. */
  live?: boolean
  /** This card is in effect right now. A third meaning of `live` would be the bug. */
  going?: boolean
  /** Offered only where someone may spend the CP: the GM's browser, and a player's own deck. */
  onUse?: () => void
  /** Anything to hang under the card's text — the equipment controls use this. A slot rather
   *  than more props, so this leaf never learns what a `Game` is. */
  footer?: React.ReactNode
  className?: string
}) {
  const ploy = card.kind === 'strategy' || card.kind === 'firefight'
  const cost = card.cp ?? PLOY_CP
  const broke = ploy && cp !== undefined && cp < cost

  return (
    <KtCard
      kicker={kicker}
      title={KIND_LABEL[card.kind]}
      name={card.name}
      dim={broke && !going}
      outline={going ? 'var(--color-recon)' : live ? 'var(--color-flare)' : undefined}
      tone={card.kind === 'strategy' ? 'green' : card.kind === 'firefight' ? 'black' : undefined}
      tag={ploy && (broke ? `need ${cost}CP` : `${cost}CP`)}
      // The black band's free slot. `OperativeCard` puts Ready/Activated here; a ploy that is
      // running says so in the same place, so the eye learns one spot.
      aside={going ? <span className="text-recon">In effect</span> : undefined}
      className={className}
    >
      <Rules text={card.text} />
      {onUse && <UseButton cost={cost} broke={broke} going={going} onUse={onUse} />}
      {footer}
    </KtCard>
  )
}

/**
 * Two taps, not a dialog. The ploy applies the moment it is confirmed and the CP goes with it,
 * so there has to be a step between a stray thumb and a spent point — but there is no `fixed`,
 * no overlay and no `<dialog>` anywhere in this app, and one button that changes its mind is
 * cheaper than becoming the first. It forgets after three seconds.
 */
function UseButton({ cost, broke, going, onUse }: { cost: number; broke?: boolean; going?: boolean; onUse: () => void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <button
      onClick={() => (armed ? (setArmed(false), onUse()) : setArmed(true))}
      disabled={broke}
      className={`display mt-2 w-full rounded px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
        armed ? 'bg-flare text-white' : 'bg-card text-white'
      }`}
    >
      {armed ? `Tap again to spend ${cost}CP` : going ? `Use again \u2014 ${cost}CP` : `Use this ploy \u2014 ${cost}CP`}
    </button>
  )
}

/** One effect, said in as few words as it can be. Used on the operative card and the GM's list. */
export function EffectChip({ e, onDrop }: { e: Effect; onDrop?: () => void }) {
  const bits = e.fx.flatMap(fxWords)
  const head = (
    <>
      <b className="display shrink-0 text-recon">{e.label}</b>
      {!!bits.length && <span className="min-w-0 text-fade">{bits.join(' \u00b7 ')}</span>}
      <span className="display shrink-0 text-[10px] text-fade">{UNTIL[e.until]}</span>
      {onDrop && (
        <button onClick={onDrop} aria-label={`End ${e.label}`} className="shrink-0 text-xenos">
          \u00d7
        </button>
      )}
    </>
  )

  // Most ploys change no number at all — their whole effect is a re-roll, a free action or a
  // retained success, none of which this app can know. The card's own words ARE the effect, so
  // they travel with it and open in place. `<details>` because it is native and this view still
  // takes no dispatch.
  if (!e.text)
    return (
      <span className="inline-flex max-w-full items-baseline gap-1.5 rounded bg-recon/15 px-1.5 py-0.5">
        {head}
      </span>
    )
  return (
    // `list-none` + an explicit caret: a `display:flex` summary loses Chrome's own disclosure
    // triangle, and without one the chip reads as a label rather than something you can open.
    <details className="group max-w-full rounded bg-recon/15 px-1.5 py-0.5">
      <summary className="flex cursor-pointer list-none items-baseline gap-1.5 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="display shrink-0 text-[9px] text-recon group-open:hidden">
          &#9656;
        </span>
        <span aria-hidden className="display hidden shrink-0 text-[9px] text-recon group-open:inline">
          &#9662;
        </span>
        {head}
      </summary>
      <Rules text={e.text} className="mt-1 mb-0.5 text-[11px] text-fade" />
    </details>
  )
}

/**
 * One modifier in as few words as it will go, in the game's own language.
 *
 * Positive is better on a roll stat, which reads backwards as a number and right as a sentence —
 * so it is said as "Hit better by 1" rather than "+1 Hit".
 */
function fxWords(f: Fx): string[] {
  const out = [
    f.apl && `${f.apl > 0 ? '+' : ''}${f.apl} APL`,
    f.move && `${f.move > 0 ? '+' : ''}${f.move}" Move`,
    f.atk && `${f.atk > 0 ? '+' : ''}${f.atk} Atk`,
    f.hit && `Hit ${f.hit > 0 ? 'better' : 'worse'} by ${Math.abs(f.hit)}`,
    f.save && `Save ${f.save > 0 ? 'better' : 'worse'} by ${Math.abs(f.save)}`,
    f.rules,
    f.tough && 'ignores Injured',
  ].filter(Boolean) as string[]
  // A card whose whole effect is a trigger has nothing else to say, and the trigger IS the words.
  return out.length ? out : []
}

const UNTIL: Record<Effect['until'], string> = {
  activation: 'this activation',
  tp: 'this TP',
  battle: 'all battle',
}

/**
 * The four stats across a datacard's header, in the order it prints them — but the numbers the
 * operative actually rolls, not the ones the PDF printed. `now` is absent in the draft, where
 * nothing is on the table yet and the printed card is the right thing to show.
 */
const STATS = (o: Operative, hp: number, now?: Live) =>
  [
    ['APL', now?.apl ?? o.apl],
    ['Move', now?.move ?? o.move],
    ['Save', now?.save ?? o.save],
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
  now,
  className = '',
}: {
  o: Operative
  st?: OpState
  card?: Datacard
  kicker: string
  /** What this operative actually rolls right now, from `live()`. Absent means print the card. */
  now?: Live
  className?: string
}) {
  const acts = Math.max(1, o.acts ?? 1)
  // Its own abilities are read as well as its weapons — an operative whose rule grants Ceaseless
  // needs Ceaseless spelled out just as much as one whose weapon prints it.
  const glossary = weaponRules(card?.weapons, [...(card?.abilities ?? []), ...(card?.actions ?? [])].map((a) => a.text))
  const hurt = !!now?.hurt
  const hp = st?.hp ?? o.w
  // A boss is the only operative that activates more than once, and then the count is the thing
  // you need to see. Everyone else just needs to know whether they have gone yet.
  const state = !st ? '' : st.dead ? 'Incapacitated' : acts > 1 ? `${st.used ?? 0}/${acts} used` : st.expended ? 'Activated' : 'Ready'

  return (
    <KtCard
      kicker={kicker}
      title="Operative"
      name={o.name}
      art={card?.img}
      dim={st?.dead}
      aside={state ? <span className="text-white/60">{state}</span> : undefined}
      className={className}
    >
      <dl className="grid grid-cols-4 gap-1 text-center">
        {STATS(o, hp, now).map(([k, v]) => (
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

      {/* The badge now explains numbers that have ALREADY moved, above — it used to state the
          penalty over a stat row that still showed the undamaged card, which is the whole bug. */}
      {hurt && (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="display shrink-0 rounded bg-recon px-1.5 text-white">Injured</span>
          <span className="text-fade">
            {now?.ignoring === 'all'
              ? 'Below half wounds \u2014 but a rule lets it ignore the penalty, so nothing above moved.'
              : now?.ignoring === 'weapons'
                ? 'Already counted above: \u22122" Move. A rule of its own keeps its weapons\u2019 Hit stat.'
                : 'Already counted above: \u22122" Move, and \u22121 to its weapons\u2019 Hit stat.'}
          </span>
        </p>
      )}
      {/* What is true right now and is not on the printed card. Above the weapon table, because
          the numbers it explains are the ones in the stat row just above it. */}
      {!!now?.from.length && (
        <div className="mt-2 flex flex-wrap items-baseline gap-1 text-xs">
          {now.from.map((e) => (
            <EffectChip key={e.id} e={e} />
          ))}
        </div>
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
            {/* Towering Size, Sneaky Zogger, Stoopid — the order is a stat here, not a choice. */}
            {o.lockOrder && <b className="text-flare"> Always in Engage Order.</b>}
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
                <td className="py-0.5 text-right tabular-nums">{now ? now.hit(w) : w.hit}</td>
                <td className="py-0.5 text-right tabular-nums">{w.dmg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* `Rules` renders a <p>, so it is the whole line rather than nested in one. Said once
          rather than on all nine rows of an Intercessor Sergeant — the rule is on the operative. */}
      {!!now?.adds.length && (
        <Rules
          text={`Every weapon above also has ${now.adds.join(', ')}.`}
          className="mt-1 text-[11px] text-recon"
        />
      )}

      {/* The riders: everything the app will not fold into the numbers because it depends on a
          board, a die, or knowing which of these weapons is a sword. Named, with its trigger, so
          the player applies it — rather than the app guessing and printing something untrue. */}
      {!!now?.riders.length && (
        <ul className="mt-1 space-y-0.5">
          {now.riders.map(({ label, fx }, i) => (
            <li key={`${label}-${i}`} className="flex items-baseline gap-1 text-[11px]">
              <span aria-hidden className="shrink-0 text-recon">
                +
              </span>
              <span className="min-w-0">
                {fx.scope && <b className="text-card">{fx.scope} weapons: </b>}
                {fxWords(fx).join(', ')}
                {fx.when && <span className="text-fade">{fxWords(fx).length ? ' \u2014 ' : ''}{fx.when}</span>}
                <span className="display ml-1 text-[10px] text-recon">{label}</span>
              </span>
            </li>
          ))}
        </ul>
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

      {/* What the weapon table's rules column actually means. These are the 2024 Appendix's
          universal rules, which are in no faction PDF — so before this the card printed
          "Piercing 1, Saturate" and nothing in the app said what either one did.

          Last on the card and collapsed, because it is the least urgent thing on it: a
          four-weapon operative can pull in eight rules, and open by default that wall would
          push the operative's OWN abilities below the fold. `<details>` rather than state
          because it is native, and because this view still takes no `dispatch`. */}
      {!!glossary.length && (
        <details
          className="mt-2.5 border-t border-black/15 pt-1.5"
          // Opening a disclosure has to REVEAL it. This sits at the bottom of the tallest card in
          // the app, so expanding it almost always lands the new text below the fold — and the
          // `more ▾` pill only tells you it is there, which is not the same as showing you. The
          // slide is the nearest scroll container, so `block: 'nearest'` scrolls it the minimum
          // needed and does nothing when the content already fits.
          onToggle={(e) =>
            e.currentTarget.open && e.currentTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }
        >
          <summary className="display cursor-pointer text-[11px] tracking-wider text-flare">
            Weapon rules ({glossary.length})
          </summary>
          <dl className="mt-1 space-y-1 text-fade">
            {glossary.map(([name, text]) => (
              <div key={name}>
                <dt className="inline font-bold text-card">{name}</dt>{' '}
                <dd className="inline">{text}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </KtCard>
  )
}

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
import { type Datacard, KIND_LABEL, PLOY_CP, type RefCard, weaponRules } from '../compendium'
import type { Operative } from '../rules'
import { injured, type OpState } from '../state'
import { KtCard, Rules } from './kit'

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
  const cost = card.cp ?? PLOY_CP
  const broke = ploy && cp !== undefined && cp < cost

  return (
    <KtCard
      kicker={kicker}
      title={KIND_LABEL[card.kind]}
      name={card.name}
      dim={broke}
      outline={live ? 'var(--color-flare)' : undefined}
      tone={card.kind === 'strategy' ? 'green' : card.kind === 'firefight' ? 'black' : undefined}
      tag={ploy && (broke ? `need ${cost}CP` : `${cost}CP`)}
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
  // Its own abilities are read as well as its weapons — an operative whose rule grants Ceaseless
  // needs Ceaseless spelled out just as much as one whose weapon prints it.
  const glossary = weaponRules(card?.weapons, [...(card?.abilities ?? []), ...(card?.actions ?? [])].map((a) => a.text))
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
      art={card?.img}
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

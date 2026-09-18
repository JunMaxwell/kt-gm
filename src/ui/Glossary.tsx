import { useState } from 'react'

import { type Datacard, type RefCard, cardsOfKind, weaponRules } from '../compendium'
import { FACTIONS, datacardOf, factionMeta } from '../factions'
import type { Operative } from '../rules'
import { DarkBtn, KtCard, Rules } from './kit'
import { RefCardView } from './Compendium'
import { setTeamInUrl, teamInUrl, teamUrl, useFaction } from './shared'

/* ---------- the faction glossary ----------
 *
 * Every kill team the app knows, laid out the way the official team rules PDFs print one, and
 * printable to A4 through the browser's own "Save as PDF". No PDF library: the print pipeline
 * is the native platform feature for this, and it keeps the type vector and selectable where a
 * canvas rasteriser would not.
 *
 * It takes no `dispatch`, like `Compendium` — which is what lets a spectator open it. See the
 * read-only note in CLAUDE.md: structural, not a flag.
 */

/** The four stat glyphs the printed band carries, as paths on a 14x14 box. */
const STAT_ICON: Record<string, string> = {
  APL: 'M2 3h10L7 12z',
  Move: 'M2 5h6V2l6 5-6 5V9H2z',
  Save: 'M7 1l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6V3z',
  Wounds: 'M7 1c3 4 4 5.5 4 7a4 4 0 1 1-8 0c0-1.5 1-3 4-7z',
}

const stats = (o: Operative) =>
  [
    ['APL', o.apl],
    ['Move', o.move],
    ['Save', o.save],
    ['Wounds', o.w],
  ] as const

/**
 * One operative, in the shape the PDF prints it: black band with the name and the four stats,
 * the weapon table with its WR column, the abilities and unique actions as bold-name prose,
 * then the keyword bar.
 *
 * Not `OperativeCard`. That one is a vertical phone card — no WR column, no keyword bar, live
 * wound and order state, and a weapon-rules `<details>` that would print collapsed.
 *
 * Two columns the PDF has and this cannot: the melee/ranged glyph (a GRAPHIC in the source PDF,
 * so `pdftotext` never gave the extractor one, and `wr` cannot stand in — a marksman bolt
 * carbine is ranged with no Range rule and fists are melee with none either) and the points
 * cost, which this app parses and drops because it does no list building.
 */
function PrintDatacard({ o, card }: { o: Operative; card?: Datacard }) {
  const prose = [
    ...(card?.abilities ?? []).map((a) => [a.name, a.text] as const),
    ...(card?.actions ?? []).map((a) => [`${a.name} (${a.ap}AP)`, a.text] as const),
  ]

  return (
    <article className="break-inside-avoid border border-card/30 bg-stone">
      <div className="kt-band flex items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-end px-3 pt-2 pb-3">
          <h3 className="display truncate text-xl text-white">{o.name}</h3>
          <div className="mt-1 h-[2px] bg-flare" />
        </div>
        <dl className="flex shrink-0">
          {stats(o).map(([k, v]) => (
            <div key={k} className="flex w-[13mm] flex-col items-center justify-center border-l border-white/20 px-1 pb-1.5">
              <dt className="display text-[8px] text-white/55">{k}</dt>
              <dd className="display flex items-center gap-0.5 text-lg leading-none text-white">
                <svg viewBox="0 0 14 14" className="h-2.5 w-2.5 shrink-0 fill-flare" aria-hidden>
                  <path d={STAT_ICON[k]} />
                </svg>
                <span className="tabular-nums">{v}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {!!card?.weapons.length && (
        <table className="w-full table-fixed border-collapse text-[10px]">
          <thead>
            <tr className="display text-[8px] text-fade">
              <th className="w-[32%] border-b-2 border-flare py-1 pr-2 pl-3 text-left font-normal">Name</th>
              <th className="w-[7%] border-b-2 border-flare py-1 text-center font-normal">Atk</th>
              <th className="w-[7%] border-b-2 border-flare py-1 text-center font-normal">Hit</th>
              <th className="w-[7%] border-b-2 border-flare py-1 text-center font-normal">Dmg</th>
              <th className="border-b-2 border-flare py-1 pr-3 pl-3 text-left font-normal">WR</th>
            </tr>
          </thead>
          <tbody className="text-ink/90">
            {card.weapons.map((w, i) => (
              <tr key={w.name} className={`align-top ${i % 2 ? 'bg-black/[0.055]' : ''}`}>
                <td className="py-1 pr-2 pl-3">{w.name}</td>
                <td className="py-1 text-center tabular-nums">{w.atk}</td>
                <td className="py-1 text-center tabular-nums">{w.hit}</td>
                <td className="py-1 text-center tabular-nums">{w.dmg}</td>
                <td className="py-1 pr-3 pl-3">{w.wr ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!!prose.length && (
        <div
          className={`kt-hex border-t-2 border-flare px-3 py-2 text-[10px] leading-snug text-ink/90 ${
            prose.length > 1 ? 'columns-2 gap-4' : ''
          }`}
        >
          {prose.map(([name, text]) => (
            /* The PDF runs the name INTO the text — bold black, colon, prose. `Rules` renders a
               <p>, so it is forced inline here rather than given an `as` prop nothing else wants. */
            <div key={name} className="mb-2 break-inside-avoid last:mb-0">
              <b className="font-bold text-card">{name}:</b> <Rules text={text} className="inline" />
            </div>
          ))}
        </div>
      )}

      {!!card?.keywords?.length && (
        <p className="opname bg-card px-3 py-1.5 text-[8px] leading-tight text-white/70">
          <span className="text-flare">{card.keywords[0]}</span>
          {card.keywords.length > 1 && `, ${card.keywords.slice(1).join(', ')}`}
        </p>
      )}
    </article>
  )
}

/** One faction's whole rules pack: every datacard, then every card, then the weapon glossary. */
export function Pack({ id, onBack }: { id: string; onBack: () => void }) {
  const meta = factionMeta(id)
  const data = useFaction(id)
  const name = meta?.name ?? id
  const cards: RefCard[] = data?.cards ?? []
  // The PDF's own order: faction rules, then the three ploy/equipment decks.
  const rules = (['faction', 'strategy', 'firefight', 'equipment'] as const).flatMap((k) => cardsOfKind(cards, k))
  // The universal rules this faction's weapons actually use. The official sheets leave these to
  // the core rules — on paper that is exactly the gap that made a datacard print "Saturate" with
  // nothing anywhere saying what it did. It prints UNDER the operatives, before the ploy deck,
  // because it explains their weapon tables and nothing else on the sheet.
  const glossary = weaponRules(data?.datacards?.flatMap((d) => d.weapons))

  return (
    <div className="min-h-screen print:min-h-0">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-white shadow-lg print:hidden">
        <DarkBtn onClick={onBack} className="display">
          ← All teams
        </DarkBtn>
        <h1 className="display text-2xl">{name}</h1>
        <span className="display text-xs text-white/50">
          {data ? `${data.operatives.length} operatives · ${cards.length} cards` : 'loading…'}
        </span>
        <DarkBtn onClick={() => navigator.clipboard?.writeText(teamUrl(id))} className="display ml-auto">
          Copy link
        </DarkBtn>
        <DarkBtn onClick={() => window.print()} className="display">
          Print / Save as PDF
        </DarkBtn>
        <span className="display w-full text-[10px] text-white/35">
          A4 · pick “Save as PDF” as the destination, and leave background graphics on · “Copy
          link” gives a player this team and nothing else
        </span>
      </header>

      {/* 190mm is A4 less the 10mm margins the print block sets, so what is on screen IS the
          printed page. `max-w-full` keeps that off a phone's horizontal scrollbar. */}
      <main className="print-sheet mx-auto w-[190mm] max-w-full space-y-3 p-4">
        {data?.operatives.map((o) => (
          <PrintDatacard key={o.id} o={o} card={datacardOf(data, o.name)} />
        ))}

        {!!glossary.length && (
          <section className="break-before-page border border-card/30 bg-stone">
            <div className="kt-band px-3 pt-2 pb-3">
              <p className="display text-[11px] tracking-widest text-flare">{name}</p>
              <p className="display text-xl leading-none text-white">Weapon rules</p>
            </div>
            <dl className="kt-hex columns-2 gap-4 p-3 text-[10px] leading-snug text-ink/90">
              {glossary.map(([rule, text]) => (
                <div key={rule} className="mb-2 break-inside-avoid">
                  <dt className="inline font-bold text-card">{rule}</dt> <dd className="inline">{text}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {!!rules.length && (
          <section className="grid break-before-page grid-cols-2 gap-3">
            <KtCard kicker={name} title="Kill Team" name="Operatives" className="break-inside-avoid print:overflow-visible">
              <p className="text-[11px] text-fade">Archetypes: {meta?.archetypes.join(', ') || '—'}</p>
              <ul className="mt-2 space-y-0.5">
                {data?.operatives.map((o) => (
                  <li key={o.id} className="opname text-[10px]">
                    • {o.name}
                  </li>
                ))}
              </ul>
            </KtCard>
            {rules.map((c) => (
              <RefCardView key={`${c.kind}:${c.name}`} card={c} kicker={name} className="break-inside-avoid print:overflow-visible" />
            ))}
          </section>
        )}

      </main>
    </div>
  )
}

/** The index: all 52 kill teams, filtered by name. */
export function Glossary({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState(teamInUrl)
  const [q, setQ] = useState('')

  // The address bar IS the selection, so every pack is a link the GM can send a player and a
  // reload lands back on it. `replaceState`, not `pushState`: nothing else in this app is
  // history-navigable, and the view has its own Back.
  const show = (next: string) => {
    setTeamInUrl(next)
    setId(next)
  }

  if (id) return <Pack id={id} onBack={() => show('')} />

  const needle = q.trim().toLowerCase()
  const hits = needle ? FACTIONS.filter((f) => f.name.toLowerCase().includes(needle)) : FACTIONS

  return (
    <div className="min-h-screen print:min-h-0">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-white shadow-lg print:hidden">
        <h1 className="display text-2xl">Faction glossary</h1>
        <span className="display text-xs text-white/50">{FACTIONS.length} kill teams · every card, printable</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter…"
          aria-label="Filter kill teams"
          className="ml-auto w-40 min-w-0 rounded bg-white/15 px-2 py-1 text-sm text-white placeholder:text-white/40"
        />
        <DarkBtn
          onClick={() => {
            setTeamInUrl('')
            onClose()
          }}
          className="display"
        >
          Close
        </DarkBtn>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {hits.map((f) => (
            <button
              key={f.id}
              onClick={() => show(f.id)}
              className="overflow-hidden border border-rule bg-paper text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className="kt-band px-3 pt-1.5 pb-3"
                style={{ background: f.color, color: f.ink ? '#282c34' : '#fff' }}
              >
                <p className="display truncate text-lg">{f.name}</p>
              </div>
              <p className="px-3 py-1.5 text-[10px] text-ink/50">
                {f.archetypes.join(' · ')}
                {f.custom && <span className="text-flare"> · homebrew</span>}
              </p>
            </button>
          ))}
        </div>
        {!hits.length && <p className="p-4 text-sm text-ink/40">No kill team matches “{q}”.</p>}
      </main>
    </div>
  )
}

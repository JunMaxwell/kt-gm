import { useState } from 'react'

import { TEAMS } from '../rules'

/* ---------- shared bits ---------- */

export const Btn = ({ on, ...p }: { on?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...p}
    className={`rounded px-2 py-1 text-sm tabular-nums transition-colors ${
      on ? 'bg-card font-semibold text-white' : 'bg-black/5 text-ink hover:bg-black/12'
    } ${p.className ?? ''}`}
  />
)

/** Dark-chrome variant, for use inside the ink header bar. */
export const DarkBtn = ({ on, ...p }: { on?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...p}
    className={`rounded px-2 py-1 text-sm tabular-nums transition-colors ${
      on ? 'bg-white font-semibold text-ink' : 'bg-white/12 text-white hover:bg-white/25'
    } ${p.className ?? ''}`}
  />
)

/**
 * Controlled input you can actually edit. The value it displays is owned by the
 * reducer, which clamps it — so a half-typed or empty field would otherwise be
 * rejected and snap back mid-keystroke. While focused we show the raw text and
 * push up whatever parses; blur drops the buffer and resyncs to real state.
 */
export function BufferedInput({
  value,
  onEdit,
  dark,
  className = '',
  ...rest
}: {
  value: string
  onEdit: (raw: string) => void
  dark?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [buf, setBuf] = useState<string | null>(null)
  return (
    <input
      {...rest}
      value={buf ?? value}
      onChange={(e) => {
        setBuf(e.target.value)
        onEdit(e.target.value)
      }}
      onBlur={() => setBuf(null)}
      className={`rounded px-1 py-0.5 text-center text-xs tabular-nums ${
        dark ? 'bg-white/15 text-white' : 'border border-rule bg-white text-ink'
      } ${className}`}
    />
  )
}

export const Stepper = ({ value, onChange, max }: { value: number; onChange: (d: number) => void; max?: number }) => (
  <span className="inline-flex items-center gap-1">
    <Btn onClick={() => onChange(-1)} disabled={value <= 0} className="w-7 disabled:opacity-25">
      –
    </Btn>
    <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
    <Btn onClick={() => onChange(1)} disabled={max !== undefined && value >= max} className="w-7 disabled:opacity-25">
      +
    </Btn>
  </span>
)

/** White card with a coloured header band, as on the reference cards. */
export function Card({
  band,
  ink,
  title,
  aside,
  children,
  className = '',
}: {
  band: string
  ink?: boolean
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden border bg-paper shadow-sm ${className}`}
      style={{ borderColor: band }}
    >
      <header
        className="kt-band flex items-center justify-between gap-2 px-3 pt-1.5 pb-3"
        style={{ background: band, color: ink ? '#282c34' : '#ffffff' }}
      >
        <h3 className="display truncate text-xl">{title}</h3>
        {aside}
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

/** Team identity as a filled pill — the only treatment that stays legible for the
 *  light bands (Deathwatch silver, XV26 white) against a white card. */
export const TeamPill = ({
  team,
  className = '',
}: {
  team: (typeof TEAMS)[number]
  className?: string
}) => (
  <span
    className={`display rounded px-1.5 text-xs ${className}`}
    style={{ background: team.color, color: team.ink ? '#282c34' : '#fff' }}
    title={team.name}
  >
    {team.short}
  </span>
)

export const Label = ({ children, ...p }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...p} className={`display text-xs text-ink/45 ${p.className ?? ''}`}>
    {children}
  </span>
)

/**
 * A card in the shape the official team rules PDFs print: a black title block carrying a small
 * orange keyword over a big white card type, then the card's own name in a bordered
 * letterspaced strip, then the body over a faint hex lattice.
 *
 * `kicker` is the faction keyword line, `title` the card type ("Firefight Ploy"), `name` the
 * card itself. Matching the real layout means the three never get muddled.
 */
export function KtCard({
  kicker,
  title,
  name,
  aside,
  dim,
  outline,
  children,
  className = '',
}: {
  kicker: React.ReactNode
  title: React.ReactNode
  name: string
  aside?: React.ReactNode
  dim?: boolean
  outline?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex min-w-0 flex-col overflow-hidden border bg-stone shadow-sm ${dim ? 'opacity-45' : ''} ${className}`}
      style={{ borderColor: outline ?? '#2a2a2a' }}
    >
      <div className="kt-band px-2 pt-1.5 pb-3 text-center">
        <p className="display flex items-baseline justify-center gap-2 text-[11px] tracking-widest text-flare">
          <span className="truncate">{kicker}</span>
          {aside}
        </p>
        <p className="display text-xl leading-none text-white">{title}</p>
      </div>

      <div className="kt-hex flex min-w-0 flex-1 flex-col p-2">
        <h5 className="kt-strip opname px-1.5 py-0.5 text-xs font-bold text-card">{name}</h5>
        <div className="mt-1.5 min-w-0 text-xs leading-snug text-ink/90">{children}</div>
      </div>
    </div>
  )
}

// Words the cards print in caps but never highlight — stats and table headers, not keywords.
const NOISE = new Set(['APL', 'ATK', 'HIT', 'DMG', 'NAME', 'AND', 'THE', 'FOR', 'ALL'])

/**
 * Card rules text with the faction keywords picked out in the accent orange, the way the
 * printed cards do it. A run of three or more capitals is a keyword unless it's a stat name.
 *
 * ponytail: a heuristic, not a parser. If it ever mis-highlights, add the word to NOISE — the
 * alternative is tagging every keyword by hand across 97 cards.
 */
export function Rules({ text, className = '' }: { text: string; className?: string }) {
  const out: React.ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(/[A-Z][A-Z'’]{2,}(?: [A-Z][A-Z'’]{1,})*/g)) {
    if (NOISE.has(m[0]) || m.index === undefined) continue
    out.push(text.slice(last, m.index))
    out.push(
      <b key={m.index} className="font-bold text-flare">
        {m[0]}
      </b>,
    )
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return <p className={`whitespace-pre-line ${className}`}>{out}</p>
}

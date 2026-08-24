import { useState } from 'react'

import { type Archetype, ARCHETYPE_COLOR, ARCHETYPES, CRIT_OPS, TAC_OPS, TEAMS, teamsWithArchetype } from '../rules'
import { Btn, KtCard, TeamPill } from './kit'
import { type Game } from './shared'
import { TacOpCard } from './TacOpCard'

export function OpsBrowser({ game }: { game: Game }) {
  const [arch, setArch] = useState<Archetype | 'all'>('all')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = TAC_OPS.filter(
    (o) =>
      (arch === 'all' || o.archetype === arch) &&
      (!needle || `${o.name} ${o.reveal} ${o.select ?? ''} ${o.vp.join(' ')}`.toLowerCase().includes(needle)),
  )
  const taken = new Map(TEAMS.filter((t) => game.teams[t.id].tacOp).map((t) => [game.teams[t.id].tacOp, t]))

  return (
    <details className="mx-4 mb-4 overflow-hidden border border-rule bg-paper shadow-sm">
      <summary className="display cursor-pointer kt-rule bg-card px-3 py-2 text-xl text-white">
        Crit ops &amp; tac ops ({CRIT_OPS.length + TAC_OPS.length} cards)
      </summary>

      <div className="p-3">
        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CRIT_OPS.map((c) => {
            const live = game.critOp === c.id
            return (
              <KtCard
                key={c.id}
                kicker={`Crit op ${c.n}`}
                title="Critical Op"
                name={c.name}
                outline={live ? '#f05c22' : undefined}
                aside={<span className="text-white/60">{live ? 'in play' : c.derive === 'holders' ? 'auto' : 'by hand'}</span>}
              >
                <p className="display text-[13px] text-flare">{c.action}</p>
                <p className="text-fade">{c.actionText}</p>
                {'extra' in c && <p className="mt-1 text-security">{c.extra}</p>}
                <ul className="mt-1.5 space-y-1">
                  {c.vp.map((v, i) => (
                    <li key={i} className="flex gap-1.5 border-b border-black/10 pb-1 last:border-0">
                      <span className="text-flare">&#9642;</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </KtCard>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
          <Btn on={arch === 'all'} onClick={() => setArch('all')} className="display">
            All
          </Btn>
          {ARCHETYPES.map((a) => (
            <button
              key={a}
              onClick={() => setArch(a)}
              title={teamsWithArchetype(a)
                .map((t) => t.name)
                .join(', ')}
              className="display rounded px-2 py-1 text-sm"
              style={
                arch === a
                  ? { background: ARCHETYPE_COLOR[a], color: '#fff' }
                  : { background: 'rgba(0,0,0,.05)', color: ARCHETYPE_COLOR[a] }
              }
            >
              {a} ({teamsWithArchetype(a).length})
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search cards…"
            className="ml-auto w-40 rounded border border-rule bg-white px-2 py-1 text-sm"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((op) => {
            const owner = taken.get(op.name)
            return (
              <div key={op.name} className="relative">
                <TacOpCard op={op} showTeams className={owner ? 'ring-2 ring-ink' : ''} />
                {owner && <TeamPill team={owner} className="absolute -top-2 right-2 shadow" />}
              </div>
            )
          })}
          {!list.length && <p className="text-sm text-ink/40">Nothing matches that search.</p>}
        </div>
      </div>
    </details>
  )
}

import { ARCHETYPE_COLOR, type TacOp, teamsWithArchetype } from '../rules'
import { KtCard, TeamPill } from './kit'

/* ---------- ops cards ---------- */

export function TacOpCard({
  op,
  className = '',
  showTeams,
  badge,
}: {
  op: TacOp
  className?: string
  showTeams?: boolean
  /** Marks the one this player actually took, among the six they could have. */
  badge?: React.ReactNode
}) {
  return (
    <KtCard
      kicker={op.archetype}
      title="Tac Op"
      name={op.name}
      outline={badge ? 'var(--color-flare)' : ARCHETYPE_COLOR[op.archetype]}
      aside={badge}
      className={className}
    >
      <p className="text-fade">
        <span className="display text-[11px] text-card">Reveal </span>
        {op.reveal}
      </p>
      {op.select && (
        <p className="mt-0.5">
          <span className="display text-[11px] text-flare">Nominate </span>
          {op.select}
        </p>
      )}
      <ul className="mt-1.5 space-y-1">
        {op.vp.map((v, i) => (
          <li key={i} className="flex gap-1.5 border-b border-black/10 pb-1 last:border-0">
            <span className="text-flare">&#9642;</span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-fade">
        {op.cap && <span>max {op.cap}VP per TP</span>}
        {showTeams && (
          <span className="flex flex-wrap gap-1">
            {teamsWithArchetype(op.archetype).map((t) => (
              <TeamPill key={t.id} team={t} />
            ))}
          </span>
        )}
      </p>
    </KtCard>
  )
}

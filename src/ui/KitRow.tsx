import { gearUse, type RefCard } from '../compendium'
import { type Kit, kitKey, teamOps } from '../state'
import { Btn, Label } from './kit'
import type { Game } from './shared'

/**
 * The controls under a piece of equipment: how much of it is spent, and who is carrying it.
 *
 * **Usage first, carrier second, and that order is the card corpus talking.** Of 196 faction
 * equipment cards exactly three are scoped to a single model, and all 64 "once per turning
 * point" ones are worded kill-team wide — equipment in this edition belongs to a team, not to a
 * model. But 103 of 222 cards carry a use limit, and remembering which ones are spent is the
 * thing nobody at the table can do. So the tick is the feature and the carrier is the garnish,
 * blank by default.
 *
 * A passive card gets no usage control at all. `gearUse` returns nothing for the 119 that are
 * simply on, and a barricade with a tick box beside it is a question the player has to answer.
 *
 * **Nothing here blocks anything.** A spent card still shows its rules and the action is still
 * available; the GM is the referee, as everywhere else in this app.
 */
export function KitRow({
  game,
  teamId,
  card,
  onKit,
}: {
  game: Game
  teamId: string
  card: RefCard
  /** Absent where nobody may change it — the glossary, the draft, a deck with no relay. */
  onKit?: (patch: Partial<Kit>) => void
}) {
  const limit = gearUse(card.text)
  const st: Kit = game.kit[kitKey(teamId, card.name)] ?? {}
  const used = st.used ?? 0
  const ops = teamOps(game, teamId)
  if (!limit && !onKit) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-black/15 pt-1.5 text-xs">
      {limit && (
        <span className="flex items-center gap-1.5">
          <Label>{limit.per === 'battle' ? 'Once per battle' : limit.max > 1 ? `${limit.max}× per TP` : 'Once per TP'}</Label>
          {/* One tick for the 96 cards with a single use, a counter for the seven that have two. */}
          {limit.max === 1 ? (
            <Btn
              on={used > 0}
              onClick={() => onKit?.({ used: used > 0 ? 0 : 1, per: limit.per, max: limit.max })}
              disabled={!onKit}
              className="disabled:opacity-100"
            >
              {used > 0 ? '✓ used' : 'unused'}
            </Btn>
          ) : (
            <span className="flex items-center gap-1">
              <Btn
                onClick={() => onKit?.({ used: Math.max(0, used - 1), per: limit.per, max: limit.max })}
                disabled={!onKit || used === 0}
                className="w-6 px-0"
              >
                &minus;
              </Btn>
              <b className="w-8 text-center tabular-nums">
                {used}/{limit.max}
              </b>
              <Btn
                onClick={() => onKit?.({ used: Math.min(limit.max, used + 1), per: limit.per, max: limit.max })}
                disabled={!onKit || used >= limit.max}
                className="w-6 px-0"
              >
                +
              </Btn>
            </span>
          )}
        </span>
      )}

      {onKit && !!ops.length && (
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <Label>Carried by</Label>
          <select
            value={st.op ?? ''}
            onChange={(e) => onKit({ op: e.target.value || undefined })}
            className="min-w-0 flex-1 border border-black/20 bg-stone px-1 py-0.5 text-xs"
          >
            <option value="">&mdash; nobody &mdash;</option>
            {ops.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </span>
      )}
      {!onKit && st.op && (
        <span className="text-fade">Carried by {ops.find((o) => o.id === st.op)?.name ?? '—'}</span>
      )}
    </div>
  )
}

import { teamOps, teamsOf } from '../state'
import { DarkBtn } from './kit'
import type { Game } from './shared'

/**
 * "Who are you playing?" — the spectator's first screen, and the one they come back to from the
 * team band in the header.
 *
 * It is a SCREEN, not a modal: an early return from `Viewer`, exactly the way `Setup` is an early
 * return from `App`. There is no overlay, no portal and no focus trap anywhere in this app, and
 * this does not need to be the first — the thing behind the picker is the deck they may be
 * reading by mistake, so replacing it outright is the point.
 *
 * `onClose` is what makes it dismissable, and it is deliberately absent on a fresh phone. Silently
 * defaulting to the first team is how a first-time player ends up reading someone else's cards for
 * a whole match without ever being told.
 */
export function TeamPicker({
  game,
  me,
  code,
  onPick,
  onClose,
}: {
  game: Game
  me: string
  code?: string
  onPick: (id: string) => void
  onClose?: () => void
}) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-wash">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-card px-4 py-3 text-white shadow-lg">
        <div className="min-w-0">
          <h1 className="display truncate text-xl">Who are you playing?</h1>
          <p className="truncate text-[11px] text-white/45">
            {code ? `Room ${code} — read only. ` : ''}This phone remembers your pick.
          </p>
        </div>
        {onClose && (
          <DarkBtn onClick={onClose} className="display ml-auto shrink-0">
            Cancel
          </DarkBtn>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {/* A match can legitimately have no teams yet. Without this the screen is simply blank,
            and there is no way for the player to tell that from a broken app. */}
        {!game.sides.some((s) => teamsOf(game, s.id).length > 0) && (
          <p className="p-3 text-sm text-ink/55">No teams yet — the GM has not finished setting the match up.</p>
        )}
        {game.sides.map((side) => (
          <section key={side.id}>
            <p className="display kt-rule px-1 pb-0.5 text-sm" style={{ color: side.color }}>
              {side.name}
            </p>
            <ul className="mt-2 space-y-2">
              {teamsOf(game, side.id).map((t) => {
                const n = teamOps(game, t.id).length
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => onPick(t.id)}
                      className="flex w-full items-center gap-3 border border-rule bg-paper px-3 py-3 text-left shadow-sm transition-colors hover:bg-black/[0.03]"
                    >
                      <span className="h-10 w-2 shrink-0 rounded-sm" style={{ background: t.color }} />
                      <span className="min-w-0 flex-1">
                        <b className="display block truncate text-lg">{t.name}</b>
                        <span className="block truncate text-xs text-ink/55">
                          {t.player}
                          {n > 0 && ` · ${n} operative${n === 1 ? '' : 's'}`}
                        </span>
                      </span>
                      {t.id === me && (
                        <span className="display shrink-0 rounded bg-card px-2 py-0.5 text-xs text-white">You</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

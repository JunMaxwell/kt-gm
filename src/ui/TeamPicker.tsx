import { useState } from 'react'

import { teamOps, teamsOf } from '../state'
import { Btn, DarkBtn } from './kit'
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
 *
 * Picking is now two things, and they are not the same thing:
 *
 *   - `onPick`  reads a team. Device-local, instant, works with no relay and no GM, and is all
 *               this screen ever did.
 *   - `onClaim` claims it. That is an ask over the wire, it takes a name, and it locks the team
 *               on every other phone. A team someone has claimed is not offered at all.
 *
 * A player who only wants to read along never has to claim; a player who is playing the team has
 * to, because the claim is how the GM learns their name and how the draft knows whose list it is.
 */
export function TeamPicker({
  game,
  me,
  code,
  onPick,
  onClaim,
  onClose,
}: {
  game: Game
  me: string
  code?: string
  onPick: (id: string) => void
  /** Absent when there is no relay to ask over — then this screen is just the old reader. */
  onClaim?: (id: string, name: string) => void
  onClose?: () => void
}) {
  // Which team's claim form is open, and the name typed into it. One at a time: the form is the
  // expanded state of a row, not a dialog.
  const [claiming, setClaiming] = useState('')
  const [name, setName] = useState('')
  const mine = game.teams[me]

  const claim = (id: string) => {
    const trimmed = name.trim()
    if (!trimmed || !onClaim) return
    onClaim(id, trimmed)
    setClaiming('')
    setName('')
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-wash">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-card px-4 py-3 text-white shadow-lg">
        <div className="min-w-0">
          <h1 className="display truncate text-xl">Who are you playing?</h1>
          <p className="truncate text-[11px] text-white/45">
            {code ? `Room ${code}. ` : ''}
            {onClaim && game.picks ? 'Claim your team to pick a list.' : 'This phone remembers your pick.'}
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
                const isMine = t.id === me
                const taken = !!t.claimed && !isMine
                const open = claiming === t.id
                return (
                  <li key={t.id} className="border border-rule bg-paper shadow-sm">
                    <button
                      onClick={() => onPick(t.id)}
                      disabled={taken}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                    >
                      <span className="h-10 w-2 shrink-0 rounded-sm" style={{ background: t.color }} />
                      <span className="min-w-0 flex-1">
                        <b className="display block truncate text-lg">{t.name}</b>
                        <span className="block truncate text-xs text-ink/55">
                          {taken ? `Taken — ${t.player}` : t.player}
                          {n > 0 && ` · ${n} operative${n === 1 ? '' : 's'}`}
                        </span>
                      </span>
                      {isMine && (
                        <span className="display shrink-0 rounded bg-card px-2 py-0.5 text-xs text-white">You</span>
                      )}
                    </button>

                    {/* The claim strip. Only where there is a relay to ask over, and only on a
                        team nobody else holds — a claimed team is not negotiable from here, it
                        is released by its own phone or by the GM in Setup. */}
                    {onClaim && !taken && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-rule px-3 py-2">
                        {t.claimed && isMine ? (
                          <>
                            <span className="flex-1 text-xs text-ink/55">Claimed as {t.player}</span>
                            <Btn onClick={() => onClaim(t.id, '')}>Release</Btn>
                          </>
                        ) : open ? (
                          <>
                            <input
                              autoFocus
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && claim(t.id)}
                              placeholder="Your name"
                              className="min-w-0 flex-1 border border-rule bg-paper px-2 py-1 text-sm"
                            />
                            <Btn onClick={() => claim(t.id)} disabled={!name.trim()}>
                              Claim
                            </Btn>
                            <Btn onClick={() => setClaiming('')}>Cancel</Btn>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-xs text-ink/45">Nobody has claimed this team.</span>
                            <Btn
                              onClick={() => {
                                setClaiming(t.id)
                                // Pre-fill from the team this phone already holds, so switching
                                // teams does not mean retyping your own name.
                                setName(mine?.claimed ? mine.player : '')
                              }}
                            >
                              This is me
                            </Btn>
                          </>
                        )}
                      </div>
                    )}
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

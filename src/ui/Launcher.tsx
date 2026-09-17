import { useEffect, useRef, useState } from 'react'

import {
  type Room,
  allTeams,
  createRoom,
  forgetRoom,
  importGame,
  knownRooms,
  parseHash,
  rememberRoom,
  resume,
  roomGame,
  viewerUrl,
} from '../state'
import { Btn } from './kit'
import { type Dispatch, type Game, type Net } from './shared'

/* ---------- step 0: create or resume ----------
 *
 * The room IS the game now — every new match gets its own code, and the old ones stay in the
 * list with their tokens instead of being overwritten one at a time.
 *
 * Everything here is best-effort against the relay. A dead VPS must not stop a game starting:
 * if `POST /rooms` fails the match still opens, under the `local` storage key, and the GM can
 * share it later. That is the same non-negotiable the whole app rests on.
 */

export function Launcher({ game, dispatch, net }: { game: Game; dispatch: Dispatch; net: Net }) {
  const { room, setRoom } = net
  const [rooms, setRooms] = useState(knownRooms)
  const [link, setLink] = useState('')
  const [watch, setWatch] = useState('')
  const [busy, setBusy] = useState('')

  const start = async () => {
    setBusy('opening a room…')
    let opened: Room | null = null
    try {
      opened = await createRoom()
    } catch {
      // No relay. Play anyway — localStorage is authoritative and always has been.
      setBusy('no relay — starting offline, you can share a room later')
    }
    if (opened) {
      setRoom(opened)
      setRooms(knownRooms())
      setBusy('')
    }
    dispatch({ type: 'reset' })
  }

  /** Open a room this device already knows. Local copy first, so a dead relay costs nothing. */
  const open = async (r: Room) => {
    rememberRoom(r)
    setRoom(r)
    setRooms(knownRooms())
    const local = roomGame(r.code)
    if (local) {
      dispatch({ type: 'replace', game: local })
      return
    }
    setBusy('fetching the match…')
    try {
      const fetched = await resume(r)
      // `null` is honest: the relay has forgotten it and nobody ever saved it.
      dispatch(fetched ? { type: 'replace', game: fetched } : { type: 'reset' })
      setBusy(fetched ? '' : 'nothing saved for that room — starting a fresh match in it')
    } catch {
      setBusy('offline — cannot reach that room from here')
    }
  }

  // Arriving on a GM link is a request to open that match, not to look at a list. `readRoom`
  // has already taken the token off the URL and stored it, but the game itself is not on this
  // device — so fetch it, once per room. Without this the link lands on an empty launcher and
  // the whole point of the link is lost.
  const fetched = useRef('')
  useEffect(() => {
    if (!room?.token || fetched.current === room.code) return
    if (roomGame(room.code)) return // already here; the row is one click away
    fetched.current = room.code
    void open(room)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  const paste = () => {
    const r = parseHash(link.trim().replace(/^.*#/, '#'))
    if (!r?.token) {
      setBusy('that is not a GM link — it needs the /g/ part and the token')
      return
    }
    setLink('')
    setBusy('')
    void open(r)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-white shadow-lg">
        <h1 className="display mr-2 text-2xl">Kill Team GM</h1>
        <span className="display text-xs text-white/50">Start a match, or pick up one you left</span>
        {busy && <span className="display ml-auto text-xs text-amber-300">{busy}</span>}
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <Panel title="New game">
          <p className="mb-3 text-xs text-ink/50">
            Opens its own room, so spectators watching an older match keep watching it. You build the
            alliances, teams, objectives and tac ops one step at a time — or load the usual seven-team
            match on the first step.
          </p>
          <Btn className="display px-3 py-1 text-base" onClick={() => void start()}>
            + New game
          </Btn>
        </Panel>

        <Panel title="Your games">
          {rooms.length ? (
            <ul className="space-y-1.5">
              {rooms.map((r) => (
                <RoomRow
                  key={r.code}
                  room={r}
                  current={r.code === room?.code}
                  onOpen={() => void open(r)}
                  onForget={() => {
                    if (!confirm(`Forget room ${r.code} on this device? The match itself is not deleted.`)) return
                    forgetRoom(r.code)
                    setRooms(knownRooms())
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ink/40">No rooms yet. Start a new game above.</p>
          )}
        </Panel>

        <Panel title="Open a game from another device">
          <p className="mb-2 text-xs text-ink/50">
            Paste the GM link from the device that started the match — it is under the room code on the
            board. <b className="text-flare">Anyone with that link can edit the match</b>, so it is not the
            one to give the table.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…/#/g/ABCD/…"
              aria-label="GM link"
              className="min-w-0 flex-1 rounded border border-rule bg-white px-2 py-1 text-sm"
            />
            <Btn disabled={!link.trim()} onClick={paste}>
              Open
            </Btn>
          </div>
        </Panel>

        <Panel title="Open a match file">
          <p className="mb-2 text-xs text-ink/50">
            A match exported from any device — this needs no room and no relay, and it is the only
            copy that crosses origins, since a browser keeps localhost and the live site apart.
          </p>
          <label className="display inline-block cursor-pointer rounded border border-rule bg-white px-2 py-1 text-sm hover:bg-black/[0.03]">
            Choose a file…
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                setBusy('')
                importGame(f)
                  .then((g) => dispatch({ type: 'replace', game: g }))
                  .catch((err: Error) => setBusy(err.message))
              }}
            />
          </label>
        </Panel>

        <Panel title="Watch a game">
          <p className="mb-2 text-xs text-ink/50">
            A room code alone is read-only — the player's view, one deck of cards, no editing.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={watch}
              onChange={(e) => setWatch(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="ABCD"
              aria-label="Room code to watch"
              className="display w-24 rounded border border-rule bg-white px-2 py-1 text-lg tracking-[.2em]"
            />
            <Btn disabled={watch.length !== 4} onClick={() => location.assign(viewerUrl(watch))}>
              Watch
            </Btn>
          </div>
        </Panel>

        {/* Only when there is something to go back to. A blank game behind this screen is not
            a match in progress, and offering to "return" to it is a lie. */}
        {allTeams(game).length > 0 && (
          <Btn className="display" onClick={() => dispatch({ type: 'stage', value: 'play' })}>
            ← Back to the current match
          </Btn>
        )}
      </main>
    </div>
  )
}

/** One remembered room. The label is derived from the stored snapshot rather than kept as
 *  separate metadata that could drift — if the game is not on this device it simply says so. */
function RoomRow({
  room,
  current,
  onOpen,
  onForget,
}: {
  room: Room
  current: boolean
  onOpen: () => void
  onForget: () => void
}) {
  const g = roomGame(room.code)
  const teams = g ? Object.values(g.teams) : []
  const label = g
    ? g.sides.map((s) => s.name).join(' vs ') || 'Empty match'
    : 'not on this device — will be fetched'
  const where = g
    ? g.stage === 'end'
      ? 'finished'
      : g.stage === 'play'
        ? `TP${g.tp}/${g.tpCount}`
        : 'in setup'
    : ''

  return (
    <li className="flex flex-wrap items-center gap-2 border border-rule bg-white p-2">
      <code className="display rounded bg-black/[0.06] px-2 py-1 text-lg tracking-[.2em]">{room.code}</code>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm">{label}</b>
        <span className="text-[11px] text-ink/45">
          {where}
          {where && teams.length ? ' · ' : ''}
          {teams.length ? `${teams.length} teams` : ''}
          {room.at ? ` · ${new Date(room.at).toLocaleString()}` : ''}
          {!room.token && ' · read only'}
        </span>
      </span>
      {current && <span className="display rounded bg-amber-300 px-1.5 text-[11px] text-ink">current</span>}
      <Btn onClick={onOpen}>Open</Btn>
      <Btn
        className="w-6 px-0 text-xenos"
        title="Forget this room on this device"
        onClick={onForget}
      >
        ×
      </Btn>
    </li>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden border border-rule bg-paper shadow-sm">
      <header className="kt-rule bg-card px-3 py-1.5 text-white">
        <h2 className="display text-xl">{title}</h2>
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

import { useEffect, useState } from 'react'

import {
  allTeams,
  createRoom,
  exportGame,
  gmUrl,
  importGame,
  listSaves,
  loadSave,
  saveMatch,
  type SaveMeta,
  viewerUrl,
} from '../state'
import { DarkBtn } from './kit'
import { type Dispatch, type Game, type Net } from './shared'

/* ---------- rooms ---------- */

/**
 * The GM's share + save strip. Friends open the viewer link and watch; only this console
 * writes. Saving is explicit — the relay never touches Postgres.
 */
export function RoomBar({ game, dispatch, net }: { game: Game; dispatch: Dispatch; net: Net }) {
  const { room, setRoom } = net
  const [saves, setSaves] = useState<SaveMeta[]>([])
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState('')

  // Only the saves list needs fetching; the room itself lives in localStorage.
  useEffect(() => {
    if (room?.token) listSaves(room).then(setSaves).catch(() => {})
  }, [room])

  // `done` matters: this used to clear the message on success, so a save flashed "saving" and
  // then showed NOTHING. "Did that work?" is the one question a save button has to answer.
  const run = async (what: string, fn: () => Promise<unknown>, done = '') => {
    setBusy(what)
    try {
      await fn()
    } catch {
      setBusy('offline — the match is safe locally')
      return
    }
    setBusy(done)
  }

  /**
   * The honest answer to "is it in the database": the server's own list, fetched back after
   * every save rather than an optimistic local flag. Shown even at zero — hiding it is what
   * made the first save of a game feel like nothing had happened.
   */
  const newest = saves[0]
  const savedNote = !room?.token ? null : newest ? (
    <span title={saves.map((x) => `${x.label} · ${new Date(x.saved_at).toLocaleString()}`).join('\n')}>
      <b className="text-white/80">{saves.length}</b> in the database · last{' '}
      {new Date(newest.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  ) : (
    <span className="text-amber-300">not saved yet</span>
  )

  /** A file in and out. Deliberately available with or without a room — it is the only
   *  durable copy that needs no server, and the only one that crosses origins. */
  const files = (
    <>
      <DarkBtn
        className="display"
        onClick={() => exportGame(game)}
        title="Download this match as a file. Works offline, and unlike a save it can be opened on another machine or origin."
      >
        Export match
      </DarkBtn>
      <label
        className="display cursor-pointer rounded bg-white/12 px-2 py-1 hover:bg-white/25"
        title="Open a match file, replacing the current game"
      >
        Import match
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = '' // so re-picking the same file fires again
            if (!f || !confirm(`Replace the current game with ${f.name}?`)) return
            importGame(f)
              .then((g) => {
                dispatch({ type: 'replace', game: g })
                setBusy('')
              })
              .catch((err: Error) => setBusy(err.message))
          }}
        />
      </label>
    </>
  )

  if (!room)
    return (
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
        <DarkBtn
          className="display"
          onClick={() => run('opening', async () => setRoom(await createRoom()))}
          title="Create a room so friends can watch the scoreboard live from their own phones."
        >
          Share a room
        </DarkBtn>
        {files}
        {busy && <span>{busy}</span>}
      </div>
    )

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/50">
      <span className="display">Room</span>
      <code className="display rounded bg-white/15 px-2 py-1 text-lg tracking-[.2em] text-white">{room.code}</code>
      <DarkBtn className="display" onClick={() => navigator.clipboard?.writeText(viewerUrl(room.code))}>
        Copy viewer link
      </DarkBtn>

      {/* One link per player, which is the one the table actually wants: the bare viewer link
          lands on the picker, and a first-time player who picks wrong reads someone else's
          cards all evening. A select rather than a chip per team — this strip already wraps,
          and it is the same control the saves list uses two rows down. */}
      <select
        defaultValue=""
        aria-label="Copy a link that opens one player's cards"
        onChange={(e) => {
          const t = game.teams[e.target.value]
          e.target.value = ''
          if (!t) return
          navigator.clipboard?.writeText(viewerUrl(room.code, t.id))
          setCopied(t.name)
        }}
        className="rounded bg-white/15 px-2 py-1 text-sm text-white"
      >
        <option value="">copy a player's link…</option>
        {allTeams(game).map((t) => (
          <option key={t.id} value={t.id} className="text-ink">
            {t.name}
            {t.player && ` · ${t.player}`}
          </option>
        ))}
      </select>
      {/* Beside the control that caused it, not at the end of the strip — the same rule the
          save readout follows, and its own state so a copy cannot overwrite a save's outcome. */}
      {copied && <span className="text-amber-300">copied · {copied}</span>}
      {room.token && (
        <DarkBtn
          className="display"
          title="Take over as GM on another device. This link carries write access — do not give it to the table."
          onClick={() => navigator.clipboard?.writeText(gmUrl(room))}
        >
          Copy GM link
        </DarkBtn>
      )}

      {/* Saves come BEFORE the file buttons. Export/import used to sit here, which pushed
          "Save match" to the eleventh item in a wrapping strip — findable only if you knew. */}
      <span className="ml-2 h-5 w-px bg-white/20" />
      <span className="display">Saves</span>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="save as…"
        aria-label="Name for this saved match"
        className="w-28 rounded bg-white/15 px-2 py-1 text-sm text-white placeholder:text-white/40"
      />
      <DarkBtn
        className="display"
        title="Write a snapshot of this match to the database. The relay never does this — only this button."
        onClick={() =>
          run(
            'saving…',
            async () => {
              await saveMatch(room, label || `TP${game.tp}`, game)
              setLabel('')
              setSaves(await listSaves(room))
            },
            'saved',
          )
        }
      >
        Save match
      </DarkBtn>

      {/* Outcome shows where the click happened. `busy` wins while it is transient ("saving…",
          "saved", "offline — …"); otherwise the persistent count from the server stands. */}
      {busy ? <span className="text-amber-300">{busy}</span> : savedNote}

      {saves.length > 0 && (
        <select
          defaultValue=""
          aria-label="Load a saved match"
          onChange={(e) => {
            const id = e.target.value
            e.target.value = ''
            if (id && confirm('Replace the current game with this save?'))
              run('loading', async () => dispatch({ type: 'replace', game: await loadSave(room, id) }))
          }}
          className="rounded bg-white/15 px-2 py-1 text-sm text-white"
        >
          <option value="">load a save…</option>
          {saves.map((s) => (
            <option key={s.id} value={s.id} className="text-ink">
              {s.label} · {new Date(s.saved_at).toLocaleString()}
            </option>
          ))}
        </select>
      )}

      <span className="h-5 w-px bg-white/20" />

      {files}
    </div>
  )
}

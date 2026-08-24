import { useEffect, useState } from 'react'

import { createRoom, listSaves, loadSave, saveMatch, type SaveMeta, viewerUrl } from '../state'
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

  // Only the saves list needs fetching; the room itself lives in localStorage.
  useEffect(() => {
    if (room?.token) listSaves(room).then(setSaves).catch(() => {})
  }, [room])

  const run = async (what: string, fn: () => Promise<unknown>) => {
    setBusy(what)
    try {
      await fn()
    } catch {
      setBusy('offline — the match is safe locally')
      return
    }
    setBusy('')
  }

  if (!room)
    return (
      <div className="mt-2 flex items-center gap-3">
        <DarkBtn
          className="display"
          onClick={() => run('opening', async () => setRoom(await createRoom()))}
          title="Create a room so friends can watch the scoreboard live from their own phones."
        >
          Share a room
        </DarkBtn>
        {busy && <span className="text-xs text-white/50">{busy}</span>}
      </div>
    )

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/50">
      <span className="display">Room</span>
      <code className="display rounded bg-white/15 px-2 py-1 text-lg tracking-[.2em] text-white">{room.code}</code>
      <DarkBtn className="display" onClick={() => navigator.clipboard?.writeText(viewerUrl(room.code))}>
        Copy viewer link
      </DarkBtn>

      <span className="ml-2 h-5 w-px bg-white/20" />

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="save as…"
        aria-label="Name for this saved match"
        className="w-36 rounded bg-white/15 px-2 py-1 text-sm text-white placeholder:text-white/40"
      />
      <DarkBtn
        className="display"
        onClick={() =>
          run('saving', async () => {
            await saveMatch(room, label || `TP${game.tp}`, game)
            setLabel('')
            setSaves(await listSaves(room))
          })
        }
      >
        Save match
      </DarkBtn>

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

      {busy && <span>{busy}</span>}
    </div>
  )
}

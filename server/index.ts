/*
 * Room relay + save slots for the Kill Team GM console.
 *
 * Two jobs, deliberately kept apart:
 *   - live sync   : the GM POSTs whole-game snapshots, we fan them out over WebSocket.
 *                   In memory only. The GM's localStorage is the source of truth, so a
 *                   restart here costs nothing — the next tap re-seeds the room.
 *                   The socket also runs the other way: a player's phone sends an `{ ask }`
 *                   frame and we forward it to the GM, who is still the only reducer.
 *   - save slots  : Postgres, written only when someone clicks "Save match".
 *
 * The server never runs the reducer and never imports rules.ts. A snapshot is an opaque blob
 * and so is an ask — we do not know what either one says, which is what keeps the rules in one
 * place. Zero dependencies: Bun.serve does the WebSocket pub/sub, Bun's SQL does Postgres.
 */
import { SQL } from 'bun'

const PORT = Number(process.env.PORT ?? 3003)
const ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// Fail with the actual reason. Compose substitutes an *unset* variable with an empty string,
// so a missing POSTGRES_PASSWORD in the stack env reaches Postgres as a blank password and
// comes back as `28P01 password authentication failed` — which reads like a wrong password
// and sends you hunting in the wrong place. Cost us an afternoon once.
if (!process.env.DATABASE_URL && !process.env.PGPASSWORD)
  throw new Error('No DATABASE_URL and no PGPASSWORD: check POSTGRES_PASSWORD is set on this stack')

// No argument on purpose: Bun reads DATABASE_URL if it is set, and otherwise falls back to
// the discrete PGHOST / PGUSER / PGPASSWORD / PGDATABASE vars. Prod passes the discrete ones,
// because interpolating a password into a URL breaks the moment it contains @ : / ? # or %.
const sql = new SQL()

// One table each. `if not exists` instead of a migration tool: two tables do not need
// Prisma, and migrate-on-start is how you get a container in a restart loop.
await sql`create table if not exists room (
  code text primary key,
  token text not null,
  created_at timestamptz not null default now())`
await sql`create table if not exists save (
  id uuid primary key default gen_random_uuid(),
  code text not null references room(code) on delete cascade,
  label text not null,
  game jsonb not null,
  saved_at timestamptz not null default now())`

/** Latest snapshot per room. ponytail: in-memory, lost on redeploy — the GM's next change re-seeds it. */
const live = new Map<string, string>()

/* ---------- helpers ---------- */

const cors = (req: Request) => {
  const origin = req.headers.get('origin')
  return origin && ORIGINS.includes(origin)
    ? { 'access-control-allow-origin': origin, vary: 'origin' }
    : {}
}

const json = (req: Request, body: unknown, status = 200) =>
  Response.json(body, { status, headers: cors(req) })

// No I/O/0/1 — these codes get read aloud across a table.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const mintCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % 32]).join('')

/** ponytail: plain token compare on a scoreboard. Hash + timingSafeEqual if this ever guards anything real. */
const authed = async (req: Request, code: string) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) return false
  const [row] = await sql`select token from room where code = ${code}`
  return !!row && row.token === token
}

const guard = async (req: Request, code: string) =>
  (await authed(req, code)) ? null : json(req, { error: 'bad token' }, 401)

/* ---------- server ---------- */

const server = Bun.serve<{ code: string; gm: boolean }, Record<string, never>>({
  port: PORT,
  idleTimeout: 120, // a spectator tab sits idle between activations; default 10s would churn

  routes: {
    '/health': () => new Response('ok'),

    '/rooms': {
      OPTIONS: (req) => new Response(null, { status: 204, headers: preflight(req) }),
      POST: async (req) => {
        const code = mintCode()
        const token = crypto.randomUUID()
        await sql`insert into room ${sql({ code, token })}`
        return json(req, { code, token }, 201)
      },
    },

    '/rooms/:code/state': {
      OPTIONS: (req) => new Response(null, { status: 204, headers: preflight(req) }),
      // The live snapshot over HTTP, for a GM resuming a room on a device that never had it.
      // In memory, so this 404s after a relay restart until the owning GM's next change — the
      // client then falls back to the newest save. Token-guarded, unlike the WS: that one is
      // open because every spectator needs it, this one is a GM operation.
      GET: async (req) => {
        const { code } = req.params
        const denied = await guard(req, code)
        if (denied) return denied
        const snapshot = live.get(code)
        return snapshot
          ? new Response(snapshot, { headers: { 'content-type': 'application/json', ...cors(req) } })
          : json(req, { error: 'no live state' }, 404)
      },
      POST: async (req) => {
        const { code } = req.params
        const denied = await guard(req, code)
        if (denied) return denied
        const snapshot = await req.text()
        live.set(code, snapshot)
        server.publish(code, snapshot)
        return new Response(null, { status: 204, headers: cors(req) })
      },
    },

    // Two topics on one socket. `<code>` carries snapshots out to spectators; `<code>:ask`
    // carries player requests back to the GM. Keeping them apart is what stops the GM
    // receiving its own snapshot echo — it POSTs one on every debounced change.
    //
    // `?gm=1` is unauthenticated on purpose: it grants only the ability to HEAR asks, which
    // are a strict subset of what the open snapshot stream already tells you. Acting on one
    // still requires being the GM's browser.
    '/rooms/:code/ws': (req) =>
      server.upgrade(req, {
        data: { code: req.params.code, gm: new URL(req.url).searchParams.get('gm') === '1' },
      })
        ? undefined
        : new Response('expected a websocket', { status: 426 }),

    '/rooms/:code/saves': {
      OPTIONS: (req) => new Response(null, { status: 204, headers: preflight(req) }),
      GET: async (req) => {
        const { code } = req.params
        const denied = await guard(req, code)
        if (denied) return denied
        return json(
          req,
          await sql`select id, label, saved_at from save where code = ${code} order by saved_at desc`,
        )
      },
      POST: async (req) => {
        const { code } = req.params
        const denied = await guard(req, code)
        if (denied) return denied
        const { label, game } = (await req.json()) as { label?: string; game?: unknown }
        if (!game || typeof game !== 'object') return json(req, { error: 'no game' }, 400)
        const [row] = await sql`insert into save ${sql({
          code,
          label: (label || 'untitled').slice(0, 80),
          game,
        })} returning id, label, saved_at`
        return json(req, row, 201)
      },
    },

    '/rooms/:code/saves/:id': {
      OPTIONS: (req) => new Response(null, { status: 204, headers: preflight(req) }),
      GET: async (req) => {
        const { code, id } = req.params
        const denied = await guard(req, code)
        if (denied) return denied
        const [row] = await sql`select game from save where code = ${code} and id = ${id}`
        return row ? json(req, row.game) : json(req, { error: 'not found' }, 404)
      },
      DELETE: async (req) => {
        const { code, id } = req.params
        const denied = await guard(req, code)
        if (denied) return denied
        await sql`delete from save where code = ${code} and id = ${id}`
        return new Response(null, { status: 204, headers: cors(req) })
      },
    },
  },

  fetch: (req) => new Response('not found', { status: 404, headers: cors(req) }),

  websocket: {
    open(ws) {
      if (ws.data.gm) return ws.subscribe(`${ws.data.code}:ask`) // the GM has its own state already
      ws.subscribe(ws.data.code)
      const snapshot = live.get(ws.data.code)
      if (snapshot) ws.send(snapshot) // catch a late joiner up before the next GM change
    },
    // A player asking the GM for something — claiming a team, submitting a roster. Forwarded
    // verbatim and understood no more than a snapshot is: the GM's client decides what is a
    // legal ask and runs the reducer, exactly as it always has. We stay a pipe.
    message(ws, raw) {
      server.publish(`${ws.data.code}:ask`, raw)
    },
    close(ws) {
      ws.unsubscribe(ws.data.gm ? `${ws.data.code}:ask` : ws.data.code)
    },
  },
})

function preflight(req: Request) {
  return {
    ...cors(req),
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
  }
}

console.log(`kt-gm relay on :${PORT}, origins: ${ORIGINS.join(', ') || '(none)'}`)

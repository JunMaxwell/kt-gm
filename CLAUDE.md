# Kill Team GM Console

A single-screen GM console for one specific homebrew **Warhammer 40,000 Kill Team (2024 edition)**
match: seven friends, two alliances, one GM. Five of the players have never played, so the app's job
is to hold the scoring state nobody at the table understands yet, tell people whose activation it is,
and answer "how does shooting work?" without anyone opening a rulebook.

Not a general Kill Team tool. It is hard-wired to this match, and that is deliberate.

## The match

| | |
|---|---|
| Board | 44" × 30" (larger than a standard killzone; terrain density must scale to match) |
| Battle | 4 turning points by default, extendable in the app |
| Imperium | Deathwatch (5), Angels of Death (6), Scout Squad (9), Deathwatch II (5) — **25 operatives** |
| Xenos | Raveners (10), T'au XV26 (7), Ork Kommandos (11) — **28 operatives** |
| Players | 7 — four Imperium, three Xenos |

53 operatives total. Every roster is a legal 2024 composition except the Raveners, who were
deliberately expanded from 5 to 10 (Prime + 4 named + 5 Warriors) at the user's request. Kommandos
reach 11 bodies legally because Grot and Bomb Squig each count as half a selection.

**Balance:** Xenos hold ~380 wounds to Imperium's ~328, and have 3 more operatives — but Imperium
averages 3+/4+ saves against a mostly-5+ Xenos side. The 10-Ravener block is the scariest thing on
the table. If it runs away with the game, the cheapest dial is a Crit Op VP handicap, not model counts.

## Commands

```
bun dev            # the user usually has this running on 5173 — do not kill it
bun test           # 59 reducer tests, the only automated suite
bun run lint       # oxlint
bun run build      # tsc -b && vite build
bun run preview    # serves at /, matching production
```

When checking things in a browser, start a dev server on **a different port (5199)** and `pkill` only
that one. The user's own server on 5173 must survive.

To exercise rooms locally you need the relay and a throwaway Postgres:

```
docker run -d --rm --name kt-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=killteam -p 5433:5432 postgres:16-alpine
DATABASE_URL=postgresql://postgres:dev@localhost:5433/killteam CORS_ORIGINS=http://localhost:5199 bun server/index.ts
VITE_API_URL=http://localhost:3003 bun x vite --port 5199
```

## Stack and layout

Vite 8 + React 19 + TS 6 + Tailwind 4, bun. No router, no state library, no component library, and
**no dependencies on the server side either**. Five files:

| File | Holds |
|---|---|
| `src/rules.ts` | All static data and every tunable: teams, operative catalogues, default rosters, 9 crit ops, 12 tac ops, colours, caps, the kill-grade formula, cheat-sheet text |
| `src/state.ts` | `useReducer` + localStorage + the room client, plus every derived selector (`scores`, `killGrade`, `rotation`, `pairTarget`, `counteract`, …) |
| `src/state.test.ts` | `bun test`. Reducer and selectors only |
| `src/App.tsx` | The whole UI |
| `server/index.ts` | The room relay. Not part of the SPA's tsconfig, so `tsc -b` never sees it |

Game state persists to `localStorage` under a **versioned key** (`killteam-gm/v10`). Any change to
the state shape bumps the version; old saves are ignored rather than migrated. That has happened ten
times and is the right trade for a tool used on one evening. Note localStorage is per-origin, so the
deployed copy and localhost keep entirely separate games.

## Rooms — live spectating

Five of seven players are watching one screen, so the GM can open a **room** and everyone else
follows on their own phone. Two features that deliberately do not share a mechanism:

- **Live sync is an in-memory relay.** The GM POSTs the whole `Game` to `/rooms/:code/state`
  (debounced 400ms — player-name and tac-op fields dispatch per keystroke), the server keeps it in a
  `Map` and `server.publish`es it to every WebSocket on that room's topic. **Postgres is not
  involved.** A relay restart costs nothing: the GM's next tap re-seeds it.
- **Saving is explicit.** "Save match" inserts a snapshot row. Nothing else writes to Postgres.

Non-negotiables that this design rests on:

- **localStorage stays authoritative.** Every relay call is `.catch(() => {})`. A dead VPS must not
  stop a game in progress — verified: kill the relay, keep playing, reload, state survives.
- **Whole snapshots, never actions.** `activate` / `passPair` / `nextTp` are order-dependent and
  `wound` / `cp` / `tacVp` / `critVp` are all deltas, so a replayed or reordered action would
  corrupt state. `{ type: 'replace', game }` is the only action the network ever produces, and it
  merges over `initialGame()` exactly like a localStorage load does.
- **The server never imports `rules.ts`** and never runs the reducer. A snapshot is an opaque blob.
  Viewers run the same selectors on the same state, so scores can't disagree.
- **Read-only is `<div inert>`**, one native attribute over the whole console. It blocks real pointer
  events and keyboard focus and drops the subtree from the a11y tree — no `disabled` threaded through
  36 dispatch sites, and not `pointer-events-none`, which leaves everything tab-focusable. Note a
  programmatic `el.click()` still gets through `inert`; that is fine, since the server rejects writes
  without the token and the next relay message overwrites any local divergence.
- **Role comes from the URL.** `#/r/ABCD` means spectator; otherwise the stored `killteam-gm/room`
  `{ code, token }` means GM. Hash matching, so still no router.
- Room codes drop `I O 0 1` — they get read aloud across a table.

## Kill Team 2024 rules, as verified

Sources used: [Wahapedia kill-team3](https://wahapedia.ru/kill-team3/the-rules/core-rules/),
[KTDash](https://ktdash.app/killteams) for operative stats and per-team tac ops, and two official card
PDFs the user supplied (crit ops sheet, reference sheet). **Trust this section over recollection —
almost every item here corrected a wrong first answer.**

- **21 VP total.** 6 each from Kill Op / Crit Op / Tac Op, plus a secret primary-op bonus of half that
  op's score rounded up, max 3.
- **There are 9 crit ops**, not 3: Secure, Loot, Transmission, Upload, Intel, Extraction, Sabotage,
  Power Surge, Coordinates. Wahapedia only documents the first three (a 1D3 selection); the full deck
  is on the card sheet.
- **Nothing scores in TP1.** Every crit op bars its mission action during the first turning point and
  scores "at the end of each turning point after the first". Tac ops likewise.
- **The cards cap crit VP at 2 per turning point.** This game homebrews 3 — but it's a GM-editable
  field, not a constant.
- **Tac ops: 12 total, 3 per archetype.** A team may only take one from the two archetypes on its own
  datacard. There is no 24-op universal pool — an earlier version of this app had one, built from a
  Wahapedia page that describes an older edition. Names like Headhunter, Challenge, Execution and
  Deadly Marksman are **not** 2024 ops.
  - Seek & Destroy: Sweep & Clear, Dominate, Rout → DW, AoD, Raveners, Orks, DW II
  - Security: Plant Banner, Martyrs, Envoy → DW, AoD, DW II
  - Infiltration: Track Enemy, Plant Devices, Steal Intelligence → Scouts, XV26, Raveners, Orks
  - Recon: Flank, Retrieval, Scout Enemy Movement → Scouts, XV26
  - Teams sharing an archetype pair share a tac op list, so the two Deathwatch teams and Angels of
    Death draw from the same six. Tac ops are per-*archetype*, not faction-unique.
- **Archetypes still exist in 2024.** They no longer gate team building, but they categorise tac ops.
- **There is no Overwatch in 2024.** The equivalent is **Counteract**: available only when you have no
  ready operatives, it performs *any* single 1AP action (not just a Shoot) with a 2" movement cap, and
  only an **Engage** operative can do it.
- **Injured** (below half starting wounds) is **−2" Move and −1 to the weapon's Hit stat** — not an APL
  penalty.
- **Defence** is always 3 dice against a numeric Save; the old Df stat is gone. Cover trades one die
  for an automatic retained success.
- **Kill grades** are keyed to enemy team size and the official table stops around 14 operatives, well
  short of 25/28. The app extrapolates `round(enemyOps × grade / 6)`, clamped so grade 5 always needs
  at least 5 kills — giving 5/9/14/19/23 for Imperium and 4/8/13/17/21 for Xenos. Editable per side.
- **Do not use `tiltos/kill-team-critical-ops`** as a data source. Its `tacops.json` (110 ops) and
  `missions.json` are 2021/2023 edition: third crit op is Capture not Transmission, distances are the
  old ○△□⬟ glyphs, and four of this match's six original teams did not exist yet. It was used only as
  a **visual** reference (see Design).

## Homebrew rules

| Thing | Official | This game |
|---|---|---|
| Objective markers | 3 | **5** (one centre, four within 4" of the centreline, 6"+ apart, 3"+ from an edge) |
| Crit VP per TP | 2 | **3** (borrowed from official Multiplayer Ops; editable) |
| Kill Op / Crit Op | per player | scored **per side**, shared pool |
| Tac Op | per player | per player, but a side's total is capped at 6 so 21 VP still holds |
| CP | — | per player. 1/TP, or **2 for the side without initiative** |
| Drop zone | — | full 44" width × 6" deep on your long edge |

### Paired activations (the Buddy System) — the default mode

Strict one-at-a-time alternation with 53 models leaves six people watching one person play. So:

- A side turn is **two operatives activated by two different players**, resolved together, then the
  turn hands to the other alliance. Four of seven players are engaged at any moment.
- **Timing conflicts:** both declare intent, then roll sequentially (resolve the charge, then shoot
  only if the target survives). Table procedure — nothing for the app to track.
- **Lone Wolf:** if only one player on a side still has ready operatives, that side reverts to single
  activations for the rest of the turning point. The app detects this automatically.
- **Counteract phase:** once a side is dry the other keeps activating back-to-back, and each such
  activation banks the flushed side one Counteract. This is not really a house rule — it is the
  standard 2024 rule, which triggers on exactly this condition.
- A **Paired / Single** toggle in the header falls back to official alternation, which still uses the
  reorderable fixed rotation.

Design note: activating **out of turn** still expends the operative but does not advance the side
turn. The GM is the referee; the app tracks whose turn it is and never blocks a call already made.
Teams already counted in the current pair still count toward the target, so spending a player's last
operative cannot retroactively turn a 2 into a 1 mid-turn.

## Design

The UI deliberately mirrors <https://tiltos.github.io/kill-team-critical-ops/> — light paper, charcoal
`#282c34` chrome, Bebas Neue caps headings, and white cards with a coloured header band. Its
archetype palette is reused verbatim (Seek & Destroy `#bd0003`, Security `#0b6be1`, Recon `#f05c22`,
Infiltration `#5f5f5f`) and its player colours became the side colours (Imperium `#0066a5`, Xenos
`#d1232a`).

Conventions that exist for a reason:

- **Team colours are hex values with an `ink` flag**, not Tailwind classes, because they are used as
  inline band backgrounds. `ink: true` means the band is light enough to need dark text (Deathwatch
  silver, XV26 white).
- **Those same light colours are illegible as text on white**, so team identity is always rendered
  through `TeamPill` — a filled pill — never as coloured text.
- **`BufferedInput` for every numeric field.** A controlled input reading a reducer-clamped number
  cannot be edited: clearing it parses to `NaN`, nothing dispatches, and the old value re-renders over
  the keystroke. It holds raw text locally while focused and resyncs on blur. Do not reintroduce a
  plain `<input value={someClampedNumber}>`.
- **`minmax(0,1fr)` and `min-w-0`, everywhere.** Grid tracks and grid items default to `min-width:auto`
  and refuse to shrink below content, which pushed the right column off-screen and clipped `+`
  buttons. The three-column layout needs `xl` (1280px); below that it stacks with the scoreboard
  hoisted to the top.
- **Fonts are vendored** via `@fontsource/bebas-neue`, not a Google Fonts link, so the page renders at
  a table with no internet.

## Testing

`bun test` covers the reducer and selectors only — 56 tests. There is no React test harness and one
was not added for a single component-state fix; UI behaviour is verified by driving a real browser.
`tsconfig.app.json` excludes `*.test.ts` so `bun run build` doesn't need `@types/bun`.

**Paired activations are on by default**, so any test of the official alternation must opt out with
`reduce(initialGame(), { type: 'paired', value: false })` — the `single()` helper.

Team order within `TEAMS` is `dw, aod, dw2, sct` for Imperium, which is the order `pairEligible` and
`teamsOf` return. Easy to get wrong in assertions.

## Deploy

Two independent pipelines, because the console and the relay change at different rates. Both gate on
lint and tests. **This replaced GitHub Pages** — the old `/kt-gm/` base path and the `VITE_BASE` /
`isPreview` dance in `vite.config.ts` are gone, since both halves now sit at the root of their own
subdomain.

| | Console | Relay |
|---|---|---|
| Trigger | **Cloudflare Workers Builds** — the Git integration, any push to `main`. There is no workflow file | `api.yml`, only when `server/**`, `Dockerfile`, or `docker-compose.yml` change |
| Host | Cloudflare Workers, static assets only — no Worker script (`wrangler.jsonc`) | The VPS, as its **own Dockhand stack** |
| URL | `kt.ydothien.work` | `kt-api.ydothien.work` → host `:3003` via a Pangolin resource |
| Secrets | none — Cloudflare pulls the repo itself | `DOCKHAND_WEBHOOK_URL`, `PANGOLIN_ID`/`_SECRET`/`_ENDPOINT` |

There is deliberately **no `deploy.yml`**. Cloudflare's Git integration already builds on every push,
so a `wrangler deploy` workflow would deploy the same commit a second time and need two secrets that
the Git integration does not. It was deleted rather than kept alongside.

Two settings live in the **Workers Builds dashboard**, and the console is broken without either:

| Setting | Value |
|---|---|
| Build command | `bun run ci` |
| Build variable | `VITE_API_URL=https://kt-api.ydothien.work` |

`bun run ci` is `lint && test && build` (`package.json`), so the gate itself stays version-controlled
and only the *pointer* sits in a dashboard. A red build must not reach the table.

**`VITE_API_URL` is baked in at build time** — a static SPA has no runtime config, so changing the
API host means a rebuild, not an env edit. If it is missing, `API` falls back to `''` (`state.ts`)
and the console POSTs `/rooms` to *its own origin*. That fails almost invisibly: with
`not_found_handling: single-page-application` the asset Worker answers **`index.html` with HTTP
200**, so `res.json()` throws on HTML and the UI just says "offline". This has happened once
already. To check a deployment, grep the served bundle for the host:

```
curl -s https://kt.ydothien.work/assets/index-*.js | grep -c kt-api.ydothien.work
```

The relay reuses the VPS's Postgres but touches **nothing** in the `green-orange` repo. That works
because of two lines in `docker-compose.yml`: `networks.internal` is declared
`external: true` with `name: green-orange_internal` (joining the existing network to reach the
`postgres` container by alias), and the port is published straight to the host so Pangolin can point
at it without a Caddyfile entry. green-orange's Caddy already claims 3000/3001/3002/8055/9000.

The `killteam` database had to be created **by hand, once** — the multi-database init script only
runs on a fresh volume, and prod's has existed for a long time. `server/index.ts` then creates its
two tables with `create table if not exists` at boot; there is no migration tool.

That does **not** make it immune to the restart loop `DEPLOY.md` warns about — an earlier version of
this note claimed it did, and was wrong. The table creation is a top-level `await`, so *any*
connection failure crashes the process and `restart: unless-stopped` retries forever with the same
error. It has happened once, from a mangled password (below).

**Postgres credentials are passed as discrete `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` /
`PGDATABASE` vars, never as an interpolated `DATABASE_URL`.** A password containing `@ : / ? # %`
silently corrupts the URL and Postgres answers `28P01 password authentication failed` for a password
that is perfectly correct — a very expensive red herring. `new SQL()` takes no argument: Bun reads
`DATABASE_URL` when it exists (so the local-dev command above still works) and otherwise falls back
to the `PG*` vars, which is what `docker-compose.yml` sets.

There is no SSH to the VPS. The only way in is Pangolin's WireGuard tunnel followed by Dockhand's
webhook, which is why `api.yml` carries that whole shell block verbatim from green-orange.

### First-time setup, done by hand

Neither workflow can do any of this, so it is recorded here rather than in a plan file. All of it is
one-time; after this, both halves deploy on push.

1. **Create the database.** The init script only runs on a fresh volume and prod's has existed for
   a long time, so this will not happen on its own:
   ```bash
   PG=$(docker ps -qf label=com.docker.compose.service=postgres)
   docker exec "$PG" psql -U postgres -c "CREATE DATABASE killteam"
   ```
   Match on the compose *service label*, not the container name — the project is `green-orange` in
   prod but `yan-portf` in a local checkout. Local socket means trust auth, so no password.
2. **Add the Dockhand stack** pointing at this repo's `docker-compose.yml`, and set `CORS_ORIGINS`
   to the console's origin (`https://kt.ydothien.work`) — not the API's own.
3. **Expose the relay.** Pangolin only fronts `dichvuyan.com` today, so `ydothien.work` has to be
   added there as a second domain, then a resource → `<vps>:3003`, then the DNS record. Check
   nothing else on the host already holds 3003.
4. **Cloudflare:** the Worker, its custom domain, and the Git integration were all set up in the
   dashboard. Set the build command and `VITE_API_URL` build variable per the table above.
5. **Repo secrets:** `DOCKHAND_WEBHOOK_URL` / `PANGOLIN_ID` / `PANGOLIN_SECRET` /
   `PANGOLIN_ENDPOINT`. Note GitHub secrets are write-only, so these cannot be copied out of the
   green-orange repo — get them from Pangolin and Dockhand directly. No Cloudflare secrets are
   needed at all.

**The WebSocket upgrade through Pangolin is the one unverified link** — the VPS ran no realtime
anything before this, so it is greenfield at the edge. Test it first: open a room, join from a phone,
change something. If the `Upgrade` header gets dropped, there are two outs. Either point a *proxied*
Cloudflare DNS record straight at the VPS (Cloudflare terminates TLS and proxies WebSockets on the
free plan, at the cost of a firewall rule and giving up the tunnel), or switch the transport to SSE —
`text/event-stream` is plain HTTP and proxies everywhere, and it is *less* client code, since
`EventSource` reconnects on its own and the retry loop in `useGame` disappears.

## Known gaps

- Seven of the nine crit ops accumulate per-marker points, track a named marker, or count actions
  performed, none of which the marker chips model. Those show **"score by hand"** rather than a wrong
  suggestion; only Secure and Transmission are auto-derived. Adding per-marker counters would fix it.
- No undo. Misclicking ☠ is corrected by clicking it again — or, since rooms landed, by saving
  before something risky and loading back. A save history (one extra column) would give real undo.
- **Spectators are read-only, full stop.** No per-player editing, no claiming a team, no accounts.
  `teams[].player` is a free-text label, not an identity, so the server cannot tell who is who.
  Authentik OIDC is already running on the VPS if that ever changes.
- Rooms are never garbage-collected. Seven friends and a few evenings; add a retention sweep if that
  stops being true.
- Tac ops are archetype-based, so two players on the same side can take the same op (both Deathwatch
  teams could take Rout). The app does not enforce distinct picks within a side. The user was offered
  this and has not asked for it.
- No player-facing second screen, no dice roller.

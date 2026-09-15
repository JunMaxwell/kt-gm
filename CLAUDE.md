# Kill Team GM Console

A single-screen GM console for one specific homebrew **Warhammer 40,000 Kill Team (2024 edition)**
match: seven friends, two alliances, one GM. Five of the players have never played, so the app's job
is to hold the scoring state nobody at the table understands yet, tell people whose activation it is,
and answer "how does shooting work?" without anyone opening a rulebook.

Built for this match, but **no longer hard-wired to it**. Alliances, kill teams, rosters, the
table and every scoring dial are now editable in a **Setup** view — the seven teams below are the
default the app opens with, not a constant. See **Custom matches** for what moved into `Game`.

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
bun test           # 96 tests: the reducer, and a render pass over every panel
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
**no dependencies on the server side either**.

| File | Holds |
|---|---|
| `src/rules.ts` | All static data and every tunable: the **preset** sides and teams, operative catalogues, default rosters, 9 crit ops, 12 tac ops, colours, caps, the kill-grade formula and cheat-sheet text |
| `src/compendium.ts` | The three turning-point phases, the `RefCard` type, and universal equipment. The per-faction cards moved to `src/factions/` |
| `src/factions/` | **Generated.** 48 kill teams — 697 cards and 454 datacards — one module each, plus `index.ts` holding the metadata and the loader |
| `tools/kt_*` | The extractor that generates `src/factions/` from the official PDFs |
| `src/state.ts` | `useReducer` + localStorage + the room client + the undo stack, plus every derived selector (`scores`, `killGrade`, `rotation`, `pairTarget`, `counteract`, …) |
| `src/state.test.ts` | `bun test`. Reducer and selectors only |
| `src/App.tsx` | The page shell only: `App`, the spectator `Viewer`, and `Console`'s layout |
| `src/ui/*` | One file per panel — see below |
| `server/index.ts` | The room relay. Not part of the SPA's tsconfig, so `tsc -b` never sees it |

### `src/ui`

`App.tsx` was one 2,000-line file. It is now a 198-line shell over one file per panel, cut along
the section markers that were already in it:

| File | Holds |
|---|---|
| `ui/shared.ts` | `Dispatch` / `Game` / `Net`, `ROW`, `rowVars`, `onInt`, the faction hooks |
| `ui/kit.tsx` | `Btn`, `DarkBtn`, `BufferedInput`, `Stepper`, `Card`, `TeamPill`, `Label` |
| `ui/TurnBar.tsx` | The sticky header, plus `SingleTurn` / `PairedTurn` |
| `ui/Scoreboard.tsx`, `ui/Objectives.tsx`, `ui/ActivationOrder.tsx` | The three left-column panels |
| `ui/TacOpCard.tsx` | One tac op card. Its own file because three panels use it |
| `ui/OpsBrowser.tsx` | The crit op / tac op catalogue |
| `ui/TeamCard.tsx` | A player's card, plus `EditRow` / `PlayRow` |
| `ui/Compendium.tsx` | A player's ploys and equipment, plus the GM's `CompendiumBrowser` |
| `ui/RoomBar.tsx` | Share / save / load |
| `ui/Setup.tsx` | The pre-game setup view: alliances, teams, scoring dials |
| `ui/render.test.tsx` | Renders every panel at 2 sides, 3 sides and a degenerate 1-team match |

Two conventions the split rests on:

- **The import graph is acyclic and shallow.** Leaves (`shared`, `kit`, `TacOpCard`) know nothing
  about panels; panels import leaves; `App.tsx` imports panels. `TurnBar` → `RoomBar` is the only
  panel-to-panel edge. Do not let a leaf import a panel.
- **`shared.ts` is `.ts`, not `.tsx`, and holds every non-component export.** A `.tsx` that
  exports a constant or a helper beside its components loses React Fast Refresh for the whole
  file — oxlint's `react(only-export-components)` catches it. That rule is why `onInt`
  and the `Dispatch`/`Game`/`Net` aliases do not live in `kit.tsx`.

Game state persists to `localStorage` under a **versioned key** (`killteam-gm/v14`). Any change to
the state shape bumps the version; old saves are ignored rather than migrated. That has happened
fourteen times and is the right trade for a tool used on one evening. Note localStorage is per-origin, so the
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
- **Read-only is structural, and `inert` is gone.** It used to be one `<div inert>` over the whole
  console. That worked while the player view *was* a small console, and stopped working the moment
  it wasn't: `inert` blocks pointer **and** keyboard, so inside it a card carousel cannot be
  swiped. There is now no `inert` anywhere in `src/`.

  What replaces it is that the player view renders one thing that *cannot* write: `Compendium`
  takes no `dispatch` prop at all. Anything added to that view has to clear the same bar.

  The server still rejects writes without the token and the next relay message overwrites any local
  divergence, so a stray click is harmless regardless. That is the backstop, not the mechanism.
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

## Undo

`withHistory` wraps the reducer inside `useGame`: `{ past: Game[], now, last }`, depth 50, Ctrl/Cmd+Z
or the header button. `reduce` itself is untouched and stays a pure `Game -> Game` — `undo` is a
`UiAction`, never an `Action`, so the relay and the tests never see it. Snapshots are structurally
shared, so 50 of them is cheap. Notes:

- **History is memory-only.** It never reaches localStorage or the relay, and a reload clears it.
- **`replace` clears history** rather than recording a step — a loaded save is a new starting point.
- **`player` / `tacOp` coalesce**, or typing one name would eat the whole stack a character at a time.
- The keyboard handler ignores `INPUT`/`TEXTAREA` so it never steals a text field's own undo, and is
  not installed for viewers.

## Design

The cards are styled after **the official Kill Team rules cards** — the same six Warhammer
Community PDFs the compendium text came from. Card anatomy, top to bottom:

| Part | How |
|---|---|
| Black title block | `.kt-band`, with the bottom corners notched by `clip-path`, as printed |
| Kicker | small letterspaced caps in the accent orange — the faction keyword |
| Title | big white Bebas caps — the *card type* ("Firefight Ploy"), never the card's name |
| Name | `.kt-strip` + `.opname`: letterspaced monospace caps in a thin bordered box |
| Body | rules text over `.kt-hex`, a faint hex lattice |

`KtCard` in `ui/kit.tsx` is the single implementation; the compendium, tac op and crit op cards
all go through it. **The three text slots are not interchangeable** — kicker is *who*, title is
*what kind*, name is *which one*. Getting them muddled is the one way to make it stop looking
like a real card.

Palette, sampled from the PDFs: `--color-card` `#101010` (title blocks *and* all app chrome —
one black, never two), `--color-flare` `#e8452a` (kickers, keywords, the rule under every panel
header), `--color-stone` `#e6e4e0` (card body), `--color-fade` (flavour). `--color-ink`
`#282c34` survives as a **text** colour only.

- **Keywords are highlighted by heuristic**, not by hand: `Rules` in `ui/kit.tsx` oranges any
  run of 3+ capitals, minus a `NOISE` stop-list (`APL`, `ATK`, `HIT`, `DMG`, `NAME`). Tagging
  97 cards by hand was not worth it. If a word highlights wrongly, add it to `NOISE`.
- **Panels are square-cornered**, controls stay rounded. The printed cards have no radius.
- **The live card outline is the accent orange**, not a per-kind colour. The printed cards carry
  no coloured outline at all, so an invented palette read as off-brand; orange already means
  "this one, now" on these sheets.
- The page lattice is stroked at 0.03 and the card lattice at 0.06 — the page one sits under
  everything, so it has to be fainter or it reads as noise.

The side and archetype colours are still <https://tiltos.github.io/kill-team-critical-ops/>'s,
credited in the **in-app footer** alongside the Games Workshop trademark line.

Conventions that exist for a reason:

- **Team colours are hex values with an `ink` flag**, not Tailwind classes, because they are used as
  inline band backgrounds. `ink: true` means the band is light enough to need dark text (Deathwatch
  silver, XV26 white). Team colour is still how a *team* is identified — the card chrome is
  black and orange regardless.
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

`bun test` is 96 tests in two files:

- `src/state.test.ts` — the reducer and selectors, 90 tests. `withHistory` is exported purely so
  undo is testable without a React harness.
- `src/ui/render.test.tsx` — four `renderToStaticMarkup` smoke tests that mount **every** panel
  against a 2-alliance game, a 3-alliance game with a hand-built team, a one-team-per-side match
  with no faction cards, and a snapshot naming a team that no longer exists. Not a React test
  harness and not a substitute for one: it catches the crash-on-render class (a `TEAMS.find(...)!`
  that is now `undefined`, a missing per-side record) that the type checker cannot, because
  `SideId` is an open `string`. Interaction is still verified by driving a real browser.

`tsconfig.app.json` excludes `*.test.ts` **and `*.test.tsx`** so `bun run build` doesn't need
`@types/bun`.

**Paired activations are on by default**, so any test of the official alternation must opt out with
`reduce(initialGame(), { type: 'paired', value: false })` — the `single()` helper.

Team order within `PRESET_TEAMS` is `dw, aod, dw2, sct` for Imperium, which is the order
`pairEligible` and `teamsOf` return. Easy to get wrong in assertions.

## Custom matches

`SideId` used to be the union `'imperium' | 'xenos'` and `TEAMS` a 7-element array in `rules.ts`.
Both are now **runtime data on `Game`**, so the GM can build any match from the **Setup** view
(header → *Setup*, or `game.setup`). `initialGame()` still produces exactly the match above, with
the same team ids and the same side ids — which is why the whole reducer suite survived the change.

| In `rules.ts` | In `Game` |
|---|---|
| `PRESET_SIDES`, `PRESET_TEAMS` — seeds, read only by `initialGame` and the Setup team picker | `sides: SideDef[]`, `teams: Record<string, TeamDef>` |
| `CP_PER_TP` | `cpPerTp: { lead, other }` |

- **`TeamDef` absorbed `PlayerState`.** One object now holds a team's identity *and* its
  CP/tac op/VP, because both are editable and both have to ride along in a snapshot.
- **`faction` is the datacard key, and it is not the team id.** `CATALOGUE` and `CARDS` are keyed
  by faction, so the two Deathwatch teams read one deck instead of aliasing it — but
  **`DEFAULT_ROSTER` stays keyed by team id**, because `dw` and `dw2` field *different* operatives.
  Key that on faction and `dw2` silently becomes a copy of `dw`, sharing operative **ids** with it,
  and `g.ops` gives two models one wound track. `fromCatalogue(faction, name, dupe, teamId)` takes
  both for exactly this reason.
- **A hand-built team has no `faction`** and therefore no catalogue and no cards. Every lookup
  tolerates that (`CATALOGUE[t.faction ?? ''] ?? []`); none of them assert.

### The N-side rules

- **`enemy(s)` is gone.** `enemies(g, s)` returns every other alliance, and everything that named
  a singular enemy folds over it: `kills` and `thresholds` count all of them, `counteract` fires
  when *any* other side still has something ready, and `activate` banks a Counteract to **every**
  dry alliance rather than to one foe.
- **The end-of-battle kill bonus needs a strict win over every other side.** A three-way tie at the
  top grade pays nobody. That is the only reading of "beat the enemy" that stays one bonus.
- **`rotation` is an N-way round-robin** — sides cycled from `initiative`, slot `i` taken from each.
  At two sides it reduces to the old alternation exactly, and a test pins that.
- **Deployment edges are a label, not geometry.** Setup shows each alliance the edge its index
  implies — 0 = top, 1 = bottom, 2 = left, 3 = right — and the players lay their models out on the
  real table. The app stores nothing about where anything stands.

### `normalize` and `recast`

`SideId` is an open `string`, so `Record<SideId, T>` no longer makes the compiler tell you when a
per-side record is missing a row — and a missing `crit` row means `scores` calls `.reduce` on
`undefined`. **`normalize(g)` is the single repair point**: it refills all five per-side records
(`crit`, `primary`, `killOverride`, `counteracts`, `order`), drops operatives and rosters of teams
that are gone, and clamps `initiative`/`sideTurn`/`objectives` to live sides. Two rules:

- **`normalize` must never touch `turnIdx`/`pairUsed`** — `replace` runs it on *every* relay
  snapshot, and moving the cursor would knock spectators off the live turn. `recast(g)` is
  `normalize` plus a rewound cursor, and only the setup cases that change the cast use it.
  `teamPatch` picks between them: a change of alliance recasts, a rename does not.
- **`normalize` re-homes an orphan team rather than deleting it.** Deleting is `sideRemove`'s job
  and it does that explicitly, so a malformed snapshot cannot silently empty the match on its way
  through `replace`.

`order` and `pairUsed` are deliberately *not* repaired: `orderedIds` already self-heals at read
time and a stale `pairUsed` id is inert. Fewer stored invariants, fewer things to drift.

### UI consequences

- **`SIDE_IDS` is gone**; panels iterate `game.sides`. `Scoreboard` was already `SIDE_IDS.map(...)`
  throughout, so most of the sweep was mechanical.
- **Tailwind's JIT cannot see an interpolated track list**, and an inline `style` cannot carry the
  `xl:` breakpoint the layout needs. Both grids therefore pass their columns as a **CSS variable**:
  `rowVars(n)` on the scoreboard body feeding `grid-cols-(--kt-row)`, and `columns(n)` on `<main>`
  feeding `xl:grid-cols-(--kt-cols)`. Team columns flank the sticky centre, even-indexed sides left
  and odd right, placed with inline `order`. At two sides this is the original three-column layout
  exactly. Past four alliances the columns are unreadable, so it just stacks.
- **`--color-imperium` / `--color-xenos` in `index.css` are no longer side identity.** They survive
  as palette values, and the remaining `text-xenos` / `bg-xenos` uses in `TeamCard` mean
  "red = destructive", not "Xenos".
- **Stored team picks are validated at render, not at mount.** `Viewer`'s `killteam-gm/me` and
  `CompendiumBrowser`'s selection both used to be checked once in a `useState` initializer; the
  relay can ship a snapshot deleting that team at any moment, so the fallback has to be re-derived
  every render.
- `teamsWithArchetype(teams, a)` takes the team list now, and `TacOpCard` receives the resulting
  pills as a **prop** — it is a leaf and must not reach for `game`.

### The faction library

`src/factions/` holds every kill team Games Workshop publishes rules for — 48 of them, 697
cards and 454 datacards. `FACTIONS` in `src/factions/index.ts` is the metadata list (id, name,
archetypes, colour) and is always in the bundle, because the Setup picker needs it.

**Loading is split, and the split is load-bearing:**

- **The six factions the preset match uses are imported statically.** `initialGame()` builds a
  roster at boot and cannot `await`, so `dw`/`aod`/`sct`/`rav`/`xv26`/`kom` must be there
  synchronously. Vite folds a statically-imported module into the main bundle rather than
  splitting it, so listing them in both maps costs nothing.
- **The other 42 are dynamic imports**, one ~10KB chunk each. Without this the main bundle
  would roughly triple; with it, it went 315KB → 335KB.
- **`usePrefetchFactions` in `App` warms every faction on the table** as soon as the game
  loads. The app is meant to work at a table with no wifi — that is the same reason the fonts
  are vendored — so a match configured beforehand must not need the network to be read. Only
  *browsing* an unused faction hits it.
- `loadFaction(undefined)` and `loadFaction('nonsense')` resolve to `undefined` rather than
  throwing. A hand-built team has no faction at all, and that is a normal state.

**Operative names come from the PDFs verbatim** ("Kommando Boss Nob", "Deathwatch Aegis
Veteran"). The six preset factions keep their **hand-curated** `CATALOGUE` in `rules.ts`
instead, with the shorter names the default rosters are built from — `fromCatalogue` throws on
a miss, so swapping those would break `DEFAULT_ROSTER`. `TeamCard` prefers `CATALOGUE` and
falls back to the library, which is the only place the two conventions meet.

Adding a team from the library gives it the faction's archetypes, colour and cards; only the
six with a `DEFAULT_ROSTER` get a starting roster, because no other team has one legal
composition. The rest start empty and the GM picks from the datacards.


## Deploy

**No pipeline deploys anything.** The console is pulled by Cloudflare; the relay's only workflow
publishes an image and stops. **This replaced GitHub Pages** — the old `/kt-gm/` base path and the
`VITE_BASE` / `isPreview` dance in `vite.config.ts` are gone, since both halves now sit at the root
of their own subdomain.

| | Console | Relay |
|---|---|---|
| Build | **Cloudflare Workers Builds** — the Git integration, any push to `main` | `api.yml` → `ghcr.io/junmaxwell/kt-gm-api:latest`, when `server/**` or `Dockerfile` change |
| Deploy | same step | **by hand**: "Pull & redeploy" on the `kt-gm` stack in Dockhand |
| Host | Cloudflare Workers, static assets only — no Worker script (`wrangler.jsonc`) | The VPS, as its **own Dockhand stack** |
| URL | `kt.ydothien.work` | `kt-api.ydothien.work` → host `:3003` via a Pangolin resource |
| Secrets | none — Cloudflare pulls the repo itself | none — `GITHUB_TOKEN` is automatic |

**`api.yml` builds but never deploys, and that split is deliberate.** Dockhand git-pulls the repo and
runs plain `docker compose up -d`; per green-orange's `DEPLOY.md`, *"the VPS never builds — it only
pulls finished images"*. So `docker-compose.yml` must name a **registry image and never carry
`build:`** — plain `up -d` builds only when the tag is absent, so `build:` would build once and then
serve that stale image forever, and "Pull & redeploy" would hunt for a tag in no registry.

Two things were deleted rather than debugged, and both should stay deleted:

- **`deploy.yml`** ran `wrangler deploy`. Redundant: Cloudflare's Git integration already builds on
  every push, so it deployed the same commit twice and needed two secrets the integration does not.
- **`api.yml`'s deploy half** tunnelled in over Pangolin's WireGuard to POST Dockhand's webhook so the
  redeploy was automatic. The tunnel connected cleanly; the webhook answered **403** and kept
  answering 403. For a relay that changes a few times a year, one click in Dockhand beats a
  four-secret pipeline — so `PANGOLIN_ID`, `PANGOLIN_SECRET`, `PANGOLIN_ENDPOINT` and
  `DOCKHAND_WEBHOOK_URL` are all unused and can be deleted from the repo's secrets.

Note `docker-compose.yml` is **not** in `api.yml`'s path filter: a compose change alters the stack,
not the image, and Dockhand picks it up from git on the next redeploy.

**One** setting lives in the Workers Builds dashboard:

| Setting | Value |
|---|---|
| Build command | `bun run ci` |

`bun run ci` is `lint && test && build` (`package.json`), so the gate itself stays version-controlled
and only the *pointer* sits in a dashboard. A red build must not reach the table.

**There is deliberately no build variable.** `API` in `state.ts` defaults to
`https://kt-api.ydothien.work` in code, and `VITE_API_URL` only *overrides* it for local dev. Two
reasons. First, a Worker serving **only static assets cannot be given runtime variables at all** —
the dashboard refuses with "Variables cannot be added to a Worker that only has static assets", and
build variables live in a different, easily-missed section. Second, the old `''` fallback failed
silently: the console POSTed `/rooms` to its own origin, where `not_found_handling:
single-page-application` answers **`index.html` with HTTP 200**, so `res.json()` threw on HTML and
the UI just said "offline". That cost two debugging rounds. A hard-coded default cannot regress that
way, and the app is hard-wired to one match on one domain regardless.

Either way the host is baked in at **build** time — a static SPA has no runtime config, so changing
the API host is a code change and a rebuild. To check a deployment, grep the served bundle:

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

1. **Create the database and its own role.** The init script only runs on a fresh volume and prod's
   has existed for a long time, so this will not happen on its own:
   ```bash
   PG=$(docker ps -qf label=com.docker.compose.service=postgres)
   docker exec "$PG" psql -U postgres -c "CREATE DATABASE killteam"
   docker exec "$PG" psql -U postgres -c "CREATE USER killteam WITH PASSWORD '<pick one>'"
   docker exec "$PG" psql -U postgres -d killteam \
     -c "ALTER DATABASE killteam OWNER TO killteam; ALTER SCHEMA public OWNER TO killteam"
   ```
   Match on the compose *service label*, not the container name — the project is `green-orange` in
   prod but `yan-portf` in a local checkout. Local socket means trust auth, so no password. The
   third command **must run with `-d killteam`**: `ALTER SCHEMA` is per-database, and without it the
   role cannot create tables, because PG15+ no longer grants `CREATE` on `public` to non-owners.

   green-orange runs everything as the single `postgres` superuser, and this is the one place that
   diverges — for two reasons. You never have to go find the shared password (it lives only in
   Dockhand's secret store, not in git or on any dev machine), and the relay is the only
   *publicly reachable* thing on this box. A dedicated role can still `connect` to the other
   databases — Postgres grants `CONNECT` to `PUBLIC` — but it is denied on every table and on
   `public` in them, so a compromised relay cannot read the CRM or CMS. Verified, not assumed.

   The stack env then uses `POSTGRES_USER=killteam` with that password. No compose change: the
   variable *names* are shared, only the values differ per stack.
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

**The WebSocket upgrade through Cloudflare + Pangolin is verified** — `wss://kt-api.ydothien.work`
returns `101 Switching Protocols` with a valid `Sec-Websocket-Accept`, and a real client opens. This
was the design's one unknown (the VPS ran no realtime anything before), so no SSE fallback and no
proxied-DNS workaround are needed. Two traps found while testing it:

- **The Pangolin resource must have authentication OFF.** With it on, *every* request — `/health`
  included — 302s to `prp.hdc-cloud.org/auth/resource/…`, and a WebSocket upgrade cannot survive a
  redirect. Symptom: spectators see a Pangolin login page.
- **`curl` with `Upgrade:` headers is not a valid test.** curl negotiates HTTP/2, where `Upgrade` is
  meaningless by spec, so the relay's own `426 expected a websocket` comes back and looks exactly
  like a stripped header. Force `--http1.1`, or just use a real client:
  ```
  bun -e 'new WebSocket("wss://kt-api.ydothien.work/rooms/TEST/ws").onopen = () => console.log("open")'
  ```

## Phases and the compendium

Five of seven players have never played. They do not know which phase they are in, and they do
not know which cards that phase lets them use. Rooms shipped the *score* to their phones; this
ships the *rules*.

- **`Game.phase` is `'initiative' | 'strategy' | 'firefight'`** — the three phases of a 2024
  turning point. `nextTp` resets it to `initiative`; **`activate` sets it to `firefight`**,
  since activating *is* that phase and the GM should never have to announce it by hand. Only
  the Initiative → Strategy step is a tap, because that is the moment worth announcing.
- **Zero server change, again.** The phase is one more field on a snapshot the relay treats as
  an opaque blob. Same free ride the board got.
- **`compendium.ts` holds the cards, `rules.ts` holds the tunables.** That is the split; ~97
  cards of rules prose would have doubled `rules.ts` and buried the dials.
- **Every ploy costs 1CP flat in 2024**, which is why the printed cards carry no cost and
  `RefCard` stores none. `PLOY_CP` is the single constant. Equipment that grants a ploy "for
  0CP" says so in its own text.
- **`PHASES[].use` is the only phase → card-kind mapping.** Add a phase or move a card kind
  there, not in the UI.
- Flavour paragraphs are dropped on extraction. Nobody reads flavour while six people wait.

### Where the card data came from

**`src/factions/*` is generated. Do not hand-edit it** — rerun the extractor:

```
tools/kt_fetch.sh          # list + download every PDF, pdftotext -layout, delete the PDFs
python3 tools/kt_generate.py   # write src/factions/*.ts
bun test                   # the completeness checks below are the gate
```

The source is the official Warhammer Community downloads page. It renders its list
client-side, so `kt_fetch.sh` calls the same JSON API the page does:

```
POST https://www.warhammer-community.com/api/search/downloads/
{"index":"downloads_v2","searchTerm":"","gameSystem":"kill-team","language":"english"}
```

That returns all 69 Kill Team downloads in one page; `kt_fetch.sh` filters out mission packs,
update logs and the **Ctesiphus Expedition** (a campaign system, not a kill team) to leave
**48 teams plus the Universal Equipment sheet**.

Facts that cost time to establish, and will again if this is redone:

- **The PDFs print two rules cards side by side**, so `pdftotext -layout` interleaves them.
  `kt_parse.split_page` cuts each page on its gutter — the widest band of columns that is
  blank on ≥99.5% of lines — and a column can still hold two cards stacked, so it is then cut
  again on every kind banner.
- **A long card is printed across several columns.** Fragments share a name and are appended,
  not deduplicated to a winner, or half of Forward Scouting disappears.
- **Flavour is italic, and `pdftotext` drops font info.** It is found by shape instead: the
  rules text begins at the first sentence that either opens like a rule or contains a game
  token (an ALL-CAPS keyword, a measurement, a stat). *Both* signals are needed — bare
  `When`/`While` are not rule openers, because flavour opens that way too ("When roused to
  anger, a battle-brother...") and matching them left the flavour in.
- **Errata are already folded into the card text.** Each PDF says so: *"Rules changes will be
  updated directly into online documents and then listed below."* Transcribe the cards, ignore
  the update log at the end.
- **Neither wiki is usable.** Wahapedia 403s automated fetches and KTDash is a JS app with no
  public API. The PDFs are the primary source and strictly better than both.

**The completeness check is the 2024 format**: every team has exactly **4 strategy ploys, 4
firefight ploys and 4 faction equipment**, and `state.test.ts` asserts it for all 48. Faction
rules vary (1 for Scouts and Kommandos, 16 for Blades of Khaine, whose Aspect Shrines each get
a card). Two teams print no fixed archetypes — Inquisitorial Agents say `ANY` and Blades of
Khaine `SEE REVERSE` — and are given all four, which the GM trims in Setup.

`UNIVERSAL_EQUIPMENT` **is now populated** (10 cards) from the separate Universal Equipment
download, which is why it was empty before: it is in the core rules, not on any team's card.

The extraction was validated against the six decks that had been transcribed by hand: 72 of 83
cards come back byte-identical after whitespace normalisation, and every difference that was
inspected turned out to be **real errata** since the hand transcription — Deathwatch's *Suffer
Not the Alien* gained "or retaliating against", XV26's *Multitrackers* gained a whole second
option. That is the reason to prefer the generated text over the old one.

### The player's phone

**The player view is not a small GM console.** It shows one thing: that player's cards. An
earlier cut gave spectators a "Score" tab holding the whole `Console`, which made the two views
identical — that is gone, and `Console` is now GM-only.

```
Room ABCD — read only        [ Deathwatch — Player 1 ▾ ]
STRATEGY   TP1/4 · 2CP                    IMP 0 · XEN 0
Gain CP, then alternate Strategy Ploys, initiative side first.
┌──────────────────────────────┐
│   ██ DEATHWATCH · 1CP ██     │   ← one card, swipe for the next
│      STRATEGY PLOY           │
│   ┌────────────────────────┐ │
│   │ THE LONG VIGIL         │ │
│   └────────────────────────┘ │
│   Whenever an operative is…  │
└──────────────────────────────┘
          ○ ▬ ○ ○   2/4
 NOW   STRAT  FIRE  GEAR  RULES  TAC OP    ← bottom navigation
  4      4     4     4      2      1
```

- **The shell owns the viewport** (`h-[100dvh]`, `overflow-hidden`). The page itself never
  scrolls on a phone — verified at 390×664.
- **The carousel is CSS scroll-snap, not a library and not touch handlers.** `snap-x
  snap-mandatory` on the rail, `w-full shrink-0 snap-center` on each slide. That buys real
  momentum swiping on a phone, trackpad swiping on a laptop and keyboard scrolling for free. The
  only JS is `Math.round(scrollLeft / clientWidth)` in `onScroll` to light the right dot — do
  not replace this with a JS carousel.
- **Slides are laid out side by side, so every card in the deck is mounted.** A deck is at most
  four cards, so this is cheaper than the remounting a windowed carousel would cost.
- **Categories live in a bottom bar**, under the thumb, the way a native app puts primary
  navigation. Active item is the accent orange with a bar above it; each carries its card count.
- **Tabs are only offered for decks that have cards.** `Now` disappears in the Initiative phase
  rather than sitting there dead; `live` falls back to the first surviving deck.
- **The `Tac op` deck holds all six the team's archetypes allow, not just the chosen one**, with
  the chosen one sorted first and badged "Yours". An earlier cut showed only the picked op, so
  the tab vanished entirely when none was set — meaning a first-time player was never told they
  *had* a tac op. When none is picked the deck still shows the six and says so.
- **Cards stretch to fill the slide** (`className="flex-1"`), so the hex lattice fills the card
  the way the printed art does instead of the card floating in the middle of the screen.
- **Switching deck resets the rail to card 1** — `pick()` does both, or the new deck would open
  at whatever scroll offset the last one ended on.
- **There are no tabs.** The view is one deck of cards; a second tab existed for the board and
  went with it. The deck is fully interactive and still cannot mutate — `Compendium` has no
  `dispatch` prop. See the read-only note in **Rooms** for why that is structural.

**Which team you are playing is a per-device choice**, stored under `killteam-gm/me` and never
in `Game`. `teams[].player` is a free-text label, not an identity — putting the selection in the
snapshot would mean seven players fighting over one field through the relay.

The GM reaches the same decks through `CompendiumBrowser`: one collapsible in the console with a
team chip row above the same `Compendium`, **wrapped in a fixed `h-[26rem]`** because the
carousel is `flex-1` and needs a height to fill inside a collapsible. Shared component,
different frame — the GM is looking things up for other people, not playing a hand.

## Known gaps

- Seven of the nine crit ops accumulate per-marker points, track a named marker, or count actions
  performed, none of which the marker chips model. Those show **"score by hand"** rather than a wrong
  suggestion; only Secure and Transmission are auto-derived. Adding per-marker counters would fix it.
- **No redo.** Undo exists (below) but Ctrl+Shift+Z does not; the `future` array was skipped as
  YAGNI. Undo is also memory-only, so a reload loses it — saves remain the durable escape hatch.
- **A faction the GM has never opened needs the network the first time.** `usePrefetchFactions`
  warms every faction on the table at load, so a configured match is safe offline; browsing an
  unused faction in `CompendiumBrowser` at a table with no wifi will show an empty deck.
- **The generated card text is not proof-read.** 697 cards came out of a layout heuristic. The
  completeness check (4/4/4 per team) and the 72/83 match against the hand transcription are the
  only evidence. Long cards that print a table — Forward Scouting, Chapter Tactics, Kauyon — are
  the ones most likely to read oddly.
- **Operative weapons are still not modelled.** The extractor reads APL/Move/Save/Wounds off a
  datacard but skips the weapon table, so nothing in the app can tell a player what they are
  shooting with.
- **Setup has no undo of its own beyond the normal stack**, and `sideRemove` deletes that
  alliance's teams outright. It confirms first; that is the whole safety net.
- **Spectators are read-only, full stop.** No per-player editing, no claiming a team, no accounts.
  `teams[].player` is a free-text label, not an identity, so the server cannot tell who is who.
  Authentik OIDC is already running on the VPS if that ever changes.
- Rooms are never garbage-collected. Seven friends and a few evenings; add a retention sweep if that
  stops being true.
- Tac ops are archetype-based, so two players on the same side can take the same op (both Deathwatch
  teams could take Rout). The app does not enforce distinct picks within a side. The user was offered
  this and has not asked for it.
- A team's archetypes are free-form in Setup — nothing stops giving one all four, or none. A team
  with none simply has no tac ops to pick from.
- **There is no board in the app, on purpose.** A builder for terrain, marker positions and 53
  operative tokens existed and was deleted: it cost more to set up than it repaid and drifted out
  of sync with the real table within an activation, so it showed the GM something untrue. The
  physical table is the board. `Game.objectives` still tracks who *holds* each marker — that is
  scoring, not geometry.
- No player-facing second screen, no dice roller.

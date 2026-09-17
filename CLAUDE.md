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
bun test           # 111 tests: the reducer, and a render pass over every panel
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
| `src/factions/` | **Generated.** 48 kill teams — 697 cards and 454 datacards (1196 weapons, 617 abilities and unique actions) — one module each, plus `index.ts` holding the metadata and the loader |
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
| `ui/shared.ts` | `Dispatch` / `Game` / `Net`, `onInt`, the faction hooks |
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

Game state persists to `localStorage` under a **versioned key** (`killteam-gm/v17`). Any change to
the state shape bumps the version; old saves are ignored rather than migrated. That has happened
seventeen times and is the right trade for a tool used on one evening. Note localStorage is per-origin, so the
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
- **`KtCard` carries `min-h-fit`, and it is load-bearing.** The carousel gives every card
  `flex-1` inside a fixed-height slide, and a flex item will happily shrink below its content —
  which, with `overflow-hidden` on the card, silently **clips** a long one. Two equipment cards
  were already losing their bottom third before anyone noticed; the datacards made it obvious.
  With `min-h-fit` the card grows instead and the slide's `overflow-y-auto` takes over. Measured
  at 390: zero clipped cards across every deck.
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

`bun test` is 111 tests in two files:

- `src/state.test.ts` — the reducer and selectors, 101 tests. `withHistory` is exported purely so
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
- **The console is a command strip over a team grid, and nothing is a fixed track.** It used to be
  team columns flanking a **fixed 26rem centre**, placed with a CSS-variable track list
  (`columns(n)`) and inline `order`. At three alliances on a 1280px screen that centre took 416px
  and left ~261px per team column, and inside it the scoreboard's per-alliance columns fell to
  ~102px — too narrow for a Stepper, a five-number threshold field and three primary buttons.
  Both `columns(n)` and `rowVars(n)`/`ROW` are gone.
  Two bugs went with them: the inline `order` **beat `xl:order-none` at every width**, so below
  1280px the scoreboard sank below two columns of team cards rather than hoisting to the top; and
  the sticky centre's hardcoded `xl:top-32` under-shot a header that grows with alliance count
  (an extra initiative button, up to `n−1` counteract banners).
- **`--color-imperium` / `--color-xenos` in `index.css` are no longer side identity.** They survive
  as palette values, and the remaining `text-xenos` / `bg-xenos` uses in `TeamCard` mean
  "red = destructive", not "Xenos".
- **Stored team picks are validated at render, not at mount.** `Viewer`'s `killteam-gm/me` and
  `CompendiumBrowser`'s selection both used to be checked once in a `useState` initializer; the
  relay can ship a snapshot deleting that team at any moment, so the fallback has to be re-derived
  every render.
- `teamsWithArchetype(teams, a)` takes the team list now, and `TacOpCard` receives the resulting
  pills as a **prop** — it is a leaf and must not reach for `game`.

### Hand-written factions

`src/factions/*` is generated, **with one exception**: `angron.ts` is homebrew, and its header
says so. Two things make that safe rather than a trap:

- `tools/kt_generate.py` only writes `<fid>.ts` for factions in its own download list, so it can
  never clobber a module whose id is not on Warhammer Community's page.
- **`src/factions/index.ts` is maintained by hand** — the generator does not emit it. That cuts
  both ways: a hand-written faction registered there survives regeneration, and a newly extracted
  one has to be added by hand.

`FactionMeta.custom` marks them. It exists because the completeness guards in `state.test.ts`
encode the *printed* 2024 format — exactly 4 strategy ploys, 4 firefight ploys and 4 equipment —
and homebrew is not bound by it. Those tests are scoped to `!custom`, and a separate test holds
custom factions to the weaker bar that actually matters: non-empty, prefixed ids, real text.

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
- **Wahapedia 403s automated fetches.** The PDFs are the primary source for team rules.
- **KTDash DOES have a public JSON API**, contrary to what this file used to say:
  `https://ktdash.app/api/killteams/<id>` returns a kill team whole, including rules text. It is
  the only place the NEMESIS *allegiance traits* could be found — the dossier defers to physical
  cards for those. Useful when a rule exists but is not in any free PDF.

### The datacards

`parse_datacards` reads everything the operative's card prints below its stat row: the weapon
table, its abilities, its unique actions with their AP cost, and its keywords. Three things
about that layout cost time and will again:

- **A long datacard continues on the other side**, printing the same name twice — once with the
  weapons, once with the abilities. The halves are **merged, never deduplicated to a winner**,
  the same rule the rules cards follow.
- **Abilities and unique actions can print in two columns, interleaved line by line.** So the
  two-column test cannot ask for text on both sides of the *same* line; it counts how many
  lines carry text on each side of the candidate gutter.
- **A unique action's header puts its name and its AP cost at opposite ends of one line**, which
  is exactly what a column finder mistakes for a gutter. Without the guard above, every action
  gets folded into the ability printed above it. This was the one real bug in the parser.

**0AP unique actions are real** — Kasrkin's Medikit, Exaction Squad's Apprehend — so nothing may
assert `ap > 0`. A test pinned that assumption and the data was right, not the test.

The extraction was validated by regenerating over the previous modules: **all 48 factions produce
byte-identical `cards` and `operatives`**, 697 and 454 exactly as before, with the datacards as
pure addition. That is the check to repeat if the parser is ever touched.

**`Datacard` is deliberately not part of `Operative`.** A roster rides in every relay snapshot and
every localStorage save, and this is reference text nobody edits — putting it on the operative
would have added ~29KB to the wire on every debounced change. It lives in the faction module and
is joined back on by name.

**That join is by name because the two naming conventions cannot move.** The preset six field
operatives under the short hand-curated `CATALOGUE` names (`Aegis`), while the PDFs print the
full one (`Deathwatch Aegis Veteran`). `datacardOf` matches when a name's words appear as a
contiguous run in the datacard's, and **the shortest such datacard wins** — without that, `Boy`
matches all eight Kommandos from Breacha to Snipa. A trailing roster duplicate number
(`Warrior 3`) is stripped first. Tests pin that every `CATALOGUE` entry and every
`DEFAULT_ROSTER` operative resolves to exactly one datacard.

**The completeness check is the 2024 format**: every team has exactly **4 strategy ploys, 4
firefight ploys and 4 faction equipment**, and `state.test.ts` asserts it for all 48. Faction
rules vary (1 for Scouts and Kommandos, 16 for Blades of Khaine, whose Aspect Shrines each get
a card). Two teams print no fixed archetypes — Inquisitorial Agents say `ANY` and Blades of
Khaine `SEE REVERSE` — and are given all four, which the GM trims in Setup.

`UNIVERSAL_EQUIPMENT` **is now populated** (10 cards) from the separate Universal Equipment
download, which is why it was empty before: it is in the core rules, not on any team's card.
**It is no longer shown anywhere.** `Gear` used to concatenate it onto every team's equipment,
which meant a player opening a boss saw ladders and barricades before their own rules; the deck
is faction equipment only now, and the constant survives as data nothing renders.

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
 NOW  OPS  STRAT  FIRE  GEAR  RULES  TAC OP   ← bottom navigation
  4    5     4     4     4      2      1
```

- **The shell owns the viewport** (`h-[100dvh]`, `overflow-hidden`). The page itself never
  scrolls on a phone — re-measured at 390 with three alliances: `scrollWidth` 390, and the only
  elements extending past the viewport are the carousel's own slides inside the horizontally
  scrolling rail, which is the swipe surface working as intended.
- **The carousel is CSS scroll-snap, not a library and not touch handlers.** `snap-x
  snap-mandatory` on the rail, `w-full shrink-0 snap-center` on each slide. That buys real
  momentum swiping on a phone, trackpad swiping on a laptop and keyboard scrolling for free. The
  only JS is `Math.round(scrollLeft / clientWidth)` in `onScroll` to light the right dot — do
  not replace this with a JS carousel.
- **Slides are laid out side by side, so every card in the deck is mounted.** A card deck is at
  most four, and the `Ops` deck is one per operative — 11 for the Kommandos, the largest roster on
  this table. Still cheaper than the remounting a windowed carousel would cost.
- **Categories live in a bottom bar**, under the thumb, the way a native app puts primary
  navigation. Active item is the accent orange with a bar above it; each carries its card count.
- **Tabs are only offered for decks that have cards.** `Now` disappears in the Initiative phase
  rather than sitting there dead; `live` falls back to the first surviving deck.
- **The `Ops` deck is the player's own roster**, one `OperativeCard` per operative: the printed
  APL / Move / Save / Wounds row, the live wound bar, the Injured and Conceal/Engage rules
  written out rather than named, then the rest of the datacard — the weapon table, the
  operative's abilities, its unique actions with their AP cost, and its keywords. It reads `teamOps` and `game.ops` straight off the snapshot, so
  it needs no relay change — and it takes no `dispatch`, like every other slide. A team's own
  operatives count as *own* content in `hasOwn`, so a team with a roster and no rules opens on its
  models rather than falling through to the universal equipment everybody shares.
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

## Nemesis operatives (the bosses)

Angron and Farsight are **NEMESIS operatives**, built with the official Custom Builder from
*Kill Team: Nemesis Operatives* — a paid expansion, so none of it is in the free downloads the
extractor pulls. The dossier PDF is in the repo root.

**The statline is not a design choice.** Size picks it outright:

| SIZE | CONTROL | MOVE | SAVE | WOUNDS | WEAPONS |
|---|---|---|---|---|---|
| Small | 4 | 6" | 4+ | 35 | 2 |
| Medium | 5 | 6" | 4+ | 50 | 2 |
| Large | 6 | 6" | 4+ | 75 | 3 |

Angron is Large/CHAOS, Farsight Medium/T'AU EMPIRE. **They differ by tier, not by invention** —
same core rules, same save.

Things that are easy to get wrong, and were:

- **A nemesis operative's durability is wounds plus an extra defence die, never a good save.** All
  three sizes are 4+. An earlier Angron had 50W and a 2+, which is not a legal nemesis operative
  and made him far harder to hurt than the format intends.
- **CONTROL is a distinct stat**, standing in for APL everywhere except spending action points.
  The app has one stat slot, so `Operative.apl` carries the Control value and the datacard card
  says so. That was a deliberate call (card text over a new field), not an oversight.
- **They activate twice per turning point** — that is the core rule, which is why
  `Operative.acts` exists. A player nemesis operative spends 5AP per turning point.
- **They have no faction keyword**, so their kill team's faction rules cannot select them. Angron
  gets nothing from Goremongers.
- **Behaviour (Brawler / Marksman / Battler / Guardian) is NPO-only.** A player-controlled nemesis
  has none; its controller chooses its actions. An earlier Angron had an invented "must charge the
  nearest enemy" rule that the format has no room for.
- **Allegiance trait text is not in the dossier.** It lives on separate cards; KTDash's API is
  where this repo got it.

**Companions of the Emperor** (`companions.ts`) is the third hand-written module — a homebrew
Adeptus Custodes team transcribed from KTDash's JSON API, plus a **Custodian Warden** designed here
and labelled as such on its own card. Two things its faction rule decides rather than the author:
*The Emperor's Finest* says operatives activate **twice** per turning point (`acts: 2`) and that a
dead one "counts as two operatives" for Kill Op scoring (`kv: 2`) — the rule states the kill value
outright, where the house rule of thumb (wounds ÷ 7) would have said 3.

Its source listed 17 equipment entries, 13 of them the **universal** equipment the app already
ships; only the four faction ones were imported. Check that before importing any KTDash team.

Its five operatives' weapons and rules **used to be five `faction` cards** — the only place there
was to put them — so the Rules deck carried five statlines nobody could act on while each
operative's own card showed four bare numbers. They are `datacards` now, and `cards` is left at
exactly the printed 2024 shape: 1 faction rule, 4 strategy, 4 firefight, 4 equipment.

`src/factions/nemesis.ts` holds the shared core-rules card so the two bosses cannot drift apart.
It exports no `cards`/`operatives`, so the faction loader never sees it.

**All three hand-written factions export `datacards`**, in the same shape the extractor emits, so
the player's Ops deck shows them like everyone else. For the bosses each trait is declared once in
the module and spread into both the Rules card and the datacard — the same anti-drift reason
`nemesis.ts` exists.

**The completeness guard for this is deliberately NOT scoped to `custom`.** The 4/4/4 card-format
guard is, because homebrew is not bound by the printed layout — but every operative needs its own
weapons and rules whoever wrote it, and scoping that check is exactly what let all three
hand-written factions ship with no datacards while the other 48 had them. 51 factions, 461
operatives, 1217 weapons, 476 abilities, 159 unique actions, and a test that fails on any gap.

**`Operative.lockOrder` is how an order becomes a stat rather than a call.** Every NEMESIS
operative has **Towering Size** — *"in the Firefight phase, whenever you determine this operative's
order, you cannot select Conceal"* — so Angron and Farsight are locked to Engage. The reducer
refuses `order` and skips them in `teamOrder`, `freshOps` starts them on the locked value, and
both UIs say so. The GM is the referee everywhere else in this app; this one is on the datacard,
and a boss quietly left on Conceal after a mis-tap is barred from counteracting for the rest of
the turning point.

Three operatives have it, and the list is **explicit in `tools/kt_generate.py`, never a regex over
the ability text**: the Kommando **Grot** (*Sneaky Zogger* — the other way round, locked to
Conceal) and the **Bomb Squig** (*Stoopid*), plus the two bosses by hand. A Fellgor Ravager's
prose matches the same phrasing but only loses Conceal *while it holds a Frenzy token*, so a
heuristic freezes all eleven of them wrongly. Note the preset six field operatives from
`CATALOGUE` in `rules.ts`, not from the library, so **Grot and the Squig need it in both places** —
`cat()` takes an optional sixth column for exactly that.

**Towering Size is what makes a boss killable, and the app understates it.** Printed pg 20 reads
*"whenever another operative is performing the Shoot action, being within control range of other
operatives doesn't prevent this operative from being selected as a valid target"* — **other**
operatives, not just friendly ones. The "in other words" sentence that follows it is an
illustration, and `nemesisCore` used to carry only that, which reads as "his own allies don't
shield him" and hides the actual counter-play: **pin the boss with one cheap operative and the rest
of that alliance keeps shooting into the melee.** Angron's own card now states the rule outright — the
**rule only**: a first draft spelled the tactic out too ("pin him with one cheap operative and keep
firing") and the user cut it. These cards print rules, not coaching. Two Towering bullets (Accessible terrain, and temporarily removing a sub-2" terrain feature
he finishes a move in) were missing outright and are now in.

**TOWERING is the core rule's name, not a printed keyword.** The dossier's sample datacard (pg 14)
prints `KEYWORDS: IMPERIUM, NEMESIS, ARMOURED SENTINEL` with SIZE as a separate field — there is no
TOWERING keyword in the format. It is on the two bosses' keyword lines because it is the clearest
flag for a rule that changes how they are played, and it is **not size-gated**: Towering Size sits
under *7. Core Rules* beside Extra Defence and Bulky, so Medium Farsight has it exactly as much as
Large Angron.

**The format gives a nemesis operative no ploys at all.** One *accompanies* a kill team rather
than being one — the dossier's own intro says a kill team fielding one "will have fewer operatives
than normal to accompany it" — so the ploys come from the team it joins, and cannot target the boss
anyway because it has **no faction keyword**. The Custom Builder has no ploy step.

**Angron has a full 4/4 ploy deck regardless, and all of it is homebrew.** The app models each boss
as a standalone team, so there is no accompanying kill team to borrow from and his player would bank
CP every turning point with nothing to spend it on. Every card names **Angron** rather than a
keyword, because a ploy worded "a friendly X operative" could never select him.

| Strategy | Firefight |
|---|---|
| *Blood Tithe* — **0CP**, 5 damage → 2CP, once per TP | *Blood for the Blood God* — heal D3+3 on a kill, once per TP |
| *Heedless Onslaught* — +2" Move and +3" on a Charge, Save worsened by 1 | *No Escape* — free Fight when an enemy Falls Back out of control range |
| *No Sanctuary* — enemies within 6" cannot be given Conceal | *Relentless Carnage* — the wound ladder, below |
| *Unkillable Rage* — survive incapacitation at 10W, once per **battle** | *Butcher's Frenzy* — +3 Atk for one fight, no Fall Back that TP |

**Check every new boss card against `nemesisCore` before writing it.** *Heedless Onslaught*
shipped granting "move through enemy operatives", which **Bulky already grants** — the user caught
it. The core rules card is long and its three rules give away a lot for free: Bulky covers moving
through operatives, Towering Size covers terrain under 2" tall, and between them they also *take*
Conceal, cover and Vantage away. *Wings of the Red Angel* — FLY for one Reposition or Charge —
passed that check but failed the one after it and **has been replaced by *Butcher's Frenzy***: FLY
bought him only terrain 2" or taller, because Bulky already gave him operatives and Towering Size
already gave him everything under 2". Technically not a duplicate, practically not worth 1CP.

*Butcher's Frenzy* fills the gap that left: **nothing in the firefight four made a single fight
decisive.** Relentless Carnage is area damage, No Escape punishes a retreat, Blood for the Blood God
pays out after a kill — so +3 Atk on one sequence is the only card that wins the melee it is used
in. Its cost is that he cannot Fall Back for the rest of the turning point, which keeps every card
in the deck a decision rather than a pure buff.

**Cutting a redundant clause is half a fix — reprice the card too.** *Heedless Onslaught* shipped as
+2" Move **and** move-through-enemies for 1CP and a worsened Save; removing the Bulky duplicate left
1CP and a Save penalty buying +2" Move, which is strictly worse than not using it. It now reads +2"
Move and a further +3" on a Charge, so his charge threat goes 8" → **13"** and the Save trade is a
real decision. Whenever a rules duplicate gets deleted here, check what the card is still worth.

The strategy four each answer a different one of his real weaknesses — he dies crossing open ground
(Towering means no cover, no Conceal, no obscuring), the enemy hides from him, downing him hands the
enemy **ten** kills at `kv: 10`, and his player is permanently broke. The set is deliberately **not**
four wound-trades: bleeding is the theme, but four of them would just kill him.

**Two of them buy their effect with wounds**, which is the whole character. *Relentless Carnage*
replaced a flat D3+3 area hit the user judged too strong: 3 / 6 / 10 damage to Angron for one hit,
two hits, or two hits at 4" for 0CP (that tier once per turning point). *Blood Tithe* runs it the
other way, 5 damage for 2CP. Both require he have strictly **more** wounds remaining than the cost,
so neither can kill him, and both walk a 75W boss toward Injured — the cost is real.

**`RefCard.cp` exists because of `Blood Tithe`, and it is not cosmetic.** `RefCardView` dims a ploy
the team cannot afford and badges it `need 1CP`; a 0CP ploy without the field greys itself out at
exactly 0CP, which is the one moment you would reach for a bleed-for-CP card. Absent means
`PLOY_CP`, so all 48 extracted factions are untouched. *Relentless Carnage*'s conditional 0CP tier
is **not** expressible as a flat number and stays 1CP on the badge — correct for its base use, and
the card text carries the rest. **Farsight still has none**; he is the untouched format baseline,
and that asymmetry is deliberate rather than an oversight. A GM wanting more can write them in
Setup, where the card editor already offers all four card kinds.

### Still unread

The per-mission-pack activation and AP limits (Joint Ops pg 34, Nemesis Ops pg 46).

**The team-size reduction HAS now been read** (pg 35, *Kill Team Selection*), and it settles what a
boss costs. A NEMESIS operative **must share its kill team's allegiance keyword** — Angron is
CHAOS, so he can only join a CHAOS kill team — and that team then fields a reduced number of
operatives *alongside* him. Row = the team's normal starting size, column = the boss's size:

| normal | Small | Medium | Large |
|---|---|---|---|
| 5 | 4 | 3 | 2 |
| 6 | 4 | 3 | 2 |
| 7 | 5 | 4 | 2 |
| 8 | 5 | 4 | 3 |
| 9 | 6 | 5 | 3 |
| 10 | 7 | 5 | 3 |
| 11 | 7 | 6 | 4 |
| 12 | 8 | 6 | 4 |
| 13 | 9 | 7 | 4 |
| 14 | 9 | 7 | 5 |

This is also the answer to "where are the boss's ploys": **a NEMESIS operative is not a kill team,
it joins one**, and the ploys are the accompanying team's. The app models Angron and Farsight as
standalone teams, so there is no kill team attached — which is why Farsight's Strat/Fire tabs are
empty and why Angron's four are marked homebrew in his own module.

**The Custom Builder HAS now been read and checks out.** Its seven steps are 1 Allegiance,
2 Size, 3 Behaviour (NPO only), 4 Weapons, 5 Traits, 6 Name, 7 Core Rules. Verified against what
this repo already had: the size table is exactly S 4/6"/4+/35/2, M 5/6"/4+/50/2, L 6/6"/4+/75/3
(pg 15); chain weapon is 4/3+/5/6 Brutal Rending and power weapon 4/3+/5/7 Lethal 5+ (pg 18), so
Angron's 5 ATK really does come from Paired weapon; and *Fury*, *Close-range Lethality*, *Let the
Galaxy Burn* and *Supporting Fire* match the trait tables on pg 19 verbatim. The core rules on
pg 20 are exactly three: Extra Defence, Bulky, Towering Size.

**An unspent weapon selection converts to an extra nemesis trait** — stated twice, on pg 16 and
again on pg 19: *"each weapon selection you didn't use in the Weapons step grants you an extra
nemesis trait selection, but you cannot select a nemesis trait the operative already has."*

**Angron spends two of his three selections, and the third buys *Implacable*.** He is Spinegrinder
(chain weapon, ATK 4) + Samni'arius (power weapon, ATK 4), with *Fury* and *Implacable* as his two
nemesis traits. He used to spend the third on **Paired weapon** — a selection, not a weapon: the
melee table (pg 18) prints it with no ATK, HIT or DMG and its whole rule is *"select one other melee
weapon this operative has and add 1 to its Atk stat"*, which is why Spinegrinder read ATK **5** in
every earlier version of this file. Its ranged twin is Twinned weapon (pg 17), granting Ceaseless.

*Implacable* is *"ignore any changes to this operative's weapon stats from being injured"*, so he
holds HIT 3+ on both weapons down to his last wound while Injured still costs him 2" of Move. That
was the user's pick over *Tenacious* (the mirror: keep the Move, lose the Hit) and over taking both,
which would have cost a second selection and therefore Samni'arius outright. It matters more than
it looks, because **two of his ploys wound him on purpose** and *Unkillable Rage* leaves him at 10W
— the Injured band is where this build expects to live.

**The dossier is a scan** — 80 pages from an HP MFP with no text layer, so `pdftotext` returns
nothing at all and the extractor cannot touch it. Read it as page images, or OCR it first.

## The console layout

Header, then a **command strip** (scoreboard + objectives, full width), then **one team column per
alliance**, then a single reference drawer. Three things carry the density:

- **The scoreboard is one block per alliance, stacked.** Rows scale to any alliance count; columns
  inside a fixed panel did not.
- **Team cards collapse to a 40px strip** — colour, name, player, ready count or a nemesis
  operative's `used/acts`, and a wound bar — and expand themselves while the team can act.
  Auto-expand is **capped at `pairTarget`**, not every eligible team: a four-player side had all
  four open at once, which was the crowding this was meant to fix, and the Buddy System only ever
  spends two. `open` in `TeamCard` only ever *forces* a card open, so pinning one does not make it
  snap shut on the next hand-off.
- **One tabbed `Reference` drawer** (`App.tsx`) holds the ops browser, the compendium browser, the
  activation order and the cheat sheet. These were three separate `<details>` stacked under
  `<main>`, so reaching any of them meant scrolling past every roster. **Activation order moved in
  here** — the collapsed team strips already show ready/gone per team grouped by alliance, so the
  panel's remaining job is its reorder controls.

**The `<main>` track list is a CSS variable, never an inline `grid-template-columns`.** An inline
style cannot be gated by `xl:`, so it would force one ~110px column per alliance onto a phone —
this file warned about exactly that, and the first cut of this layout did it anyway. One column
below `md`, two from `md`, one per alliance from `xl`. Measured, not assumed: an iframe probe at
390 / 414 / 768 / 1280 showed `scrollWidth` equal to the viewport at every step, with the grid
resolving to `358px`, `382px`, `360px 360px`, and `405px × 3`.

`Scoreboard` reads `game.crit[side.id] ?? []`. `normalize` guarantees the row exists, but a missing
one would white-screen the whole console mid-game, and that is not a trade worth making for one
`??`.

## Boss fights — the app support underneath

The two bosses above are NEMESIS operatives; this is the machinery that lets the app hold one.

- **`Operative.kv`** is how many kills downing it is worth. Absent means 1, and that default is
  the whole reason adding the field changed no existing test: `killValue()` sums `killWorth` over
  a list, so a roster of plain operatives sums to its own length and the published ladders
  (5/9/14/19/23 and 4/8/13/17/21) are untouched. `kills` and `thresholds` both fold over value
  rather than counting bodies, and **so does the Scoreboard's "N of M down"** — that readout
  computes "the enemy" through its own local closure, separate from `state.ts`, so both have to
  be weighted or the readout and the grade disagree.
  Rule of thumb when setting one: **kv ≈ wounds ÷ 7** — Angron is 75W/kv 10, Farsight 50W/kv 7.
- **`TeamDef.cards`** holds cards the GM typed. They live on the team, not in a `Game.cards`
  record, and that is the entire trick: `normalize` already prunes `g.teams`, so deleting a team
  or an alliance takes its cards with it and **no cleanup code was needed**.

Three details that are load-bearing:

- **GM cards are merged ahead of the faction deck, and the empty-deck fallback never lands on
  universal equipment while the team has rules of its own.** Those ten cards belong to everybody
  and they sort before `faction`, so without the guard a player opening a boss sees ladders and
  barricades instead of his rules. This bit twice: once for GM-written cards, and again for
  Angron once he was rebuilt with faction cards only.
- **`cardAdd`/`cardPatch`/`cardRemove` are their own actions rather than `teamPatch`** so that
  one card edit is one undo step. `teamPatch` coalesces per team, which would merge every card
  edit on a team into a single step.
- **`stepKey` now composes every id the action carries.** It used to be
  `'teamId' in a ? … : 'id' in a ? … : a.type`, and `cardPatch` carries *both* a `teamId` and a
  `cardId` — so `teamId` won and edits to two different cards on one team collapsed into one undo
  step. A test pins this.

**`Operative.acts`** is how many times an operative activates in a turning point; absent means 1.
`OpState.expended` used to be the whole story, and it is still what `readyCount` and Counteract
eligibility read — `OpState.used` counts activations underneath it and `expended` becomes
`used >= acts`. The correction path (clicking an expended operative) decrements rather than
clearing, so a boss can be walked back one activation at a time. Without this a two-activation
operative is a note in the GM's head, and the reducer would treat its second activation as a
correction — banking no Counteract and not advancing the turn.

`Stepper` also gained an optional `onSet`, which turns its number into a typed field. Stepping a
75-wound boss down by a 12-damage hit is twelve clicks with the table waiting. The caller converts
the typed absolute into a delta, so the `wound` action and its clamp are unchanged.

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
- **Nothing a datacard prints is modelled beyond the card itself.** Weapons, abilities, unique
  actions and keywords are all extracted, and the two NEMESIS bosses carry hand-written ones.
  Points costs are parsed and then dropped: this app does not do list building. Farsight has no
  ploys, which is the format, not a gap; Angron's four are homebrew — see **Nemesis operatives**.
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

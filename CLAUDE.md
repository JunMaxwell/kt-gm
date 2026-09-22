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
bun test           # 208 tests: the reducer, and a render pass over every panel
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
| `src/compendium.ts` | The three turning-point phases, the `RefCard` type, universal equipment, and the universal **weapon rules** glossary. The per-faction cards moved to `src/factions/` |
| `src/factions/` | **Generated.** 48 kill teams — 697 cards and 454 datacards (1362 weapons, 759 abilities and unique actions) — one module each, plus `index.ts` holding the metadata and the loader |
| `tools/kt_*` | The extractor that generates `src/factions/` from the official PDFs |
| `src/fx/` | **Hand-written.** What each ploy and each piece of equipment DOES, one module per faction |
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
| `ui/cards.tsx` | `OperativeCard` and `RefCardView` — same reason: the deck and the draft both draw them |
| `ui/Carousel.tsx` | The swipe rail, one `Slide`, the dots. Shared by the deck and the draft |
| `ui/OpsBrowser.tsx` | The crit op / tac op catalogue |
| `ui/TeamCard.tsx` | A player's card, plus `EditRow` / `PlayRow` |
| `ui/Compendium.tsx` | A player's ploys and equipment, plus the GM's `CompendiumBrowser` |
| `ui/RoomBar.tsx` | Share / save / load. Rendered by **both** `TurnBar` and `Setup` |
| `ui/Setup.tsx` | The setup **wizard** — the four steps, and the rail/Back/Next shell over them |
| `ui/Launcher.tsx` | Step 0: new game, the room list, resume by GM link, watch by code |
| `ui/Glossary.tsx` | The faction glossary: the index of all 53 kill teams, and `Pack`, one team's printable rules pack |
| `ui/EndScreen.tsx` | Step 6: the final scoreboard |
| `ui/TeamPicker.tsx` | The spectator's "who are you playing?" screen, and claiming a team |
| `ui/Draft.tsx` | The player's own list: a carousel per tab — operatives, faction gear, universal gear |
| `ui/Effects.tsx` | The effect form and the in-effect list. Shared by the GM's drawer and a phone |
| `ui/render.test.tsx` | Renders every panel at 2 sides, 3 sides, a degenerate 1-team match and a blank new game |

Two conventions the split rests on:

- **The import graph is acyclic and shallow.** Leaves (`shared`, `kit`, `TacOpCard`, `cards`,
  `Carousel`) know nothing about panels; panels import leaves; `App.tsx` imports panels.
  `TurnBar` → `RoomBar` and `Setup` → `RoomBar` are the only panel-to-panel edges, and they are
  the same edge twice: `RoomBar` imports nothing but `state`, `kit` and `shared`, so it is a leaf
  in everything except where the table lists it. Do not let a leaf import a panel — when a second
  panel needs something a panel owns, the thing moves down to a leaf. That is how `cards.tsx` and
  `Carousel.tsx` came out of `Compendium` once `Draft` needed them.
- **`shared.ts` is `.ts`, not `.tsx`, and holds every non-component export.** A `.tsx` that
  exports a constant or a helper beside its components loses React Fast Refresh for the whole
  file — oxlint's `react(only-export-components)` catches it. That rule is why `onInt`
  and the `Dispatch`/`Game`/`Net` aliases do not live in `kit.tsx`.

Game state persists to `localStorage` under a **versioned key, one game per room**:
`killteam-gm/v21/<code>`, or `killteam-gm/v21/local` when no room could be opened. Any change to
the state shape bumps the version; old saves are ignored rather than migrated. That has happened
twenty-one times and is the right trade for a tool used on one evening. Note localStorage is per-origin, so the
deployed copy and localhost keep entirely separate games.

The `local` key is written even on a fresh device that has never opened a room — the reducer boots
to `blankGame()` before the launcher creates one. It is one orphan entry, not worth a migration.

## The GM flow

`Game.setup: boolean` used to choose between one 451-line panel stack and the board. It is now
`Game.stage`, a cursor:

```ts
export type Stage = 'rooms' | 'alliances' | 'teams' | 'config' | 'tacops' | 'play' | 'end'
export const STEPS: Stage[] = ['alliances', 'teams', 'config', 'tacops']
```

| Stage | View | Gate to leave |
|---|---|---|
| `rooms` | `Launcher` — new game, the room list, GM link, watch by code | — |
| `alliances` | Alliances, plus *Load the usual match* while the match is empty | two alliances |
| `teams` | One add-team picker **per alliance**, then the rosters | every side has a team, every team an operative |
| `config` | The live objective markers, the scoring dials, the crit op, GM-written cards | none — nudge only |
| `tacops` | One tac op picker per team, grouped by alliance | none — nudge only |
| `play` | `Console`, unchanged | — |
| `end` | `EndScreen` — the final scoreboard | — |

- **`rooms` is a stage rather than device state**, so every button that reaches it is an
  ordinary `dispatch` instead of a setter threaded through `Net` to `TurnBar` and `RoomBar`. It
  costs a meaningless `stage: 'rooms'` in the odd relay snapshot, which no spectator reads —
  `net.viewer` wins in `App` before any stage is consulted. The same free ride `phase` got.
- **`blankGame()` is two EMPTY alliances, never zero.** `normalize` materialises an "Alliance 1"
  out of an empty list and runs on every setup edit *and* every `replace`, so `sides: []` would
  sprout a phantom alliance on the first click or the first relay round-trip. Two is the floor
  `normalize` already believes in, and it gives step 1 something to rename. It is built as
  `recast({ ...initialGame(), ... })` so its shape cannot drift from `Game`.
- **`reset` is "new game" now**, and the preset seven-team match is a *button* rather than an
  action: `replace` over `initialGame()`, which already clears the undo stack — correct, because
  a loaded preset is a new starting point.
- **`finish` sets `finished` AND `stage`** in one reducer case, so "End battle" stays one undo
  step. `finished` is **not** derived from `stage === 'end'`: the escape hatch lets the GM step
  off the end screen to fix a dial, and deriving it would silently revoke the +1 kill-op bonus in
  the scoreboard he is reading. One flag, two readers.
- **Setup stays reachable mid-match** — late players arrive, teams get cut — through a step menu
  in the header. Every step offers *To the match* once the gates pass, so the wizard needs no
  "is a match in progress" concept to double as an escape hatch.
- **The wizard carries the room strip too**, on every step. It did not for as long as setup
  existed, and that was survivable only while the players had nothing to do until the match
  began. The draft happens *during* setup, so the viewer link has to be on the screen the GM is
  building the match on — reaching it used to mean walking onto the board, which is the very
  thing that used to close the draft. `Setup` takes `net` for this and nothing else.
- The gates are per-step. The old single `blocked` ladder said all of it at once on one screen.
- **`bun test` does not typecheck**, so the `setup` → `stage` rename broke nothing at runtime and
  three things under `tsc -b`. `bun run ci` is the gate, not `bun test`.

## Rooms — live spectating

Five of seven players are watching one screen, so the GM can open a **room** and everyone else
follows on their own phone. **A room is a game**: every new game mints its own code, and the
rooms this device has opened are kept as a list (`killteam-gm/rooms`, newest first, capped at 20)
rather than the single slot that `createRoom` used to overwrite — overwriting it orphaned the
previous room's token, and the token is the only thing that can ever read that room's saves again.

Two features that deliberately do not share a mechanism:

- **Live sync is an in-memory relay.** The GM POSTs the whole `Game` to `/rooms/:code/state`
  (debounced 400ms — player-name and tac-op fields dispatch per keystroke), the server keeps it in a
  `Map` and `server.publish`es it to every WebSocket on that room's topic. **Postgres is not
  involved.** A relay restart costs nothing: the GM's next tap re-seeds it.
- **Saving is explicit.** "Save match" inserts a snapshot row. Nothing else writes to Postgres.
  **The strip says so out loud**, because for a long time it did not: `run()` cleared its message
  on success, so a save flashed "saving" and then showed nothing, and the `load a save…` select
  is hidden at zero — meaning the *first* save of a game produced no feedback whatsoever. The
  readout now reads **`N in the database · last HH:MM`**, or `not saved yet`, and it is derived
  from `listSaves` — **the server's own list, re-fetched after every save** — rather than an
  optimistic local flag, so it survives a reload and cannot claim a save that did not land. The
  outcome renders beside the button that caused it, not at the end of the strip.
  Saves also come *before* Export/Import in the strip: file buttons there once pushed
  "Save match" to the eleventh item in a wrapping row.

Non-negotiables that this design rests on:

- **localStorage stays authoritative.** Every relay call is `.catch(() => {})`. A dead VPS must not
  stop a game in progress — verified: kill the relay, keep playing, reload, state survives.
- **Whole snapshots DOWN, never actions.** `activate` / `passPair` / `nextTp` are order-dependent
  and `wound` / `cp` / `tacVp` / `critVp` are all deltas, so a replayed or reordered action would
  corrupt state. `{ type: 'replace', game }` is the only action the relay's *downstream* ever
  produces, and it merges over `initialGame()` exactly like a localStorage load does.
  Upstream is a **request**, not an action applied anywhere but the GM's own reducer — see
  **The player's draft**. There is still exactly one writer.
- **The server never imports `rules.ts`** and never runs the reducer. A snapshot is an opaque blob.
  Viewers run the same selectors on the same state, so scores can't disagree.
- **Read-only is structural, and `inert` is gone.** It used to be one `<div inert>` over the whole
  console. That worked while the player view *was* a small console, and stopped working the moment
  it wasn't: `inert` blocks pointer **and** keyboard, so inside it a card carousel cannot be
  swiped. There is now no `inert` anywhere in `src/`.

  What replaces it is that the player view renders one thing that *cannot* write: `Compendium`
  takes no `dispatch` prop at all. Anything added to that view has to clear the same bar — and
  **the draft did not change this**. `TeamPicker` and `Draft` take `net.ask`, which can send three
  team-scoped requests and nothing else; the card deck still has no write prop of any kind.

  The server still rejects writes without the token and the next relay message overwrites any local
  divergence, so a stray click is harmless regardless. That is the backstop, not the mechanism.
- **Role comes from the URL.** `#/r/ABCD` means spectator, `#/g/ABCD/<token>` means GM, and
  otherwise the stored `killteam-gm/room` `{ code, token }` means GM. Hash matching, so still no
  router.
- **The GM link carries the write token, and the hash is stripped on arrival.** That is what lets
  a GM take the console over on another device. `history.replaceState` clears it immediately:
  the realistic leak is not `Referer` (fragments are never sent) but the GM copying the address
  bar to share the match, or projecting it, and handing seven people write access. The token is
  already in `localStorage` by then, so a reload still lands in the room.
- **Arriving on a GM link auto-resumes.** Setting the room is not enough — the match is not on
  that device. `resume()` tries `GET /rooms/:code/state`, then the newest save, then gives up and
  says so. Without the auto-fetch the link lands on an empty launcher and its whole point is lost.
- **`GET /rooms/:code/state` is token-guarded even though the WebSocket is not.** The open WS is
  the spectator affordance the whole app rests on; this route is a GM operation.
  **Its 404 is the normal path, not an edge case** — `live` is an in-memory Map lost on every
  redeploy and not re-seeded until the owning GM's next tap, so after a restart the Postgres save
  is what actually answers. A room nobody ever saved has nothing anywhere, and the launcher says
  exactly that rather than inventing a third store.
- **There is no room-listing route, on purpose.** The `room` table has no owner column, so a
  `GET /rooms` would enumerate everybody's. The list is client-side; the GM link is how a room
  crosses devices.
- **No `GET /saves/latest`** — it would shadow `/saves/:id` and hand Postgres `where id =
  'latest'` (uuid cast error, 500). `listSaves` is already `order by saved_at desc`; take `[0]`.
- **`api()` throws on a non-2xx**, because a 401 body is valid JSON: without it `loadSave`
  returns `{error:'bad token'}` as if it were a `Game` and `listSaves` hands the UI a non-array
  to `.map`. A wrong or revoked GM link is a first-class user path now.
- **Export/import is the third way out, and the only one that needs no server.** The relay is
  live and in memory; "Save match" is Postgres and room-scoped; a **match file** is neither. It
  is also the only copy that crosses origins — localStorage is per-origin, so a save made on
  `localhost` is invisible to `kt.ydothien.work` and vice versa. Native `Blob` + `<a download>`
  out, `<input type="file">` in; no dependency, because a `Game` is already a serialisable blob
  and `replace` already merges one over `initialGame()`.
  - **`importGame` is a trust boundary and checks the shape**, because the file comes from
    anywhere. `replace` fills in what is *missing* and `normalize` repairs what *dangles*, but
    neither survives a field of the wrong TYPE: `sides: "hello"` has a `.length` and then dies
    on `.map`. Three checks — object, `sides` array, `teams` object — stand between a bad file
    and a white screen, and each failure names itself rather than throwing.
  - Export sits in `RoomBar` (with or without a room) and on the `EndScreen`, where the result
    is about to be thrown away by "New game". Import sits in `RoomBar` behind a `confirm`
    (it replaces a game in progress) and on the `Launcher` without one (nothing to lose there).
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
  field, not a constant. The 3 is verified as the official **Multiplayer Ops** cap, verbatim: "to a
  maximum of 3VP per turning point".
- **Multiplayer Ops is the official precedent for two things this app invented**, and it is worth
  knowing where it disagrees:
  - It weights kills by durability — operatives with **Wounds 12 or more count as two**. That is far
    coarser than this app's `kv` rule of thumb (wounds ÷ 7), which would put Angron at 10 where the
    official rule puts him at 2.
  - It scores N sides by **rank, not by pool**: at the end of each turning point after the first,
    1st = 2VP, 2nd = 1VP, 3rd and 4th = 0, and ties share the rank at the higher end. This app keeps
    per-side pools instead, which is a deliberate divergence, not an oversight.
- **"Nothing scores in TP1" is enforced per-op, not by a blanket rule** — every crit op's mission
  action is barred during the first turning point and every end-of-TP trigger reads "after the
  first". **The kill op is the exception**: its VP fires "whenever you move to a new kill grade",
  with no turning-point-1 exclusion stated anywhere.
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
  ready operatives, it performs any single 1AP action **excluding Guard** (so not just a Shoot) with a
  2" movement cap, and only an **Engage** operative can do it. The 2" is explicitly *not* a Move stat
  change and takes precedence over everything. Counteracting is "instead of activating", not an
  activation, so the no-repeating-an-action restriction does not apply to it.
- **Guard is not a universal action**, despite the cheat sheet listing it beside Shoot and Fight. It
  lives under Killzones → Close Quarters — Gallowdark/Tomb World-style boards, not a 44"×30" open
  table. Its text could not be retrieved verbatim (Wahapedia truncates that page past ~39k chars and
  its own link for it points at a stale 2nd-edition page), so **the cheat sheet's Guard line is
  unverified**. Everything else about it is confirmed: there is a GUARD TOKEN in the marker guide, the
  Heavy weapon rule says it "has no effect on preventing the Guard action", and Counteract excludes it.
- **Two stat floors nobody remembers, and both bind homebrew ploys.** A **Move stat can never be
  changed to less than 4"**, and **APL changes can never total more than −1 or +1** from an
  operative's normal APL. Both are stated as taking precedence over all other stat changes. Also:
  stat changes that occur *during* an action apply once the action completes, but changes to **weapon
  rules** apply immediately.
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
- **`Rules` also renders `**bold**`, and that is the only markdown any card text may use.** It
  is structure, not decoration: the hand-written factions head the sub-options inside a long
  ability with it — Anvil of War's *Hammers of Nocturne* and *Drake Shields*, the Custodes
  stances. The 697 generated cards carry none, since they come from PDFs, which is exactly why
  it went unnoticed printing literal asterisks on the card. Stripping it instead would have
  thrown away the structure the author meant. A test renders `Rules` over every card and
  datacard in all 53 factions and fails on a surviving `**`. Anything richer — a table — still
  has to be flattened at transcription time; `Promethean Tooth Dagger` is the standing example.
- **`KtCard` carries `min-h-fit`, and it is load-bearing.** The carousel gives every card
  `flex-1` inside a fixed-height slide, and a flex item will happily shrink below its content —
  which, with `overflow-hidden` on the card, silently **clips** a long one. Two equipment cards
  were already losing their bottom third before anyone noticed; the datacards made it obvious.
  With `min-h-fit` the card grows instead and the slide's `overflow-y-auto` takes over.

  Re-measured against the Custodes deck at 430x780, all three ways: **no `min-height`** clips two
  cards and leaves the slide 0px to scroll; **`min-h-fit`** and **`min-h-max`** are byte
  identical, 0 clipped and 163px of scroll. So `fit-content` does *not* clamp to the available
  space here and there is nothing to "fix" — `min-h-max` was tried and reverted as a no-op.
  **Measure the CARD, never the slide**: a clamped card makes the slide report no overflow at
  all, which is exactly how the original "zero clipped cards" check would have missed a
  regression.

  What this does *not* buy is anyone noticing. See `Slide` in **The player's phone**.
- **Panels are square-cornered**, controls stay rounded. The printed cards have no radius.
- **`Btn` is the light-panel button and `DarkBtn` the one for the ink header bars**, and mixing
  them up is invisible in code and glaring on screen: `Btn`'s `text-ink` on `bg-card` is dark on
  dark. The setup header shipped that way for as long as it existed — *Back*, *Start match* and
  *Games* were all but unreadable, and *Start match* looked permanently disabled.
- **Both dim themselves when `disabled`, and that lives on the base rather than per call.**
  Eighteen call sites pass `disabled` and exactly one used to style it, so a blocked *Next* and a
  live one were identical everywhere in the app. `Stepper`'s own `disabled:opacity-25` is gone
  with it — two `disabled:opacity-*` in one class list resolve by stylesheet order, not by which
  was written last.
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

`bun test` is 208 tests in two files:

- `src/state.test.ts` — the reducer, the selectors and the weapon-rules glossary. `withHistory` is
  exported purely so undo is testable without a React harness.
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
Both are now **runtime data on `Game`**, so the GM can build any match from the **Setup wizard**
(header → *Setup* → a step, or `game.stage`). `initialGame()` still produces exactly the match
above, with the same team ids and the same side ids — which is why the whole reducer suite
survived the change.

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

## The player's draft

Seven people and one GM, who used to build all seven rosters alone while six of them watched.
The phone now holds the three decisions that were always theirs — **which team, which operatives,
which equipment** — and what they choose becomes the roster the GM tracks wounds on.

It is the first thing in the app that lets a spectator write, so the mechanism matters more than
the screens do.

### One writer, still

A player's phone does not dispatch. It **asks**, and the GM's client is the reducer it has always
been:

```
phone ──{ ask }──▶ relay ──▶ GM's browser ──reduce──▶ snapshot ──▶ every phone
```

- The phone sends `{ ask: Action }` up the WebSocket it already had open.
- The relay forwards it, understanding it no better than it understands a snapshot.
- The GM validates it against `PLAYER_ASKS`, dispatches it, and the result goes back out as an
  ordinary snapshot. **The player's confirmation is the game state changing under them.**

So every non-negotiable above survives intact: localStorage on the GM's device is authoritative,
snapshots still only flow one way, and the server still never runs the reducer or imports
`rules.ts`.

- **Two topics on one socket.** `<code>` carries snapshots to spectators, `<code>:ask` carries
  requests to the GM, and the GM subscribes only to the second. That is not tidiness: it POSTs a
  30–100KB snapshot on every debounced change, and one topic would echo all of it straight back
  down a phone-tethered GM's uplink. `?gm=1` on the upgrade picks the side.
- **`?gm=1` is unauthenticated, and that is fine.** It grants the ability to *hear* asks, which
  are a strict subset of what the open snapshot stream already says. Acting on one still requires
  being the GM's browser.
- **`PLAYER_ASKS` is the whole security boundary.** The room code is the only secret in this app,
  so anyone who can open the spectator link can send a frame. The GM applies `claim`, `setRoster`
  and `gear` and nothing else — all three team-scoped, none of them able to reach VP, wounds,
  initiative or the turn cursor. Verified: an ask reaches the GM, reaches *only* the GM (the
  sender gets no echo and other players hear nothing), and a snapshot POST still 401s without the
  token.
- **The GM-side fields go through `teamPatch`, which is exactly why the whitelist is action-typed
  rather than a patch sanitiser.** `pool`, `opLimit` and `gearLimit` are ordinary `Partial<TeamDef>`
  edits — and `teamPatch` must never be askable, or a phone could move its own team to another
  alliance.
- **Failure has to be visible.** With the GM's tab shut the ask simply evaporates. `Draft` holds a
  `sending` flag, derives `landed` from the snapshot it is handed, and falls to *Could not reach
  the GM* after 4s. Landing beats the timeout, so a slow GM never shows a stale error. Measured
  both ways: GM tab closed → the timeout path; relay killed → `ask` returns false and it reports
  at once.

### What it stores

Five optional fields on `TeamDef`, and one on `Game`. Optional throughout, so `TeamPreset`, every
hand-built team and every stale save stay valid.

| Field | |
|---|---|
| `claimed?: boolean` | A phone holds this team. **Not** `player !== ''` — the presets ship "Player 1".."Player 7", so a non-empty name cannot mean taken. |
| `pool?: Operative[]` | What the player may choose from. Absent means the team's own roster. |
| `opLimit?: number` | How many of it they may take. Set from the roster size when the team is added. |
| `gear?: string[]` | Chosen equipment, by `RefCard.name`. |
| `gearLimit?: number` | The GM's number. Absent means `GEAR_LIMIT`, which is 4. The operatives add to it — see below. |
| `Game.picks: boolean` | Is the draft open. Closes itself on the **first activation**; the GM's header toggle is the one way back. |

- **`pool` holds minted operatives, not catalogue ids**, for three reasons. The phone mints no ids
  — the reducer never has, and ids come in four shapes. Duplicates work, because the Raveners'
  `Warrior 1..5` are five tickable rows rather than one catalogue entry takeable once. And a
  re-picked operative keeps its id, which is what lets `setRoster` keep its wounds. It costs ~6KB
  in a 30–100KB snapshot.
- **`gear` keys on `name`** because `RefCard` has no id and `kind:name` was already the de-facto
  key. Everything in the list is `kind: 'equipment'`, so the name alone is unique enough.
- **`opLimit` is materialised when the team is added, never read back off the roster.** The
  player's picks *become* the roster, so deriving the limit from `roster.length` would ratchet it
  down to whatever they last chose. `initialGame()` sets each preset team's own legal size —
  5/6/5/9 and 10/7/11 — so the whole match is draftable with the GM setting nothing. It is read
  with `||`, not `??`: a team added from the library has no roster, so `teamAdd` stored 0, and 0
  as a limit means "pick nothing".
- **What the draft closes on is the FIRST ACTIVATION, not `stage: 'play'`,** and the difference
  is not academic — it shipped wrong once. The GM walks onto the board constantly during setup:
  to read the scoreboard, to check the counteract banners, to copy the room link that is printed
  there. Closing the draft then locks seven phones out of a list nobody has built yet, and the
  symptom is simply that the *My list* chip is not there. An activation is unambiguous.
- **`draftPool(team, faction, roster)` in `ui/shared.ts` is the one place the list is decided**,
  so the GM's Setup panel and the player's phone can never disagree. Three tiers: the GM's
  `pool`, else the roster, else **the faction's whole datacard list** — that last tier exists
  because only the six preset factions carry a `DEFAULT_ROSTER`, so without it the other 42 hand
  their player a blank draft. Tier 3 **re-mints every id against the team**, because library
  operatives are keyed by faction and `g.ops` is one flat map: two teams of one faction would
  otherwise share a wound track. Deterministic, so unticking and changing your mind keeps it.
- **An empty `claim` name is the release**, and the label survives it. The same action both ways
  because the two always happen together: switching teams releases the old one in the same step,
  so a phone can never hold two claims or strand one.
- **`setRoster` keeps the OpState of every operative that survives the change.** The GM can reopen
  the draft mid-match, and a re-pick must not heal the team.
- **`setRoster` also FREEZES the pool, on the first draft and only then**, and without it the
  offered list is a one-way ratchet. An uncurated pool falls back to the team's roster — which is
  exactly what this action overwrites with the player's picks — so dropping an operative deleted
  it from the very list it could be picked back from. Eleven Kommandos to four, and never up
  again. The roster is captured *before* the replacement, so the pool holds the full starting
  eleven for good and the GM's Setup panel stays a list he removes from rather than one that
  quietly shrinks under him. Skipped when the roster is empty, because that pool falls through to
  the faction's own datacards, and that tier is derived from the faction and cannot shrink.
- **`claim` is deliberately NOT gated on `picks`.** A late arrival still has to tell the GM who
  they are once the draft has closed; they simply cannot build a list. `setRoster` and `gear` both
  return `g` untouched, so a stale phone cannot edit a roster mid-turn.
- **Both limits are clamped in the reducer, not only in the UI.** `gear` always was; `setRoster`
  was not, which made the GM's *Pick* field a suggestion — set it to 5 on an eleven-model team
  and the phone still submitted eleven. Worse, the draft opened with the **whole current roster**
  pre-selected whatever the limit said, so the counter read `11/5` on arrival and the player could
  only ever remove. It now binds in the three places that each need it: the phone's initial
  selection is truncated to it (roster order, so a leader survives the cut), the pick control
  refuses to go over, and the reducer slices on the way in, because the ask crosses a network from
  a phone that may be showing a stale limit.
- **The limit caps what you TAKE, never what you see.** All eleven stay in the carousel at a limit
  of five, and that is what makes swapping one for another possible at all. The effective limit is
  itself capped at the pool size, since a counter reading `11/20` only looks broken.

### The operatives who raise the equipment limit

"Limit 4 **unless stated otherwise**" is the printed rule, and four operatives in 53 factions are
the otherwise. `gearAllowance(g, teamId)` is `gearLimit + gearBonus(roster)`, and the roster is
the point: a Watch Sergeant you did not field grants nothing.

| Faction | Operative | Rule | |
|---|---|---|---|
| Deathwatch | Watch Sergeant | *Adaptable Armoury* | +1 |
| Hearthkyn Salvagers | Lugger | *Well Supplied* | +1 (also 1CP, not modelled) |
| Ratlings | Fixer | *Munitorum Contacts* | +1 |
| Spectre Squad | Guide | *Prepared Killzone* | +1, **restricted** |

- **Found by reading every datacard, not by guessing** — the same reason `lockOrder` is an
  explicit list. A wide regex over all 53 factions threw up eleven candidates and seven were
  noise: the Ratling Stashmaster grants an extra Ammo Cache *marker* rather than an extra
  selection, and Inquisitorial Requisition is about operatives. **A test keeps that audit
  runnable**, failing if any datacard says "you can select one additional equipment" and is not
  in `GEAR_BONUS` — so a faction added later cannot quietly short its player.
- **`GEAR_BONUS` is keyed by NAME, and carries both names each operative has.** The preset six
  field the short `CATALOGUE` names while the library carries the PDF's full ones. Names rather
  than ids is what lets the **reducer** use it: no faction chunk has to be loaded, so the clamp
  cannot depend on whether a dynamic import has resolved. A second test checks every key resolves
  to a real operative, since a typo would otherwise fail silently.
- **The Spectre Guide's extra pick must be an Ammo Cache or an equipment terrain feature**, and
  that restriction is *not* enforced — it is on the card the player is reading, and refereed at
  the table like every other distance in this app.
- **Dropping the grantor trims the gear list.** The limit moves with the operatives, so unticking
  the Watch Sergeant while holding five cards has to drop the fifth, or the player saves a list
  the reducer then silently truncates. The draft trims the newest first.
- **The phone says who is granting it** — *"Watch Sergeant grants the extra pick."* under the gear
  carousel — and the GM's Setup panel shows `+1 gear from Watch Sergeant`. Without it a fifth slot
  looks like a bug, and losing it when you drop him looks like a worse one.
- `pool` lives on `TeamDef`, so `normalize` prunes it when a team is deleted — no cleanup code was
  written, the same free ride `TeamDef.cards` gets.

### The screens

- **`TeamPicker` gained claiming, and picking is now two things.** `onPick` reads a team —
  device-local, instant, works with no relay at all, and is everything this screen used to do.
  `onClaim` takes a name, locks the team on every other phone, and is offered only where there is
  a socket to ask over. A player who just wants to read along never has to claim.
- **`Draft` is the same carousel the deck is, showing the same full cards.** A first cut listed
  operatives as one-line rows reading `2AP · 6" · 5+ · 10W` — enough to identify a model you
  already know and useless for choosing between two you do not, which is the entire situation for
  five of the seven players here. It now shows the whole datacard: weapons, abilities, unique
  actions with their AP, keywords, the weapon-rules glossary.
- **Three tabs over one rail**: Operatives, Faction gear, Universal gear. Tabs rather than stacked
  sections because a phone fits exactly one full card, and the counts still have to be visible —
  they live in the tab labels. An empty deck is not offered at all, and the tab it opens on is the
  first that has cards, so a team with no pool lands on gear rather than an empty rail.
- **The two gear tabs are separate lists over ONE budget.** Four cards written for this kill team
  and ten every team in the game can take are different things, and running them together buried
  the team's own gear among ladders and barricades — the exact complaint that got universal
  equipment removed from the player's deck in the first place. The limit stays one number across
  both, because that is the rule; it is stated once, in the header, and the card's own kicker
  reads the team's name or `Universal` so which list you are in is legible from the card.
- **The pick control sits below the dots, not on the card.** A carousel shows one card at a time
  by design, so the choice can act on "the card you are looking at". Putting it inside the slide
  either scrolls out of reach on a long datacard or reflows the card it sits in — the same trap
  the `more ▾` pill documents. The dots double as the overview: a chosen card's dot is tinted, so
  a player picking eleven operatives one at a time can still see what they hold.
- **This is what brought `UNIVERSAL_EQUIPMENT` back.** Those ten cards had been referenced nowhere
  but a test since they were pulled out of the Gear deck for burying a team's own rules under
  ladders and barricades. That objection does not apply to a list you pick *from* — and the Gear
  deck now shows the cards the player chose, so it is more their own content than before, not
  less. It still falls back to the full faction deck when nobody has drafted, which is why no
  existing behaviour or test moved.
- **`Carousel` and `cards.tsx` were extracted from `Compendium` for this**, rather than the draft
  growing a second carousel. Both are leaves, for the reason `TacOpCard.tsx` is one: more than one
  panel draws them, and **a panel must not import a panel**. `Compendium` re-exports
  `OperativeCard` and `RefCardView` so nothing that already imported them from there had to move.
  Resetting the rail to card 1 is now a `key` on the `Carousel` — remounting clears the scroll
  offset and the index together, where the old `pick()` set an index and left the rail where the
  last deck ended.
- **The GM curates in Setup step 2**, in a *Player picks* panel beside the Rosters one: the pool,
  the two limits, and a Release button — the escape hatch for a player who claims the wrong team
  and whose phone then dies. Doing nothing is a valid setup: the roster is the pool.
- **The reopen toggle sits beside *Tac ops hidden/shown* in the header**, and is the one of the
  two that is `Game` state rather than device state. A GM peeking at his own screen is not the
  same as unlocking seven other people's.

### Verified in a browser

Two real pages against a live relay, the player's in **its own browser context** — two tabs in one
Chrome profile share `localStorage`, so without that a "second phone" inherits the first player's
pick and never sees the picker at all. Claim → GM console; draft → the GM's roster and gear; a
second phone sees `Taken — Minh` on a disabled row and every other team still open; the first
activation hides the *My list* chip and the toggle brings it back; the Gear deck shows exactly the
cards drafted; and `scrollWidth === clientWidth` at 360 / 390 / 430 on every tab.

**And screenshotted, not only asserted.** Every check above passed while the header subtitle was
being cut at `Faction and universal share the li…` — `truncate` on a 390px phone, eating the only
half that mattered. This file already says it once about the `more ▾` pill and it was true again:
a boolean answers "did it render", never "could anyone read it". Look at the pixels.


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
tools/kt_fetch.sh          # list + download every PDF into /tmp/ktwork/pdf, pdftotext -layout
python3 tools/kt_photos.py     # cut the operative photos out of the PDFs into public/ops/
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
- **Errata are USUALLY folded into the card text, and the update log is the check on that.**
  Each PDF says so: *"Rules changes will be updated directly into online documents and then
  listed below."* It is not always true — Blooded's `APRIL '26` log amends Glory Kill's first
  sentence and the card face in the same PDF still prints the old one. Parsing free-prose
  errata is not worth it for one entry in 48 teams, so `ERRATA` in `tools/kt_generate.py` is an
  explicit `(fid, card) -> (find, replace)` list, the same call `LOCK_ORDER` makes. Its `find`
  half is **asserted**, so a reprint that folds the change in fails the generator loudly rather
  than silently applying nothing. Read the log when a card looks stale; do not transcribe from
  it wholesale.
- **Wahapedia no longer 403s automated fetches** — this file used to say it did. `core-rules`,
  `appendix`, `killzones` and `the-missions` all return 200. Two caveats that cost time: pages are
  **truncated at ~39.4k characters** and the cut point is deterministic across re-fetches, so the
  tail of `core-rules` (Markers through Visible) and of `killzones` (Close Quarters, Guard, Setting
  Up Killzones) is unreachable that way; and the site is now labelled **Edition 3, Version 3** with
  update logs dated February and June 2026, so it has moved on from what this section was written
  against. The PDFs remain the primary source for *team* rules; Wahapedia is the source for the core
  rules and the Appendix, which are in no team PDF.
- **KTDash DOES have a public JSON API**, contrary to what this file used to say:
  `https://ktdash.app/api/killteams/<id>` returns a kill team whole, including rules text. It is
  the only place the NEMESIS *allegiance traits* could be found — the dossier defers to physical
  cards for those. Useful when a rule exists but is not in any free PDF.


### The weapon rules glossary

`WEAPON_RULES` in `compendium.ts` is the 2024 Appendix's universal weapon rules — Accurate
through Torrent, 22 of them. They are in **no faction PDF**, which is why the extractor never
produced them and why a datacard printed `Piercing 1, Saturate` with nothing anywhere in the app
saying what either did. `OperativeCard` renders the ones an operative's own weapons use, in a
`<details>` at the very bottom of the card.

- **Restated, not transcribed**, and the module comment says so. The source
  (`wahapedia.ru/kill-team3/the-rules/appendix/`) was read through a fetch tool that caps verbatim
  quoting, so every stat name, distance and keyword is exact but the connective prose is ours. This
  is the one place in the app where rules text is not a transcription — the generated card text
  still is.
- **`weaponRules(weapons)` is a matcher, not a parser.** It splits the `wr` column on commas and
  looks for a rule name as a **whole word anywhere in the token**, not as a prefix: several weapons
  print the distance first (`1" Devastating 3`). `Piercing Crits x`, `Seek Light` and
  `Heavy (Dash only)` are variants folded into their parent rule's text rather than entries of
  their own, so longest-match is not needed and no key is a word-substring of another.
- **A trailing asterisk means the faction's own rule** (`Poison*`, `Soulstrike*` — 30-odd of them),
  written out in that operative's abilities. Those are skipped rather than guessed at.
- **Last on the card, and collapsed.** A four-weapon operative pulls in eight rules; open by
  default that wall pushes the operative's *own* abilities below the fold. `<details>` rather than
  state because it is native — and because this view still takes no `dispatch`, which is what keeps
  the spectator read-only structurally.
- A test walks every statically-imported faction's `wr` columns and fails on a token the glossary
  cannot resolve, so a PDF printing a rule this list misses is caught rather than silently shown as
  a bare keyword. Two known non-rules are filtered: the bare `PSYCHIC` keyword, and the extractor's
  "no weapon rules" dash, which it sometimes leaves in place of dropping the field.

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
pure addition. That is the check to repeat if the parser is ever touched — and it has been
repeated once, for the weapon-table fixes below, which moved 146 datacard lines and **not one
`cards` or `operatives` line**.

#### The weapon table lost rows for a year, and three separate bugs did it

Found by printing a sheet and counting against the PDF in the repo root: Deathwatch prints **35**
weapons and the modules held **26**. Library-wide it was 1196 against 1320. All three are fixed;
each had its own cause, and the third was caused by fixing the first two.

1. **A wrapped row ended the table.** The layout breaks a long weapon name, or a long rules list,
   onto its own line — `Auxiliary grenade launcher` / `(frag)`. Any line that did not match
   `W_ROW` set `in_weapons = False`, so **every row below the first wrap was dropped**. The
   Breacher Veteran prints five weapons and kept one. A non-matching line indented to the NAME
   column is now folded back into the previous row — into its `wr` if it sits past the ATK
   column, into its `name` otherwise. Only a blank line, or prose back at the left margin, ends
   the table.
2. **`W_ROW` required two spaces before ATK.** A name long enough to leave one —
   `Xenophase blade (phase sweep) 4   3+   4/6` — was invisible to it. It is `\s+` now; the
   `\d\+` and `\d+/\d+` anchors are what keep that safe, because a name ending in a digit still
   backtracks to the real split.
3. **`twocol` then started refusing real two-column rules.** Fixing 1 and 2 moved four or five
   lines out of the rules region and into `weapons`, where they belonged — and that dropped
   several regions under the old `< 3 lines a side` guard, silently losing the Wyrmblade
   Kelermorph's abilities and the Pathfinder's *Markerlight*. That line count was only ever a
   **proxy** for the real hazard, which is documented above: a gutter that cuts an action
   header's NAME from its `1AP`. `twocol` now tests for that directly — a column that OPENS with
   an AP cost — and the floor drops to two.

   **And `split_page` had to learn to try its second choice.** A card printing two action
   headers side by side (`MARKERLIGHT … 1AP    SIGNAL … 1AP`) has two blank runs, and the false
   one — the gap inside the left header — is the *wider*. Vetoing the split outright lost both
   actions; `split_page` now takes a predicate and walks its candidates widest-first until one
   passes.

Two more, found by auditing which datacards ended up with no weapons at all — 22 of them:

4. **Two teams abbreviate the table header.** Goremongers and Sanctifiers print
   `NAME A HIT D WR`, and `W_HDR` demanded `ATK`/`DMG` in full, so `in_weapons` never switched
   on and **every weapon on both teams** fell through into the rules prose. 18 tables.
5. **A footnoted ability name was invisible.** A datacard writes out its faction's own weapon
   rule under the marker its WR column points at — `*Shield:` for the Deathwatch Aegis,
   `¹Wreathed:` for the Sanctifiers — and `ABILITY` required the name to start with a capital.
   All **49** of them were dropped, so the marker appeared on the weapon line with nothing
   anywhere defining it: exactly the gap the universal glossary exists to close. `OWN_RULE` in
   `compendium.ts` is now the single spelling of that convention, shared by `weaponRules` and by
   the test that hunts orphan rule tokens — the Sanctifiers' superscript is why a second copy of
   it in the test would have been missed twice.

Net: weapons 1196 → 1362, abilities 458 → 567, unique actions 159 → 177, and datacards with no
weapons at all 22 → 4 (a C.A.T. unit, a Gheistskull, a Tome-skull and a Vox-relay Beacon, none
of which print a weapon table). Several garbage entries the old parser invented
(`'WELD SHUT Select a closed hatchway (e.g. Killzone'`) resolve into the real actions they were
(`Weld Shut`, `Wayfind`, `Signal`, `Markerlight`). Nothing real was lost anywhere — the check is
a **name-level diff of every ability and action**, not a count, because a count hides a swap.

Two more, found by checking the Blooded modules against the two PDFs the user supplied:

6. **A card that runs off the SIDE of its column was cut in half.** A wide card — the faction
   rule, the kill team composition — fills the page across two internal columns and prints
   `CONTINUES ON OTHER SIDE` where the first one runs out. The rest sits in the **next column
   over the same rows**, carrying no kind banner, so `split_cards` saw no card there at all and
   the fragment-merge (which keys on a repeated name) never got a chance; `cut_furniture` then
   trimmed the marker and the card simply ended mid-rule. Blooded lost both remaining paragraphs
   of its faction rule — the token assignment, GAZE OF THE GODS and the whole Accurate 1 rule.
   `columns()` is now `pages()`, because the stitch needs a page's columns side by side:
   `split_page` slices every line at the same offset, so column N's row *i* sits beside column
   N+1's row *i*. `split_cards` reports each card's row range, and the range starts at the
   **kicker line above the banner**, not at the banner — the neighbouring column's half begins
   two rows higher, at the top of the printed box. 11 faction cards across 11 teams grew back.
7. **An ability whose name is a header on its own line was dropped outright.** `ABILITY`
   demanded text after the colon, which held only because `dewrap` glues a header to the
   paragraph below it when no blank line separates them. Where the layout does leave one — the
   Blooded Corpseman's `STIMM Rules:`, every `Drone:` and `Machine:` — the header matched
   nothing and its body had no `cur` to attach to, so both halves vanished. It is `:\s*` now,
   and `rules_of` drops a header that never picks up a body. 15 abilities came back, including
   the rules that say what a drone may do at all.

Net of those two: abilities 567 → 582, and no card, operative, weapon or action changed. Same
check as before — a name-level diff of every card and every ability against a regeneration with
the old parser, not a count.

**`NOTES` is in `DC_NOISE` now.** The printed notes box below the last datacard on a page was
being swallowed as a continuation of that operative's last ability, so the Deathwatch Marksman's
rules ended in a bare `NOTES:`. Note the keyword bar is *not* a hard stop: Hierotek Circle and
Canoptek Circle print an operative's unique actions on their own cards **below** it, and treating
the bar as the end of the card deleted them.

**`kt_fetch.sh` now fails loudly on a missing team, and that matters more than it looks.** A
download that quietly failed produced no `.txt`, so the generator never saw that faction, wrote
no module, and **the stale one already in `src/factions` survived** — a clean-looking run that
ships old data. It happened to XV26, a preset faction, on the very run that fixed this. The
script now uses `curl -f`, retries three times, checks for a `%PDF` header, counts what it got
against `list.tsv` and exits non-zero if anything is short.

**And the reason XV26 kept failing was never the download.** `list.tsv` was written without a
trailing newline, and bash's `read` returns non-zero on a final line that has none — so the
`while read` loop ran its body for every row but the last, and XV26 sorts last. Every check
above passed on a run that never even tried it. The file ends with a newline now.

**The operative photos live in `public/ops/<fid>/<slug>.webp`**, one per datacard, cut out of
the PDFs by `tools/kt_photos.py` (PyMuPDF plus `cwebp`; ~6MB for 450 of them). The generator
emits `Datacard.img` for every file that exists on disk, so a card either has a real photo or
no field — no manifest, no runtime URL convention, no `onError` hiding. A test checks every
`img` against the filesystem. Three facts about the PDFs that the script rests on:

- **The photo is identified by shape, not by its mask.** Almost every cut-out is a JPEG with a
  soft mask, but two Hearthkyn photos are flattened JPEGs with none, and equipment icons on the
  ploy pages *do* have one. What is constant is that a photo is exactly the band's height (35pt)
  where the stat icons and the band graphic behind the name are 44pt.
- **The band's text must END with the datacard name.** The name can run under a wide photo
  (Murderwing Warp Talon), so words are gathered up to the photo's right edge rather than its
  left — and the composition pages print every name in prose, which is why "contains" is not
  good enough. Longest match wins so `Boy` cannot steal `Breacha Boy`.
- **Every image is converted to RGB before saving.** The PDFs use CMYK, DeviceN *and*
  Separation colour, and PNG accepts only RGB or grey; a channel-count test misses DeviceN.

**The hand-written factions have no PDF, so their photos are cut by hand** with
`tools/kt_cutout.py` and their `img` is set in the module rather than by the generator. All sixteen
are done — Angron, Farsight, the five Custodes and the nine Relic Seekers — so every operative
in the app now has a photo, whether its faction came from a PDF or not.
The tool keys the background three ways and **which one is the only per-source decision**:
`--white` for a product photo on a white sweep, `--warm` for a red banner (Angron's datasheet
card), the default for a cool teal one (Farsight's). Four things it learned the hard way:

- **A colour key alone punches holes through the model**, because a shadow between two armour
  plates is tinted exactly like the banner. The key only applies where a flood fill from the
  crop's border can reach.
- **On a warm card the model's own red touches the background red**, and the fill pours through
  that neck — Angron lost his midsection to a channel a few pixels wide. `--open` erodes the mask
  before the fill and dilates it after, which severs the neck without moving the real edges.
- **Battle smoke is grey and so is white armour**, so nothing separates them by colour. The
  smoke fades into the banner, though, so the fill walks into it where saturated armour stops it.
- **A source that arrives already cut out beats any key of ours**, so its alpha is used as-is.
  Three of the Custodes came that way. **A product photo can be an opaque white sweep inside a
  transparent margin**, though. Then every border
  pixel is transparent black, a brightness key seeds on none of them, and the whole sweep
  survives. The alpha channel is trusted only when the border ring is mostly transparent, and
  what is already transparent counts as background either way.

**`--sweep=N` moves where white starts, and a model with BONE armour needs it.** The Relic
Seekers' Captain paints his pauldron at 218-245 on a sweep of 250-255, and the default threshold
of 228 takes a bite out of his shoulder. Sample the source and put the threshold in the gap — for
him, 248. Everything gold or green clears the default untouched.

`--top=F` keeps the top F of the model's height, measured after the key. A full-length product
shot at F=0.4 lands around 2:1, which sits beside the PDF's ~3:1 band cut-outs; at 0.58 it is
nearer square and reads small on the card.

Photos are not prefetched for offline use the way faction modules are — a table with no wifi
shows text-only cards for any photo the browser has not already cached.

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
 DEATHWATCH      Player 1 · ABCD · read only   [Change]   ← the team's own colour, tappable
STRATEGY   TP1/4 · 2CP                    IMP 0 · XEN 0
Gain CP, then alternate Strategy Ploys, initiative side first.
┌──────────────────────────────┐
│   ██ DEATHWATCH · 1CP ██     │   ← one card, swipe for the next
│      STRATEGY PLOY           │
│   ┌────────────────────────┐ │
│   │ THE LONG VIGIL         │ │
│   └────────────────────────┘ │
│   Whenever an operative is…  │
│          ( more ▾ )          │   ← only when the card runs past the fold
└──────────────────────────────┘
          ○ ▬ ○ ○   2/4
 NOW  OPS  STRAT  FIRE  GEAR  RULES  TAC OP   ← bottom navigation
  4    5     4     4     4      2      1
```

- **`Slide` owns the vertical scroll, and the `more ▾` pill is the whole reason it is a
  component.** Nothing is ever clipped — `min-h-fit` already sees to that — but a long card is
  cut flush with the bottom edge while the deck's primary gesture is a *horizontal* swipe, so a
  player swipes sideways and never learns the card continued. Measured at 430x780 on the Custodes
  deck, Venatari keeps 163px, 22% of its card, below the fold with nothing to say so.
  Three things about it are load-bearing, and each was a bug first:
  - **The pill has `h-0` and hangs its content off a sticky anchor.** With real height it is a
    flex sibling of a `flex-1` card, so showing it reflows the card and changes the measurement
    that decided to show it — the hint flickers against its own layout.
  - **Overflow is measured on the card's rect, not `scrollTop + clientHeight < scrollHeight`.**
    The pill lives in the same scroll container, so a `scrollHeight` test counts the pill itself
    as content and keeps the hint up on six cards that fit.
  - **The effect keys on `children`, not `[]`.** Slides are keyed by index, so switching deck
    swaps the card inside the *same* slide, and `flex-1` stretches most cards to an identical box
    — so a `ResizeObserver` fires nothing and a stale `more` carries across. The observer is kept
    for the viewport changing under a card that did not re-render, i.e. rotating the phone — **and
    it observes the CARD as well as the slide.** A `<details>` opening inside the card (the weapon
    rules glossary) grows the card and nothing else: the slide's own box is unchanged, and a native
    toggle re-renders no React, so neither the `children` key nor an observer on the slide fires.
    Measured: 33px below the fold with the hint still down, on the one interaction that most needs
    it. Watching both covers content growing *and* the viewport changing under it.
  - `MORE_SLACK` is 24px, one line: several cards clear the fold by two or three pixels of
    rounding, and promising more when there is none is worse than staying quiet.

- **The shell owns the viewport** (`h-[100dvh]`, `overflow-hidden`), and that fixed viewport is
  **correct here and wrong in the GM drawer** — a phone's page must not scroll, a console's already
  does. Re-verified after the drawer was un-fixed, at 360x740 / 390x844 / 430x932 across all six
  decks: `scrollWidth - clientWidth` **0** and `scrollHeight - clientHeight` **0** at every size,
  nothing clipped anywhere. Only the Ops deck overflows its slide (operative cards are the tallest
  in the app) and the `more ▾` pill shows on exactly those — 2 cards at 360, 1 at 390, 1 at 430.
  Opening the weapon-rules `<details>` at 390 scrolls itself in and the **last** of seven rules is
  fully visible. The page itself never
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
  `dispatch` prop. See the read-only note in **Rooms** for why that is structural, and
  **The player's draft** for the one screen beside it that can write, and how narrowly.
- **The `Gear` deck is the four cards the player drafted**, falling back to the whole faction
  deck when nobody has. See **The player's draft**.

**Which team you are playing is a per-device choice**, stored under `killteam-gm/me` and never
in `Game`. `teams[].player` is a free-text label, not an identity — putting the selection in the
snapshot would mean seven players fighting over one field through the relay.

**It is chosen on its own screen, `ui/TeamPicker.tsx`, and a fresh phone cannot skip it.**
That screen now also *claims* a team — which does reach `Game`, as `teams[].claimed` plus the
name in `teams[].player`. The device-local `me` and the shared claim are different things on
purpose: `me` is "whose cards am I reading", the claim is "who is playing this", and a player
reading along over someone's shoulder should need neither a name nor anyone's permission. `me`
falls back to `''`, not to `teams[0]`, and `Viewer` early-returns the picker while it is empty.
The old control was an unlabelled `<select>` in the corner of the room strip, and the silent
default behind it meant a player who never found that corner read *someone else's cards for the
whole match* with nothing to signal it — the worst kind of bug for a table where five of seven
players are new. The picker takes `onClose` only once a team is set, which is what makes the
first pass unskippable; afterwards the team is the coloured band across the top of the screen and
that band is the way back.

It is a **screen, not a modal** — an early return, exactly as `Setup` is one for the GM. There is
no `fixed`, no `inset-0`, no `<dialog>`, no portal and nothing above `z-10` anywhere in `src/`,
and this did not need to be the first: what sits behind the picker is the deck they may be
reading by mistake, so replacing it outright is the point.

The GM reaches the same decks through `CompendiumBrowser`: one collapsible in the console with a
team chip row above the same `Compendium`, **wrapped in `h-[min(40rem,75vh)]`** because the
carousel is `flex-1` and needs a height to fill inside a collapsible. Shared component,
different frame — the GM is looking things up for other people, not playing a hand.

**The GM drawer had a fixed height for three versions and it was wrong every time.** It was
`h-[26rem]`, then `h-[min(40rem,75vh)]`, and the user reported card still hidden after both —
correctly. The mistake was treating it as a sizing number to tune: **the phone needs a fixed
viewport because its page must not scroll, and the GM's console scrolls already**, so any fixed box
here can only ever hide card from him. There is now no height, just `max-h-[85vh]` so one
pathological card cannot fill the screen. Measured across 3 teams x 5 decks: at 1512x982 **every**
deck is 0 hidden, 0 clipped, 0 pills; at 1280x720 only the Intercessor Sergeant still overflows and
the pill correctly appears.

Two things this cost, worth remembering:

- **The Intercessor Sergeant, not a boss, is the tallest card in the app** — nine weapons plus
  *Doctrine Warfare* and *Chapter Veteran*, 651px. Size this frame against him, not against Angron.
- **A measurement said the pill was rendering and the user still could not find it.** Screenshotting
  the slide showed why: it is a small dark chip that lands **on top of a line of body text**, where
  it reads as a smudge rather than an affordance. `pill: true` answers "did it render", never "did
  anyone see it" — look at the pixels before trusting a boolean about a UI hint.

**Measure the pill with `span.sticky`, not `textContent.includes('more')`.** The naive check reports
a false positive on any card whose prose contains the word — it claimed a pill on cards that had
none, which nearly sent this fix the wrong way.

**Opening a disclosure scrolls it into view, and that is the fix the other two only set up for.**
The weapon-rules `<details>` sits at the bottom of the tallest card in the app, so expanding it
almost always lands the new text below the fold. A taller drawer and a working `more ▾` pill both
help, but neither *shows* you what you just clicked — the user reported it still hidden after both.
`onToggle` → `scrollIntoView({ block: 'nearest' })` on the `<details>`: the slide is the nearest
scroll container, so it scrolls the minimum needed and does nothing when the content already fits.
Measured at 1440x900, 1280x720 and 1512x982 — the **last** rule in the list is fully visible after
opening at all three, including the case where the summary itself was off-screen beforehand.

**Growing the frame is not the general fix, and must not be mistaken for one.** A `<details>` inside
a card can always push past whatever height the drawer has — at 1280x720 the drawer is 540px and
Angron's card overflows it even collapsed. The height change stops the *default* state hiding a
third of a boss card; the `more ▾` pill is what makes any remaining overflow discoverable, which is
why the observer bug above mattered more than the height did.

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

Angron is Large/CHAOS, Farsight **Small**/T'AU EMPIRE. **Both are CONTROL 5 regardless of tier**,
at the user's request — the printed table says 6 for Large and 4 for Small. Everything else still
comes off the table. Each module states it in two places, the faction card and `apl`, and they
must not drift apart. **They differ by tier, not by invention** —
same core rules, same save.

**Farsight is Small because the dossier says so about this exact model.** Its worked example
(pgs 26-31 are the examples section pg 14 points at) is an **XV8 Crisis Battlesuit** on the same
50mm base, built at Size: Small, 4/6"/4+/35, *"as it will be fighting alongside an XV26 STEALTH
BATTLESUIT kill team"* — and it takes **Shielded** for its countermeasures, which is the swap
`farsight.ts` already suggested. He was Medium here only while he was a solo one-model team.

**The size is priced against the escort, and that is the whole point.** Sizes are costed by the
team-size reduction table (pg 35): a Small boss costs its kill team only a couple of operatives
because it fights *alongside* one. Farsight is now paired with **XV26**, whose normal starting size
of 7 drops to **5** beside him. Angron stays Large *and* alone, which is why 75W is not excessive
for him and 35W is not fragile for Farsight.

**The app cannot put a boss inside another team's roster.** `TeamCard`'s picker offers only
`CATALOGUE[team.faction] ?? faction.operatives`, so Farsight cannot be added to the XV26 roster.
The pairing is expressed instead by keeping him his own team in XV26's alliance and giving **both
teams the same `player`** — `teams[].player` is free text, and one person runs both. No code change
was needed for that, and the three ploys worded "an operative from Farsight's alliance" are exactly
the ones the pairing switches on.

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

**Nocturne's Relic Seekers** (`relic-seekers.ts`) is the fourth — a homebrew Salamanders team from
the same KTDash API (`HBR-XRqxC-1`). It hit the same three traps `companions.ts` did and the header
records them: 13 of its 17 equipment entries are the universal deck; `Astartes` and *Close-range
Eradication* are repeated on all nine operatives rather than flagged `isFactionRule`, so they are
faction cards here and off the datacards; and KTDash abbreviates weapon rules (`Rng 8", Sat, Tor 2"`,
`PrcCrit1`), which have to be expanded to the glossary's own names or `weaponRules` resolves none of
them. Unlike the Custodes it takes no `acts`/`kv` — nothing in its rules doubles activations or kill
value — and no `DEFAULT_ROSTER`, because its composition offers choices.

**Its leader is Vulkan He'stan, and he is the one operative here that is converted rather than
transcribed.** The source team's leader is a generic Captain and names He'stan only in prose.
**He has no Kill Team datacard in any edition** — checked against the same downloads API
`kt_fetch.sh` calls, which lists 69 Kill Team downloads and not one Salamanders or named-character
team — so the card comes off his 40,000 datasheet, identical in 10th and 11th. The module header
records every translation; the three worth knowing here are that **Kill Team has no Melta weapon
rule** (Forgefather names Torrent and Devastating, which is what this team's flamers and meltagun
actually print), that **his 2+ save and 4+ invulnerable stay off the statline**, because Kill Team
puts every Space Marine at 3+, and that **Seeker of the Unfound adds to the control total rather
than his APL**, because an APL change can never total more than +1. That same ability carries his
Feel No Pain, **written out as a D6 per attack dice** — Kill Team has no Feel No Pain, and its
damage arrives as dice rather than as wounds lost one at a time, so a per-wound roll has nothing
to hook onto.
An unrelated KTDash homebrew converts him independently to the same APL 3 / 6" / 3+ / 15, which is
the nearest thing to corroboration that exists for him.

**All five hand-written factions export `datacards`**, in the same shape the extractor emits, so
the player's Ops deck shows them like everyone else. For the bosses each trait is declared once in
the module and spread into both the Rules card and the datacard — the same anti-drift reason
`nemesis.ts` exists.

**The completeness guard for this is deliberately NOT scoped to `custom`.** The 4/4/4 card-format
guard is, because homebrew is not bound by the printed layout — but every operative needs its own
weapons and rules whoever wrote it, and scoping that check is exactly what let all three
hand-written factions ship with no datacards while the other 48 had them. 53 factions, 471
operatives, 1423 weapons, 612 abilities, 178 unique actions, and a test that fails on any gap.

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
under *7. Core Rules* beside Extra Defence and Bulky, so Small Farsight has it exactly as much as
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
| *Blood Tithe* — **0CP**, 5 damage → 2CP, once per TP | *Reborn from Blood* — **0CP**, spend all CP, return at 20W, once per **battle** |
| *Heedless Onslaught* — +2" Move and +3" on a Charge, Save worsened by 1 | *Blood for the Blood God* — heal D3+3 on a kill, once per TP |
| *No Sanctuary* — enemies within 6" cannot be given Conceal | *Relentless Carnage* — the wound ladder, below |
| *Bring Down the Walls* — D3+3 a turn to anyone sheltering in terrain he cannot enter | *Butcher's Frenzy* — +3 Atk for one fight, no Fall Back that TP |

**And a 4-card equipment deck, homebrew for the same reason.** The Custom Builder has no equipment
step either, and a boss that IS the kill team has no accompanying team whose gear it can share — so
until these four his Gear tab was empty, since `Gear` stopped concatenating the universal deck onto
every team.

| Equipment | |
|---|---|
| *Chains of the Red Angel* | BARBED CHAIN (1AP), 8", once per activation — beat the target on a D6 and place it in his control range |
| *Crushing Impact* | CRUSHING IMPACT (1AP), 12", once per **battle** — a Heavy terrain feature leaves the killzone and he lands in its footprint |
| *The Butcher's Nails* | passive — Severe on his melee weapons while injured |
| *Warp-Forged Bronze* | passive — Piercing and Piercing Crits are ignored against him |

- **Two actions and two passives, deliberately.** He has 5AP across both activations and his own
  Fight and Charge want most of it, so four action cards would be two he never performs. Neither
  passive costs CP, because he has none to spare — that is what *Blood Tithe* is for.
- **A tie on the hook does nothing.** That is why the card spells the dice out instead of saying
  *roll-off*, which is a defined term that re-rolls ties and would turn a ~42% drag into a 50% one.
- **The hook names BULKY's distances**, exactly as *Relentless Carnage* does and for the same
  reason recorded there: "control range" on a boss card is ambiguous, and the 4" vertical is the
  whole point — it is what rips an operative off a gantry rather than only off the floor.
- **The dragged operative gets BETTER, not worse**, for one activation. It is the card's cost, and
  it is the theme: the Nails are not quieted by prey that cannot fight back. Flipping it to a
  debuff is a one-line change if that reads wrong at the table.
- ***Crushing Impact* is not a second *Bring Down the Walls*.** The ploy is what he uses on terrain
  he cannot reach, over a whole turning point, at 6". The equipment is what he uses when he can
  reach it: one action, 12", the feature is gone for the rest of the battle and he is standing in
  it. It inflicts no damage — removing a building and teleporting 12" is the effect.
- **Its terrain is *Heavy*, not "Stronghold".** Stronghold is not a 2024 terrain trait; the only
  Stronghold in this repo is Volkus's *Condensed Stronghold*, quoted inside two extracted
  datacards. Heavy is the trait that means the solid, sight-blocking thing the card is about.
- ***Warp-Forged Bronze* must not become cover.** Worsening the Hit stat of shots at him would
  soft-undo Towering Size, which is the documented counter-play and the thing that makes a boss
  killable at all. Ignoring Piercing protects the Extra Defence dice instead, which is a narrower
  effect on purpose.
- **The Nails and IMPLACABLE do not collide**, and the card says so: Implacable ignores changes to
  his weapon *stats* from being injured, Severe is a weapon *rule*, and rule changes apply
  immediately. Injured still costs him 2" of Move and, per `nemesisCore`, the Extra Defence dice —
  so the two bleed ploys keep a real price.

Plus one **ability**: **No Escape is not a ploy, and it lives ONLY on the Ops datacard.** Always
on, free, beside *Fury* and *Implacable* — an enemy Falling Back out of his control range eats a
free Fight action. It was a firefight ploy until the user moved it, which is a real buff (it cost
1CP at a moment his player rarely had CP spare) and which is what opened the fourth firefight slot
for *Reborn from Blood*. Its text is labelled "Homebrew ability" outright, because the format's own
abilities are the two nemesis traits and nothing else.

**It is the one ability not also spread into `cards`,** and that broke a test worth understanding.
`state.test.ts` asserted every boss datacard ability also appeared as a Rules card, with a
hardcoded `'Paired Weapon'` exception — stale since Angron dropped that selection. The real
invariant is **anti-drift**: an ability that *also* has a Rules card must be the same text, which is
why each trait is declared once per module and spread into both. Coverage was never the point, so
the test now checks the twin only when a twin exists, and needs no name list to maintain. Fury,
Implacable and the allegiance trait stay in both places because they are format rules a player reads
beside the core-rules card; No Escape is just something Angron does, so it belongs with his weapons.

**Bring Down the Walls is the terrain answer, and it exists because of a rules fact.** Towering Size
lets him through terrain under 2" tall and **hatchways only**; Bulky bars him from Vantage above 2".
So a Volkus ruin can simply be somewhere a 100mm base cannot go, and pg 14 says as much — *"larger
bases (in particular 100mm or more) can be awkward as there may be locations where the operative
cannot be placed"*. Rather than bend a core rule, the ploy lets him collapse the structure: select
one terrain feature within 6" he cannot move through, and anyone ending an activation wholly inside
it takes D3+3. It deliberately does **not** overlap *No Sanctuary*, which denies the Conceal *order*
rather than punishing the position.

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

**A boss ploy that says "control range" has to say WHICH one.** Bulky widens control range to 1"
horizontal / 4" vertical, but only *"whenever this operative would perform the Fight action"* — so
a ploy triggering at any other moment silently gets the normal 1". *Relentless Carnage* fires at the
**end of an activation**, which meant Angron could reach up into a window to fight and then have the
area hit miss the operative he had just punched. It now names the Bulky distances outright. Cards
that trigger *on* a Fight (*Butcher's Frenzy*, *No Escape*) need no such note, because the Fight
action carries the reach itself.

**`RefCard.cp` exists because of `Blood Tithe`, and it is not cosmetic.** `RefCardView` dims a ploy
the team cannot afford and badges it `need 1CP`; a 0CP ploy without the field greys itself out at
exactly 0CP, which is the one moment you would reach for a bleed-for-CP card. Absent means
`PLOY_CP`, so all 48 extracted factions are untouched. *Relentless Carnage*'s conditional 0CP tier
is **not** expressible as a flat number and stays 1CP on the badge — correct for its base use, and
the card text carries the rest. **Farsight has a 4/4 deck too, and it is deliberately
nothing like Angron's.** A GM wanting more can write them in Setup, where the card editor already
offers all four card kinds.

| Farsight — strategy | Farsight — firefight |
|---|---|
| *Mont'ka* — mark a target; his alliance shoots it with Balanced | *Unerring Aim* — retain one attack dice as a crit unrolled |
| *Thrust Vector* — Fall Back for 1 less AP and +3" | *Dawn Blade* — Brutal + Rending for one sequence |
| *Interposing Drones* — retain a defence dice unrolled vs shooting | *Covering Volley* — interrupt a Charge on an ally with a free Shoot |
| *Command Uplink* — **0CP**, +1CP while within 3" of an ally, once per TP | *Reactive Protocols* — counteract twice, no 2" cap on the first |

**Angron pays in blood, Farsight pays in position.** That split is the whole point of having two
bosses: Angron's deck wounds him and reaches nobody else, while half of Farsight's reaches other
teams. Three of his cards say **"an operative from Farsight's alliance"** rather than "a friendly
operative", and that wording is load-bearing — a boss is his own one-model team, so "friendly"
would mean only himself and the card would do nothing. `Game.sides` is what an alliance means here.

Two of his cards exist because of facts about *this app's* model of a boss, not about Farsight:

- ***Interposing Drones* is cover, bought back.** Towering Size denies him cover outright, which is
  the same weakness the shot-in-melee line advertises; the ploy restores it by another route for a
  turning point. It is not a duplicate of the **Shielded** nemesis trait — check every new boss
  card against the pg 19 trait table as well as `nemesisCore`, or you write a trait he could simply
  have taken.
- ***Reactive Protocols* is the one that reads oddly and is actually the strongest.** A one-model
  kill team runs dry the moment it activates, so both bosses bank Counteracts every time the enemy
  activates into an empty side — far more than a seven-model team ever would. Angron's deck ignores
  that resource entirely; Farsight's spends it.

**His equipment four are sourced, not invented**, which is the difference from Angron's — Angron
had to be given a deck because the format leaves a standalone boss with nothing, while Farsight has
five decades of published wargear to draw on. Each card names a real item or a real rule:

| Equipment | | Sourced from |
|---|---|---|
| *Chronophagic Alloy* | a Dawn Blade kill grants **+1AP** that activation, once per TP | the blade's chronophagic alien alloys, taken on Arthas Moloch |
| *Puretide Engram Neurochip* | an enemy activating within 6" gives him a **free Dash**, once per TP | canon, and a real 10th-ed Retaliation Cadre Enhancement |
| *Ta'lissera Bonding Knife* | his alliance ignores **injured** stat changes within 3" | the Enclaves' bonding ritual; a 7th-ed Farsight army had to take it |
| *Target Designator* | MARKERLIGHT (1AP), 12" — his alliance ignores that target's **cover and obscured** | For the Greater Good: an Observer with MARKERLIGHT grants IGNORES COVER |

- **The Dawn Blade steals TIME, not wounds.** The lore says a life it cuts short is *added to the
  wielder's own* — so the obvious reading is a heal, and the obvious reading is the one to avoid:
  *Blood for the Blood God* already heals Angron on a kill, and the two decks are meant to share
  nothing. AP is the closer translation anyway, because what the blade actually steals is lifespan.
- **It grants AP, not APL, and the card says so.** `nemesisCore` has him ignore all changes to his
  APL, so a card that reads as an APL change would cancel itself.
- **Puretide is CP everywhere else and deliberately not here.** Both his 10th-ed *Puretide's
  Teachings* and the Enhancement of the same name are Stratagem economy; *Command Uplink* already
  holds that axis, so this card takes the other half of the idea — the anticipation that earned
  O'Shovah the name Farsight.
- ***Ta'lissera* is broader than the IMPLACABLE trait on purpose.** Implacable is weapon stats only
  and costs a nemesis trait selection; this covers all stats but only within 3" of a 35W operative
  that TOWERING SIZE keeps permanently out of cover. The ally pays in position, which is the axis
  the whole deck is built on. Note it shares the 3" band with *Supporting Fire* — one distance to
  remember at the table rather than two.
- ***Target Designator* partially overlaps XV26's *Advanced Blacksun Filters***, and that is worth
  knowing because the same player runs both teams in the preset match. The filters are XV26-only,
  obscured-only and free; this is alliance-wide, covers cover as well, and costs 1AP on one named
  target. They stack rather than replace, but if the deck feels redundant this is the card to cut.
- **One action, three triggered** — inverted from Angron's two-and-two. Farsight is a shooter and
  his AP goes to Shoot, so a second action card would be one he never performs.
- **Nothing here touches his Save.** All three nemesis sizes are 4+ and a boss's durability is
  wounds plus the extra defence dice — the mistake an early Angron made at 50W and a 2+.
- **He is Seek & Destroy AND Security**, where Angron is Seek & Destroy alone. Two archetypes is
  the printed shape every real team has, and Security was the pick over Recon for a reason that is
  about the table rather than the lore: the Xenos alliance already holds Seek & Destroy,
  Infiltration and Recon between Raveners, XV26 and the Orks, and **Security is the only archetype
  nobody on that side can reach**. Recon would have shared XV26's pool — the same player runs both
  teams — and the app does not enforce distinct tac op picks within a side, so it would have put
  two Flanks on one alliance rather than three ops on the table. It reads fine anyway: the Enclaves
  are a breakaway realm he holds, and *Envoy* and *Plant Banner* are a separatist commander's cards.

### The Brutalis Dreadnought — the third boss

`dreadnought.ts` is a **Large / IMPERIUM** nemesis operative: CONTROL 5 (the table prints 6 —
the same house divergence Angron and Farsight carry), Move 6", Save 4+, **75W**, `kv` 10, two
weapon selections of three spent. Its allegiance trait is **Defenders of the Imperium**, from
KTDash's `SPEC-NEM` — the same route Angron's CHAOS trait took, because the dossier defers
allegiance text to separate cards.

**Its flavour source is a KTDash homebrew, its rules are not.** The user supplied
`ktdash.app/killteams/HBR-tPn5gs-5` ("dreadnoughts", flagged WIP), which is APL 6 / Save 2+ /
60W with no ploys, untitled abilities, and all thirteen "equipment" entries the universal deck —
the trap `companions.ts` and `relic-seekers.ts` both hit. A 2+ is specifically the mistake an
early Angron made: **pg 15 fixes every nemesis size at 4+**. So the chassis and the kit came from
KTDash and every number came off the dossier's tables. Three of its ideas survive, translated:

| KTDash wrote | This ships as |
|---|---|
| Ballistus: stationary → "piercing 1 and seek light" | *Fire Support Doctrine*, a strategy ploy, in the game's own rule names |
| Brutalis: change Move to 8" and smash through Heavy terrain on a D6 4+ | *Through the Wall*, a firefight ploy, 1CP for one charge |
| shared: two Shoot **or** two Fight actions every activation, free | *Blessed Autoloaders*, 1CP, one extra Shoot with a **different** weapon |

- **Both traits trigger on the Charge action** — Blitz and Crushing Impact — and that is the
  build. **Blitz overlaps the talons' own Shock**, so in practice it grants Severe; that is
  accepted, not missed, and the module says so. Swapping the power fist for a chain weapon to
  clear the overlap would trade one duplicated rule for 6/8 damage dropping to 5/6.
- **Crushing Impact fires on finishing a Charge move, which is not the Fight action**, so Bulky's
  widened 1"/4" control range does **not** apply — the normal one does. That is the same trap
  *Relentless Carnage* documents from the other side.
- **The twin heavy bolter is the single heavy bolter profile.** The *Twinned weapon* selection
  (pg 17) grants Ceaseless and would have cost the spare selection that pays for Crushing Impact.
  *Twin-Linked Discipline* rents that selection for one shooting sequence instead.
- **Its deck pays in nothing and reaches nobody**, which is the axis neither other boss uses —
  Angron pays in blood, Farsight pays in position and half his cards reach his alliance. It has
  deliberately **no CP generator** (Angron's *Blood Tithe*, Farsight's *Command Uplink*) and **no
  self-repair**, which would have collided with *Blood for the Blood God*.
- **Both its equipment passives buy back a clause its own core rules take away**, rather than
  inventing a defence: *Atomantic Shielding* keeps the Extra Defence dice while injured (the
  core rule says "unless it is injured"), and *Ironclad Ceramite* stops Devastating and Blast.
  Neither re-implements Armoured, Tough or Shielded — traits it could simply have selected — and
  neither touches its Save or the Hit stat of shots at it, which would soft-undo Towering Size.
- **It has no photo.** A nemesis operative is a paid expansion so the extractor never sees one,
  and no promo shot was supplied the way Angron's and Farsight's were. `Datacard.img` is simply
  absent, which is a normal state.
- **One card was written and cut**, and the reason is the newly-read rule below: a ploy lifting
  the "cannot activate a second time until all other friendly operatives are expended" gate reads
  well and does **nothing**, because a boss modelled as a one-model team has no other friendly
  operatives.

### Still unread

Nothing. The per-mission-pack activation and AP limits were the last gap, and both packs print
the **same** rule — Joint Ops on pg **36** and Nemesis Ops on pg **47**, not the 34/46 this file
used to point at (those are the pack openers):

> Each player must activate their friendly NEMESIS operative twice per turning point, but they
> cannot activate it a second time **until all other friendly operatives are expended**. It cannot
> move more than **12" per turning point** and each player cannot spend more than **5AP** for it in
> total per turning point.

Three limits, and the app models one and a half of them:

- **Twice per turning point** is `Operative.acts`, already there.
- **5AP per turning point** was already recorded here and is a table-procedure number — the app
  tracks activations, never AP.
- **12" per turning point** and **not until every other friendly operative is expended** are new,
  and neither is modelled. The 12" is a table call like every other distance in this app. The
  expended gate would be a real reducer change, and it is **vacuous for Angron and Farsight**,
  who are one-model teams with no other friendly operatives to wait on — so it only starts to
  matter if a boss is ever put inside a populated roster, which `TeamCard`'s picker currently
  cannot do anyway (see **Nemesis operatives**).

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
it looks, because **two of his ploys wound him on purpose** and *Reborn from Blood* leaves him at 20W
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

- **Tac ops are hidden on the console until the GM taps *Tac ops hidden/shown*.** The GM's
  screen faces the table, and a tac op is secret. `reveal` is one `useState` in `Console`,
  drilled to `TurnBar`, `TeamCard` and `OpsBrowser` — **device state, never `Game`**, for the
  same reason `killteam-gm/me` is: the relay would broadcast one GM's peek to all seven phones,
  which is where the players read their own op anyway. Default is hidden on every load; nothing
  persists it. Hiding covers the two always-visible leaks — the team card's select plus its
  `TacOpCard`, and the ops browser's owner pill (the eligibility pills stay, they are derived
  from archetypes and public). `CompendiumBrowser`'s "Yours" badge is **not** covered: it is
  three deliberate taps into a closed drawer, and `Compendium` is the player's own view.
  `Setup` passes `reveal` outright — configuring the match is not playing it.

### The header folds on a phone

`TurnBar` is `sticky top-0` and had **no responsive prefix anywhere** — nor does `RoomBar`,
which renders inside it. Measured at 390x844 with a room open and a crit op picked, the header
was **570px, 67% of the screen**, and since a sticky element taller than the viewport can never
be scrolled to its own bottom, "Save match" was not merely in the way but *unreachable*. The
board panels were always fine — `scrollWidth === innerWidth` at 390 before and after.

Under `md` the header now keeps **only the turn block** — who is activating, `done/target`, the
"pick two" pills, Pass, and the counteract banners — plus a `⋯ Controls` toggle and a read-only
`TP 1/4 · FIREFIGHT` chip. Everything else folds away. **112px, 13%.** Four things carry it:

- **The fold is `display:contents`, not a second layout.** One wrapper holds the row's existing
  children with `` `${open ? 'contents' : 'hidden'} md:contents` ``. At `md` the wrapper's box
  vanishes and its children go back to being direct flex items of the same
  `flex flex-wrap gap-x-6` row — so `ml-auto` on the action cluster still right-aligns and the
  desktop header measures **203px before and after, byte for byte the same layout**. Verified,
  not assumed: that equality is the whole reason for the mechanism, and `max-md:hidden` on each
  of the seven groups was rejected because it needs the `open` ternary repeated seven times.
- **The expanded drawer caps itself**: `max-h-[85dvh] overflow-y-auto`, reset at
  `md:max-h-none md:overflow-y-visible`. Without it, opening the controls recreates the original
  bug exactly. `dvh` because iOS Safari's `vh` is the *large* viewport. At a phone's height the
  cap never actually engages (the reducer clamps `tpCount` to 12), so it is a safety net — tested
  by injecting a 2000px child: caps at 717, becomes scrollable, reaches bottom.
- **The turning-point and initiative rows needed `flex-wrap`, and that bug predates the fold.**
  Both grow with the match and neither wrapped, so past ~9 turning points the pips were simply
  cut off at 390px. The fold made it *silent* rather than causing it — `overflow-y-auto` computes
  `overflow-x` to `auto` too, so the header absorbed the overflow instead of the page showing a
  scrollbar. Fixed at the cause; the phase row is left alone because three buttons always fit.
- **`RoomBar` needs a wrapper, not a class** — it returns its own `<div className="mt-2 …">` in
  both branches.

The breakpoint is `md` (768px), where the full header is 313px on a 1024-tall tablet — the status
quo nobody complained about. **No new test:** `hidden` is CSS, so `renderToStaticMarkup` emits the
identical string either way and a unit assertion would prove nothing. Browser measurement is the
check, as everywhere else here.

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

The three bosses above are NEMESIS operatives; this is the machinery that lets the app hold one.

- **`Operative.kv`** is how many kills downing it is worth. Absent means 1, and that default is
  the whole reason adding the field changed no existing test: `killValue()` sums `killWorth` over
  a list, so a roster of plain operatives sums to its own length and the published ladders
  (5/9/14/19/23 and 4/8/13/17/21) are untouched. `kills` and `thresholds` both fold over value
  rather than counting bodies, and **so does the Scoreboard's "N of M down"** — that readout
  computes "the enemy" through its own local closure, separate from `state.ts`, so both have to
  be weighted or the readout and the grade disagree.
  Rule of thumb when setting one: **kv ≈ wounds ÷ 7** — Angron is 75W/kv 10, Farsight 35W/kv 5.
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

## The faction glossary — the printable rules pack

The app holds 774 cards and 471 operatives and, until this, only ever showed **one card at a
time** in a phone carousel. The glossary is the other view of the same data: an index of all 52
kill teams, each opening onto its whole rules pack laid out like the official team rules PDF,
printable to A4.

- **`window.print()` and `@media print`. No PDF library.** jsPDF/html2canvas would cost ~500KB
  to produce *worse* output — a raster of the page instead of selectable vector type. The
  browser's print pipeline is the native feature for this, and the four runtime dependencies
  stay four. Verified end to end: headless Chrome `--print-to-pdf` over the real component and
  the real built CSS gives 6 A4 pages for Deathwatch, 8 for Inquisitorial Agents.
- **`print-color-adjust: exact` is what makes it work at all**, and it is on `*`, not `body`.
  `.kt-band`, the zebra weapon rows and `.kt-hex` are all *background* paint, which browsers
  drop when printing — without this the sheet is white boxes with white-on-white titles. It is
  inherited in theory; Chrome has shipped builds where only the painting box's own value
  counted. **Verified against Chrome with no background-graphics flag at all: the bands print.**
- **The print viewport is 718px, below Tailwind's `md` at 768.** So a responsive prefix inside
  the sheet silently collapses to one column *on paper only*, which no screen check would ever
  show. The sheet is pinned to `w-[190mm]` (A4 less the 10mm `@page` margin) on screen as well,
  so what wraps in the browser is what wraps in the PDF, and a test asserts the sheet's markup
  carries no `sm:`/`md:`/`lg:`/`xl:` at all.
- **No `min-h-screen`, no `vh`, no trailing margin inside the sheet.** In print `100vh` is one
  page, so any of the three emits a blank final page. The root carries `print:min-h-0`.
- **`KtCard` gets `print:overflow-visible` here.** A scroll container never fragments, so its
  `overflow-hidden` would *clip* a rules card taller than the page rather than splitting it.
  The datacards deliberately have no `overflow-hidden` for the same reason.
- **The page lattice goes, the card lattice stays.** `body`'s covers every sheet edge to edge
  and reads as a grey rectangle; `.kt-hex` is texture on a card, the printed sheets have it,
  and Save-as-PDF keeps it vector.
- **Zebra rows carry a border as well as a fill.** Borders and text print whatever the
  background-graphics setting says, so the weapon table stays legible even if the fill is
  dropped — and the two together just look like the printed card.
- **`table-fixed` with explicit column widths.** Auto widths made every operative's table line
  up differently down the page; the printed sheets use one grid for all of them.

### What it prints, and the three things it cannot

Datacards first — the black band with the name and the four stats, the weapon table with its WR
column, abilities and unique actions as bold-name prose in two columns, the keyword bar — then
the weapon-rules appendix, then the cards 2-up: composition, faction rules, strategy, firefight,
equipment. **The weapon rules sit under the operatives, ahead of the ploy deck**, because they
explain the weapon tables and nothing else on the sheet. The official PDFs omit them entirely
(they are core rules), but on paper that is exactly the gap that once had a datacard printing
`Saturate` with nothing anywhere saying what it did.

They **flow** after the last datacard rather than forcing a sheet — only the ploy deck does that.
A one-operative team spent a whole page on three weapon rules otherwise, and Angron and Farsight
are exactly that. `break-inside-avoid` still keeps the block whole, so it moves down entire when
it will not fit, never orphaning its header from its list.

`PrintDatacard` is **not** `OperativeCard`. That one is a vertical phone card with no WR column,
no keyword bar, live wound and order state, and a `<details>` that would print collapsed.

| The PDF has | This prints | Why |
|---|---|---|
| A melee/ranged glyph column | nothing | It is a GRAPHIC in the source PDF, so `pdftotext` never gave the extractor one, and `wr` cannot stand in — a marksman bolt carbine is ranged with no Range rule and fists are melee with none either. A name heuristic over 53 factions would mislabel, and a wrong icon is worse than no icon. |
| A points cost | nothing | Parsed and dropped; this app does not do list building. |
| An operative photo | the cut-out from the name band | `public/ops/<fid>/<slug>.webp`, via `Datacard.img` — see **The datacards**. |

### The index puts this match's teams on top

`Glossary` takes `game` for one reason: the teams actually on the table sort above the other 47,
so a player opens their own deck without hunting an alphabetical list of 52.

- **Teams map MANY-TO-ONE onto factions**, so a pinned row is a *faction* and its label is the
  teams using it. The preset seven are **six** rows — `dw` and `dw2` both carry `faction: 'dw'`
  — and Deathwatch's row reads *"Deathwatch · Deathwatch II"*. At the table the question is
  "which deck is Player 7 reading?", not "which faction exists?". A test pins the count.
- **A hand-built team has no `faction`** and therefore no page here, so it is skipped rather
  than rendered as a row that cannot be opened. Its GM-written cards live in the Compendium
  browser, which is where they already were.
- **Typing in the filter collapses the split.** A pinned block fighting a search box is worse
  than either alone — once you are hunting a name you want one list, not a hit hiding in
  whichever section it landed in. A pinned faction is also *removed* from the list below rather
  than repeated, so every faction appears exactly once at every filter state.
- It costs nothing when there is no match: from the `Launcher` the section simply does not
  render, and a spectator gets it too, since the glossary renders before the `net.viewer` check.

**JSX text does not process backslash escapes**, and that cost a round here: `<span> \u00b7 </span>`
renders the six characters, where `{'\u00b7'}` and `join(' \u00b7 ')` are JS strings and do not.
The header read *"52 kill teams \u00b7 every card"* on screen while every test passed — a
rendered-output assertion cannot see it, because the escape IS the output. `render.test.tsx` now
greps every panel's markup for `\uXXXX`.

### Reaching it, and the deep link

**Device state, not a `Game.stage`** — one `useState` in `App`, checked *before* `net.viewer`.
A spectator's local state is overwritten by every relay snapshot, so `stage: 'glossary'` would
be wiped the instant the GM tapped anything, and would drag all seven phones in at once.
`rooms` could be a stage precisely because only the GM ever reaches it. Three entry points: a
`DarkBtn` beside *Games* in `TurnBar`, a button in the `Launcher` header, and an *All teams*
chip in the player's phase strip.

**The deep link is `?team=dw` — a SEARCH param, not a hash, and that is load-bearing.**
`#/r/ABCD` is the only thing that makes a spectator a spectator across a reload (`readRoom`
deliberately never remembers a viewer link), so writing `#/lib/dw` over it would quietly demote
every player who opened the glossary. A search param is orthogonal: the two live in one URL, and
`readRoom` already preserves `location.search` when it strips a GM token. `replaceState`, not
`pushState` — nothing else in this app is history-navigable and the view has its own Back. The
helpers are in `ui/shared.ts` beside the other non-component exports, and they guard `typeof
location` because **`bun test` has no `location`, `history` or `localStorage`** — which is also
why `read()` in `state.ts` has always been wrapped in a try/catch.

## Effective stats — what the operative actually rolls

A datacard prints its stats as strings: Move is `6"`, Save and a weapon's Hit are `3+`. For a
long time nothing in the app did arithmetic on any of them — it printed what the PDF printed. An
operative at 6 wounds of 15 showed `Move 6"` and `Hit 3+` with a badge underneath reading
*"Injured — −2" Move, and −1 to its weapons' Hit stat"*: the app knew, said so, and then showed
the undamaged numbers anyway.

**`liveStats(g, o, st)` in `state.ts` is the single answer to "what does this roll".** It returns
`{ apl, move, save, hit(w), hurt, ignoring }`, and every renderer that shows a live stat goes
through it.

- **NOT called `live`.** `RefCardView.live` already means "belongs to the current phase" and
  `Compendium` has a local `live` meaning "the open deck". A third meaning of one word in one
  render path is a bug nobody can see; the first attempt at this collided on exactly that.
- **`hit` is a function, not a value**, because the penalty lands on each weapon's Hit stat and an
  operative has up to nine of them.
- **`OperativeCard` takes the result as a `now` prop and never the game.** It is a leaf shared by
  the deck, the draft and the GM's browser; handing it `game` would make it a panel. Absent `now`
  means print the printed card.

### The arithmetic, and the two floors

`moveIn` / `asMove` / `rollIn` / `asRoll` in `rules.ts`, plus `moveAfter` / `aplAfter` /
`rollAfter` which apply the core rules' own limits — both recorded in the 2024 rules section
above and both binding here:

- **A Move stat can never be changed to less than 4"**, so a 5" operative injured is 4", not 3".
- **APL changes can never total more than −1 or +1** from normal.

**Positive is worse on a roll stat**: `rollAfter('3+', 1)` is `4+`. That reads backwards and is
the direction Injured and most penalties move, so the argument is named `worse`. A roll never
passes 2+ or 6+.

### Three renderers, and the fourth that is deliberately left alone

| | |
|---|---|
| `cards.tsx` `STATS` + the weapon table | the phone's card — goes through `liveStats` |
| `TeamCard.tsx` `PlayRow` | the GM's row — same, so the two can never disagree |
| `Glossary.tsx` `stats(o)` | the **printable pack** — untouched on purpose. A rules reference prints the printed card. |

### Injury immunity is mostly NOT modellable, and the toggle says so

Ten operatives in the library have a rule that ignores the Injured penalty. Most read *"whenever a
friendly X operative is within 6" of this operative, you can ignore…"* — and **there is no board
in this app, on purpose**, so a distance is always a table call; *"you can"* makes it a choice
besides. So there are three routes, in that order of precedence:

1. **`OpState.tough`** — the GM's per-operative toggle, the `inj` chip on `PlayRow`. This is the
   answer for every aura and every optional rule, and it is the same call the GM already makes
   for every other distance in the app.
2. **`INJURY_IGNORES`** — the four that are flat, self-only and unconditional. `'weapons'` is
   Angron's *Implacable*: he keeps HIT 3+ and still loses the 2".
3. **`INJURY_GRANTS`** — one entry, and it earns its own map because it is a **roster scan rather
   than an aura**: *Spiritual Chirurgy* gives the whole Wolf Scout team immunity "if you select
   this operative for the battle (even if it's incapacitated later)". No distance, survives the
   Fangbearer dying. The Fenrisian Wolf is excluded by name, as the card says.

Both maps are keyed by **name** for the reason `GEAR_BONUS` is: no faction chunk has to be loaded,
so the reducer and the card agree without waiting on a dynamic import. **Two audit tests keep them
honest** — every key resolves to a real datacard, and no datacard carries a flat unconditional
injury rule that is in neither map. That second test is what found *Spiritual Chirurgy*.

### What the badge says now

It used to state a penalty over a stat row that ignored it. It now explains numbers that have
already moved, and branches: *"Already counted above"*, or *"a rule lets it ignore the penalty, so
nothing above moved"*, or Angron's *"…keeps its weapons' Hit stat"*. `hurt` stays true even when
something is ignoring the penalty, because the wound bar and the badge both still want to know.

## Effects — what is true right now

A ploy that grants the whole team Balanced used to be invisible: the GM said it out loud and six
people tried to remember. `Game.effects` is the app's memory of it, and it reaches every phone
for free — the whole snapshot is already relayed and `replace` merges over `initialGame()`.

**Using a ploy asks no questions.** Tapping one applies it and spends the CP, with the card's own
two-tap confirm as the only step in between — `ployEffect` in `ui/shared.ts` seeds the effect from
the card's name, kind, printed text and whatever `PLOY_FX` knows about it. There is no form on a
phone. `EffectForm` survives for the GM's house calls, behind *+ Note an effect*.

### `src/fx/` — what each card actually does

Thirteen factions are mapped card by card: the six the preset match fields, the five hand-written
homebrew ones, plus Kasrkin and the Canoptek Circle. 156 cards, every ploy and every piece of
equipment. One module per faction beside the **generated** `src/factions/`, with a hand-written
index — the same arrangement, and `tools/kt_generate.py` would rewrite anything put in the other
one. Mapping another faction is one module and one line in the index; everything unmapped still
works, applying as a named, timed effect carrying the card's printed text.

**`Fx` is one modifier, and a card carries a list** — *Sting* improves a named weapon's Hit AND
grants it two rules. The whole design is one rule:

> **No `when` and no `scope` → the numbers move. Either one set → it prints as a rider.**

That is not timidity, it is what the cards say. Of 424 ploys in the library, **twenty-six are
unconditional**, and most of those are still weapon-scoped. Almost every ploy is a trigger
resolved mid-sequence — *"whenever shooting an operative that has that order"*, *"if you roll two
or more fails"*, *"wholly within your opponent's territory"* — against a board and dice this app
does not have. Across the thirteen mapped factions **7 entries apply and 149 ride.**

Three traps, each of which bit once:

- **The app cannot tell a melee weapon from a ranged one.** The glyph is a graphic in the source
  PDFs, `pdftotext` never produced it, and the rules column cannot stand in (a bolt carbine is
  ranged with no Range rule; fists are melee with none). So *Waaagh!* and *Dakka! Dakka! Dakka!*
  are flat and unconditional and still ride — applying either would put Punishing on a choppa.
- **An applied entry lands on the WHOLE TEAM.** A ploy that names "a friendly X operative" in the
  singular is a rider, because a one-tap ploy is never told which one it was. *Raw Physiology*
  was mapped as applied and would have given all nine Scouts +1" Move. **A test catches this
  class** — and it has to know that *"whenever a friendly X operative"* is generic rather than a
  selection, or it flags *Crucible of Battle*, which is correctly applied.
- **A card that debuffs the ENEMY gets no delta**, or the number lands on your own operative.

**Equipment needs no `Effect` record at all.** Gear is chosen rather than used, so `liveStats`
folds `team.gear` straight in off the team — it is simply always on.

**`normalize` coerces `Effect.fx` to an array, and that is not belt-and-braces.** `replace` merges
over `initialGame()` at the TOP level only — nothing defaults a field nested inside an array. When
`Effect` changed from inline deltas to an `fx` list, stale snapshots kept their old shape and
`liveStats` died on `e.fx.some`, white-screening the entire console. The storage key should have
been bumped in the same commit (it now is) but that only helps this machine: a relay message from
a GM on an older build arrives the same way. `normalize` is the single repair point precisely so
no reader has to carry a `?.` for a shape that drifted.

Four tests hold the mapping honest: every key names a real card, every mapped faction covers all
twelve of its cards (partial coverage is the trap — a player sees three ploys explain themselves
and assumes the fourth does nothing), an applied entry must actually say something, and the
single-operative guard above.



### The record

`Effect` is `{ id, label, text?, kind?, teamId, opId?, apl?, move?, hit?, save?, rules?, until }`.

- **`text` is COPIED off the card, not looked up.** The reducer has no faction data, and a phone
  reading this may never load that faction's chunk.
- **Positive is BETTER in an effect, including on the two roll stats** — the rules say "improve
  the Hit stat by 1" and that is what a person types. `rollAfter` takes the opposite sign, so
  `liveStats` negates in exactly one place.
- **`opId` absent means the whole team.** `effectsOn` folds both into `liveStats`.
- **One action for "use a ploy" and "note an effect"**, `effectAdd`, because they differ only by
  whether `cost` changes hands. `effectRemove` **does not refund** — a ploy that was used was
  used, and the GM has a CP stepper for a real mistake and undo for the rest.

### Expiry rides the reset points that already existed

- `nextTp` keeps only `until: 'battle'`, beside `pairUsed` and `counteracts` — the two precedents
  for per-turn ephemeral state.
- `activate` drops `until: 'activation'` effects **aimed at the operative that just spent**.
  "Until the end of its next activation" is the commonest duration in the game and this is the end
  of it. Readying an operative again is a correction, not an activation, so it ends nothing. An
  `activation` effect with no target has nothing to hang off and waits for the turning point.
- `normalize` prunes effects whose team or target is gone. The roster cases (`setRoster`,
  `removeOp`, `resetRoster`) deliberately bypass `normalize`, so **`effectsFor` heals at read
  time** instead — same trade as `orderedIds` and a stale `pairUsed`, which this file already
  argues for. `effectsOn` could never match a dead id anyway.

### Where it shows

| | |
|---|---|
| The stat row | already moved — `liveStats` sums the deltas under the same floors Injured uses |
| An `EffectChip` on the operative card | above the weapon table, explaining the numbers right above it |
| One line under the weapon table | *"Every weapon above also has Balanced."* Said once, not on all nine rows of an Intercessor Sergeant — the rule is on the operative |
| A band under the player's phase strip | so a ploy is visible while reading a different deck entirely |
| `RefCardView`'s `aside` slot | an `In effect` chip, in the same corner `OperativeCard` puts Ready/Activated |
| `Carousel`'s `marked` dots | already built for the draft, free here |

- **`going`, not `live`.** `RefCardView.live` means "belongs to the current phase" and
  `Compendium` has a local `live` meaning "the open deck". The rename in stage 1 exists because a
  third meaning is a bug nobody can see; do not undo it by naming this one `live` either.
- **`EffectForm` takes an `onApply` callback, never a `dispatch`**, so the GM can hand it one and
  anything else can hand it something narrower — the same seam `Draft` uses to be writable without
  being a writer. It lives in `Effects.tsx`; `ployEffect` had to move to `ui/shared.ts`, because a
  `.tsx` that exports a helper beside its components loses Fast Refresh for the whole file and
  oxlint says so.
- **A ploy that went nowhere says so.** An ask into a shut socket is silent and the GM's browser is
  the only reducer there is, so a failed one puts a line across the player's screen rather than
  letting the CP look spent. Same lesson as `Draft`.
- **Two taps, not a dialog.** The ploy applies the moment it is confirmed, so there has to be a
  step between a stray thumb and a spent point — but there is no `fixed`, no overlay and no
  `<dialog>` anywhere in `src/`, and a button that changes its mind for three seconds is cheaper
  than becoming the first.
- **The chip is a `<details>` with an explicit caret.** A `display:flex` summary loses Chrome's own
  disclosure triangle, and without one the chip reads as a label rather than something that opens.
- **`effectAdd` and `effectRemove` are the loosest two player asks**: a phone can name any team
  and any numbers, where the other three are inert outside its own team. Deliberate and cheap —
  every effect is listed by team on the console and on all seven phones, and the GM ends any of
  them in one tap. An audit trail beats a permission model for seven friends.
- The form's **`free`** toggle applies a ploy at 0CP. Several rules hand one out — the Watch
  Sergeant's *Strategic Command* does it twice a battle — and a checkbox is cheaper than modelling
  any of them.

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
- **A player can claim a team and build a list, and that is all.** No accounts, no per-operative
  ownership, and the server still cannot tell who is who — a claim is a flag on a team, not an
  identity, and any phone with the room code could send one. The whitelist in `PLAYER_ASKS` is the
  entire boundary, and the GM's Release button in Setup is the entire recovery. Authentik OIDC is
  already running on the VPS if that ever needs to be real. See **The player's draft**.
- **The draft needs the GM's console open.** A player's phone asks; the GM's browser is the only
  reducer there is. With that tab shut the ask goes nowhere, which is why `Draft` reports it rather
  than failing silently — but it means the draft is the one part of the app that is not offline-
  tolerant. Everything else still is.
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

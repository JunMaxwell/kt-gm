import type { RefCard } from './compendium'

// All tunable data lives here. Stats are the official 2024 datacards (via KTDash).
// CATALOGUE is every operative a team may field; DEFAULT_ROSTER is the starting
// picks for this match. Both are only seeds — the live roster is editable in the
// app and persists in localStorage.

// Sides and teams are no longer a compile-time fact. They live in `Game`, so the GM can
// build any match: rename an alliance, add a third, move a team across, field two of the
// same faction. What is left here is the *preset* — the match this app was written for.
export type SideId = string
export type OpKind = 'kill' | 'crit' | 'tac'

/** An operative's Firefight-phase order. Lives here, not in state.ts, because `Operative`
 *  needs it — state.ts re-exports it so existing imports keep working. */
export type Order = 'conceal' | 'engage'

export type Operative = {
  id: string
  name: string
  apl: number
  move: string
  save: string
  w: number
  /** Activations this operative gets each turning point. Absent means 1, which is every
   *  datacard operative — a boss is the reason the field exists. */
  acts?: number
  /** How many kills downing this operative is worth. Absent means 1, which is what every
   *  datacard operative is — so the kill ladders are unchanged by this field existing. Raise
   *  it for a boss, whose death should move the grade further than a Grot's. */
  kv?: number
  /**
   * An order some rule locks this operative to; absent means it is free to take either.
   *
   * Three real cases: every NEMESIS operative (Towering Size — "whenever you determine this
   * operative's order, you cannot select Conceal"), the Kommando Grot (Sneaky Zogger, the
   * other way round) and the Bomb Squig (Stoopid). The reducer refuses to move a locked
   * operative, so a boss cannot be concealed by a mis-tap mid-game.
   *
   * It is a stored field rather than something read out of the datacard text, because the
   * one other operative whose prose matches — a Fellgor Ravager — only loses Conceal *while
   * it holds a Frenzy token*, and a heuristic over rules prose gets that wrong.
   */
  lockOrder?: Order
}

/** A boss counts for more than a body. Everything else counts for one. */
export const killWorth = (o: Operative) => o.kv ?? 1

/** An alliance. `color` is a hex value, used as an inline background — never a class. */
export type SideDef = { id: SideId; name: string; color: string }

/**
 * A kill team as the GM configured it. This merges what used to be a compile-time
 * `TeamMeta` with the per-player `PlayerState` that sat beside it, because both are
 * now editable and both have to ride along in a snapshot.
 *
 * `faction` is the preset this team draws its datacards from — the key into CATALOGUE
 * and CARDS. Two teams may share one; the match's two Deathwatch teams do. A team built
 * by hand has none, and simply gets an empty catalogue and no compendium cards.
 */
/**
 * A card the GM wrote, as opposed to one extracted from a datacard PDF. Same shape as a
 * `RefCard` plus an id, because the editor has to address one card among several and the
 * generated cards are only ever read in bulk.
 */
export type OwnCard = RefCard & { id: string }

export type TeamDef = {
  id: string
  player: string
  name: string
  short: string
  side: SideId
  color: string // hex, used as the card's header band
  ink?: boolean // band is light enough to need dark text
  archetypes: Archetype[] // its datacard's tac op archetypes
  faction?: string // CATALOGUE / CARDS key; absent for a hand-built team
  cp: number
  tacOp: string
  tacVp: number
  /** GM-authored rules, shown ahead of the faction deck. A boss lives here: the app has no
   *  other way to tell a player anything, since the player view is the card deck and nothing
   *  else. Optional, so `TeamPreset` and every stale save stay valid. */
  cards?: OwnCard[]

  /* ---------- the player's draft ----------
   * All optional, so `TeamPreset`, every hand-built team and every stale save stay valid.
   * The GM sets `pool` / `opLimit` / `gearLimit`; the player's phone asks for the rest.
   */
  /** A phone has claimed this team. NOT `player !== ''` — the presets ship "Player 1".."Player 7",
   *  so a non-empty name cannot mean "taken" without every team reading as claimed on day one. */
  claimed?: boolean
  /** What the player may choose from. Absent means the team's current roster.
   *  Fully-minted operatives rather than catalogue ids, for three reasons: the phone never mints
   *  an id (they come in four shapes and the reducer has never minted one); duplicates work,
   *  because the Raveners' `Warrior 1..5` are five tickable rows instead of one catalogue entry
   *  takeable once; and a re-picked operative keeps its id, so `setRoster` can keep its wounds. */
  pool?: Operative[]
  /** How many of the pool the player may take. Set from the roster size when the team is added. */
  opLimit?: number
  /** Equipment the player chose, by `RefCard.name` — cards have no id, and `kind:name` is
   *  already the de-facto key. Every entry here is `kind: 'equipment'`, so the name alone is
   *  enough. ponytail: a faction card sharing a name with a universal one selects both; give
   *  cards ids if that ever happens. */
  gear?: string[]
  /** How many equipment cards the player may take. Absent means `GEAR_LIMIT`. */
  gearLimit?: number
}

/** "Limit 4 selection unless stated otherwise" — the printed rule, and the default `gearLimit`. */
export const GEAR_LIMIT = 4

/**
 * The operatives who ARE the "unless stated otherwise": their own datacard rule grants the team
 * extra equipment selections, so the limit depends on who the player actually fielded.
 *
 * Four of them in 53 factions, found by reading every datacard ability and action rather than by
 * guessing — the same reason `lockOrder` is an explicit list and not a regex over rules text.
 * Three are unconditional; the Spectre Guide's extra pick must be an Ammo Cache or an equipment
 * terrain feature, which is on its card and is NOT enforced here. `ponytail: one restricted
 * grant, stated on the card and refereed at the table; model it if a second one shows up.`
 *
 * Keyed by NAME, and by both names each operative has: the six preset factions field the short
 * hand-curated `CATALOGUE` names while the library carries the PDF's full ones, and the two
 * conventions never merged. Names rather than ids because this then needs no faction chunk to
 * be loaded, which is what lets the reducer clamp with it.
 * `ponytail: a name collision across factions would grant wrongly; give operatives stable keys
 * if the library ever gets one.`
 */
export const GEAR_BONUS: Record<string, number> = {
  'Watch Sergeant': 1, // Deathwatch — Adaptable Armoury
  'Deathwatch Watch Sergeant': 1,
  'Hearthkyn Lugger': 1, // Hearthkyn Salvagers — Well Supplied (also grants 1CP, not modelled)
  'Ratling Fixer': 1, // Ratlings — Munitorum Contacts
  'Spectre Guide': 1, // Spectre Squad — Prepared Killzone (restricted; see above)
}

/** Extra equipment these operatives earn between them. A roster duplicate's trailing number is
 *  stripped first, the same way `datacardOf` strips it before joining. */
export const gearBonus = (ops: Operative[]) =>
  ops.reduce((n, o) => n + (GEAR_BONUS[o.name.replace(/ \d+$/, '')] ?? 0), 0)

/** Who in a list is granting it, for a UI that has to explain why the limit is 5 and not 4. */
export const gearGrantors = (ops: Operative[]) =>
  ops.filter((o) => GEAR_BONUS[o.name.replace(/ \d+$/, '')]).map((o) => o.name)

/* ---------- stat arithmetic ----------
 *
 * A datacard prints its stats as strings — Move is `6"`, Save and a weapon's Hit are `3+` — and
 * until now nothing in the app ever did arithmetic on them. It printed what the PDF printed.
 * Injured has always been rendered as prose underneath the unmodified numbers.
 *
 * These four are the whole of it. They live here beside `Operative` because that is what they
 * are about, and `state.ts` builds `live()` on top of them.
 */

const bound = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** `6"` -> 6. `parseInt` stops at the quote, which is exactly what we want. */
export const moveIn = (m: string) => parseInt(m, 10) || 0
export const asMove = (n: number) => `${n}"`
/** `3+` -> 3. Same trick, stopping at the plus. */
export const rollIn = (s: string) => parseInt(s, 10) || 0
/** A dice roll is never better than 2+ and never worse than 6+. */
export const asRoll = (n: number) => `${bound(n, 2, 6)}+`

/**
 * The two floors the core rules put on stat changes, and both take precedence over everything
 * else — which is why they belong here rather than in each caller.
 *
 *   MOVE_FLOOR  "a Move stat can never be changed to less than 4\""
 *   APL_SWING   "APL changes can never total more than −1 or +1" from the operative's normal APL
 *
 * A 5" operative that is injured moves 4", not 3".
 */
export const MOVE_FLOOR = 4
export const APL_SWING = 1

/** Move after a total change of `delta` inches, floored. A change, not an override. */
export const moveAfter = (move: string, delta: number) =>
  delta === 0 ? move : asMove(Math.max(MOVE_FLOOR, moveIn(move) + delta))

/** APL after a total change, clamped to ±1 of normal and never below 0. */
export const aplAfter = (apl: number, delta: number) => Math.max(0, apl + bound(delta, -APL_SWING, APL_SWING))

/** A roll stat after a change. POSITIVE IS WORSE: `3+` worsened by 1 is `4+`, which is the
 *  direction Injured and most penalties move, and the opposite of what the number looks like. */
export const rollAfter = (roll: string, worse: number) => (worse === 0 ? roll : asRoll(rollIn(roll) + worse))

/**
 * Operatives whose own rule ignores the Injured penalty, and which half of it.
 *
 * Only the four that are FLAT, SELF-ONLY and UNCONDITIONAL are here. Ten operatives across the
 * library have an injury-ignoring rule, but most read "whenever a friendly X operative is within
 * 6" of this operative, you can ignore…" — this app has no board, on purpose, so a distance is
 * always a table call, and "you can" makes it a choice besides. Those are `OpState.tough`, a
 * toggle the GM flips, rather than entries here pretending to be complete.
 *
 * Keyed by name like `GEAR_BONUS`, and for the same reason: it needs no faction chunk loaded.
 */
export const INJURY_IGNORES: Record<string, 'all' | 'weapons'> = {
  Angron: 'weapons', // Implacable — keeps HIT 3+ on both weapons, still loses the 2"
  'Arbites Castigator': 'all', // Engendered Focus
  'Penal Legionnaire Agent': 'all', // Chem-mask
  'Dragon Master Leystalker': 'weapons', // Implacable Darkscale
}

/**
 * Operatives who grant that to their WHOLE TEAM just by being on the roster.
 *
 * One of them, and it is flat rather than an aura: *Spiritual Chirurgy* says the team has it
 * "if you select this operative for the battle (even if it's incapacitated later)" — so it is a
 * roster scan, not a distance, and it survives the Fangbearer dying. Exactly the shape
 * `GEAR_BONUS` already has, which is why this is a lookup and not a toggle.
 */
export const INJURY_GRANTS: Record<string, 'all' | 'weapons'> = {
  'Wolf Scout Fangbearer': 'all', // Spiritual Chirurgy — excluding FENRISIAN WOLF, see below
}

/** Whether anyone on this roster hands the team injury immunity. */
export const grantedIgnore = (ops: Operative[]) => {
  for (const o of ops) {
    const g = INJURY_GRANTS[o.name.replace(/ \d+$/, '')]
    if (g) return g
  }
  return undefined
}

/** A team before it has play state. `initialGame` adds the CP and tac op columns. */
export type TeamPreset = Omit<TeamDef, 'cp' | 'tacOp' | 'tacVp'>

export type Archetype = 'Seek & Destroy' | 'Security' | 'Infiltration' | 'Recon'
export const ARCHETYPES: Archetype[] = ['Seek & Destroy', 'Security', 'Infiltration', 'Recon']

export const ARCHETYPE_COLOR: Record<Archetype, string> = {
  'Seek & Destroy': '#bd0003',
  Security: '#0b6be1',
  Infiltration: '#5f5f5f',
  Recon: '#f05c22',
}

/** The two alliances this match was written for. Only a starting point now. */
export const PRESET_SIDES: SideDef[] = [
  { id: 'imperium', name: 'Imperium', color: '#0066a5' },
  { id: 'xenos', name: 'Xenos', color: '#d1232a' },
]

/** Colours to hand a newly added alliance, in order, so the GM never picks one blind. */
export const SIDE_PALETTE = ['#0066a5', '#d1232a', '#3f8f29', '#f05c22', '#7b4fa8', '#c9a227']

export const PRESET_TEAMS: TeamPreset[] = [
  { archetypes: ['Seek & Destroy', 'Security'], id: 'dw', faction: 'dw', short: 'DW', player: 'Player 1', name: 'Deathwatch', side: 'imperium', color: '#8a97a8', ink: true },
  { archetypes: ['Seek & Destroy', 'Security'], id: 'aod', faction: 'aod', short: 'AoD', player: 'Player 2', name: 'Angels of Death', side: 'imperium', color: '#0066a5' },
  { archetypes: ['Seek & Destroy', 'Security'], id: 'dw2', faction: 'dw', short: 'DW II', player: 'Player 7', name: 'Deathwatch II', side: 'imperium', color: '#4f5b6b' },
  { archetypes: ['Infiltration', 'Recon'], id: 'sct', faction: 'sct', short: 'Scouts', player: 'Player 3', name: 'Scout Squad', side: 'imperium', color: '#5c5f63' },
  { archetypes: ['Seek & Destroy', 'Infiltration'], id: 'rav', faction: 'rav', short: 'Raveners', player: 'Player 4', name: 'Raveners', side: 'xenos', color: '#b83227' },
  { archetypes: ['Infiltration', 'Recon'], id: 'xv26', faction: 'xv26', short: 'XV26', player: 'Player 5', name: "T'au XV26", side: 'xenos', color: '#dfe3e8', ink: true },
  { archetypes: ['Seek & Destroy', 'Infiltration'], id: 'kom', faction: 'kom', short: 'Orks', player: 'Player 6', name: 'Ork Kommandos', side: 'xenos', color: '#3f8f29' },
]

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

type Row = [string, number, string, string, number] | [string, number, string, string, number, Order]

const cat = (teamId: string, rows: Row[]): Operative[] =>
  rows.map(([name, apl, move, save, w, lockOrder]) => ({
    id: `${teamId}:${slug(name)}`, name, apl, move, save, w,
    ...(lockOrder ? { lockOrder } : {}),
  }))

// Two Deathwatch kill teams are in play. They share one catalogue entry, because
// CATALOGUE is keyed by faction — but not one roster: they field different operatives.
const DEATHWATCH_ROWS: Row[] = [
  ['Watch Sergeant', 3, '6"', '3+', 15],
  ['Aegis', 3, '6"', '2+', 15],
  ['Blademaster', 3, '6"', '3+', 15],
  ['Bombard', 3, '5"', '3+', 18],
  ['Breacher', 3, '5"', '3+', 18],
  ['Demolisher', 3, '6"', '3+', 15],
  ['Disruptor', 3, '7"', '3+', 13],
  ['Gunner', 3, '6"', '3+', 15],
  ['Headtaker', 3, '7"', '3+', 13],
  ['Horde-Slayer', 3, '5"', '3+', 18],
  ['Marksman', 3, '6"', '3+', 15],
]

/** Every operative each team can field, per its datacards. */
export const CATALOGUE: Record<string, Operative[]> = {
  dw: cat('dw', DEATHWATCH_ROWS),
  aod: cat('aod', [
    ['Space Marine Captain', 3, '6"', '3+', 15],
    ['Intercessor Sergeant', 3, '6"', '3+', 15],
    ['Assault Intercessor Sergeant', 3, '6"', '3+', 15],
    ['Intercessor Gunner', 3, '6"', '3+', 14],
    ['Intercessor Warrior', 3, '6"', '3+', 14],
    ['Assault Intercessor Grenadier', 3, '6"', '3+', 14],
    ['Assault Intercessor Warrior', 3, '6"', '3+', 14],
    ['Heavy Intercessor Gunner', 3, '5"', '3+', 18],
    ['Eliminator Sniper', 3, '7"', '3+', 12],
  ]),
  sct: cat('sct', [
    ['Scout Sergeant', 3, '6"', '4+', 11],
    ['Heavy Gunner', 2, '6"', '4+', 10],
    ['Hunter', 2, '6"', '4+', 10],
    ['Sniper', 2, '6"', '4+', 10],
    ['Tracker', 2, '6"', '4+', 10],
    ['Warrior', 2, '6"', '4+', 10],
  ]),
  rav: cat('rav', [
    ['Ravener Prime', 3, '7"', '5+', 21],
    ['Felltalon', 3, '7"', '5+', 20],
    ['Tremorscythe', 3, '7"', '5+', 20],
    ['Venomspitter', 3, '7"', '5+', 20],
    ['Warrior', 3, '7"', '5+', 20],
    ['Wrecker', 3, '7"', '4+', 20],
  ]),
  xv26: cat('xv26', [
    ["Shas'Vre", 3, '6"', '3+', 13],
    ['Designator', 3, '6"', '3+', 12],
    ['Infiltrator', 3, '6"', '3+', 12],
    ['Liberator', 3, '6"', '3+', 12],
    ['Lodestar', 3, '6"', '3+', 12],
    ['Neutraliser', 3, '6"', '3+', 12],
    ['MV75 Marker Drone', 2, '6"', '4+', 7],
    ['MV15 Gun Drone', 2, '6"', '4+', 7],
  ]),
  kom: cat('kom', [
    ['Boss Nob', 3, '6"', '5+', 14],
    ['Boy', 2, '6"', '5+', 10],
    ['Slasha Boy', 2, '6"', '5+', 10],
    ['Breacha Boy', 2, '6"', '5+', 10],
    ['Snipa Boy', 2, '6"', '5+', 10],
    ['Dakka Boy', 2, '6"', '5+', 10],
    ['Comms Boy', 2, '6"', '5+', 10],
    ['Burna Boy', 2, '6"', '5+', 10],
    ['Rokkit Boy', 2, '6"', '5+', 10],
    // Sneaky Zogger: this one can never be given an Engage order. Stoopid: the Squig never Conceals.
    ['Grot', 2, '6"', '5+', 5, 'conceal'],
    ['Bomb Squig', 2, '6"', '5+', 5, 'engage'],
  ]),
}

/**
 * Copy a catalogue entry into a roster slot. `dupe` distinguishes repeats.
 *
 * `faction` chooses the catalogue; `teamId` mints the id, and they are deliberately
 * separate. Two teams of the same faction share datacards but must never share
 * operative ids — `g.ops` is one flat id-keyed map, so a collision would have two
 * models sharing one wound track.
 */
export const fromCatalogue = (faction: string, name: string, dupe?: number, teamId = faction): Operative => {
  const src = (CATALOGUE[faction] ?? []).find((o) => o.name === name)
  if (!src) throw new Error(`${name} is not in the ${faction} catalogue`)
  return { ...src, id: `${teamId}-${slug(name)}${dupe ?? ''}`, name: dupe ? `${name} ${dupe}` : name }
}

/** A preset team's starting roster, re-minted for a different team id. */
export const presetRoster = (faction: string, teamId: string): Operative[] =>
  (DEFAULT_ROSTER[faction] ?? []).map((o) => ({ ...o, id: `${teamId}-${o.id.split('-').slice(1).join('-')}` }))

export const blankOperative = (teamId: string): Operative => ({
  id: `${teamId}-custom-${crypto.randomUUID().slice(0, 8)}`,
  name: 'New operative',
  apl: 2,
  move: '6"',
  save: '4+',
  w: 10,
})

const roster = (faction: string, teamId: string, picks: (string | [string, number])[]) =>
  picks.map((p) =>
    typeof p === 'string' ? fromCatalogue(faction, p, undefined, teamId) : fromCatalogue(faction, p[0], p[1], teamId),
  )

/**
 * Starting picks for this match: 25 Imperium vs 28 Xenos. All legal compositions.
 * Keyed by *team* id, not faction — the two Deathwatch teams field different operatives.
 */
export const DEFAULT_ROSTER: Record<string, Operative[]> = {
  dw: roster('dw', 'dw', ['Watch Sergeant', 'Aegis', 'Blademaster', 'Gunner', 'Marksman']),
  dw2: roster('dw', 'dw2', ['Watch Sergeant', 'Bombard', 'Demolisher', 'Disruptor', 'Headtaker']),
  aod: roster('aod', 'aod', [
    'Intercessor Sergeant',
    'Intercessor Gunner',
    'Heavy Intercessor Gunner',
    'Eliminator Sniper',
    'Assault Intercessor Warrior',
    'Intercessor Warrior',
  ]),
  sct: roster('sct', 'sct', [
    'Scout Sergeant',
    'Heavy Gunner',
    'Hunter',
    'Sniper',
    'Tracker',
    ['Warrior', 1],
    ['Warrior', 2],
    ['Warrior', 3],
    ['Warrior', 4],
  ]),
  rav: roster('rav', 'rav', [
    'Ravener Prime',
    'Felltalon',
    'Tremorscythe',
    'Venomspitter',
    'Wrecker',
    ['Warrior', 1],
    ['Warrior', 2],
    ['Warrior', 3],
    ['Warrior', 4],
    ['Warrior', 5],
  ]),
  xv26: roster('xv26', 'xv26', [
    "Shas'Vre",
    'Designator',
    'Infiltrator',
    'Liberator',
    'Neutraliser',
    'MV75 Marker Drone',
    'MV15 Gun Drone',
  ]),
  kom: roster('kom', 'kom', [
    'Boss Nob',
    'Slasha Boy',
    'Breacha Boy',
    'Snipa Boy',
    'Dakka Boy',
    'Comms Boy',
    'Burna Boy',
    'Rokkit Boy',
    'Boy',
    'Grot',
    'Bomb Squig',
  ]),
}


/**
 * All nine 2024 crit ops, summarised from the official card sheet. Every one of
 * them bars its mission action during the first turning point and scores only
 * "at the end of each turning point after the first" — so TP1 never yields crit VP.
 * `derive` says whether marker holders alone are enough to compute the VP.
 */
export const CRIT_OPS = [
  {
    id: 'secure',
    n: 1,
    name: 'Secure',
    action: 'SECURE — 1AP',
    actionText: 'A marker the active operative controls stays secured by you until the enemy secures it.',
    vp: ['1VP if any markers are secured by you.', '1VP if more markers are secured by you than by your opponent.'],
    derive: 'holders',
  },
  {
    id: 'loot',
    n: 2,
    name: 'Loot',
    action: 'LOOT — 1AP',
    actionText: 'A marker the active operative controls is looted. Each marker can only be looted once per TP.',
    vp: ['1VP each time a friendly operative performs the LOOT action.'],
    derive: 'manual',
  },
  {
    id: 'transmission',
    n: 3,
    name: 'Transmission',
    action: 'INITIATE TRANSMISSION — 1AP',
    actionText: 'A marker the active operative controls transmits until the start of the next turning point.',
    vp: [
      '1VP if friendly operatives control any transmitting markers.',
      '1VP if they control more transmitting markers than enemy operatives do.',
    ],
    derive: 'holders',
  },
  {
    id: 'upload',
    n: 4,
    name: 'Upload',
    action: 'UPLOAD — 1AP',
    actionText:
      "Wipe the opponent's Upload points from a marker you control, then add one of yours (unless it already has one, or you have scored from it).",
    vp: [
      'Score from any markers holding your Upload points — remove the points and score that many VP.',
      'Each marker can only be scored from once. You need not control it to score.',
    ],
    derive: 'manual',
  },
  {
    id: 'intel',
    n: 5,
    name: 'Intel',
    action: 'COMPILE INTEL — 1AP',
    actionText: 'A marker you control gains 1 Intel point — at most one per marker per turning point.',
    extra:
      'From TP2, PICK UP MARKER can be used on a marker with 1+ Intel point; it then gains no more. Scores only at the end of TP4.',
    vp: ['At the end of TP4, score VP equal to the Intel points on each marker friendly operatives control.'],
    derive: 'manual',
  },
  {
    id: 'extraction',
    n: 6,
    name: 'Extraction',
    action: 'SEARCH — 1AP',
    actionText: 'A marker you control is searched. The last one searched becomes the extraction marker.',
    extra:
      'The extraction marker can be picked up. Its carrier worsens its weapons\u2019 Hit by 1, cannot be set up more than 6" away, and cannot CHARGE or DASH.',
    vp: [
      '1VP for searching the first or third marker, 2VP for the second.',
      '1VP per TP for controlling the extraction marker — 2VP if it is TP4.',
    ],
    derive: 'manual',
  },
  {
    id: 'sabotage',
    n: 7,
    name: 'Sabotage',
    action: 'SABOTAGE — 1AP',
    actionText: "Sabotage the marker wholly inside your opponent's territory, if the active operative controls it.",
    vp: [
      '1VP each time a friendly operative performs SABOTAGE.',
      '1VP for controlling the marker in your own territory (unless sabotaged this TP), 1VP for the centreline marker.',
    ],
    derive: 'manual',
  },
  {
    id: 'surge',
    n: 8,
    name: 'Power Surge',
    action: 'REROUTE POWER — 1AP',
    actionText: 'Reroute a surged marker the active operative controls.',
    extra:
      'As a Strategic Gambit from TP2, one player picks a marker to be surged until the next TP (never one already surged). The player without initiative picks first, then it alternates.',
    vp: [
      '1VP each time a friendly operative performs REROUTE POWER.',
      '1VP for controlling the surged marker, 1VP for controlling more markers than enemy operatives do.',
    ],
    derive: 'manual',
  },
  {
    id: 'coordinates',
    n: 9,
    name: 'Coordinates',
    action: 'INPUT COORDINATES — 1AP',
    actionText: 'A marker you control gains 1 of your Objective points — at most one per marker per turning point.',
    extra: 'Scores only at the end of TP4.',
    vp: [
      "At the end of TP4: 1VP per marker holding your Objective points, 2VP if it is wholly in your opponent's territory.",
      "1VP per marker holding more of your Objective points than your opponent's.",
    ],
    derive: 'manual',
  },
] as const
export type CritOpId = (typeof CRIT_OPS)[number]['id']

export type TacOp = {
  archetype: Archetype
  name: string
  reveal: string
  select?: string // something you must nominate before it can score
  vp: string[]
  cap?: number // per-turning-point VP maximum printed on the card
}

/**
 * The 2024 tac ops: three per archetype, twelve in total. A kill team may only
 * take one from the two archetypes on its own datacard — see TeamMeta.archetypes.
 * Summarised from the team datacards; the full wording is on the cards.
 * None of them score during the first turning point.
 */
export const TAC_OPS: TacOp[] = [
  // --- Seek & Destroy: Deathwatch, Angels of Death, Raveners, Kommandos ---
  {
    archetype: 'Seek & Destroy',
    name: 'Sweep & Clear',
    reveal:
      'The first time an enemy is incapacitated while contesting an objective marker, or a friendly performs the Clear action.',
    vp: [
      '1VP if a cleared marker other than your own is uncontested by enemies — 2VP if it also holds your Swept token.',
      '1VP if friendly operatives control a marker holding your Swept token.',
    ],
    cap: 2,
  },
  {
    archetype: 'Seek & Destroy',
    name: 'Dominate',
    reveal: 'The first time a friendly operative incapacitates an enemy.',
    vp: ['At the end of TP3 and TP4, remove Dominate tokens from surviving operatives — 1VP each.'],
    cap: 3,
  },
  {
    archetype: 'Seek & Destroy',
    name: 'Rout',
    reveal: 'The first time you score VP from it.',
    vp: [
      '1VP when a friendly incapacitates an enemy within 6" of the opponent\u2019s drop zone.',
      '2VP instead if that enemy had a Wounds stat of 12 or more.',
    ],
    cap: 2,
  },

  // --- Security: Deathwatch, Angels of Death ---
  {
    archetype: 'Security',
    name: 'Plant Banner',
    reveal: 'When a friendly operative performs the Plant Banner action.',
    select: "Plant it in your opponent's territory, 5\" or more from a neutral killzone edge.",
    vp: [
      "1VP if friendly operatives control the banner in your opponent's territory.",
      '2VP instead if no enemy operative contests it.',
    ],
    cap: 2,
  },
  {
    archetype: 'Security',
    name: 'Martyrs',
    reveal: 'The first time a friendly operative is incapacitated while contesting an objective marker.',
    vp: [
      '1VP for removing a Martyr token from a contested marker.',
      '2VP instead if friendly operatives control that marker.',
    ],
    cap: 2,
  },
  {
    archetype: 'Security',
    name: 'Envoy',
    reveal: 'The first time you select an envoy.',
    select: 'One friendly operative as your envoy, each turning point after the first.',
    vp: [
      '1VP if the envoy is wholly in enemy territory and out of enemy control range.',
      '2VP instead if it also lost no wounds that turning point.',
    ],
    cap: 2,
  },

  // --- Infiltration: Scouts, XV26, Raveners, Kommandos ---
  {
    archetype: 'Infiltration',
    name: 'Track Enemy',
    reveal: 'The first time you score VP from it.',
    vp: ['1VP if one enemy operative is being tracked — 2VP if two or more are.', '2VP for a single tracked enemy in TP4.'],
    cap: 2,
  },
  {
    archetype: 'Infiltration',
    name: 'Plant Devices',
    reveal: 'When a friendly operative performs the Plant Device action.',
    vp: [
      "1VP if your opponent's objective marker holds your Device token.",
      '1VP for each other contested marker holding your Device token.',
    ],
    cap: 2,
  },
  {
    archetype: 'Infiltration',
    name: 'Steal Intelligence',
    reveal: 'The first time an enemy operative is incapacitated.',
    vp: [
      '1VP per turning point while friendly operatives carry Intelligence markers.',
      '1VP per Intelligence marker still carried at the end of the battle.',
    ],
  },

  // --- Recon: Scouts, XV26 ---
  {
    archetype: 'Recon',
    name: 'Flank',
    reveal: 'As a Strategic Gambit.',
    select: 'Divide the killzone into a left and a right flank.',
    vp: [
      '1VP per turning point for each flank friendly operatives control.',
      '2VP instead in TP4 for a flank you also held in TP3.',
    ],
    cap: 2,
  },
  {
    archetype: 'Recon',
    name: 'Retrieval',
    reveal: 'The first time you score VP from it.',
    vp: [
      '1VP the first time each objective marker is searched.',
      '1VP per Retrieval marker still carried at the end of the battle.',
    ],
  },
  {
    archetype: 'Recon',
    name: 'Scout Enemy Movement',
    reveal: 'When a friendly operative performs the Scout action.',
    select: 'One ready enemy operative to monitor.',
    vp: ['1VP per turning point for each monitored enemy visible to friendly operatives.'],
    cap: 2,
  },
]

export const tacOp = (name: string) => TAC_OPS.find((o) => o.name === name)

/** The six tac ops a team may actually choose from, given its two archetypes. */
export const teamTacOps = (archetypes: Archetype[]) => TAC_OPS.filter((o) => archetypes.includes(o.archetype))

/** Which of these teams can take a given tac op — handy for the card browser. Takes the
 *  list because the teams in play are now a property of the game, not of this module. */
export const teamsWithArchetype = <T extends { archetypes: Archetype[] }>(teams: T[], a: Archetype) =>
  teams.filter((t) => t.archetypes.includes(a))

export const TURNING_POINTS = 4 // default; the GM can extend the battle in the app
export const OBJECTIVE_MARKERS = 5 // homebrew: 5 not 3, for a 44"x30" board
export const OP_CAP = 6 // default max VP per op type
export const CRIT_CAP_PER_TP = 3 // homebrew default; the cards themselves cap at 2VP per TP
export const STARTING_CP = 2
/** CP granted each turning point: less to the side holding initiative. */
export const CP_PER_TP = { lead: 1, other: 2 }

// Official kill grade table only goes to ~14 operatives, so this extrapolates.
// Editable per side in the app if it plays out wrong.
export const killThresholds = (enemyOps: number): number[] =>
  [1, 2, 3, 4, 5].map((g) => Math.max(g, Math.round((enemyOps * g) / 6)))

export const CHEAT_SHEET: { title: string; lines: string[] }[] = [
  {
    title: 'Actions (AP)',
    lines: [
      'Reposition 1 — move up to Move stat',
      'Dash 1 — move up to 3"',
      'Charge 1 — Move +2", end in enemy control range',
      'Fall Back 2 — leave enemy control range',
      'Shoot 1 · Fight 1 · Guard 1',
      'Pick Up Marker 1 · Place Marker 1',
      'No operative may repeat the same action in one activation.',
    ],
  },
  {
    title: 'Shooting',
    lines: [
      '1. Collect attack dice = weapon Atk.',
      '2. Target must be visible. Engage: visible is enough. Conceal: visible AND not in cover.',
      '3. Roll. Retain successes ≥ Hit. Natural 6 = crit, natural 1 always fails.',
      '   Obscured (intervening Heavy terrain, >1" from both): discard one success, crits become normal.',
      '4. Defender rolls 3 defence dice — or 2 dice + one auto-success if using cover. Retain ≥ Save.',
      '5. Block: normal blocks normal, TWO normals block a crit, a crit blocks either.',
      '6. Unblocked normal = Normal Dmg. Unblocked crit = Critical Dmg.',
    ],
  },
  {
    title: 'Fighting',
    lines: [
      'Both operatives roll attack dice for their melee weapon. +1 Hit per assisting friendly.',
      'Then ALTERNATE resolving one die at a time, attacker first.',
      'Each die is either a Strike (deal damage now) or a Block (cancel an enemy success).',
      'Ends when someone is incapacitated or all dice are resolved.',
    ],
  },
  {
    title: 'Cover, Conceal, Injured',
    lines: [
      'Cover: intervening terrain within your control range — never while within 2" of the shooter.',
      'Conceal: cannot Shoot, Charge or counteract — but NOT a valid target while in cover.',
      'Engage: acts normally, and can counteract.',
      'You may change an operative\u2019s order for free each time it is activated.',
      'Injured (below half starting wounds): −2" Move and worsen weapon Hit by 1.',
      'Counteract: when you have no ready operatives and the enemy does — one expended Engage',
      'operative performs a free 1AP action (not Guard), moving max 2".',
    ],
  },
  {
    title: 'Paired activations (house rule)',
    lines: [
      'A side turn is TWO operatives, activated by two DIFFERENT players, resolved together.',
      'Then the turn hands over to the other alliance, who also pick two players.',
      'Conflicts between the two: declare both intents, then roll sequentially — e.g. resolve the',
      'charge first, and only shoot if the target survives.',
      'Lone Wolf: if only one player on a side still has ready operatives, that side reverts to',
      'single activations for the rest of the turning point.',
      'Counteract (2024 has no Overwatch): once a side has nothing ready, the other keeps activating',
      'back-to-back. Per enemy activation the flushed side may pick one expended operative on ENGAGE',
      'to perform any single 1AP action, moving at most 2". The tracker banks these — spend with –.',
    ],
  },
  {
    title: 'This game (homebrew)',
    lines: [
      'Board 44"×30". Drop zone = full width × 6" deep on your long edge.',
      '5 objective markers: one centre, then alternate placing 4 within 4" of the centreline,',
      '6"+ apart, 3"+ from any edge.',
      'Control a marker by having more total APL within 1" of it than the enemy does.',
      'Battle runs 4 turning points by default — extend it in the header, and raise the VP cap',
      'to match or the extra turning points cannot score.',
      'Activation rotation: Imp1 → Xen1 → Imp2 → Xen2 → Imp3 → Xen3, one operative per slot.',
      'CP is per player. Everyone gains 1/TP; players on the side without initiative gain 2.',
      'Kill Op & Crit Op are scored per SIDE. Each player has their own secret Tac Op.',
    ],
  },
]

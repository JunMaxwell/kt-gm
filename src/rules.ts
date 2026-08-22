// All tunable data lives here. Stats are the official 2024 datacards (via KTDash).
// CATALOGUE is every operative a team may field; DEFAULT_ROSTER is the starting
// picks for this match. Both are only seeds — the live roster is editable in the
// app and persists in localStorage.

export type SideId = 'imperium' | 'xenos'
export type OpKind = 'kill' | 'crit' | 'tac'

export type Operative = { id: string; name: string; apl: number; move: string; save: string; w: number }
/** `color` holds literal Tailwind classes so the JIT compiler still sees them. */
export type TeamMeta = {
  id: string
  player: string
  name: string
  short: string
  side: SideId
  color: string // hex, used as the card's header band
  ink?: boolean // band is light enough to need dark text
  archetypes: [Archetype, Archetype] // its datacard's two tac op archetypes
}

export type Archetype = 'Seek & Destroy' | 'Security' | 'Infiltration' | 'Recon'
export const ARCHETYPES: Archetype[] = ['Seek & Destroy', 'Security', 'Infiltration', 'Recon']

export const ARCHETYPE_COLOR: Record<Archetype, string> = {
  'Seek & Destroy': '#bd0003',
  Security: '#0b6be1',
  Infiltration: '#5f5f5f',
  Recon: '#f05c22',
}

export const SIDE_COLOR: Record<SideId, string> = { imperium: '#0066a5', xenos: '#d1232a' }

export const SIDES: Record<SideId, string> = { imperium: 'Imperium', xenos: 'Xenos' }

export const TEAMS: TeamMeta[] = [
  { archetypes: ['Seek & Destroy', 'Security'], id: 'dw', short: 'DW', player: 'Player 1', name: 'Deathwatch', side: 'imperium', color: '#8a97a8', ink: true },
  { archetypes: ['Seek & Destroy', 'Security'], id: 'aod', short: 'AoD', player: 'Player 2', name: 'Angels of Death', side: 'imperium', color: '#0066a5' },
  { archetypes: ['Seek & Destroy', 'Security'], id: 'dw2', short: 'DW II', player: 'Player 7', name: 'Deathwatch II', side: 'imperium', color: '#4f5b6b' },
  { archetypes: ['Infiltration', 'Recon'], id: 'sct', short: 'Scouts', player: 'Player 3', name: 'Scout Squad', side: 'imperium', color: '#5c5f63' },
  { archetypes: ['Seek & Destroy', 'Infiltration'], id: 'rav', short: 'Raveners', player: 'Player 4', name: 'Raveners', side: 'xenos', color: '#b83227' },
  { archetypes: ['Infiltration', 'Recon'], id: 'xv26', short: 'XV26', player: 'Player 5', name: "T'au XV26", side: 'xenos', color: '#dfe3e8', ink: true },
  { archetypes: ['Seek & Destroy', 'Infiltration'], id: 'kom', short: 'Orks', player: 'Player 6', name: 'Ork Kommandos', side: 'xenos', color: '#3f8f29' },
]

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const cat = (teamId: string, rows: [string, number, string, string, number][]): Operative[] =>
  rows.map(([name, apl, move, save, w]) => ({ id: `${teamId}:${slug(name)}`, name, apl, move, save, w }))

// Two Deathwatch kill teams are in play, both drawing on the same datacards.
const DEATHWATCH_ROWS: [string, number, string, string, number][] = [
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
  dw2: cat('dw2', DEATHWATCH_ROWS),
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
    ['Grot', 2, '6"', '5+', 5],
    ['Bomb Squig', 2, '6"', '5+', 5],
  ]),
}

/** Copy a catalogue entry into a roster slot. `dupe` distinguishes repeats. */
export const fromCatalogue = (teamId: string, name: string, dupe?: number): Operative => {
  const src = CATALOGUE[teamId].find((o) => o.name === name)
  if (!src) throw new Error(`${name} is not in the ${teamId} catalogue`)
  return { ...src, id: `${teamId}-${slug(name)}${dupe ?? ''}`, name: dupe ? `${name} ${dupe}` : name }
}

export const blankOperative = (teamId: string): Operative => ({
  id: `${teamId}-custom-${crypto.randomUUID().slice(0, 8)}`,
  name: 'New operative',
  apl: 2,
  move: '6"',
  save: '4+',
  w: 10,
})

const roster = (teamId: string, picks: (string | [string, number])[]) =>
  picks.map((p) => (typeof p === 'string' ? fromCatalogue(teamId, p) : fromCatalogue(teamId, p[0], p[1])))

/** Starting picks for this match: 20 Imperium vs 23 Xenos. All legal compositions. */
export const DEFAULT_ROSTER: Record<string, Operative[]> = {
  dw: roster('dw', ['Watch Sergeant', 'Aegis', 'Blademaster', 'Gunner', 'Marksman']),
  dw2: roster('dw2', ['Watch Sergeant', 'Bombard', 'Demolisher', 'Disruptor', 'Headtaker']),
  aod: roster('aod', [
    'Intercessor Sergeant',
    'Intercessor Gunner',
    'Heavy Intercessor Gunner',
    'Eliminator Sniper',
    'Assault Intercessor Warrior',
    'Intercessor Warrior',
  ]),
  sct: roster('sct', [
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
  rav: roster('rav', [
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
  xv26: roster('xv26', [
    "Shas'Vre",
    'Designator',
    'Infiltrator',
    'Liberator',
    'Neutraliser',
    'MV75 Marker Drone',
    'MV15 Gun Drone',
  ]),
  kom: roster('kom', [
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
export const teamTacOps = (teamId: string) => {
  const team = TEAMS.find((t) => t.id === teamId)
  return team ? TAC_OPS.filter((o) => team.archetypes.includes(o.archetype)) : []
}

/** Which teams can take a given tac op — handy for the card browser. */
export const teamsWithArchetype = (a: Archetype) => TEAMS.filter((t) => t.archetypes.includes(a))

export const TURNING_POINTS = 4 // default; the GM can extend the battle in the app
export const OBJECTIVE_MARKERS = 5 // homebrew: 5 not 3, for a 44"x30" board
export const OP_CAP = 6 // default max VP per op type
export const CRIT_CAP_PER_TP = 3 // homebrew default; the cards themselves cap at 2VP per TP
export const STARTING_CP = 2

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

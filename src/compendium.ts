// The cards each player may reach for, and the phase of the turning point that puts them in
// play. Split out of `rules.ts` because that file is tunables and this one is rules prose,
// transcribed from the official Warhammer Community team rules PDFs (URLs in CLAUDE.md).
// Flavour paragraphs are dropped; only the rules text is kept, because nobody reads flavour
// while seven people wait.
//
// Every ploy costs 1CP flat in the 2024 edition — the cards print no cost, which is why none
// is stored here. Equipment that lets a ploy be used "for 0CP" says so in its own text.

export type PhaseId = 'initiative' | 'strategy' | 'firefight'
export type RefKind = 'faction' | 'strategy' | 'firefight' | 'equipment'

/** One card: a faction rule, a ploy, or a piece of equipment. */
export type RefCard = { name: string; kind: RefKind; text: string }

export const PLOY_CP = 1

export const KIND_LABEL: Record<RefKind, string> = {
  faction: 'Faction rule',
  strategy: 'Strategy ploy',
  firefight: 'Firefight ploy',
  equipment: 'Equipment',
}

/** Which kinds of card a phase puts in play. The only place that mapping lives. */
export const PHASES: { id: PhaseId; label: string; hint: string; use: RefKind[] }[] = [
  {
    id: 'initiative',
    label: 'Initiative',
    hint: 'Roll off. The winner picks who has initiative — nothing to spend yet.',
    use: [],
  },
  {
    id: 'strategy',
    label: 'Strategy',
    hint: 'Gain CP, then alternate Strategy Ploys, initiative side first.',
    use: ['strategy'],
  },
  {
    id: 'firefight',
    label: 'Firefight',
    hint: 'Alternate activations. Firefight Ploys whenever their condition is met.',
    use: ['firefight'],
  },
]

export const phaseMeta = (id: PhaseId) => PHASES.find((p) => p.id === id)!

/* ---------- Deathwatch (dw + dw2) ---------- */

const DEATHWATCH_CARDS: RefCard[] = [
  {
    kind: 'faction',
    name: 'Veteran Astartes',
    text: 'During each friendly DEATHWATCH operative’s activation, it can perform either two Shoot actions or two Fight actions. If it’s two Shoot actions and an auxiliary grenade launcher, frag cannon, heavy plasma incinerator, infernus heavy bolter, plasma pistol or stalker bolt rifle is selected for both, or if a melta bomb is selected for either, 1 additional AP must be spent for the second action.\n\nEach friendly DEATHWATCH operative can counteract regardless of its order. Whenever it does, it can perform an additional 1AP action for free during that counteraction, but both actions must be different and you cannot perform a Fight and Shoot action during the same counteraction.',
  },
  {
    kind: 'faction',
    name: 'Special Issue Ammunition',
    text: 'Once per turning point, when a friendly DEATHWATCH operative is performing the Shoot action, in the Select Weapon step, you can use this rule. If you do, select one of the following weapon rules for that operative’s ranged weapons to have until the end of the action. This rule cannot be used with explosive grenades (see universal equipment) or melta bombs.\n• Blast 1" (you cannot select this if the weapon profile being used has the Torrent weapon rule)\n• Devastating 1\n• Lethal 5+\n• Piercing Crits 1\n• Saturate\n• Severe',
  },
  {
    kind: 'strategy',
    name: 'Mission Tactics',
    text: 'Select Conceal or Engage. Whenever a friendly DEATHWATCH operative is shooting against or fighting against an enemy operative that has that order, that friendly operative’s weapons have the Balanced weapon rule.',
  },
  {
    kind: 'strategy',
    name: 'The Long Vigil',
    text: 'Whenever an operative is shooting a friendly DEATHWATCH operative that’s wholly within your territory, you can re-roll one of your defence dice.',
  },
  {
    kind: 'strategy',
    name: 'The Shield That Slays',
    text: 'Whenever a friendly DEATHWATCH operative is wholly within your opponent’s territory, Normal Dmg of 4 or more inflicts 1 less damage on it.',
  },
  {
    kind: 'strategy',
    name: 'And They Shall Know No Fear',
    text: 'You can ignore any changes to the stats of friendly DEATHWATCH operatives from being injured (including their weapons’ stats).',
  },
  {
    kind: 'firefight',
    name: 'Suffer Not the Alien',
    text: 'Use this firefight ploy after rolling your attack dice for a friendly DEATHWATCH operative, if it’s shooting against or fighting against an operative that doesn’t have the CHAOS or IMPERIUM keyword. You can re-roll any of your attack dice.',
  },
  {
    kind: 'firefight',
    name: 'Auspicator Tracking',
    text: 'Use this firefight ploy when a friendly DEATHWATCH operative is counteracting, before it performs any actions. You can change its order.',
  },
  {
    kind: 'firefight',
    name: 'Advanced Auspex Scan',
    text: 'Use this firefight ploy when a friendly DEATHWATCH operative performs the Shoot action. Until the end of the activation/counteraction, its ranged weapons have the Saturate weapon rule and enemy operatives cannot be obscured.',
  },
  {
    kind: 'firefight',
    name: 'Transhuman Physiology',
    text: 'Use this firefight ploy when an operative is shooting a friendly DEATHWATCH operative, in the Roll Defence Dice step. You can retain one of your normal successes as a critical success instead.',
  },
  {
    kind: 'equipment',
    name: 'Digital Weapons',
    text: 'Once per turning point, when a friendly DEATHWATCH operative performs the Fight action, at the start of the Roll Attack Dice step, you can use this rule. If you do, inflict 1 damage on the enemy operative in that sequence.',
  },
  {
    kind: 'equipment',
    name: 'Scrutavore Servo-Thrall',
    text: 'Once per turning point, during a friendly DEATHWATCH operative’s activation, you can use this rule. If you do, during that activation, that operative can perform a mission action for 1 less AP.\n\nHaving an enemy operative within its control range doesn’t prevent that friendly operative from performing that mission action. However, in such an instance, after it does so, you and your opponent roll-off. If your opponent wins, you cannot use this equipment for the rest of the battle.',
  },
  {
    kind: 'equipment',
    name: 'Sanctus-V Bioscryer Cuffs',
    text: 'Once during each friendly DEATHWATCH operative’s activation, before or after it performs an action, if it’s not within control range of enemy operatives, you can use this rule. If you do, select one of the following:\n• That friendly operative regains up to D3 lost wounds.\n• Remove any changes to that friendly operative’s APL stat.\n• Remove one of the following tokens that friendly operative has (before that token’s activation effects are resolved, if relevant): Neutron Fragment, Poison, Terrorchem.',
  },
  {
    kind: 'equipment',
    name: 'Ammunition Reserve',
    text: 'Once per battle, you can use the Special Issue Ammunition faction rule for up to two Shoot actions during one turning point, but you must select different weapon rules for both uses. This takes precedence over the normal Special Issue Ammunition rules.',
  },
]

/* ---------- Angels of Death ---------- */

const AOD_CARDS: RefCard[] = [
  {
    kind: 'faction',
    name: 'Astartes',
    text: 'During each friendly ANGEL OF DEATH operative’s activation, it can perform either two Shoot actions or two Fight actions. If it’s two Shoot actions, a bolt weapon must be selected for at least one of them, and if it’s a bolt sniper rifle or heavy bolter, 1 additional AP must be spent for the second action if both actions are using that weapon.\n\nEach friendly ANGEL OF DEATH operative can counteract regardless of its order.',
  },
  {
    kind: 'faction',
    name: 'Chapter Tactics',
    text: 'When selecting your kill team, select a primary and secondary CHAPTER TACTIC for friendly ANGEL OF DEATH operatives to gain for the battle. Multiple instances of the same CHAPTER TACTIC aren’t cumulative.\n\n1. AGGRESSIVE — This operative’s melee weapons have the Rending weapon rule.\n\n2. DUELLER — Whenever this operative is fighting or retaliating, each of your normal successes can block one unresolved critical success (unless the enemy operative’s weapon has the Brutal weapon rule).\n\n3. RESOLUTE — You can ignore any changes to this operative’s APL stat and it isn’t affected by enemy operatives’ Shock weapon rule.\n\n4. STEALTHY — Whenever an operative is shooting this operative, if you can retain any cover saves, you can retain one additional cover save, or you can retain one cover save as a critical success instead. This isn’t cumulative with improved cover saves from Vantage terrain.\n\n5. MOBILE — This operative can perform the Fall Back action for 1 less AP. This operative can perform the Charge action while within control range of an enemy operative, and can leave that operative’s control range to do so (but then normal requirements for that move apply).\n\n6. HARDY — Whenever an operative is shooting this operative, defence dice results of 5+ are critical successes. Whenever this operative is retaliating, the first time an attack dice inflicts Normal Dmg of 3 or more on this operative during that sequence, that dice inflicts 1 less damage on it.\n\n7. SHARPSHOOTER — Whenever this operative is shooting during an activation in which it hasn’t performed the Charge, Fall Back or Reposition action, its bolt weapons have the Accurate 1 and Severe weapon rules.\n\n8. SIEGE SPECIALIST — This operative’s ranged weapons have the Saturate weapon rule. Whenever this operative is fighting or retaliating, enemy operatives cannot assist.',
  },
  {
    kind: 'strategy',
    name: 'Combat Doctrine',
    text: 'Select one COMBAT DOCTRINE from those presented below. Whenever a friendly ANGEL OF DEATH operative is x, its weapons have the Balanced weapon rule. X is the COMBAT DOCTRINE you selected.\n• Devastator Doctrine: Shooting an operative more than 6" from it.\n• Tactical Doctrine: Shooting an operative within 6" of it.\n• Assault Doctrine: Fighting or retaliating.',
  },
  {
    kind: 'strategy',
    name: 'And They Shall Know No Fear',
    text: 'You can ignore any changes to the stats of friendly ANGEL OF DEATH operatives from being injured (including their weapons’ stats).',
  },
  {
    kind: 'strategy',
    name: 'Adaptive Tactics',
    text: 'Change your secondary CHAPTER TACTIC. Note this ploy only lasts until the end of the turning point, at which point your original secondary CHAPTER TACTIC returns.',
  },
  {
    kind: 'strategy',
    name: 'Indomitus',
    text: 'Whenever an operative is shooting a friendly ANGEL OF DEATH operative, if you roll two or more fails, you can discard one of them to retain another as a normal success instead.',
  },
  {
    kind: 'firefight',
    name: 'Adjust Doctrine',
    text: 'Use this firefight ploy during a friendly ANGEL OF DEATH operative’s activation, before or after it performs an action. If you’ve used the Combat Doctrine strategy ploy during this turning point, change the COMBAT DOCTRINE you selected.',
  },
  {
    kind: 'firefight',
    name: 'Transhuman Physiology',
    text: 'Use this firefight ploy when an operative is shooting a friendly ANGEL OF DEATH operative, in the Roll Defence Dice step. You can retain one of your normal successes as a critical success instead.',
  },
  {
    kind: 'firefight',
    name: 'Shock Assault',
    text: 'Use this firefight ploy when a friendly ANGEL OF DEATH operative is performing the Fight action during an activation in which it performed the Charge action, at the start of the Resolve Attack Dice step. Until the end of that action:\n• Its melee weapon has the Shock weapon rule.\n• The first time you strike during that sequence, inflict 1 additional damage (to a maximum of 7).',
  },
  {
    kind: 'firefight',
    name: 'Wrath of Vengeance',
    text: 'Use this firefight ploy when a friendly ANGEL OF DEATH operative is counteracting. It can perform an additional 1AP action for free during that counteraction, but both actions must be different.',
  },
  {
    kind: 'equipment',
    name: 'Purity Seals',
    text: 'Once per turning point, when a friendly ANGEL OF DEATH operative is shooting, fighting or retaliating, if you roll two or more fails, you can discard one of them to retain another as a normal success instead.',
  },
  {
    kind: 'equipment',
    name: 'Chapter Reliquaries',
    text: 'You can use the Wrath of Vengeance firefight ploy for 0CP if the specified friendly operative has an Engage order.',
  },
  {
    kind: 'equipment',
    name: 'Tilting Shields',
    text: 'Once per turning point, when a friendly ANGEL OF DEATH operative is fighting or retaliating, after your opponent rolls their attack dice, but before re-rolls, you can use this rule. If you do, your opponent cannot retain attack dice results of less than 6 as critical successes during that sequence (e.g. as a result of the Lethal, Rending or Severe weapon rules).',
  },
  {
    kind: 'equipment',
    name: 'Auspex',
    text: 'Once per turning point, when a friendly ANGEL OF DEATH operative performs the Shoot action and you’re selecting a valid target, you can use this rule. If you do, until the end of the activation/counteraction, enemy operatives within 8" of that friendly operative cannot be obscured.',
  },
]

/* ---------- Scout Squad ---------- */

const SCOUT_CARDS: RefCard[] = [
  {
    kind: 'faction',
    name: 'Forward Scouting',
    text: 'At the end of the Set Up Operatives step, you can select and resolve up to six Forward Scouting options. Each option has a number in brackets, which is the maximum number of times you can select and resolve it for the battle. If both players have this rule, alternate resolving selection by selection, starting with the player with initiative.\n\nRedeploy (1) — Change the set up of one third of your operatives (rounding up).\n\nReposition (2) — Perform a free Reposition action with one friendly operative that’s wholly within your drop zone. It must end that move wholly within 3" of your drop zone.\n\nTrip Alarm (2) — Place one of your Trip Alarm markers more than 6" from your opponent’s drop zone. During the first and second turning point, whenever a friendly SCOUT SQUAD operative is shooting an enemy operative that’s within 2" of that marker, that friendly operative’s ranged weapons have the Seek weapon rule. In the Ready step of the third Strategy phase, remove that marker.\n\nBooby Trap (1) — Place one of your Booby Trap markers more than 6" from your opponent’s drop zone and more than 2" from other markers, access points and Accessible terrain. The first time your Booby Trap marker is within an enemy operative’s control range, remove that marker and inflict 2D3 damage on that operative; if it isn’t incapacitated, end its action (if any), even if that action’s effects aren’t fulfilled. If it cannot be placed, move it the minimum amount to do so.\n\nTactical Manoeuvre (1) — Twice per battle STRATEGIC GAMBIT. Select one friendly operative. Until the end of that operative’s next activation, add 1 to its APL stat.\n\nDiversion (1) — Once per battle STRATEGIC GAMBIT. Select one enemy operative within 6" of a killzone edge. Until the end of that operative’s next activation, subtract 1 from its APL stat.\n\nDevise Plan (1) — You gain 1CP.\n\nDesignate Target (1) — Select one enemy operative to gain one of your Target tokens. Whenever a friendly SCOUT SQUAD operative is shooting against, fighting against or retaliating against an enemy operative that has one of your Target tokens, you can re-roll one of your attack dice.\n\nSpy (1) — Approved Ops only. Your opponent must reveal their selected tac op.',
  },
  {
    kind: 'strategy',
    name: 'Guerrilla Engagement',
    text: 'Whenever an enemy operative is shooting a friendly SCOUT SQUAD operative, if that friendly operative is in cover and more than 6" from enemy operatives it’s visible to, you can re-roll one of your defence dice.',
  },
  {
    kind: 'strategy',
    name: 'Ambush',
    text: 'Whenever a friendly SCOUT SQUAD operative is shooting or fighting during its activation, if its order was changed from Conceal to Engage at the start of that activation, or it wasn’t visible to enemy operatives at the start of that activation:\n• That friendly operative’s weapons have the Balanced weapon rule.\n• If the target is expended, that friendly operative’s weapons have the Ceaseless weapon rule instead.',
  },
  {
    kind: 'strategy',
    name: 'Adaptable Training',
    text: 'You can change the order of up to D3 friendly SCOUT SQUAD operatives that are more than 4" from enemy operatives.',
  },
  {
    kind: 'strategy',
    name: 'Stealth Relocation',
    text: 'Up to D3 friendly SCOUT SQUAD operatives that have a Conceal order and are more than 4" from enemy operatives can immediately perform a free Dash action. You cannot use this ploy during the first turning point.',
  },
  {
    kind: 'firefight',
    name: 'Astartes Training',
    text: 'Use this firefight ploy during a friendly SCOUT SQUAD operative’s activation. Until the end of that activation, that operative can do one of the following:\n• Perform two Fight actions.\n• Perform two Shoot actions if an Astartes shotgun, bolt pistol or boltgun is selected for at least one of them.\n• Perform two Shoot actions with a heavy bolter, missile launcher or sniper rifle, but 1 additional AP must be spent for the second action.',
  },
  {
    kind: 'firefight',
    name: 'Raw Physiology',
    text: 'Use this firefight ploy during a friendly SCOUT SQUAD operative’s activation, before or after it performs an action. Until the start of its next activation, add 1" to its Move stat and you can ignore any changes to that operative’s stats from being injured (including its weapons’ stats).',
  },
  {
    kind: 'firefight',
    name: 'Emboldened Aspirant',
    text: 'Use this firefight ploy when a friendly SCOUT SQUAD operative performs the Shoot or Fight action, after any re-rolls. If it’s the first friendly operative to perform either of those actions during this turning point, or if the enemy operative in that action (primary target, if relevant) has a higher Wounds stat than that friendly SCOUT SQUAD operative, you can retain one of your normal successes as a critical success instead.',
  },
  {
    kind: 'firefight',
    name: 'Covert Position',
    text: 'Use this firefight ploy during a friendly SCOUT SQUAD operative’s activation. Until the start of its next activation, while that operative has a Conceal order and is in cover, it cannot be selected as a valid target, taking precedence over all other rules (e.g. Seek, Vantage terrain) except being within 2".',
  },
  {
    kind: 'equipment',
    name: 'Camo Cloak',
    text: 'Whenever an operative is shooting a friendly SCOUT SQUAD operative (excluding SNIPER), if you can retain any cover saves, you can retain one additional cover save. This isn’t cumulative with improved cover saves from Vantage terrain.',
  },
  {
    kind: 'equipment',
    name: 'Targeting Oculars',
    text: 'Up to twice per turning point, when a friendly SCOUT SQUAD operative is performing the Shoot action and you’re selecting a valid target, you can use this rule. If you do, until the end of that action, that friendly operative’s ranged weapons have the Lethal 5+ and Saturate weapon rules.',
  },
  {
    kind: 'equipment',
    name: 'Combat Blades',
    text: 'Friendly SCOUT SQUAD operatives have the following melee weapon — Combat blade: ATK 3, HIT 3+, DMG 4/5. Note that some operatives already have this weapon but with better stats; in that instance, use the better version.',
  },
  {
    kind: 'equipment',
    name: 'Tactical Vox-Link',
    text: 'Once per turning point, you can use the Astartes Training or Emboldened Aspirant firefight ploy for 0CP if a friendly SERGEANT operative is in the killzone.',
  },
]

/* ---------- Raveners ---------- */

const RAVENER_CARDS: RefCard[] = [
  {
    kind: 'faction',
    name: 'Burrow',
    text: 'When setting up a RAVENER kill team before the battle, your first two operatives must be set up as normal. Each other friendly RAVENER operative thereafter can be set up underground: place it to one side instead of in the killzone.\n\nIn the Firefight phase, friendly RAVENER operatives set up underground are activated and can counteract as normal. Whenever a friendly RAVENER operative is underground, it cannot perform any actions other than Burrow. At the end of the battle, each friendly RAVENER operative that’s underground is incapacitated.\n\nBURROW (1AP) — If this operative is underground, set it up on your TUNNEL in a location it can be placed (it’s no longer underground, and it can be set up within control range of enemy operatives). Until the end of the activation/counteraction, subtract 2" from its Move stat. Alternatively, instead of resolving the above effect, if this operative is in the killzone and on your TUNNEL, remove it from the killzone: it’s now underground. An operative cannot perform this action while carrying a marker, or if it isn’t either underground or on your TUNNEL.',
  },
  {
    kind: 'faction',
    name: 'Tunnel',
    text: 'At the end of the Set Up Operatives step, place your Tunnel marker numbered ‘0’ on the killzone floor, wholly within your drop zone and touching your killzone edge. As a STRATEGIC GAMBIT in the first four turning points, you can place your next numbered Tunnel marker on the killzone floor wholly within 5" of your preceding Tunnel marker. This means that, as the battle progresses, you can have a series of sequentially numbered Tunnel markers (0, 1, 2, 3 and 4). Once you have placed five Tunnel markers, don’t place any more.\n\nYour Tunnel markers and the area between your sequentially numbered markers (i.e. between 0 and 1, 1 and 2, etc.), create your TUNNEL.',
  },
  {
    kind: 'faction',
    name: 'Predatory Instincts',
    text: 'During each friendly RAVENER operative’s activation, it can perform two Fight actions.\n\nEach friendly RAVENER operative can counteract regardless of its order. Whenever it does:\n• You can change its order first, or change its order instead of performing an action (for the latter, still treat it as having counteracted this turning point).\n• During that counteraction, if it doesn’t perform a mission action it can perform a free Burrow action.',
  },
  {
    kind: 'strategy',
    name: 'Death From Below',
    text: 'Whenever a friendly RAVENER operative is fighting:\n• If it’s performed the Burrow action during that activation/counteraction, its melee weapons have the Balanced weapon rule.\n• If it’s on your TUNNEL, its melee weapons have the Ceaseless weapon rule.',
  },
  {
    kind: 'strategy',
    name: 'Whipcord Emergence',
    text: 'Whenever an operative is shooting a friendly RAVENER operative:\n• If that friendly operative has performed the Burrow action during that turning point, you can re-roll one of your defence dice.\n• If that friendly operative is on your TUNNEL, you can re-roll any of your defence dice.',
  },
  {
    kind: 'strategy',
    name: 'Writhe Out of Sight',
    text: 'Select one friendly RAVENER operative in the killzone. That friendly operative can immediately perform a free Burrow action. If it’s within 2" of your TUNNEL, it can immediately perform a free Fall Back or Reposition action before it does so.',
  },
  {
    kind: 'strategy',
    name: 'Tunnel Lurkers',
    text: 'Whenever a friendly RAVENER operative is on your TUNNEL it’s in cover, unless it’s within 2" of the active operative. Treat this as cover provided by Light terrain (therefore it’s affected by rules that prevent this, e.g. Seek Light and Vantage terrain).',
  },
  {
    kind: 'firefight',
    name: 'Slithering Evasion',
    text: 'Use this firefight ploy during a friendly RAVENER operative’s activation or counteraction, before or after it performs an action. During that activation/counteraction, that operative can:\n• Perform the Fall Back action for 1 less AP.\n• Perform the Charge action while within control range of an enemy operative, and can leave that operative’s control range to do so (but then normal requirements for that move apply).',
  },
  {
    kind: 'firefight',
    name: 'Subterranean Horror',
    text: 'Use this firefight ploy when an enemy operative is performing the Fight action and selects a friendly RAVENER operative on your TUNNEL to fight against. In the Resolve Attack Dice step of that sequence, you resolve the first attack dice (i.e. defender instead of attacker).',
  },
  {
    kind: 'firefight',
    name: 'Burrowing Strike',
    text: 'Use this firefight ploy when a friendly RAVENER operative performs the Burrow action. Before that operative is removed from the killzone, or after setting it up on your TUNNEL, inflict D3+1 damage on each enemy operative within its control range (roll separately for each). You cannot use this ploy in the Strategy phase, or during a FELLTALON operative’s activation or counteraction if it performs the Toxic Lunge action (and vice versa).',
  },
  {
    kind: 'firefight',
    name: 'Death Frenzy',
    text: 'Use this firefight ploy when a friendly RAVENER operative is incapacitated. Before that operative is removed from the killzone, inflict D3 damage on each enemy operative within its control range (roll separately for each). If that friendly operative is a VENOMSPITTER that’s currently benefitting from the effects of its Distend Dorsal Sac action, inflict 2D3 damage instead.',
  },
  {
    kind: 'equipment',
    name: 'Chromatospore Camouflage',
    text: 'Whenever an operative is shooting a friendly RAVENER operative, if you can retain any cover saves, you can retain one additional cover save. This isn’t cumulative with improved cover saves from Vantage terrain.',
  },
  {
    kind: 'equipment',
    name: 'Acid Blood',
    text: 'Whenever a friendly RAVENER operative is fighting or retaliating, whenever an attack dice inflicts damage on it, roll one D6: on a 5+, inflict 1 damage on the enemy operative in that sequence.',
  },
  {
    kind: 'equipment',
    name: 'Metamorphic Flesh',
    text: 'Whenever a friendly RAVENER operative is activated, it regains up to D3 lost wounds.',
  },
  {
    kind: 'equipment',
    name: 'Heightened Senses',
    text: 'Once per battle, after rolling off to decide initiative, if a friendly RAVENER operative is underground and an enemy operative is within 5" of your TUNNEL, you can re-roll your dice.',
  },
]

/* ---------- T'au XV26 Stealth Battlesuits ---------- */

const XV26_CARDS: RefCard[] = [
  {
    kind: 'faction',
    name: 'Kauyon',
    text: 'Whenever a friendly XV26 STEALTH BATTLESUIT operative is shooting an enemy operative, its ranged weapons have the Accurate X weapon rule. X is determined by that enemy operative’s location:\n• Within 3" of your territory — Accurate 1\n• Within your territory — Accurate 2\n• Within 3" of your drop zone — Accurate 3',
  },
  {
    kind: 'faction',
    name: 'Stealth Fields',
    text: 'Whenever a friendly XV26 STEALTH BATTLESUIT operative has a Conceal order, it cannot be visible to enemy operatives more than 3" from it (this takes precedence over all other rules).\n\nWhenever a friendly XV26 STEALTH BATTLESUIT operative has a Conceal order, it can perform the Fall Back action for 1 less AP.',
  },
  {
    kind: 'strategy',
    name: 'Patient Hunters',
    text: 'Whenever a friendly XV26 STEALTH BATTLESUIT operative is shooting against or fighting against an expended enemy operative, that friendly operative’s weapons have the Balanced weapon rule and its ranged weapons have the Saturate weapon rule.',
  },
  {
    kind: 'strategy',
    name: 'Bonds of Unity',
    text: 'Whenever a friendly XV26 STEALTH BATTLESUIT operative is activated (excluding DRONE), if it’s visible to and within 6" of another friendly XV26 STEALTH BATTLESUIT operative (excluding DRONE), you can ignore any changes to that first friendly operative’s APL stat and select one of the following:\n• Ignore any changes to that first friendly operative’s Move stat from being injured until the end of that activation.\n• Ignore any changes to the Hit stat of that first friendly operative’s weapons from being injured until the end of that activation.',
  },
  {
    kind: 'strategy',
    name: 'Prepare Ambush',
    text: 'Place one of your Ambush markers wholly within your territory and more than 2" from enemy operatives. Whenever a friendly XV26 STEALTH BATTLESUIT operative is shooting an enemy operative that’s within 2" of that marker, you can use this rule. If you do, that friendly operative’s ranged weapons have the Seek weapon rule until the end of the action. Remove that Ambush marker at the end of that action or in the Ready step of the next turning point (whichever comes first).',
  },
  {
    kind: 'strategy',
    name: 'Holowave Countermeasures',
    text: 'Whenever an operative is shooting a friendly XV26 STEALTH BATTLESUIT operative more than 6" from it, in the Roll Attack Dice step, the attacker must discard one of their unresolved normal successes (or one of their critical successes if there are none). This isn’t cumulative with being obscured.',
  },
  {
    kind: 'firefight',
    name: 'Vectored Retro-Thrusters',
    text: 'Use this firefight ploy when an enemy operative ends the Charge action within control range of a friendly XV26 STEALTH BATTLESUIT operative (excluding DRONE). Interrupt that action to use this rule. If you do, that friendly operative can immediately perform a free Fall Back action, but it cannot move more than 3" during that action. Then, that enemy operative can immediately perform a free Reposition action using any remaining move distance it had from that first Charge action, and can do so even if it’s performed an action that prevents it from performing the Reposition action.',
  },
  {
    kind: 'firefight',
    name: 'Ghostshroud',
    text: 'Use this firefight ploy at the end of a friendly XV26 STEALTH BATTLESUIT operative’s activation. If that operative has an Engage order, change it to Conceal. You cannot use this ploy for each friendly operative more than once per battle.',
  },
  {
    kind: 'firefight',
    name: 'Engage Jet Pack',
    text: 'Use this firefight ploy when a friendly XV26 STEALTH BATTLESUIT operative (excluding DRONE) is activated or counteracts. Until the end of that activation/counteraction, you can ignore the vertical distance they move during one climb and one drop.',
  },
  {
    kind: 'firefight',
    name: 'Saviour Protocols',
    text: 'Use this firefight ploy when a friendly XV26 STEALTH BATTLESUIT operative (excluding DRONE) is selected as the valid target of a Shoot action. Select one friendly XV26 STEALTH BATTLESUIT DRONE operative visible to and within 3" of that first friendly operative to become the valid target instead (even if it wouldn’t normally be valid for this). That friendly DRONE operative is only in cover or obscured if the original target was. This ploy has no effect if the ranged weapon has the Blast or Torrent weapon rule.',
  },
  {
    kind: 'equipment',
    name: 'XV26 Multitrackers',
    text: 'Once per turning point, when a friendly XV26 STEALTH BATTLESUIT operative is performing the Shoot action and you select a burst cannon (sweeping), you can use this rule. If you do, until the end of that action, that weapon has the Torrent 2" weapon rule.',
  },
  {
    kind: 'equipment',
    name: 'Counter-Network Jammers',
    text: 'STRATEGIC GAMBIT. Select one objective marker or mission marker. Until the end of the turning point, whenever determining control of that marker, treat the total APL stat of enemy operatives that contest it as 1 lower if at least one of those enemy operatives is within 3" of friendly XV26 STEALTH BATTLESUIT operatives. Note this isn’t a change to the APL stat, so any changes are cumulative with this.',
  },
  {
    kind: 'equipment',
    name: 'Advanced Blacksun Filters',
    text: 'Whenever a friendly XV26 STEALTH BATTLESUIT operative is shooting an operative that’s obscured, you don’t have to discard one success as a result of that rule. All other effects of obscured apply as normal.',
  },
  {
    kind: 'equipment',
    name: 'Hardwired Target Locks',
    text: 'Whenever you would counteract, you can do so with one friendly XV26 STEALTH BATTLESUIT operative that has a Conceal order and is more than 3" from enemy operatives, but before it counteracts, you must change its order to Engage and it cannot perform any actions other than Shoot during that counteraction.',
  },
]

/* ---------- Ork Kommandos ---------- */

const KOMMANDO_CARDS: RefCard[] = [
  {
    kind: 'faction',
    name: 'Throat Slittas',
    text: 'Each friendly KOMMANDO operative (excluding BOMB SQUIG) can perform the Charge action while it has a Conceal order.',
  },
  {
    kind: 'strategy',
    name: 'Dakka! Dakka! Dakka!',
    text: 'Friendly KOMMANDO operatives’ ranged weapons have the Punishing weapon rule.',
  },
  {
    kind: 'strategy',
    name: 'Waaagh!',
    text: 'Friendly KOMMANDO operatives’ melee weapons have the Balanced weapon rule.',
  },
  {
    kind: 'strategy',
    name: 'Skulk About',
    text: 'Whenever an enemy operative is shooting a friendly KOMMANDO operative that has a Conceal order, you can retain one of your defence dice as a normal success without rolling it (in addition to a cover save, if any).',
  },
  {
    kind: 'strategy',
    name: 'Sssshhhh!',
    text: 'Each friendly KOMMANDO operative that’s not a valid target for enemy operatives, or has a Conceal order and is more than 6" from enemy operatives, can immediately perform a free Dash action. You cannot use this ploy during the first turning point.',
  },
  {
    kind: 'firefight',
    name: 'Just a Scratch',
    text: 'Use this firefight ploy when an attack dice inflicts Normal Dmg on a friendly KOMMANDO operative (excluding BOMB SQUIG and GROT). Ignore that inflicted damage.',
  },
  {
    kind: 'firefight',
    name: 'Krump ’Em!',
    text: 'Use this firefight ploy at the end of the Firefight phase. Select one friendly KOMMANDO operative. It can immediately perform a free Fight action.',
  },
  {
    kind: 'firefight',
    name: 'Kunnin’ but Brutal',
    text: 'Use this firefight ploy when a friendly KOMMANDO operative that has a Conceal order is fighting during an activation in which it performed the Charge action, you’re resolving the first attack dice, and it’s a strike with a normal success. Treat that normal success as a critical success instead.',
  },
  {
    kind: 'firefight',
    name: 'Shake It Off',
    text: 'Use this firefight ploy when a friendly KOMMANDO operative is activated, or when its APL stat is changed. Until the start of the next turning point, you can ignore any changes to its APL stat.',
  },
  {
    kind: 'equipment',
    name: 'Choppas',
    text: 'Friendly KOMMANDO operatives (excluding BOMB SQUIG and GROT) have the following melee weapon — Choppa: ATK 3, HIT 3+, DMG 4/5. Note that some operatives already have this weapon but with better stats; in that instance, use the better version.',
  },
  {
    kind: 'equipment',
    name: 'Dynamite',
    text: 'Once per battle, a friendly KOMMANDO operative (excluding BOMB SQUIG and GROT) can use the following ranged weapon — Dynamite: ATK 5, HIT 4+, DMG 4/5. Range 4", Blast 1", Heavy (Reposition only), Saturate.',
  },
  {
    kind: 'equipment',
    name: 'Harpoon',
    text: 'Once per turning point, a friendly KOMMANDO operative (excluding BOMB SQUIG and GROT) can use the following ranged weapon — Harpoon: ATK 4, HIT 4+, DMG 4/5. Range 8", Lethal 5+, Stun.',
  },
  {
    kind: 'equipment',
    name: 'Collapsible Stocks',
    text: 'Remove the Range weapon rule from the following ranged weapons friendly KOMMANDO operatives have: Shokka pistol, Slugga.',
  },
]

/** teamId -> its faction rules, ploys and faction equipment. */
export const CARDS: Record<string, RefCard[]> = {
  dw: DEATHWATCH_CARDS,
  dw2: DEATHWATCH_CARDS, // one datacard, two kill teams — as CATALOGUE shares DEATHWATCH_ROWS
  aod: AOD_CARDS,
  sct: SCOUT_CARDS,
  rav: RAVENER_CARDS,
  xv26: XV26_CARDS,
  kom: KOMMANDO_CARDS,
}

/** Equipment every team may take. Lives in the core rules rather than any team's card, so it
 *  is not in the six PDFs above — empty until that sheet is transcribed too. */
export const UNIVERSAL_EQUIPMENT: RefCard[] = []

export const teamCards = (teamId: string, kind: RefKind) => (CARDS[teamId] ?? []).filter((c) => c.kind === kind)

/** What this phase unlocks for this team, in the order the cards should be read. */
export const phaseCards = (teamId: string, phase: PhaseId) =>
  phaseMeta(phase).use.flatMap((kind) => teamCards(teamId, kind))

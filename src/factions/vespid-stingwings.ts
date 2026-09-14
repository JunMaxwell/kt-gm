// Generated from the official team rules PDF. Do not edit by hand — rerun the
// extractor described in CLAUDE.md (‘Where the card data came from’).
import type { RefCard } from '../compendium'
import type { Operative } from '../rules'

export const cards: RefCard[] = [
  { kind: 'faction', name: "Communion", text: "Communion points are used to maintain the tactical focus of friendly VESPID STINGWING operatives. In the Ready step of each Strategy phase, you gain D3 Communion points, plus 1 if a friendly OVERSIGHT DRONE operative is in the killzone. Communion points are used as follows (OVERSIGHT DRONE operatives aren’t affected by the following):\nRULE CONTINUES ON OTHER SIDE" },
  { kind: 'faction', name: "Neutron Charge", text: "Neutron weapons are powered by radioactive crystals from the Vespids’ home world. The harmonic thrumming of Vespids’ wings resonates within the crystals to charge them. When unleashed, even heavy combat armour can barely protect against this atom‑stripping energy charge.\nNeutron weapons are any weapons that have the word ‘neutron’ in their name, e.g. neutron blaster, neutron grenade launcher, etc. Whenever a friendly VESPID STINGWING operative moves or uses FLY, its neutron weapons have the Piercing 1 weapon rule until the end of the turning point." },
  { kind: 'faction', name: "Fly", text: "Whenever a friendly VESPID STINGWING operative performs an action in which it moves, it can FLY. If it does, don’t move it. Instead, remove it from the killzone and set it back up wholly within a distance equal to its Move stat (or 3\" if it was a Dash) horizontally of its original location (in a killzone that uses the close quarters rules, e.g. Killzone: Tomb World, this distance cannot be measured over or through Wall terrain, and that operative cannot be set up on the other side of an access point – in other words it cannot FLY through an open hatchway). Note that it gains no additional distance when performing the Charge action. It must be set up in a location it can be placed, and unless it’s the Charge action, it cannot be set up within control range of an enemy operative." },
  { kind: 'strategy', name: "Hardened Exoskeleton", text: "Whenever a friendly VESPID STINGWING operative (excluding OVERSIGHT DRONE) is fighting or retaliating, Normal Dmg of 4 or more inflicts 1 less damage on it." },
  { kind: 'strategy', name: "Aerial Agility", text: "Whenever an operative is shooting a friendly VESPID STINGWING operative while counteracting or interrupting, or during an activation in which that shooting operative moved or was set up, roll one D6 whenever an attack dice would inflict Normal Dmg: on a 5+, ignore that inflicted damage. You cannot ignore more than one attack dice per Shoot action sequence this way." },
  { kind: 'strategy', name: "Airborne Predators", text: "Whenever a friendly VESPID STINGWING operative moves or uses FLY during its activation, its weapons have the Balanced weapon rule until the end of that activation." },
  { kind: 'firefight', name: "Ocelli", text: "Use this firefight ploy when a friendly VESPID STINGWING operative performs the Shoot action during an activation in which it’s used FLY. Until the end of that action, it gains all benefits from the first and second main features of Vantage terrain. When determining the height difference between operatives for Vantage terrain rules, treat that friendly operative as being 3\" higher than it currently is (but not when determining the distance for Communion)." },
  { kind: 'strategy', name: "Sting", text: "Improve the Hit stat of friendly VESPID STINGWING operatives’ claws by 1, and those weapons have the Lethal 5+ and Shock weapon rules." },
  { kind: 'firefight', name: "Darting Flight", text: "Use this firefight ploy when a friendly VESPID\nSTINGWING operative performs the Reposition action. Until the end of that action, it can move an additional D3\", or be set up an additional D3\" away if it uses FLY. In either case, it cannot perform Shoot or Fight actions for the rest of the turning point." },
  { kind: 'firefight', name: "Neutron Overload", text: "Use this firefight ploy when you resolve a critical success for a friendly VESPID STINGWING operative that’s shooting with a neutron weapon during an activation in which it’s moved or used FLY. If the target is within 4\" of it, inflict D3 additional damage." },
  { kind: 'equipment', name: "Neurostimulant", text: "In the Ready step of each Strategy phase, when determining how many Communion points to gain, you can roll two D3 and select one D3 to use." },
  { kind: 'firefight', name: "Vicious Venom", text: "Use this firefight ploy when a friendly VESPID STINGWING operative (excluding OVERSIGHT DRONE) is fighting and you strike with a critical success. Inflict D3 additional damage." },
  { kind: 'equipment', name: "Convergence Stimulant", text: "Once per turning point, a friendly VESPID STINGWING operative can perform the Pick Up Marker or a mission action without you spending a Communion point." },
  { kind: 'equipment', name: "Accelerant Stimulant", text: "Whenever a friendly VESPID STINGWING operative (excluding OVERSIGHT DRONE) performs the Charge or Dash action, it can move an additional 1\". If it uses FLY for this action, you can set it back up 1\" further away." },
  { kind: 'equipment', name: "Aggression Stimulant", text: "Whenever a friendly VESPID STINGWING operative (excluding OVERSIGHT DRONE) is fighting, its melee weapons have the Ceaseless weapon rule." },
]

export const operatives: Operative[] = [
  { id: "vespid-stingwings:vespid-strain-leader", name: "Vespid Strain Leader", apl: 2, move: "6\"", save: "5+", w: 10 },
  { id: "vespid-stingwings:oversight-drone", name: "Oversight Drone", apl: 2, move: "8\"", save: "2+", w: 5 },
  { id: "vespid-stingwings:vespid-longsting", name: "Vespid Longsting", apl: 2, move: "6\"", save: "5+", w: 9 },
  { id: "vespid-stingwings:vespid-shadestrain", name: "Vespid Shadestrain", apl: 2, move: "6\"", save: "3+", w: 9 },
  { id: "vespid-stingwings:vespid-skyblast", name: "Vespid Skyblast", apl: 2, move: "6\"", save: "5+", w: 9 },
  { id: "vespid-stingwings:vespid-swarmguard", name: "Vespid Swarmguard", apl: 2, move: "6\"", save: "5+", w: 9 },
  { id: "vespid-stingwings:vespid-warrior", name: "Vespid Warrior", apl: 2, move: "6\"", save: "5+", w: 9 },
]

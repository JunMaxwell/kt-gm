import { useState } from 'react'

import { PLOY_CP, type RefCard } from '../compendium'
import type { Effect } from '../state'
import { effectsFor, teamOps } from '../state'
import { Btn, Label } from './kit'
import { EffectChip } from './cards'
import type { Game } from './shared'

/**
 * Saying what an effect does, because nothing can work it out.
 *
 * The app holds 774 cards of rules PROSE extracted from PDFs and has no structured meaning for a
 * single one of them, so there is no way to know that Kau'yon grants +1 APL. Rather than build a
 * rules engine over 697 generated cards, whoever uses the ploy states the numbers once and the
 * app does the three things it actually can: remember them, put them on the right cards, and
 * expire them at the right moment.
 *
 * Every field is optional. A ploy with no numbers at all is still worth applying — the phones
 * then show its name and its own text, which for most cards is the whole of what a player needs.
 */
export function EffectForm({
  game,
  onApply,
  teamId,
  card,
  onDone,
}: {
  game: Game
  /** A callback, not a `dispatch`: the GM hands it one and a player hands it their `net.ask`,
   *  which is the same seam `Draft` uses to stay writable without being a writer. */
  onApply: (a: { type: 'effectAdd'; effect: Omit<Effect, 'id'>; cost?: number }) => void | boolean
  teamId: string
  /** Seeds the label, kind, text and CP cost when this came from tapping a ploy. */
  card?: RefCard
  onDone?: () => void
}) {
  const ploy = card?.kind === 'strategy' || card?.kind === 'firefight'
  const [label, setLabel] = useState(card?.name ?? '')
  // A strategy ploy lasts the turning point; a firefight one is almost always "until the end of
  // its next activation". Defaults, not rules — every card can say otherwise and the GM reads it.
  const [until, setUntil] = useState<Effect['until']>(card?.kind === 'firefight' ? 'activation' : 'tp')
  const [opId, setOpId] = useState('')
  const [n, setN] = useState({ apl: 0, move: 0, hit: 0, save: 0 })
  const [rules, setRules] = useState('')
  const [free, setFree] = useState(false)

  const bump = (k: keyof typeof n, d: number) => setN({ ...n, [k]: n[k] + d })

  const apply = () => {
    if (!label.trim()) return
    // `onApply` may not land — a player's goes over a socket to the GM, who is the only reducer.
    // It says so by returning false, and then the form stays up rather than pretending.
    const sent = onApply({
      type: 'effectAdd',
      cost: ploy && !free ? (card?.cp ?? PLOY_CP) : undefined,
      effect: {
        label: label.trim(),
        text: card?.text,
        kind: card?.kind,
        teamId,
        ...(opId ? { opId } : {}),
        // The GM's form makes exactly one modifier, and it is always an applied one — he is
        // stating a number he wants on the card, not describing a trigger to read.
        fx: [
          {
            ...(n.apl ? { apl: n.apl } : {}),
            ...(n.move ? { move: n.move } : {}),
            ...(n.hit ? { hit: n.hit } : {}),
            ...(n.save ? { save: n.save } : {}),
            ...(rules.trim() ? { rules: rules.trim() } : {}),
          },
        ],
        until,
      },
    })
    if (sent !== false) onDone?.()
  }

  return (
    <div className="space-y-2 border border-rule bg-wash/60 p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What is it called?"
          className="min-w-0 flex-1 border border-rule bg-paper px-2 py-1"
        />
        <select
          value={until}
          onChange={(e) => setUntil(e.target.value as Effect['until'])}
          className="border border-rule bg-paper px-1 py-1 text-xs"
        >
          <option value="activation">until its next activation ends</option>
          <option value="tp">this turning point</option>
          <option value="battle">the rest of the battle</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label>On</Label>
        <select
          value={opId}
          onChange={(e) => setOpId(e.target.value)}
          className="min-w-0 flex-1 border border-rule bg-paper px-1 py-1 text-xs"
        >
          <option value="">the whole team</option>
          {teamOps(game, teamId).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* Positive is BETTER on every one of these, including the two roll stats — the rules say
          "improve the Hit stat by 1" and that is what a person types. `liveStats` negates. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {([
          ['apl', 'APL'],
          ['move', 'Move "'],
          ['hit', 'Hit'],
          ['save', 'Save'],
        ] as const).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1">
            <Label>{l}</Label>
            <Btn className="w-6 px-0" onClick={() => bump(k, -1)}>
              −
            </Btn>
            <b className="w-6 text-center tabular-nums">{n[k] > 0 ? `+${n[k]}` : n[k]}</b>
            <Btn className="w-6 px-0" onClick={() => bump(k, 1)}>
              +
            </Btn>
          </span>
        ))}
      </div>

      <input
        value={rules}
        onChange={(e) => setRules(e.target.value)}
        placeholder="Weapon rules to add, e.g. Balanced, Ceaseless"
        className="w-full border border-rule bg-paper px-2 py-1 text-xs"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={apply} disabled={!label.trim()} className="bg-card font-semibold text-white">
          {ploy && !free ? `Use — ${card?.cp ?? PLOY_CP}CP` : 'Apply'}
        </Btn>
        {/* Several rules hand out a ploy for 0CP — the Watch Sergeant's *Strategic Command* does
            it twice a battle — and equipment does it too. Cheaper than modelling any of them. */}
        {ploy && (
          <Btn on={free} onClick={() => setFree(!free)} title="Some rules grant a ploy for 0CP">
            free
          </Btn>
        )}
        {onDone && <Btn onClick={onDone}>Cancel</Btn>}
      </div>
    </div>
  )
}

/** Everything running on one team, with a way to end each. The GM's view and the player's. */
export function EffectList({
  game,
  teamId,
  onDrop,
}: {
  game: Game
  teamId: string
  /** Absent where nobody may end one. */
  onDrop?: (id: string) => void
}) {
  const on = effectsFor(game, teamId)
  if (!on.length) return null
  return (
    <div className="flex flex-wrap items-baseline gap-1 text-xs">
      {on.map((e) => (
        <EffectChip key={e.id} e={e} onDrop={onDrop ? () => onDrop(e.id) : undefined} />
      ))}
    </div>
  )
}

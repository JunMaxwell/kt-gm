import { useRef, useState } from 'react'

import { BOARD, boardPhases, mirrorPiece, type Piece, type Point, SIDE_COLOR, SIDES, TEAMS, TERRAIN_KIND, TERRAIN_PALETTE, type TerrainKind } from '../rules'
import { Btn, BufferedInput, Label } from './kit'
import { type Dispatch, type Game, onNum, SIDE_IDS } from './shared'

/* ---------- the board ---------- */

export type Sel = { kind: 'piece' | 'op'; id: string } | null
export type Drag = { kind: 'piece' | 'op' | 'marker'; id: string; x: number; y: number; ox: number; oy: number }

/**
 * The physical table, drawn to scale and built by hand: terrain laid out to match the real
 * board, objective markers dragged to where they actually sit, and every operative's
 * position. All of it lives in `game`, so a mid-game save restores the board along with
 * the score and spectators see it over the existing relay.
 *
 * A drag keeps its position in local state and only dispatches on pointer-up. Dispatching
 * per `pointermove` would rewrite localStorage and re-render 53 tokens sixty times a second.
 */
export function MapBuilder({ game, dispatch, bare }: { game: Game; dispatch: Dispatch; bare?: boolean }) {
  // `bare` is the spectator's board: no phase strip, no palette, no inspector. Those are
  // inert on a viewer anyway, and on a phone they are three screens of dead controls.
  const svgRef = useRef<SVGSVGElement>(null)
  const [sel, setSel] = useState<Sel>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [view, setView] = useState<string | null>(null) // null = the live board
  const { w, h, drop, snap: step, token } = BOARD

  const phases = boardPhases(game.tpCount)
  const shot = view ? game.boards[view] : undefined
  // A captured phase renders instead of the live board, and nothing on it can be dragged.
  const terrain = shot ? shot.terrain : game.terrain
  const markers = shot ? shot.markers : game.markers

  // getScreenCTM is the native answer to "where on the board is this pixel" and stays
  // correct however the SVG is scaled by the surrounding layout.
  const at = (e: React.PointerEvent) =>
    new DOMPoint(e.clientX, e.clientY).matrixTransform(svgRef.current!.getScreenCTM()!.inverse())
  const snap = (v: number) => Math.round(v / step) * step

  const grab = (kind: Drag['kind'], id: string, ax: number, ay: number) =>
    shot
      ? undefined
      : (e: React.PointerEvent) => {
          e.preventDefault()
          e.stopPropagation()
          const p = at(e)
          svgRef.current!.setPointerCapture(e.pointerId)
          setDrag({ kind, id, x: ax, y: ay, ox: p.x - ax, oy: p.y - ay })
          if (kind !== 'marker') setSel({ kind, id })
        }

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return
    const p = at(e)
    setDrag({ ...drag, x: p.x - drag.ox, y: p.y - drag.oy })
  }

  const onUp = () => {
    if (!drag) return
    const pos = { x: snap(drag.x), y: snap(drag.y) }
    if (drag.kind === 'piece') dispatch({ type: 'terrainPatch', id: drag.id, patch: pos })
    else if (drag.kind === 'op') dispatch({ type: 'place', opId: drag.id, pos })
    else dispatch({ type: 'markerMove', index: Number(drag.id), pos })
    setDrag(null)
  }

  /** Whatever is mid-drag follows the pointer; everything else renders from state. */
  const dragged = <T extends Point>(kind: Drag['kind'], id: string, v: T): T =>
    drag && drag.kind === kind && drag.id === id ? { ...v, x: drag.x, y: drag.y } : v

  const selPiece = !shot && sel?.kind === 'piece' ? game.terrain.find((p) => p.id === sel.id) : undefined
  const patch = (p: Partial<Omit<Piece, 'id'>>) =>
    selPiece && dispatch({ type: 'terrainPatch', id: selPiece.id, patch: p })
  const selOp =
    !shot && sel?.kind === 'op' ? Object.values(game.roster).flat().find((o) => o.id === sel.id) : undefined

  const label = (i: number) => (i === 0 && markers.length % 2 ? 'C' : String(i + 1))
  const grabbable = shot ? '' : 'cursor-move'

  const piece = (p: Piece, ghost?: boolean) => (
    <rect
      key={p.id}
      x={p.x}
      y={p.y}
      width={p.w}
      height={p.h}
      rx={0.15}
      transform={`rotate(${p.rot} ${p.x + p.w / 2} ${p.y + p.h / 2})`}
      fill={TERRAIN_KIND[p.kind].fill}
      // The twin renders fainter so it is obvious which of the pair is the one you can grab.
      fillOpacity={TERRAIN_KIND[p.kind].opacity * (ghost ? 0.55 : 1)}
      stroke={!ghost && sel?.kind === 'piece' && sel.id === p.id ? '#f05c22' : 'none'}
      strokeWidth={0.3}
      // The twin is derived, never stored, so clicks fall through to the real piece and
      // moving one always moves both.
      pointerEvents={ghost ? 'none' : 'auto'}
      className={ghost ? '' : grabbable}
      onPointerDown={ghost ? undefined : grab('piece', p.id, p.x, p.y)}
    />
  )

  return (
    <details open className="mx-4 mb-4 overflow-hidden border border-rule bg-paper shadow-sm">
      <summary className="display cursor-pointer kt-rule bg-card px-3 py-2 text-xl text-white">Board</summary>

      {/* Each phase is a captured copy of the board. Empty slots capture on click; full
          ones open read-only, so looking back at TP2 can never disturb the live table. */}
      {!bare && (
      <div className="flex flex-wrap items-center gap-1 border-b border-rule px-3 py-2">
        <Btn on={!view} onClick={() => setView(null)} title="The board as it stands now — the only one you can edit">
          Live board
        </Btn>
        <span className="mx-1 text-ink/25">|</span>
        {phases.map((ph) => {
          const has = !!game.boards[ph.id]
          return (
            <Btn
              key={ph.id}
              on={view === ph.id}
              onClick={() => (has ? setView(ph.id) : dispatch({ type: 'boardCapture', phase: ph.id }))}
              className={has ? '' : 'opacity-40'}
              title={has ? `${ph.hint} — click to view` : `${ph.hint}. Nothing captured — click to store the board as it is now.`}
            >
              {ph.label}
              {has ? '' : ' +'}
            </Btn>
          )
        })}
        <span className="ml-auto text-xs text-ink/45">Turning points capture themselves on “Next TP”.</span>
      </div>
      )}

      {shot && (
        <div className="flex flex-wrap items-center gap-2 bg-amber-400/90 px-3 py-1.5 text-sm text-ink">
          <b>{phases.find((p) => p.id === view)?.label}</b> — a captured board, read only.
          <Btn
            onClick={() => {
              dispatch({ type: 'boardRestore', phase: view! })
              setView(null)
            }}
            title="Put the terrain and every operative back where this capture has them. Wounds and the score are untouched."
          >
            Load onto the live board
          </Btn>
          <Btn onClick={() => dispatch({ type: 'boardCapture', phase: view! })} title="Overwrite this capture with the board as it stands now">
            Re-capture from live
          </Btn>
          <Btn onClick={() => setView(null)}>Back to live</Btn>
        </div>
      )}

      <div className={`grid gap-4 p-3 ${bare ? '' : 'xl:grid-cols-[minmax(0,1fr)_17rem]'}`}>
        <div className="min-w-0">
          <svg
            ref={svgRef}
            viewBox={`-0.5 -0.5 ${w + 1} ${h + 1}`}
            className="w-full touch-none select-none rounded border border-rule bg-white"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerDown={() => setSel(null)}
          >
            <rect x={0} y={0} width={w} height={h} fill="#f7f5f1" />
            {Array.from({ length: w / 2 - 1 }, (_, i) => (
              <line key={`c${i}`} x1={i * 2 + 2} y1={0} x2={i * 2 + 2} y2={h} stroke="#282c34" strokeOpacity={0.07} strokeWidth={0.06} />
            ))}
            {Array.from({ length: h / 2 - 1 }, (_, i) => (
              <line key={`r${i}`} x1={0} y1={i * 2 + 2} x2={w} y2={i * 2 + 2} stroke="#282c34" strokeOpacity={0.07} strokeWidth={0.06} />
            ))}

            {SIDE_IDS.map((side, i) => (
              <g key={side}>
                <rect x={0} y={i ? h - drop : 0} width={w} height={drop} fill={SIDE_COLOR[side]} fillOpacity={0.1} />
                {/* hugging the outer edge, so the deployed rows below never sit on the label */}
                <text x={0.6} y={i ? h - 0.5 : 1.2} fontSize={1.1} fill={SIDE_COLOR[side]} className="display">
                  {SIDES[side]} drop zone
                </text>
              </g>
            ))}
            <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#282c34" strokeOpacity={0.3} strokeWidth={0.08} strokeDasharray="0.8 0.7" />

            {game.mirror && terrain.map((p) => piece(mirrorPiece(dragged('piece', p.id, p)), true))}
            {terrain.map((p) => piece(dragged('piece', p.id, p)))}

            {markers.map((m0, i) => {
              const m = dragged('marker', String(i), m0)
              const holder = game.objectives[i]
              return (
                <g key={i} className={grabbable} onPointerDown={grab('marker', String(i), m0.x, m0.y)}>
                  <title>{`Marker ${label(i)}${shot ? '' : ' — drag to match the table'}`}</title>
                  <circle cx={m.x} cy={m.y} r={1} fill="#fff" stroke={holder ? SIDE_COLOR[holder] : '#282c34'} strokeWidth={0.25} />
                  <text x={m.x} y={m.y + 0.45} textAnchor="middle" fontSize={1.3} fill="#282c34" className="display">
                    {label(i)}
                  </text>
                </g>
              )
            })}

            {TEAMS.map((t) =>
              (game.roster[t.id] ?? []).map((o, i) => {
                const st = game.ops[o.id]
                // A capture holds positions only, so its tokens are drawn plain: conceal,
                // expended and injured are today's state, not that turning point's.
                const spot = shot ? shot.pos[o.id] : st?.pos
                if (!spot || (!shot && (!st || st.dead))) return null
                const p = dragged('op', o.id, spot)
                const picked = sel?.kind === 'op' && sel.id === o.id
                const injured = !shot && st && st.hp * 2 < o.w
                return (
                  <g
                    key={o.id}
                    className={grabbable}
                    opacity={!shot && st?.expended ? 0.45 : 1}
                    onPointerDown={grab('op', o.id, spot.x, spot.y)}
                  >
                    <title>
                      {shot
                        ? `${o.name} (${t.short})`
                        : `${o.name} (${t.short}) — ${st!.hp}/${o.w}W, ${st!.order}${st!.expended ? ', expended' : ''}`}
                    </title>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={token}
                      fill={t.color}
                      stroke={injured ? '#bd0003' : picked ? '#f05c22' : '#282c34'}
                      strokeWidth={injured || picked ? 0.22 : 0.13}
                      strokeDasharray={!shot && st?.order === 'conceal' ? '0.3 0.25' : undefined}
                    />
                    <text x={p.x} y={p.y + 0.27} textAnchor="middle" fontSize={0.8} fill={t.ink ? '#282c34' : '#fff'} className="display">
                      {i + 1}
                    </text>
                  </g>
                )
              }),
            )}
          </svg>

          <p className="mt-2 text-xs text-ink/50">
            44"×30", 2" grid, drags snap to {step}".{' '}
            {shot
              ? 'A capture records terrain, markers and positions only — tokens are drawn plain because wounds and orders belong to the live board.'
              : 'Tokens are numbered by their place in the team list — dashed ring = conceal, faded = expended, red ring = injured. Incapacitated operatives leave the board.'}
          </p>
        </div>

        {!bare && (
        <div className="min-w-0 space-y-3 text-sm">
          {shot ? (
            <p className="text-xs text-ink/45">
              {terrain.length} terrain {terrain.length === 1 ? 'piece' : 'pieces'}, {markers.length} markers and{' '}
              {Object.keys(shot.pos).length} operatives, as captured. Go back to the live board to change anything.
            </p>
          ) : (
            <>
              <div>
                <Label>Add terrain</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {TERRAIN_PALETTE.map(({ label: name, w: pw, h: ph, kind }) => (
                    <Btn
                      key={name}
                      // Cascade successive drops so three clicks are not one pile.
                      onClick={() =>
                        dispatch({
                          type: 'terrainAdd',
                          piece: { w: pw, h: ph, kind, rot: 0, x: 14 + (game.terrain.length % 6), y: 8 + (game.terrain.length % 6) },
                        })
                      }
                      title={`Drop a ${TERRAIN_KIND[kind].label} piece on the board, then drag it into place`}
                    >
                      {name}
                    </Btn>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2">
                <input type="checkbox" checked={game.mirror} onChange={(e) => dispatch({ type: 'mirror', value: e.target.checked })} className="mt-1" />
                <span>
                  Mirror terrain
                  <span className="block text-xs text-ink/45">Draws every piece rotated 180° too — a symmetric table.</span>
                </span>
              </label>

              {selPiece ? (
                <div className="space-y-2 rounded border border-rule bg-black/[0.02] p-2">
                  <div className="flex items-center justify-between">
                    <Label>Selected piece</Label>
                    <Btn
                      onClick={() => {
                        dispatch({ type: 'terrainRemove', id: selPiece.id })
                        setSel(null)
                      }}
                      className="text-xenos"
                    >
                      Remove
                    </Btn>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        ['X', 'x'],
                        ['Y', 'y'],
                        ['W', 'w'],
                        ['H', 'h'],
                      ] as const
                    ).map(([name, key]) => (
                      // `min-w-0` and `w-full`: an <input> defaults to ~20ch and to
                      // min-width:auto, so without both it refuses to shrink and shoves the
                      // rail off-screen — the same trap as the three-column layout.
                      <label key={key} className="grid min-w-0 gap-0.5">
                        <Label className="text-center">{name}</Label>
                        <BufferedInput
                          value={String(selPiece[key])}
                          onEdit={onNum((v) => patch({ [key]: v }))}
                          inputMode="decimal"
                          className="w-full min-w-0"
                          aria-label={`Piece ${name}`}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-end gap-1">
                    <label className="grid gap-0.5">
                      <Label className="text-center">Rot°</Label>
                      <BufferedInput
                        value={String(selPiece.rot)}
                        onEdit={onNum((rot) => patch({ rot }))}
                        inputMode="decimal"
                        className="w-12"
                        aria-label="Piece rotation"
                      />
                    </label>
                    <Btn onClick={() => patch({ rot: selPiece.rot + 90 })} title="Turn 90°">
                      ⇄ 90°
                    </Btn>
                    {(Object.keys(TERRAIN_KIND) as TerrainKind[]).map((k) => (
                      <Btn key={k} on={selPiece.kind === k} onClick={() => patch({ kind: k })} title={`Mark this piece ${TERRAIN_KIND[k].label}`}>
                        {TERRAIN_KIND[k].label}
                      </Btn>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink/45">Click a terrain piece to move, resize or turn it.</p>
              )}

              <div>
                <Label>Operatives</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {SIDE_IDS.map((side) => (
                    <Btn key={side} onClick={() => dispatch({ type: 'deploy', side })} title={`Lay undeployed ${SIDES[side]} survivors out in their drop zone`}>
                      Deploy {SIDES[side]}
                    </Btn>
                  ))}
                </div>
                {selOp && (
                  <p className="mt-1 flex items-center gap-2 text-xs">
                    <span className="truncate">{selOp.name}</span>
                    <Btn
                      onClick={() => {
                        dispatch({ type: 'place', opId: selOp.id, pos: null })
                        setSel(null)
                      }}
                      className="ml-auto shrink-0 text-xenos"
                    >
                      Take off board
                    </Btn>
                  </p>
                )}
              </div>

              <Btn
                onClick={() => {
                  dispatch({ type: 'terrainClear' })
                  setSel(null)
                }}
                className="text-xenos"
              >
                Clear all terrain
              </Btn>
            </>
          )}
        </div>
        )}
      </div>
    </details>
  )
}

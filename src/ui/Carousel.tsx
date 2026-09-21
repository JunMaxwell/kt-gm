/**
 * The card carousel: one rail, one slide per card, dots underneath.
 *
 * Extracted from `Compendium` so the player's draft can use the real thing rather than a second
 * implementation of it. A leaf — it knows about no panel and no game state.
 *
 * **CSS scroll-snap, not a library and not touch handlers.** `snap-x snap-mandatory` on the rail,
 * `w-full shrink-0 snap-center` on each slide. That buys real momentum swiping on a phone,
 * trackpad swiping on a laptop and keyboard scrolling for free. The only JS is
 * `Math.round(scrollLeft / clientWidth)` to light the right dot. Do not replace this with a JS
 * carousel.
 *
 * Slides sit side by side, so every card in the deck is mounted. A deck is at most a dozen, and
 * that is still cheaper than the remounting a windowed carousel would cost.
 *
 * **Resetting to card 1 is the caller's job, with a `key`.** Remounting is the whole reset — it
 * clears the scroll offset and the index together, where setting state left the rail wherever the
 * last deck ended.
 */
import { useEffect, useRef, useState } from 'react'

/**
 * Is there still card below the fold? Measured on the CARD against the slide's visible bottom,
 * deliberately NOT as `scrollTop + clientHeight < scrollHeight`: the hint pill is a sibling in
 * this same scroll container, so a scrollHeight test counts the pill's own height as content and
 * the hint keeps itself on screen for a card that fits. Measured: that kept it up on 6 cards
 * with nothing to show.
 *
 * The 24px is one line of body text: several cards clear the fold by two or three pixels of
 * rounding, and a hint promising more when there is no more is worse than no hint.
 */
const MORE_SLACK = 24
const cardOverflows = (el: HTMLElement | null) => {
  const card = el?.firstElementChild
  return (
    !!el && !!card && card.getBoundingClientRect().bottom > el.getBoundingClientRect().bottom + MORE_SLACK
  )
}

/**
 * One slide of the carousel, and the scroll container for any card taller than the screen.
 *
 * The pill is the whole point of this component. `KtCard`'s `min-h-fit` already makes a long card
 * grow and the slide scroll, so nothing is ever clipped — but the card is cut flush with the
 * bottom edge and this deck's primary gesture is a HORIZONTAL swipe, so a player swipes sideways
 * and never learns the card continued. Measured at 430x780 on the Custodes deck: Venatari keeps
 * 163px, 22% of its card, below the fold with no sign of it.
 *
 * `sticky` is what makes it self-removing: the pill un-pins once its own position scrolls into
 * view, which is exactly the bottom of the card.
 */
function Slide({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)

  // Keyed on `children`, which is a fresh element every render, so this re-measures whenever the
  // card changes — and it has to. Measuring once on mount is wrong twice over: a dynamically
  // imported faction grows the card a tick later, and switching deck swaps the card inside the
  // SAME slide (the slides are keyed by index), so a stale `more` would carry across. Watching
  // the card for resize instead is not enough either — `flex-1` stretches most cards to the same
  // box height, so the swap fires no resize at all. The observer is only for the viewport
  // changing under a card that did not re-render, i.e. rotating the phone.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setMore(cardOverflows(el))
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    // ...and the CARD, which is the only thing that grows when a `<details>` inside it opens. The
    // slide's own box never changes then, and a native toggle re-renders no React, so neither the
    // `children` key nor an observer on `el` fires — measured: 33px below the fold with the hint
    // still down, on the one interaction that most needs it. Watching both covers content growing
    // (the card) and the viewport changing under it (the slide).
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [children])

  return (
    <div
      ref={ref}
      onScroll={(e) => setMore(cardOverflows(e.currentTarget))}
      className="flex w-full shrink-0 snap-center flex-col overflow-y-auto p-2"
    >
      {children}
      {/* Zero-height on purpose. The pill is a flex sibling of a `flex-1` card, so anything with
          real height reflows the card the moment it appears, which changes the very measurement
          that decided to show it — the hint then flickers against its own layout. An `h-0` sticky
          anchor contributes nothing and the pill hangs off it. */}
      {more && (
        <span className="pointer-events-none sticky bottom-0 h-0 self-stretch">
          <span className="display absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-card/85 px-2 py-0.5 text-[10px] whitespace-nowrap text-white shadow">
            more &#9662;
          </span>
        </span>
      )}
    </div>
  )
}

/**
 * How every card sits in its slide, and both halves matter.
 *
 * `min-h-full` fills the slide so the hex lattice reaches the edges the way the printed art
 * does — that is what `flex-1` used to buy. `shrink-0` is the part that was missing: a flex
 * item shrinks below its content by default, and `KtCard` clips what it cannot fit, so a long
 * card was cut flush with the bottom edge AND left the slide nothing to scroll. Vulkan
 * He'stan's card ended mid-sentence on a phone with no `more ▾` pill and no scroll at all,
 * because from the slide's point of view nothing was overflowing.
 *
 * `KtCard` carried `min-h-fit` against this before. `min-height: fit-content` is an intrinsic
 * keyword a browser may drop; `flex-shrink: 0` is not.
 */
export const SLIDE_CARD = 'min-h-full shrink-0'

/**
 * The rail and its dots.
 *
 * `marked` tints a dot for a card that is chosen — the draft's overview, so a player picking
 * eleven operatives one card at a time can still see at a glance which they hold. Absent
 * everywhere else, where a dot only says "you are here".
 */
export function Carousel({
  slides,
  onAt,
  marked,
  note,
  empty = 'Nothing here.',
}: {
  slides: React.ReactNode[]
  /** The visible card changed. The draft's pick button acts on it. */
  onAt?: (i: number) => void
  marked?: boolean[]
  /** A line between the rail and the dots, e.g. "None picked yet". */
  note?: React.ReactNode
  empty?: string
}) {
  const rail = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)

  const goto = (i: number) => {
    const el = rail.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <>
      <div
        ref={rail}
        onScroll={(e) => {
          const el = e.currentTarget
          const i = el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0
          if (i === at) return
          setAt(i)
          onAt?.(i)
        }}
        className="no-bar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {slides.length ? (
          slides.map((slide, i) => <Slide key={i}>{slide}</Slide>)
        ) : (
          <p className="p-3 text-sm text-ink/55">{empty}</p>
        )}
      </div>

      {note}

      {/* Which card of how many, and a tap target per card for anyone not swiping. */}
      {slides.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-rule py-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goto(i)}
              aria-label={`Card ${i + 1} of ${slides.length}${marked?.[i] ? ', chosen' : ''}`}
              aria-current={i === at}
              className={`h-1.5 rounded-full transition-all ${
                i === at ? 'w-5 bg-flare' : marked?.[i] ? 'w-1.5 bg-flare/55' : 'w-1.5 bg-black/20'
              }`}
            />
          ))}
          <span className="display ml-2 text-[10px] text-fade">
            {Math.min(at + 1, slides.length)}/{slides.length}
          </span>
        </div>
      )}
    </>
  )
}

"""Cut the model out of an official promo/datasheet card, leaving transparency.

    python3 tools/kt_cutout.py <in> <out.png> x0 y0 x1 y1 [--warm|--white] [--top=F] [--open=N]

`kt_photos.py` reads the band cut-outs straight out of the team PDFs, which is the right source
whenever one exists. This is for the operatives that have no PDF — the two NEMESIS bosses and
the hand-written factions — where the only art is a promo card with the model on a banner.

**The background is what you choose per source.** `--white` is a product photo of the painted
model on a white sweep, and needs none of the machinery below — it is a brightness key. The other
two are promo cards, where the model stands on a coloured banner and the key is by TINT: `--warm`
for a red/maroon banner (Angron, World Eaters), the default for a cool teal/blue one (Farsight,
T'au). A source that already carries transparency is used as-is, whatever the flags say.

`--top=F` keeps the top F of the model's height, which is how a full-length product photo is
made to sit beside the PDF's upper-body cut-outs. The banner cards need no such thing: they are
already cropped that way in print.

For the two tint modes, everything after the key is shared:

- **The key only applies where the background can REACH**, by flood fill from the crop's border.
  A dark gap between two armour plates is tinted much like the banner, and keying it by colour
  alone punches a hole straight through the model.
- **Thin leaks are severed first** (`--open`, default 2 for warm). On a red banner the model's
  own red skin touches the background red, and the fill pours through that neck into the middle
  of the figure — Angron lost his midsection to a channel a few pixels wide. Eroding the mask
  before the fill and dilating after removes the neck without moving the real edges.
- **On a cool banner the fill also walks through the artwork's smoke**, which no colour test
  separates from white armour — both are grey — but which fades into the banner rather than
  belonging to the model, so it is reachable where the suit's saturated red is not.

Then a despill (cool only: nothing on those models is genuinely cool-toned, so a green-blue lift
is banner bleed — on a warm card the same logic would eat the model's own red), the largest
connected blobs, and a tight crop.

Output is PNG; convert with `cwebp -q 85 out.png -o public/ops/<fid>/<slug>.webp` and set `img`
on that operative's datacard by hand — the generator only fills it in for the factions it parses.
"""
import sys
from collections import deque
import pymupdf

a = [x for x in sys.argv[1:] if not x.startswith('--')]
flags = [x for x in sys.argv[1:] if x.startswith('--')]
src, dst = a[0], a[1]
x0, y0, x1, y1 = map(int, a[2:6])
WARM, WHITE = '--warm' in flags, '--white' in flags
OPEN = next((int(f.split('=')[1]) for f in flags if f.startswith('--open=')), 2 if WARM else 0)
TOP = next((float(f.split('=')[1]) for f in flags if f.startswith('--top=')), 0.0)
# Where the sweep starts, for --white. The default clears a plain white backdrop, but a model
# with BONE armour needs it raised until it sits in the gap between the two: the Relic Seekers'
# Captain paints his pauldron at 218-245 on a sweep of 250-255, and at the default the key takes
# a bite out of his shoulder. Sample the source before assuming; the gap is what you are after.
SWEEP = next((int(f.split('=')[1]) for f in flags if f.startswith('--sweep=')), 228)
SWEEP_HI = min(SWEEP + 15, 250)
# The tint band: below LO a pixel is the model, above HI it is banner, between it ramps. Raise
# both for a source whose banner is only faintly tinted, or whose model wears the same hue in
# shadow — He'stan's card is 150px wide and his shaded green sits where the default called it
# background, biting holes in his shoulder.
LO = next((float(f.split('=')[1]) for f in flags if f.startswith('--lo=')), 6.0)
HI = next((float(f.split('=')[1]) for f in flags if f.startswith('--hi=')), 20.0)

p = pymupdf.Pixmap(src)
W, n, s = p.width, p.n, p.samples
w, h = x1 - x0, y1 - y0
at = lambda x, y: ((y0+y)*W + x0+x) * n
pix = [tuple(s[at(i % w, i // w) + c] for c in range(3)) for i in range(w*h)]
# a source that already carries transparency has the answer in it — a product shot sold as a
# cut-out, where any key of ours could only be worse
raw_alpha = [s[at(i % w, i // w) + 3] for i in range(w*h)] if p.alpha else None
src_alpha = raw_alpha
if src_alpha:
    # Judge it on the BORDER RING, not on whether any transparent pixel exists at all: a photo
    # on an opaque white sweep can still carry four transparent corners, and trusting those
    # keeps the whole sweep. A real cut-out has a border that is almost entirely transparent.
    ring = [src_alpha[i] for i in range(w*h) if i % w in (0, w-1) or i // w in (0, h-1)]
    if sum(v < 16 for v in ring) < len(ring) * 0.6: src_alpha = None
# >0 means tinted like the banner: away from red for a cool card, toward it for a warm one
tint = [min(g - r, b - r) for r, g, b in pix] if not WARM else [min(r - g, r - b) for r, g, b in pix]
bright = [(r + g + b) / 3 for r, g, b in pix]
sat = [max(q) - min(q) for q in pix]

def hazy(i):
    r, g, b = pix[i]
    return 105 < (r + g + b) / 3 < 200 and max(pix[i]) - min(pix[i]) < 48 and tint[i] >= 4

if WHITE:
    fill = [bright[i] > SWEEP and sat[i] < 20 for i in range(w*h)]
    # A sweep can come with a transparent margin around it — opaque white inside, nothing at the
    # edge. Then every border pixel is transparent BLACK, the brightness key seeds on none of
    # them, and the whole sweep survives. What is already transparent is background too.
    if raw_alpha: fill = [fill[i] or raw_alpha[i] < 16 for i in range(w*h)]
elif WARM:
    # a warm banner is dark as well as saturated, and its murky corners are neither
    fill = [tint[i] > 34 or max(pix[i]) < 56 for i in range(w*h)]
else:
    fill = [tint[i] > LO or max(pix[i]) < 45 or hazy(i) for i in range(w*h)]

def morph(m, r, grow):
    if r <= 0: return m
    o = bytearray(w*h)
    for y in range(h):
        for x in range(w):
            if not m[y*w+x]: continue
            hit = True
            for dy in range(-r, r+1):
                yy = y + dy
                if yy < 0 or yy >= h: continue
                for dx in range(-r, r+1):
                    xx = x + dx
                    if not 0 <= xx < w: continue
                    if grow: o[yy*w+xx] = 1
                    elif not m[yy*w+xx]: hit = False; break
                if grow or not hit: break
            if not grow and hit: o[y*w+x] = 1
    return o

core = morph(bytearray(fill), OPEN, False)
bg = bytearray(w*h); q = deque()
STRONG = HI - 2
for i in range(w*h):
    x, y = i % w, i // w
    # a pixel this tinted is never a shadow on the model, so it seeds wherever it sits — that is
    # what reaches the smoke the disc and the rifle enclose
    seed = (not WARM and tint[i] >= STRONG) or ((x in (0, w-1) or y in (0, h-1)) and fill[i])
    if seed: bg[i] = 1; q.append(i)
while q:
    i = q.popleft()
    x, y = i % w, i // w
    for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1), (i-w if y else -1), (i+w if y < h-1 else -1)):
        if j >= 0 and not bg[j] and core[j]: bg[j] = 1; q.append(j)
if OPEN: bg = bytearray(g and f for g, f in zip(morph(bg, OPEN, True), fill))

out = bytearray(w * h * 4)
for i, (r, g, b) in enumerate(pix):
    t = tint[i]
    if raw_alpha is not None and raw_alpha[i] < 16: alpha = 0
    elif src_alpha is not None: alpha = src_alpha[i]
    elif not bg[i]: alpha = 255
    elif WHITE:
        # ramp across the sweep's own falloff, so the model keeps its anti-aliased edge
        alpha = 0 if bright[i] >= SWEEP_HI else max(0, min(255, int(255 * (SWEEP_HI - bright[i]) / 15)))
    elif WARM or t >= HI or max(r, g, b) < 45 or hazy(i): alpha = 0
    else: alpha = max(0, min(255, int(255 * (HI - t) / (HI - LO))))
    if not WARM and not WHITE and src_alpha is None and t > 0:
        g, b = max(0, g - int(t * .8)), max(0, b - int(t * .8))
    out[i*4:i*4+4] = bytes((r, g, b, alpha))

# Fragments the key leaves behind — a wisp of banner the model encloses, a speck of frame.
seen = bytearray(w*h); blobs = []
for start in range(w*h):
    if seen[start] or out[start*4+3] <= 40: continue
    comp, q2 = [], deque([start]); seen[start] = 1
    while q2:
        i = q2.popleft(); comp.append(i)
        x, y = i % w, i // w
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    j = ny*w + nx
                    if not seen[j] and out[j*4+3] > 40: seen[j] = 1; q2.append(j)
    blobs.append(comp)
blobs.sort(key=len, reverse=True)
keep = bytearray(w*h)
for comp in blobs:
    if len(comp) < len(blobs[0]) * 0.05: break
    for i in comp: keep[i] = 1
for i in range(w*h):
    if not keep[i]: out[i*4+3] = 0

ys = [i // w for i in range(w*h) if out[i*4+3] > 40]
t_, b_ = min(ys), max(ys)+1
# keep the top slice of the MODEL, measured after the key — a photo's own framing says nothing
# about where the model starts, and the base at the bottom would drag the fraction down with it
if TOP: b_ = t_ + int((b_ - t_) * TOP)
xs = [i % w for i in range(w*h) if out[i*4+3] > 40 and t_ <= i // w < b_]
l, r_ = min(xs), max(xs)+1
cw, ch = r_ - l, b_ - t_
tight = bytearray(cw * ch * 4)
for y in range(ch):
    row = ((t_+y)*w + l)*4
    tight[y*cw*4:(y+1)*cw*4] = out[row:row + cw*4]
pymupdf.Pixmap(pymupdf.csRGB, cw, ch, bytes(tight), True).save(dst)
print(f'{dst} {cw}x{ch}  (crop {x0+l},{y0+t_} .. {x0+r_},{y0+b_})')

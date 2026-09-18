"""Cut the model out of an official promo/datasheet card, leaving transparency.

    python3 tools/kt_cutout.py <in.png|jpg|webp> <out.png> x0 y0 x1 y1 [LO HI]

The extractor (`kt_photos.py`) reads the band cut-outs straight out of the team PDFs, which is
the right source whenever one exists. This is for the operatives that have no PDF — the two
NEMESIS bosses and the hand-written factions — where the only art available is a promo card
with the model standing on a coloured banner.

Three things do the work, in this order:

1. **The banner is keyed by TINT, not by colour**, so the gradient, the hex lattice and the
   glow all go together: `teal = min(g - r, b - r)` is positive on the banner and negative on
   anything red, gold or warm. RETUNE THIS ONE LINE for a banner that is not cool-toned — it
   is the only faction-specific thing in here.
2. **The key only applies where the background can REACH**, by flood fill from the crop's
   border. A dark gap between two armour plates is tinted much like the banner, and without
   this it becomes a hole straight through the model.
3. **The fill also walks through the artwork's smoke**, which no colour test can separate from
   white armour — it is grey either way — but which fades into the banner rather than being
   part of the model, so it is reachable and the suit's saturated red is not.

Then a despill (nothing on these models is genuinely cool-toned, so any green-blue lift is
banner bleed), the largest connected blob, and a tight crop.

Output is PNG; convert with `cwebp -q 85 out.png -o public/ops/<fid>/<slug>.webp` and set
`img` on that operative's datacard by hand — the generator only fills it in for the PDFs.
"""
import sys
from collections import deque
import pymupdf

src, dst, x0, y0, x1, y1 = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])
LO, HI = (float(sys.argv[7]), float(sys.argv[8])) if len(sys.argv) > 8 else (6.0, 20.0)

p = pymupdf.Pixmap(src)
if p.n != 3: p = pymupdf.Pixmap(pymupdf.csRGB, p)
W, n, s = p.width, p.n, p.samples
w, h = x1 - x0, y1 - y0
pix = [[s[((y0+y)*W + x0+x)*n + c] for c in range(3)] for y in range(h) for x in range(w)]
teal = [min(g - r, b - r) for r, g, b in pix]          # >0 means teal-tinted
# the card's own frame is near-black rather than teal, so it needs its own test or it
# survives as a bar along the top of the cut-out
def hazy(i):
    # The artwork's battle smoke is a mid-grey veil: it dilutes the banner's teal to the same
    # tint as the suit's white panels, so no colour test separates the two. What does separate
    # them is that the smoke FADES INTO the banner, so the fill can walk into it from outside
    # while the suit's saturated red and bright white stop it dead.
    r, g, b = pix[i]
    return 105 < (r + g + b) / 3 < 200 and max(pix[i]) - min(pix[i]) < 48 and teal[i] >= 4
fillable = [teal[i] > LO or max(pix[i]) < 45 or hazy(i) for i in range(len(pix))]

# background is the teal REACHABLE FROM THE BORDER, so a dark tinted pixel enclosed by
# the model (a shadow between plates) stays opaque instead of punching a hole
bg = bytearray(w * h)
q = deque()
STRONG = HI - 2          # unmistakably banner, wherever it sits
for i in range(w * h):
    x, y = i % w, i // w
    # Seeding only from the border protects a shadow between two armour plates, but it also
    # protects the artwork's smoke where the disc and rifle enclose it. A pixel this teal is
    # never a shadow on a red battlesuit, so it seeds too.
    if teal[i] >= STRONG or ((x in (0, w-1) or y in (0, h-1)) and fillable[i]):
        bg[i] = 1; q.append(i)
while q:
    i = q.popleft()
    x, y = i % w, i // w
    for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1), (i-w if y else -1), (i+w if y < h-1 else -1)):
        if j >= 0 and not bg[j] and fillable[j]:
            bg[j] = 1; q.append(j)

out = bytearray(w * h * 4)
for i, (r, g, b) in enumerate(pix):
    t = teal[i]
    # the ramp only means anything for a teal-blended EDGE pixel; a frame pixel keyed by
    # brightness has no teal at all and would ramp straight past opaque
    if not bg[i]: a = 255
    elif t >= HI or max(r, g, b) < 45 or hazy(i): a = 0
    else: a = max(0, min(255, int(255 * (HI - t) / (HI - LO))))
    # despill: nothing on this model is genuinely teal, so any green+blue lift is banner bleed
    if t > 0: g, b = max(0, g - int(t * .8)), max(0, b - int(t * .8))
    out[i*4:i*4+4] = bytes((r, g, b, a))

# The artwork's smoke is neutral grey, not teal, so no colour key can touch it — but it is a
# separate blob. Keep the largest connected component and drop anything under 5% of it.
seen = bytearray(w * h)
blobs = []
for start in range(w * h):
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
                    if not seen[j] and out[j*4+3] > 40:
                        seen[j] = 1; q2.append(j)
    blobs.append(comp)
blobs.sort(key=len, reverse=True)
keep = bytearray(w * h)
for comp in blobs:
    if len(comp) < len(blobs[0]) * 0.05: break
    for i in comp: keep[i] = 1
for i in range(w * h):
    if not keep[i]: out[i*4+3] = 0

# tighten to what actually survived
xs = [i % w for i in range(w*h) if out[i*4+3] > 40]
ys = [i // w for i in range(w*h) if out[i*4+3] > 40]
l, r_, t_, b_ = min(xs), max(xs)+1, min(ys), max(ys)+1
cw, ch = r_ - l, b_ - t_
tight = bytearray(cw * ch * 4)
for y in range(ch):
    row = ((t_+y)*w + l)*4
    tight[y*cw*4:(y+1)*cw*4] = out[row:row + cw*4]
pymupdf.Pixmap(pymupdf.csRGB, cw, ch, bytes(tight), True).save(dst)
print(f'{dst} {cw}x{ch}  (crop {x0+l},{y0+t_} .. {x0+r_},{y0+b_})')

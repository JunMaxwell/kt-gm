"""Cut the operative photos out of the team PDFs into public/ops/<fid>/<slug>.webp.

Every datacard prints a cut-out of the miniature in its black name band. What identifies it is
NOT its soft mask — two Hearthkyn photos are flattened JPEGs with none, and the Ratlings' band
furniture has one — and not its height either, since a photo can stand taller than the band
(Kroot Kill-broker, 66pt) and then overlaps the weapon header row below it. What is constant:

- a photo shares its band with one datacard name (or a few), where the ribbons, stat icons and
  keyword bars are the same image drawn on every card — so an image seen under most of the
  team's names is furniture and is dropped;
- the datacards come first in every PDF, and the card sheets at the back reuse the same image,
  so the earliest page wins, then the height closest to the band's 35pt (a small icon printed
  beside a photo loses).

The name is read line by line from the words sharing the image's vertical span that begin
before its right edge — the name can run UNDER a wide photo (Murderwing Warp Talon) — and the
line nearest the photo's centre wins, because a tall photo also overlaps the keyword bar of the
card above, whose "Assault Intercessor Warrior" out-lengths "Heavy Intercessor Gunner". Within
the line the longest datacard name wins, so "Boy" cannot steal "Breacha Boy". A photo may be
shared by a few cards (Warpcoven's three Sorcerers print one), so only an image seen under more
than half the team's names counts as furniture. kt_generate.py then emits `img` for every file
that exists here.

    python3 tools/kt_photos.py [/tmp/ktwork] [--dry]

Needs PyMuPDF (pip install pymupdf) and cwebp. Prints every datacard left without a photo.
"""
import sys, os, glob, subprocess, tempfile
from collections import defaultdict
import pymupdf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kt_parse import parse_datacards, SKIP, fid_of, slugify

DRY = '--dry' in sys.argv
SRC = next((a for a in sys.argv[1:] if not a.startswith('--')), '/tmp/ktwork')
OUT = 'public/ops'

def band_name(page, box, names):
    """The datacard name printed on the text line nearest the image's centre, or None."""
    lines = defaultdict(list)
    for w in page.get_text('words'):
        if w[3] > box.y0 and w[1] < box.y1 and w[0] < box.x1:
            lines[round((w[1] + w[3]) / 2)].append(w)
    mid = (box.y0 + box.y1) / 2
    for y in sorted(lines, key=lambda y: abs(y - mid)):
        text = slugify(' '.join(w[4] for w in sorted(lines[y], key=lambda w: w[0])))
        hits = [n for n in names if f'-{n}-' in f'-{text}-']
        if hits: return max(hits, key=len)

def save(doc, xref, path):
    # CMYK, DeviceN and Separation all print here; PNG takes only RGB or grey
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.Pixmap(doc, xref))
    smask = doc.extract_image(xref).get('smask')
    if smask: pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, smask))
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as t:
        pix.save(t.name)
    subprocess.run(['cwebp', '-quiet', '-q', '80', t.name, '-o', path], check=True)
    os.unlink(t.name)

total = missing = 0
for pdf in sorted(glob.glob(f'{SRC}/pdf/*.pdf')):
    slug = os.path.basename(pdf)[:-4]
    if slug in SKIP: continue
    fid = fid_of(slug)
    names = {slugify(d['name']): d['name'] for d in parse_datacards(f'{SRC}/txt/{slug}.txt')}
    doc = pymupdf.open(pdf)
    cands = defaultdict(list)          # name -> [(page, |h-35|, xref)]
    named = defaultdict(set)           # xref -> the names it was seen under
    for pno, page in enumerate(doc):
        for info in page.get_image_info(xrefs=True):
            xref, box = info['xref'], pymupdf.Rect(info['bbox'])
            if not xref or not 20 < box.height < 100: continue
            name = band_name(page, box, names)
            if not name: continue
            cands[name].append((pno, abs(box.height - 35), xref))
            named[xref].add(name)
    furniture = {x for x, ns in named.items() if len(ns) > len(names) / 2}
    gaps = []
    for name in names:
        own = sorted(c for c in cands[name] if c[2] not in furniture)
        if not own: gaps.append(names[name]); continue
        if DRY: continue
        os.makedirs(f'{OUT}/{fid}', exist_ok=True)
        save(doc, own[0][2], f'{OUT}/{fid}/{name}.webp')
    total += len(names); missing += len(gaps)
    print(f'{fid}: {len(names) - len(gaps)}/{len(names)}' + (f'  MISSING {gaps}' if gaps else ''), flush=True)
print(f'{total - missing} of {total} datacards have a photo')

import sys, os, glob, json, re, hashlib

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ktwork'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kt_parse import parse_faction, parse_cards, ALIAS, SKIP, fid_of, slugify

OUT = 'src/factions'
PRESET = set(ALIAS.values())
# muted, readable band colours; the six presets keep the colours already in rules.ts
FIXED = {'dw':'#8a97a8','aod':'#0066a5','sct':'#5c5f63','rav':'#b83227','xv26':'#dfe3e8','kom':'#3f8f29'}
PALETTE = ['#6b4f8a','#8a5a2b','#2f6f6f','#7a2f3f','#3d5a80','#6f7a2f','#8a4f6b','#2f6b4f',
           '#5a5a7a','#8a6f2f','#4f6b8a','#7a4f2f','#2f5a6b','#6b2f5a','#4f7a5a','#7a6b4f']
INK = {'#dfe3e8','#8a97a8'}

def title_from(slug, cards):
    return TITLES[slug]

TITLES = {}
for line in open(f'{SRC}/list.tsv'):
    t, f = line.rstrip('\n').split('\t')
    TITLES[re.sub(r'[^a-z0-9_]','', t.lower().replace(' ','_'))] = t

# Operatives a printed rule locks to one order. Deliberately an explicit list, not a regex over
# the ability text: a Fellgor Ravager's prose matches too, but it only loses Conceal *while it
# holds a Frenzy token*, so a heuristic would wrongly freeze all eleven of them.
LOCK_ORDER = {
    'kom:kommando-grot': 'conceal',        # Sneaky Zogger
    'kom:kommando-bomb-squig': 'engage',   # Stoopid
}

# CLAUDE.md used to say errata are always folded into the card text and the update log at the
# back can be ignored. That is not true: Blooded's APRIL '26 log amends Glory Kill and the card
# face still prints the old first sentence. Parsing free-prose errata is not worth it for one
# entry in 48 teams, so it is an explicit list, the same call LOCK_ORDER makes. The replacement
# is verbatim from the log AND from the separate online-rules booklet, which agrees.
# The `find` half is asserted, so if GW ever reprints the card this fails loudly instead of
# silently doing nothing.
ERRATA = {
    ('blooded', 'Glory Kill'): ('Select one enemy operative.',
                                'Select one enemy operative visible to a friendly BLOODED operative.'),
}

def ts(s):
    return json.dumps(s, ensure_ascii=False)

os.makedirs(OUT, exist_ok=True)
index = []
for path in sorted(glob.glob(f'{SRC}/txt/*.txt')):
    slug = os.path.basename(path)[:-4]
    if slug in SKIP: continue
    fid = fid_of(slug)
    data = parse_faction(path)
    name = TITLES.get(slug, slug.replace('_',' ').title())
    colour = FIXED.get(fid) or PALETTE[int(hashlib.md5(fid.encode()).hexdigest(), 16) % len(PALETTE)]
    ops = []
    for o in data['operatives']:
        ops.append({'id': f"{fid}:{slugify(o['name'])}", **o})
    lines = [
        f"// Generated from the official team rules PDF. Do not edit by hand — rerun the",
        f"// extractor described in CLAUDE.md (‘Where the card data came from’).",
        f"import type {{ Datacard, RefCard }} from '../compendium'",
        f"import type {{ Operative }} from '../rules'",
        "",
        f"export const cards: RefCard[] = [",
    ]
    for c in data['cards']:
        find, repl = ERRATA.get((fid, c['name']), (None, None))
        if find:
            assert find in c['text'], f"errata for {fid}/{c['name']} no longer applies"
            c['text'] = c['text'].replace(find, repl, 1)
        lines.append(f"  {{ kind: '{c['kind']}', name: {ts(c['name'])}, text: {ts(c['text'])} }},")
    lines.append("]")
    lines.append("")
    lines.append("export const operatives: Operative[] = [")
    for o in ops:
        lock = LOCK_ORDER.get(o['id'])
        tail = f", lockOrder: '{lock}'" if lock else ""
        lines.append(f"  {{ id: {ts(o['id'])}, name: {ts(o['name'])}, apl: {o['apl']}, move: {ts(o['move'])}, save: {ts(o['save'])}, w: {o['w']}{tail} }},")
    lines.append("]")
    lines.append("")
    # The rest of the datacard — weapons, abilities, unique actions, keywords. Kept OUT of
    # `Operative` on purpose: rosters ride in every relay snapshot and localStorage save, and
    # this is reference text nobody edits. Joined back on by name, in `factions/index.ts`.
    lines.append("export const datacards: Datacard[] = [")
    for d in data['datacards']:
        row = {'name': d['name'], 'weapons': d['weapons'],
               'abilities': d['abilities'], 'actions': d['actions']}
        if d.get('keywords'): row['keywords'] = d['keywords']
        # Written by tools/kt_photos.py; absent means the PDF printed no cut-out we could match.
        img = f"/ops/{fid}/{slugify(d['name'])}.webp"
        if os.path.exists('public' + img): row['img'] = img
        lines.append(f"  {ts(row)},")
    lines.append("]")
    open(f"{OUT}/{fid}.ts", 'w').write("\n".join(lines) + "\n")
    index.append({'id': fid, 'name': name, 'archetypes': data['archetypes'],
                  'color': colour, 'ink': colour in INK,
                  'preset': fid in PRESET, 'cards': len(data['cards']), 'ops': len(ops),
                  'weapons': sum(len(d['weapons']) for d in data['datacards']),
                  'rules': sum(len(d['abilities']) + len(d['actions']) for d in data['datacards'])})

index.sort(key=lambda r: r['name'])
json.dump(index, open(f'{SRC}/index.json','w'), indent=1)
print(f"wrote {len(index)} faction modules")
print(f"  presets: {[r['id'] for r in index if r['preset']]}")
print(f"  total cards: {sum(r['cards'] for r in index)}  operatives: {sum(r['ops'] for r in index)}")
print(f"  datacard weapons: {sum(r['weapons'] for r in index)}  abilities+actions: {sum(r['rules'] for r in index)}")

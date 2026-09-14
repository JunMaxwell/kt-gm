import sys, os, glob, json, re, hashlib

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ktwork'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kt_parse import parse_faction, parse_cards

OUT = 'src/factions'
SKIP = {'ctesiphus_expedition', 'universal_equipment'}
# the six factions the preset match already uses keep their existing ids, so
# PRESET_TEAMS[].faction, CATALOGUE and DEFAULT_ROSTER all keep working
ALIAS = {'deathwatch':'dw', 'angels_of_death':'aod', 'scout_squad':'sct',
         'raveners':'rav', 'xv26_stealth_battlesuits':'xv26', 'kommandos':'kom'}
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

def slugify(s):
    return re.sub(r'[^a-z0-9]+','-', s.lower()).strip('-')

def ts(s):
    return json.dumps(s, ensure_ascii=False)

os.makedirs(OUT, exist_ok=True)
index = []
for path in sorted(glob.glob(f'{SRC}/txt/*.txt')):
    slug = os.path.basename(path)[:-4]
    if slug in SKIP: continue
    fid = ALIAS.get(slug, slug.replace('_','-'))
    data = parse_faction(path)
    name = TITLES.get(slug, slug.replace('_',' ').title())
    colour = FIXED.get(fid) or PALETTE[int(hashlib.md5(fid.encode()).hexdigest(), 16) % len(PALETTE)]
    ops = []
    for o in data['operatives']:
        ops.append({'id': f"{fid}:{slugify(o['name'])}", **o})
    lines = [
        f"// Generated from the official team rules PDF. Do not edit by hand — rerun the",
        f"// extractor described in CLAUDE.md (‘Where the card data came from’).",
        f"import type {{ RefCard }} from '../compendium'",
        f"import type {{ Operative }} from '../rules'",
        "",
        f"export const cards: RefCard[] = [",
    ]
    for c in data['cards']:
        lines.append(f"  {{ kind: '{c['kind']}', name: {ts(c['name'])}, text: {ts(c['text'])} }},")
    lines.append("]")
    lines.append("")
    lines.append("export const operatives: Operative[] = [")
    for o in ops:
        lines.append(f"  {{ id: {ts(o['id'])}, name: {ts(o['name'])}, apl: {o['apl']}, move: {ts(o['move'])}, save: {ts(o['save'])}, w: {o['w']} }},")
    lines.append("]")
    open(f"{OUT}/{fid}.ts", 'w').write("\n".join(lines) + "\n")
    index.append({'id': fid, 'name': name, 'archetypes': data['archetypes'],
                  'color': colour, 'ink': colour in INK,
                  'preset': fid in PRESET, 'cards': len(data['cards']), 'ops': len(ops)})

index.sort(key=lambda r: r['name'])
json.dump(index, open(f'{SRC}/index.json','w'), indent=1)
print(f"wrote {len(index)} faction modules")
print(f"  presets: {[r['id'] for r in index if r['preset']]}")
print(f"  total cards: {sum(r['cards'] for r in index)}  operatives: {sum(r['ops'] for r in index)}")

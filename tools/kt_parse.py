"""Parse `pdftotext -layout` Kill Team team-rules into cards + operatives.

The PDFs print two rules cards side by side, so every page is split on its gutter
first; each resulting column is one card, in reading order.
"""
import re, sys, os, json

# ---------- column splitting ----------

def split_page(page):
    lines = page.split('\n')
    body = [l for l in lines if l.strip()]
    if len(body) < 6:
        return [lines]
    width = max(len(l) for l in body)
    runs, cur = [], []
    for c in range(int(width * 0.30), int(width * 0.70)):
        frac = sum(1 for l in body if len(l) <= c or l[c] == ' ') / len(body)
        if frac >= 0.995:
            cur.append(c)
        else:
            if len(cur) >= 3: runs.append(cur)
            cur = []
    if len(cur) >= 3: runs.append(cur)
    if not runs:
        return [lines]
    mid = width / 2
    run = max(runs, key=lambda r: (len(r), -abs(sum(r) / len(r) - mid)))
    cut = run[0]
    return [[l[:cut].rstrip() for l in lines], [l[cut:].rstrip() for l in lines]]

def columns(path):
    out = []
    for page in open(path, encoding='utf-8').read().split('\f'):
        for col in split_page(page):
            out.append([l.rstrip() for l in col])
    return out

# ---------- card extraction ----------

KIND = {
    'FACTION RULE': 'faction',
    'STRATEGY PLOY': 'strategy',
    'FIREFIGHT PLOY': 'firefight',
    'FACTION EQUIPMENT': 'equipment',
    'EQUIPMENT': 'equipment',
    'UNIVERSAL EQUIPMENT': 'equipment',
}
KIND_RE = re.compile(r'^\s*(FACTION RULE|STRATEGY PLOY|FIREFIGHT PLOY|FACTION EQUIPMENT|UNIVERSAL EQUIPMENT|EQUIPMENT)\s*$')

def titlecase(s):
    small = {'of','the','and','a','an','to','in','on','for','from','with','at','by','or'}
    out = []
    for i, w in enumerate(s.split()):
        # a model code like MV15 or XV26 is printed in caps and must stay that way
        if re.fullmatch(r"[A-Z]{1,3}\d+[A-Z]*", w) or re.fullmatch(r"[A-Z]'[A-Z]+", w):
            out.append(w); continue
        lw = w.lower()
        out.append(lw if (i and lw in small) else lw[:1].upper() + lw[1:])
    return ' '.join(out)

def is_caps(line):
    letters = [c for c in line if c.isalpha()]
    return bool(letters) and all(c.isupper() for c in letters)

def split_cards(col):
    """A column can hold two cards stacked vertically. Cut on every kind banner."""
    hits = [i for i, l in enumerate(col) if KIND_RE.match(l)]
    if not hits:
        return []
    out = []
    for n, i in enumerate(hits):
        end = hits[n + 1] if n + 1 < len(hits) else len(col)
        # the next card's team-keyword line sits just above its banner
        stop = end
        while stop > i + 1 and (not col[stop - 1].strip() or is_caps(col[stop - 1].strip())):
            stop -= 1
            if end - stop > 3:
                break
        out.append((KIND[KIND_RE.match(col[i]).group(1)], col[i + 1:stop]))
    return out

def name_and_body(rest):
    j = next((i for i, l in enumerate(rest) if l.strip() and is_caps(l.strip())), None)
    if j is None:
        return None
    name = rest[j].strip()
    k = j + 1
    while k < len(rest) and rest[k].strip() and is_caps(rest[k].strip()) and len(rest[k].strip()) < 40:
        name += ' ' + rest[k].strip(); k += 1
    qty = re.match(r'^(\d)X\s+(.*)$', name)
    if qty:
        name = f'{titlecase(qty.group(2))} ({qty.group(1)}x)'
    else:
        name = titlecase(name)
    return name, rest[k:]

# Flavour is printed in italics and pdftotext drops that, so the boundary is found by
# shape. Two signals, because neither alone is enough:
#   - a tightened rule opener ("Use this", "Whenever a", ...). Bare "When"/"While" are
#     deliberately NOT openers: flavour opens that way too ("When roused to anger, a
#     battle-brother...") and matching it left the flavour in.
#   - the presence of a game token — an ALL-CAPS keyword, a measurement, a stat — which
#     flavour prose essentially never carries.
# A sentence is rules text if either fires; leading sentences where neither does are flavour.
RULE_OPEN = re.compile(
    r'^(Use this|Once per|Twice per|Three times per|Whenever|Whilst a|Whilst this|While a|While this|'
    r'While it|Each time|At the end|At the start|During (each|this|that|the)|Before (rolling|this|the)|'
    r'After (rolling|your|this|the)|When (a|an|this|that|the|you|your|setting|selecting|determining)|'
    r'Select|You can|You cannot|Your |This operative|This rule|Friendly|Enemy operatives|Each friendly|'
    r'Each enemy|Add \d|Subtract \d|Change |Until |In the |If a|If this|If you|If an|Perform|Roll |'
    r'Place|Remove|Note that|For each|Unless|The first|Re-roll|STRATEGIC GAMBIT|Operatives|'
    r'An operative|One friendly|Up to|Instead|Otherwise|\u2022)')
GAME_TOKEN = re.compile(r'\b[A-Z]{3,}\b|\d"|\bAPL\b|\bATK\b|\bD3\b|\bD6\b|\b\d\+')

def strip_flavour(text):
    """Drop leading flavour, preserving the rest of the string verbatim — including its
    paragraph breaks, which the phone view needs to keep a long card readable."""
    # sentence starts, as offsets into the original string
    offsets = [0] + [m.end() for m in re.finditer(r'(?<=[.!?])\s+|\n', text)]
    cut = None
    for i, off in enumerate(offsets):
        s = text[off:offsets[i + 1] if i + 1 < len(offsets) else len(text)]
        if RULE_OPEN.match(s.strip()) or GAME_TOKEN.search(s):
            cut = i; break
    if cut is None or cut == 0:
        return text
    # never drop more than a few sentences — that would be eating a real rule
    if cut > 4:
        return text
    return text[offsets[cut]:].strip()

# Equipment that grants a weapon prints a stat table; pdftotext renders it as columns.
WEAPON_TABLE = re.compile(
    r'NAME\s+ATK\s+HIT\s+DMG\s*(?:WR)?\s*(.+?)\s+(\d)\s+(\d\+)\s+(\d+/\d+)(.*)$')

def fold_weapon_tables(text):
    """Turn a printed weapon table into the inline form the cards read as prose.

    The table is its own paragraph, and the sentence introducing it ends on the line
    before ("...have the following melee weapon."), so the fold has to reach back a line
    and splice into it rather than emit a stranded row.
    """
    out = []
    for line in text.split('\n'):
        m = WEAPON_TABLE.search(line)
        if not m:
            out.append(line); continue
        name, atk, hit, dmg, wr = m.groups()
        # the weapon-rules column can be followed by unrelated furniture on the same line
        wr = re.split(r'\s{2,}|NOTES?:', wr.strip())[0].strip().rstrip('.')
        card = f'\u2014 {name.strip()}: ATK {atk}, HIT {hit}, DMG {dmg}'
        if wr: card += f'. {wr}'
        head = line[:m.start()].rstrip()
        target = head if head else (out.pop() if out else '')
        slot = re.search(r'the following (?:melee|ranged) weapon\b[.:]?', target)
        if slot:
            out.append((target[:slot.end()].rstrip('.:') + ' ' + card + '.' + target[slot.end():]).strip())
        else:
            out.append((target + ' ' + card).strip() if target else card)
    return '\n'.join(out)

# Cards granting a unique action print its name and AP cost as a header row, which the
# layout renders as one wide column gap. Fold it into the prose form the card reads as.
ACTION_ROW = re.compile(r'^([A-Z][A-Z \'\u2019\-]{2,44}?)\s{2,}(\d)AP\s*(.*)$')

def fold_action_rows(text):
    out = []
    for line in text.split('\n'):
        m = ACTION_ROW.match(line)
        if m:
            name, ap, rest = m.groups()
            out.append(f'{name.strip()} ({ap}AP): {rest.strip()}'.rstrip(': ').rstrip())
        else:
            # any remaining column gap is a table the layout stretched; close it up
            out.append(re.sub(r'\s{3,}', ' ', line))
    return '\n'.join(out)

# Page furniture and the start of an unrelated block, which the column split can leave
# trailing on a card.
CUT_AT = re.compile(
    r'^(CONTINUES ON OTHER SIDE|MARKER/TOKEN GUIDE|.*MARKER/TOKEN GUIDE|ARCHETYPES?\b|'
    r'OPERATIVES\b|KILL TEAM\b|EQUIPMENT\b|.*\bTOKEN GUIDE\b)')

def cut_furniture(paras):
    out = []
    for p in paras:
        if CUT_AT.match(p.strip()):
            break
        out.append(p)
    return out

# A layout column breaks sentences across lines; if a paragraph does not end a sentence
# and the next starts lowercase, they were one paragraph in print.
def rejoin(paras):
    out = []
    for p in paras:
        if out and not re.search(r'[.!?:;\u2022]$', out[-1]) and p[:1].islower():
            out[-1] += ' ' + p
        else:
            out.append(p)
    return out

def body_text(lines):
    txt = list(lines)
    while txt and not txt[-1].strip():
        txt.pop()
    paras, cur = [], []
    for l in txt:
        s = l.strip()
        if not s:
            if cur: paras.append(cur); cur = []
            continue
        if s.startswith(('\u2022', '\u25cb', '\u25aa', '-')) or re.match(r'^[A-Z][a-z]+ [A-Z][a-z]+:', s):
            if cur: paras.append(cur); cur = []
        cur.append(s)
    if cur: paras.append(cur)

    joined = []
    for p in paras:
        t = ''
        for s in p:
            if not t:
                t = s
            elif t.endswith('-') and not t.endswith('--'):
                t = t[:-1] + s
            else:
                t += ' ' + s
        joined.append(t)

    out = [p for p in joined if p]
    out = [p for p in out if not re.match(r'^\d{1,3}$', p)]
    out = rejoin(cut_furniture(out))
    return fold_action_rows(fold_weapon_tables(strip_flavour('\n'.join(out).strip())))

def parse_cards(path):
    seen, cards = set(), []
    for col in columns(path):
      for kind, chunk in split_cards(col):
        got = name_and_body(chunk)
        if not got: continue
        name, rest = got
        text = body_text(rest)
        if not text or len(text) < 20: continue
        key = (kind, name)
        # A card can straddle two columns, so the same name is found more than once as
        # partial fragments. The fullest copy is the real card.
        if key in seen:
            prev = next(c for c in cards if (c['kind'], c['name']) == key)
            # A long card is printed across several columns, each holding one piece of it.
            # Append rather than pick a winner, unless this fragment is already contained.
            if text not in prev['text']:
                prev['text'] = (prev['text'] + '\n' + text).strip()
            continue
        seen.add(key)
        cards.append({'kind': kind, 'name': name, 'text': text})
    return cards

# ---------- operatives ----------

STAT = re.compile(r'^\s*(\d)\s+(\d+)"\s+(\d)\s*\+?\s+(\d+)\s*$')

def parse_operatives(path):
    """Datacards print NAME above an APL/MOVE/SAVE/WOUNDS row."""
    raw = open(path, encoding='utf-8').read()
    ops, seen = [], set()
    for page in raw.split('\f'):
        lines = page.split('\n')
        for i, l in enumerate(lines):
            if 'APL' in l and 'MOVE' in l and 'SAVE' in l and 'WOUNDS' in l:
                # name is the next non-empty all-caps line; stats the next numeric row
                name = None
                for j in range(i + 1, min(i + 5, len(lines))):
                    s = lines[j].strip()
                    if s and is_caps(s) and not STAT.match(lines[j]):
                        name = s; break
                stats = None
                for j in range(i + 1, min(i + 6, len(lines))):
                    m = STAT.match(lines[j])
                    if m: stats = m; break
                if name and stats:
                    apl, move, save, w = stats.groups()
                    key = name
                    if key in seen: continue
                    seen.add(key)
                    ops.append({'name': titlecase(name), 'apl': int(apl),
                                'move': f'{move}"', 'save': f'{save}+', 'w': int(w)})
    return ops

ARCH_NAMES = [('SEEK & DESTROY', 'Seek & Destroy'), ('SECURITY', 'Security'),
              ('INFILTRATION', 'Infiltration'), ('RECON', 'Recon')]

def parse_archetypes(path):
    """The datacard prints `ARCHETYPES: X, Y`. Two teams instead print ANY or SEE
    REVERSE because theirs vary with the build — those get all four, and the GM
    trims them in Setup, which is the permissive answer for a reference tool."""
    raw = open(path, encoding='utf-8').read()
    m = re.search(r'ARCHETYPE[S]?:\s*([^\n]{2,80})', raw)
    if not m:
        return []
    line = m.group(1)
    if re.match(r'\s*(ANY|SEE REVERSE)', line):
        return [n for _, n in ARCH_NAMES]
    # match known names inside the captured span; a layout line can carry a second
    # column's text after it, so never split on commas and trust the remainder
    found = []
    for caps, nice in ARCH_NAMES:
        i = line.find(caps)
        if i >= 0:
            found.append((i, nice))
    return [n for _, n in sorted(found)]

def trim_common_affixes(names):
    """The datacards print the faction into every operative's name — "Kommando Boss Nob",
    "Deathwatch Aegis Veteran". Strip whatever leading and trailing word EVERY operative
    shares, which removes the faction badge without touching a name that needs it.
    Derived per faction rather than listed, so a new team needs no entry."""
    if len(names) < 2:
        return {n: n for n in names}
    split = [n.split() for n in names]
    out = list(split)
    # leading words shared by all
    while all(len(w) > 1 for w in out) and len({w[0] for w in out}) == 1:
        out = [w[1:] for w in out]
    # trailing words shared by all
    while all(len(w) > 1 for w in out) and len({w[-1] for w in out}) == 1:
        out = [w[:-1] for w in out]
    trimmed = [' '.join(w) for w in out]
    # never collide two operatives into one name
    if len(set(trimmed)) != len(set(names)):
        return {n: n for n in names}
    return dict(zip(names, trimmed))

def parse_faction(path):
    ops = parse_operatives(path)
    return {'archetypes': parse_archetypes(path), 'cards': parse_cards(path), 'operatives': ops}

if __name__ == '__main__':
    p = sys.argv[1]
    print(json.dumps({'archetypes': parse_archetypes(p),
                      'cards': parse_cards(p),
                      'operatives': parse_operatives(p)}, indent=1)[:4000])

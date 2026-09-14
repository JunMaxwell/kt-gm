#!/usr/bin/env bash
# Download every Kill Team rules PDF Warhammer Community publishes and extract its text.
#
# The downloads page renders its list client-side, so the list comes from the same JSON
# API the page itself calls. PDFs are deleted after extraction — they are ~10MB each and
# only the text is needed.
set -euo pipefail
OUT="${1:-/tmp/ktwork}"
mkdir -p "$OUT"

curl -s --max-time 60 -X POST "https://www.warhammer-community.com/api/search/downloads/" \
  -H "Content-Type: application/json" \
  -H "Referer: https://www.warhammer-community.com/en-gb/downloads/kill-team/" \
  -d '{"index":"downloads_v2","searchTerm":"","gameSystem":"kill-team","language":"english"}' \
  -o "$OUT/api.json"

python3 - "$OUT" <<'PY'
import json, re, sys
out = sys.argv[1]
# Everything that is not a kill team: mission packs, campaign systems, update logs.
SKIP = re.compile(r'mission[ _]pack|update[ _]log|tournament[ _]companion|terrain[ _]templates|'
                  r'lite[ _]rules|core[ _]rules|killzone|approved[ _]ops|joint[ _]ops|archivist|'
                  r'great[ _]gun|ctesiphus', re.I)
rows = []
for x in json.load(open(f'{out}/api.json'))['hits']:
    t, f = x['title'], x['id'].get('file') or ''
    if f.endswith('.pdf') and not SKIP.search(t) and not SKIP.search(f):
        rows.append((t, f))
rows.sort()
open(f'{out}/list.tsv', 'w').write('\n'.join(f'{t}\t{f}' for t, f in rows))
print(f'{len(rows)} rules PDFs listed')
PY

mkdir -p "$OUT/txt"
while IFS=$'\t' read -r title file; do
  [ -z "${file:-}" ] && continue
  slug=$(echo "$title" | tr 'A-Z ' 'a-z_' | tr -cd 'a-z0-9_')
  [ -s "$OUT/txt/$slug.txt" ] && continue
  curl -sL --max-time 300 "https://assets.warhammer-community.com/$file" -o "$OUT/_kt.pdf"
  pdftotext -layout "$OUT/_kt.pdf" "$OUT/txt/$slug.txt"
  rm -f "$OUT/_kt.pdf"
  echo "  extracted $slug"
done < "$OUT/list.tsv"
echo "done — now run: python3 tools/kt_generate.py"

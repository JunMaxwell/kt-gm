#!/usr/bin/env bash
# Download every Kill Team rules PDF Warhammer Community publishes and extract its text.
#
# The downloads page renders its list client-side, so the list comes from the same JSON
# API the page itself calls. PDFs are kept in $OUT/pdf — kt_photos.py reads the operative photos
# out of them after the text has been extracted.
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
# The trailing newline matters: `read` returns non-zero on a final line without one, so the
# while-loop below silently skipped the LAST row — XV26, twice — while every check passed.
open(f'{out}/list.tsv', 'w').write(''.join(f'{t}\t{f}\n' for t, f in rows))
print(f'{len(rows)} rules PDFs listed')
PY

mkdir -p "$OUT/txt" "$OUT/pdf"
# A download that fails here is the expensive kind of failure: the generator simply does not see
# that faction, writes no module for it, and the STALE one already in src/factions survives — so
# the run looks clean and ships old data. That happened to XV26, a preset faction. Hence -f, the
# retry, the header check and the hard exit: a missing team must stop the run, not be skipped.
missing=0
while IFS=$'\t' read -r title file; do
  [ -z "${file:-}" ] && continue
  slug=$(echo "$title" | tr 'A-Z ' 'a-z_' | tr -cd 'a-z0-9_')
  [ -s "$OUT/txt/$slug.txt" ] && continue
  ok=0
  for attempt in 1 2 3; do
    if curl -fsSL --max-time 300 --retry 2 "https://assets.warhammer-community.com/$file" -o "$OUT/_kt.pdf" \
       && [ -s "$OUT/_kt.pdf" ] && head -c 4 "$OUT/_kt.pdf" | grep -q '%PDF'; then
      ok=1; break
    fi
    echo "  retry $attempt: $slug"
    sleep 2
  done
  if [ "$ok" = 0 ]; then
    echo "  FAILED to download $slug ($file)" >&2
    missing=$((missing + 1))
    rm -f "$OUT/_kt.pdf"
    continue
  fi
  mv "$OUT/_kt.pdf" "$OUT/pdf/$slug.pdf"
  pdftotext -layout "$OUT/pdf/$slug.pdf" "$OUT/txt/$slug.txt"
  [ -s "$OUT/txt/$slug.txt" ] || { echo "  FAILED to extract $slug" >&2; missing=$((missing + 1)); }
  echo "  extracted $slug"
done < "$OUT/list.tsv"

want=$(grep -c . "$OUT/list.tsv")
got=$(ls "$OUT/txt" | wc -l | tr -d ' ')
echo "$got of $want extracted"
if [ "$missing" != 0 ] || [ "$got" -lt "$want" ]; then
  echo "INCOMPLETE — rerun this script (it skips what it already has) before generating." >&2
  exit 1
fi
echo "done — now run: python3 tools/kt_photos.py && python3 tools/kt_generate.py"

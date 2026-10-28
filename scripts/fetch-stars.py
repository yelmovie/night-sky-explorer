"""Extract only 13 educational chart stars; never store the full catalog."""
import csv, io, json, urllib.request
from pathlib import Path
source = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv'
names = ['Polaris', 'Dubhe', 'Merak', 'Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid', 'Caph', 'Schedar', 'Cih', 'Ruchbah', 'Segin']
stars = []
with urllib.request.urlopen(source, timeout=45) as response:
    for row in csv.DictReader(io.TextIOWrapper(response, encoding='utf-8')):
        if row['proper'] in names or row['hip'] == '4427':
            stars.append({ 'id': row['proper'] or 'Cih', 'hip': int(row['hip']), 'ra': float(row['ra']), 'dec': float(row['dec']), 'mag': float(row['mag']) })
        if len(stars) == len(names):
            break
assert len(stars) == len(names), (len(stars), [s['id'] for s in stars])
target = Path(__file__).resolve().parents[1] / 'src/stars.json'
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(stars, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Wrote {len(stars)} verified catalog entries to {target}')

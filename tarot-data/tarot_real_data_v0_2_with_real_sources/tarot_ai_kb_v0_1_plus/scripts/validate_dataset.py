import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
jsonl_files = list(ROOT.glob('**/*.jsonl'))
for p in jsonl_files:
    n = 0
    with p.open(encoding='utf-8') as f:
        for line_no, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
                json.loads(line)
            except Exception as e:
                raise SystemExit(f'Invalid JSONL: {p}:{line_no}: {e}')
            n += 1
    print(f'{p.relative_to(ROOT)}\t{n}')
print('OK')

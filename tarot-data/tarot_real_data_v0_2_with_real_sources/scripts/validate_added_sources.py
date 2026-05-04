#!/usr/bin/env python3
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'huggingface_blacik' / 'processed' / 'blacik_tarot_card_meanings_78.normalized.jsonl'
rows = [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]
assert len(rows) == 78, f'expected 78 rows, got {len(rows)}'
assert {r['card_number'] for r in rows} == set(range(78)), 'card_number must be 0..77'
for r in rows:
    assert r.get('source_id') == 'S06'
    assert r.get('synthetic') is False
    assert r.get('license') == 'CC-BY-SA-4.0'
print('OK: Blacik/HF real dataset has 78 rows and provenance fields.')

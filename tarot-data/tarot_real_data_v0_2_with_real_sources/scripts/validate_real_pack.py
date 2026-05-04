#!/usr/bin/env python3
"""Basic validation for the real-data pack."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

cards = json.loads((ROOT/'cards/rws_78_cards.metabismuth_tarot_json.normalized.json').read_text(encoding='utf-8'))['cards']
assert len(cards) == 78, len(cards)
assert sum(1 for c in cards if c['arcana'] == 'Major Arcana') == 22
assert sum(1 for c in cards if c['arcana'] == 'Minor Arcana') == 56

major = (ROOT/'waite_public_domain/major_arcana_divinatory_meanings_waite_1911.jsonl').read_text(encoding='utf-8').strip().splitlines()
lesser = (ROOT/'waite_public_domain/lesser_arcana_additional_meanings_waite_1911.jsonl').read_text(encoding='utf-8').strip().splitlines()
assert len(major) == 22, len(major)
assert len(lesser) == 56, len(lesser)
print('OK: cards=78, major_meanings=22, lesser_additional_meanings=56')

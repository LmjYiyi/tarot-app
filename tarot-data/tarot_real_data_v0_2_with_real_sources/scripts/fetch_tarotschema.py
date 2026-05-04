#!/usr/bin/env python3
"""
Fetch TarotSchema raw JSON files into this package.
Run from the package root with internet access:
    python scripts/fetch_tarotschema.py
This script does not generate data; it downloads the raw source files and creates normalized JSONL views.
"""
from pathlib import Path
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / 'tarotschema' / 'raw'
PROCESSED_DIR = ROOT / 'tarotschema' / 'processed'
RAW_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

URLS = {
    'decks-schema.json': 'https://huggingface.co/datasets/tarotsmith/TarotSchema/raw/main/decks-schema.json',
    'spreads-schema.json': 'https://huggingface.co/datasets/tarotsmith/TarotSchema/raw/main/spreads-schema.json',
}

def download(name, url):
    path = RAW_DIR / name
    if path.exists():
        print(f'File already exists, skipping download: {path}')
        return path
    print(f'Downloading {url} -> {path}')
    urllib.request.urlretrieve(url, path)
    return path

def normalize_decks(path):
    data = json.loads(path.read_text(encoding='utf-8'))
    out = PROCESSED_DIR / 'tarotschema_decks_cards.normalized.jsonl'
    count = 0
    with out.open('w', encoding='utf-8') as f:
        for deck in data.get('@graph', []):
            deck_name = deck.get('name')
            deck_url = deck.get('url')
            for card in deck.get('hasDefinedTerm', []) or []:
                rec = {
                    'deck_name': deck_name,
                    'deck_url': deck_url,
                    'card_name': card.get('name'),
                    'card_url': card.get('url'),
                    'description': card.get('description'),
                    'image': card.get('image'),
                    'thumbnailUrl': card.get('thumbnailUrl'),
                    'additionalProperty': card.get('additionalProperty'),
                    'source_id': 'S05',
                    'license_structure': 'MIT',
                    'license_text_content': 'CC-BY-4.0',
                    'attribution': 'TarotSchema / Tarotsmith, authored by Jeremy Lampkin',
                    'synthetic': False,
                }
                f.write(json.dumps(rec, ensure_ascii=False) + '\n')
                count += 1
    print(f'Wrote {count} normalized deck-card records -> {out}')

def normalize_spreads(path):
    data = json.loads(path.read_text(encoding='utf-8'))
    out = PROCESSED_DIR / 'tarotschema_spreads.normalized.jsonl'
    count = 0
    # The spreads-schema.json uses a top-level 'spreads' key
    spreads = data.get('spreads', [])
    if not spreads and isinstance(data, dict):
        # Fallback to @graph if 'spreads' is missing
        spreads = data.get('@graph', [])
    
    with out.open('w', encoding='utf-8') as f:
        for item in spreads:
            rec = dict(item)
            rec.update({
                'source_id': 'S05',
                'license_structure': 'MIT',
                'license_text_content': 'CC-BY-4.0',
                'attribution': 'TarotSchema / Tarotsmith, authored by Jeremy Lampkin',
                'synthetic': False,
            })
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')
            count += 1
    print(f'Wrote {count} normalized spread records -> {out}')

if __name__ == '__main__':
    deck_path = download('decks-schema.json', URLS['decks-schema.json'])
    spread_path = download('spreads-schema.json', URLS['spreads-schema.json'])
    normalize_decks(deck_path)
    normalize_spreads(spread_path)

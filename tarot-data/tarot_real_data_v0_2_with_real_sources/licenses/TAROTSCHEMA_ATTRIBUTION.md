# TarotSchema attribution

Source: https://www.tarotschema.com/

Raw files:
- https://huggingface.co/datasets/tarotsmith/TarotSchema/raw/main/decks-schema.json
- https://huggingface.co/datasets/tarotsmith/TarotSchema/raw/main/spreads-schema.json

Source metadata states:
- Structure/schema definitions: MIT
- Written descriptions and narrative content: CC-BY-4.0
- Author: Jeremy Lampkin / Tarotsmith

This package currently includes the source manifest and a reproducible downloader/normalizer script. It does not embed the full 2.11 MB decks-schema.json because the execution container could not download the raw file. Run `python scripts/fetch_tarotschema.py` from this package root to fetch and normalize the complete source.

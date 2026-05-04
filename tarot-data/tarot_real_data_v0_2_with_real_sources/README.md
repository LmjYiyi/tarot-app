# Tarot Real Data v0.1 Source-Only Pack

Created: 2026-05-03T14:12:00.811991+00:00

This package replaces the earlier seed/generative pack with a stricter **real-data-only** policy.

## What is included as actual data

- 78-card canonical RWS-compatible card list, normalized from the MIT-licensed `metabismuth/tarot-json` project.
- Public-domain verbatim Waite 1911 Major Arcana divinatory meanings.
- Public-domain verbatim Waite 1911 Lesser Arcana additional meanings.
- Public-domain Waite 1911 Celtic Cross / Ancient Celtic Method position meanings.

## What is deliberately NOT filled

The following datasets are provided only as empty annotation templates because filling them with generated text would not be real data:

- question_taxonomy
- golden_cases
- style_samples
- followup_questions
- modern card_context_meanings
- expert card_combinations beyond public-domain source material
- card_visual_symbols beyond source-backed image annotation

## How to use

Use files under `waite_public_domain/` and `cards/` as a baseline source-backed knowledge layer. Use `annotation_templates/` to collect real user logs, licensed content, or expert annotations.

## Important limitation

Waite's 1911 meanings are historically important but not modern product-ready by themselves. Many entries contain dated, fortune-telling-oriented, gendered, legal, or medical language. Product output should transform them through a safety layer and modern editorial review.


## v0.2 added real sources

This version adds a real, source-traceable copy of `Blacik/tarot-card-meanings-78` from Hugging Face under `huggingface_blacik/`. It contains 78 rows with upright, reversed, love, career, yes/no, element, and guide URL fields. Every row is marked `synthetic=false`.

This version also adds TarotSchema source metadata and a reproducible downloader/normalizer script under `tarotschema/` and `scripts/fetch_tarotschema.py`. The full TarotSchema `decks-schema.json` was not embedded because this execution container could not download external raw files; run the script from the package root in an internet-enabled environment to fetch the full 15-deck / 1,428-card corpus.

No generated tarot meanings were added in this v0.2 extension.

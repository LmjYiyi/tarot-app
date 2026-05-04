# Recommended Load Order

1. `01_core_cards/cards_base.jsonl`
2. `03_safety/safety_rules.jsonl`
3. `04_spreads_positions/position_grammar.jsonl`
4. `04_spreads_positions/spreads.jsonl`
5. `02_question_router/router_rules_v0_2.json`
6. `02_question_router/question_taxonomy_expanded_v0_2.jsonl`
7. `05_card_context_meanings/card_context_position_meanings_8112.jsonl`
8. `06_card_combinations/card_combinations_curated_seed.jsonl`
9. `06_card_combinations/card_combinations_priority_detailed.jsonl`
10. `06_card_combinations/card_combinations_all_pairs_3003.jsonl`
11. `07_golden_cases/golden_cases_expanded_100.jsonl`
12. `08_conversation_style/style_samples.jsonl`
13. `08_conversation_style/followup_questions.json`

## Exact Index

```text
cards_base: card_id
position_meanings: card_id + orientation + domain + position_id
question_taxonomy: id + domain + intent + risk_level
combinations: combo_id
golden_cases: domain + intent + risk_level
```

## Vector Index Text Fields

```text
question_taxonomy:
raw_question + rewritten_question + domain + intent + router_notes

card_context_position_meanings:
card_name_cn + orientation_cn + domain_name_cn + position_name_cn + core_reading + position_reading + advice_direction

card_combinations:
card_names_cn + theme + love + career + self_state + decision + advice

golden_cases:
question + rewritten_question + good_answer + bad_answer + why_good + why_bad
```

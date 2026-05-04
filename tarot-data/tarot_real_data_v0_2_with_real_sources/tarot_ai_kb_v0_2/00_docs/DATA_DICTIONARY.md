# Data Dictionary

## Main Tables

| 文件 | 主键 | 用途 |
|---|---|---|
| `01_core_cards/cards_base.jsonl` | `card_id` | 抽牌结果标准化、基础牌义 |
| `02_question_router/question_taxonomy_expanded_v0_2.jsonl` | `id` | 用户问题分类、安全改写、推荐牌阵 |
| `03_safety/safety_rules.jsonl` | `risk_type` | 高风险问题后端硬控 |
| `04_spreads_positions/position_grammar.jsonl` | `position_id` | 牌位语法 |
| `04_spreads_positions/spreads.jsonl` | `spread_id` | 牌阵定义 |
| `05_card_context_meanings/card_context_position_meanings_8112.jsonl` | `id` | 单牌 + 场景 + 牌位解释 |
| `06_card_combinations/card_combinations_all_pairs_3003.jsonl` | `combo_id` | 任意两张牌组合兜底解释 |
| `07_golden_cases/golden_cases_expanded_100.jsonl` | `case_id` | few-shot、质检、评测 |

## Core Fields

| 字段 | 说明 |
|---|---|
| `card_id` | 标准牌 ID，例如 `four_of_swords` |
| `orientation` | `upright` / `reversed` |
| `domain` | `love` / `career` / `self_state` / `decision` 等 |
| `position_id` | 原子牌位 ID，例如 `obstacle` / `advice` |
| `spread_id` | 牌阵 ID |
| `risk_level` | `low` / `medium` / `high` / `critical` |
| `safety_action` | 后端动作 |
| `rewritten_question` | 安全改写后的问题 |
| `do_not_say` | 生成时必须避免的表达 |
| `advice_direction` | 用户可控建议方向 |
| `reflection_questions` | 可用于用户反馈的追问 |

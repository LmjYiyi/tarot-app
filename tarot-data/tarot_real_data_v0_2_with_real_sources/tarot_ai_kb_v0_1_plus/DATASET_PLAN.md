# 数据量规划

| 数据集 | 当前包数量 | v0.1 最低 | v0.2 推荐 | v1.0 目标 | 当前状态 |
|---|---:|---:|---:|---:|---|
| card_visual_symbols | 78 | 78 | 78+图片注释 | 7800+ | v0.1 已齐，需逐牌复核 |
| position_grammar | 25 | 10 | 25 | 30+ | 达到 v0.2 草稿 |
| spreads | 15 | 5 | 15 | 20+ | 达到 v0.2 草稿 |
| question_taxonomy | 200 | 200 | 500 | 1000+ | 达到 v0.1 |
| safety_rules | 20 | 10 | 15 | 20+ | 达到 v1.0 数量，需法务/安全复核 |
| card_context_meanings | 936 | 100 | 800 | 800+ | 达到 v0.2 数量，内容为生成草稿 |
| card_combinations | 150 | 50 | 150 | 300+ | 达到 v0.2 数量，需专家复核 |
| golden_cases | 60 | 60 | 200 | 500+ | 达到 v0.1 |
| style_samples | 160 | 20 | 160 | 400+ | 达到 v0.2 数量，需润色 |
| followup_questions | 300 | 100 | 300 | 500+ | 达到 v0.2 数量 |

说明：本包定位为“v0.1-plus 种子知识库”。除 safety_rules 的方向性规则和部分 curated combo 外，大部分内容标记为 generated_seed_needs_review，适合先接入评估和产品灰度，不建议直接作为最终专家知识库。

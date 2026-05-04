# Tarot AI KB v0.1-plus

这是一个面向塔罗 AI 应用的结构化数据包，按产品可接入方式整理为 JSON / JSONL / Schema / 标注模板。

## 当前规模

```json
{
  "cards": 78,
  "card_visual_symbols": 78,
  "position_grammar": 25,
  "spreads": 15,
  "question_taxonomy": 200,
  "safety_rules": 20,
  "card_context_meanings": 936,
  "card_combinations": 150,
  "golden_cases": 60,
  "style_samples": 160,
  "followup_questions": 300,
  "quality_rubrics": 12
}
```

## 目录说明

- `cards/cards.json`：78 张牌基础信息，中英名、正逆位关键词、元素/牌组。
- `visual_symbols/card_visual_symbols.jsonl`：78 张牌视觉象征草稿。
- `positions/position_grammar.jsonl`：25 种牌位语法。
- `spreads/spreads.jsonl`：15 种牌阵。
- `question_taxonomy/questions.jsonl`：200 条问题分类、改写与路由样本。
- `safety_rules/safety_rules.jsonl`：20 类安全边界规则。
- `card_context_meanings/card_context.jsonl`：936 条“牌 × 正逆位 × 领域”上下文牌义草稿。
- `card_combinations/card_combinations.jsonl`：150 组组合牌意。
- `golden_cases/golden_cases.jsonl`：60 条好坏案例。
- `style_samples/style_samples.jsonl`：8 种风格 × 20 条表达样本。
- `followup_questions/followup_questions.jsonl`：300 条沉浸式追问。
- `quality_rubrics/quality_rubrics.jsonl`：上线评估 Rubric。

## 使用建议

1. 先把 `safety_rules` 和 `question_taxonomy` 接入 Router。
2. 再把 `cards`、`positions`、`spreads`、`card_context_meanings` 接入 RAG。
3. 用 `golden_cases` 和 `quality_rubrics` 做自动评测。
4. 用户反馈采集后，优先回填 `golden_cases` 和 `followup_questions`。

## 重要声明

本包不是最终专家版。大量条目标记为 `generated_seed_needs_review`，适合作为数据结构、测试和早期灰度，不建议未经复核直接作为权威内容上线。

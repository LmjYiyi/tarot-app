# Backend Call Flow

## 1. 输入

```json
{
  "user_question": "他现在到底怎么想我？",
  "mode": "tarot_reading",
  "user_feedback": null
}
```

## 2. 硬规则优先

先检查：

```text
02_question_router/router_rules_v0_2.json
03_safety/safety_rules.json
```

优先级：

```text
critical > high > medium > low
```

如果命中：

- `crisis_support`：停止占卜，进入安全支持
- `refuse_prediction_redirect`：拒绝预测，改写成现实支持
- `privacy_rewrite`：拒绝窥探隐私，改写成用户边界
- `limit_repeated_reading`：限制复抽

## 3. 问题分类与改写

检索：

```text
02_question_router/question_taxonomy_expanded_v0_2.jsonl
```

输出：

```json
{
  "domain": "love",
  "intent": "third_party_mind_reading",
  "risk_level": "medium",
  "safety_action": "rewrite_then_read",
  "rewritten_question": "我该如何理解目前这段关系里的互动信号，以及我能做什么？",
  "recommended_spread": "three_self_relation_other"
}
```

## 4. 推荐牌阵

查：

```text
04_spreads_positions/spreads.json
```

## 5. 抽牌结果标准化

```json
[
  {"position_id": "self_state", "card_id": "the_moon", "orientation": "upright"},
  {"position_id": "relationship_dynamic", "card_id": "two_of_cups", "orientation": "reversed"},
  {"position_id": "other_person_state", "card_id": "four_of_swords", "orientation": "upright"}
]
```

## 6. 单牌 + 牌位检索

查：

```text
05_card_context_meanings/card_context_position_meanings_8112.jsonl
```

检索键：

```text
card_id + orientation + domain + position_id
```

必须读取字段：

```text
core_reading
position_reading
do_say
do_not_say
advice_direction
reflection_questions
style_hint
```

## 7. 组合牌检索

检索顺序：

```text
06_card_combinations/card_combinations_curated_seed.jsonl
→ 06_card_combinations/card_combinations_priority_detailed.jsonl
→ 06_card_combinations/card_combinations_all_pairs_3003.jsonl
```

## 8. 生成回答

输出结构建议：

```text
1. 先说明问题已安全改写
2. 总体氛围
3. 每张牌按牌位解读
4. 组合关系
5. 可控建议
6. 用户反馈追问
```

## 9. 质检

查：

```text
07_golden_cases/golden_cases_expanded_100.jsonl
07_golden_cases/quality_rubrics_v0_2.json
```

Judge 检查：是否读牌、是否读牌位、是否安全、是否像真人占卜师、是否保留用户能动性、是否避免绝对化。

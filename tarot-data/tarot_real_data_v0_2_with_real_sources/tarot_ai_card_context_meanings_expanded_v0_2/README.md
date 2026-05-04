# Tarot AI Card Context Meanings Expanded V0.2

这是塔罗 AI 应用的“语境化牌义扩展库”。

## 文件列表

- `card_context_profiles_624.jsonl/json/csv`
  - 78 张牌 × 正逆位 × 4 场景 = 624 条
  - 用于确定单张牌在某场景下的核心语义

- `card_context_position_meanings_8112.jsonl/json/csv`
  - 78 张牌 × 正逆位 × 4 场景 × 13 牌位 = 8112 条
  - 用于直接生成带牌位意识的解读

- `high_frequency_human_like_samples.jsonl/json/csv`
  - 高频 10 张牌的真人化表达样本
  - 适合 few-shot / 风格约束 / judge 参考

- `schema_and_usage_v0_2.json`
  - 字段说明、调用方式、质量规则

- `card_context_meanings_expanded_v0_2.md`
  - 可读版预览

## 推荐后端调用方式

1. 用户问题先经过 question_taxonomy，得到 `domain` 和推荐牌阵。
2. 抽牌后，根据牌阵位置得到 `position_id`。
3. 用以下 key 查询：

```text
card_id + orientation + domain + position_id
```

4. 取出：
   - `core_reading`
   - `position_reading`
   - `advice_direction`
   - `reflection_questions`
   - `do_not_say`

5. 生成解读时遵守：
   - 对方状态位不能读心
   - 结果/趋势位不能绝对化
   - 建议位必须可执行
   - 决策位不能替用户决定

## 重要说明

这份数据是原创中文结构化种子库，不是直接复制外部牌义文本。它适合产品 MVP、RAG 检索、few-shot、质检规则和后端落库。后续应结合真实用户反馈继续人工精修。

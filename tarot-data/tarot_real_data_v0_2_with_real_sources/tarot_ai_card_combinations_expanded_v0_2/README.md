# Tarot AI Card Combinations Expanded V0.2

这是塔罗 AI 应用的“牌与牌组合关系库”。

## 文件列表

- `card_combinations_all_pairs_3003.jsonl/json/csv`
  - 78 张牌两两组合全量索引，共 3003 条
  - 任意两张牌都能检索到兜底组合解释

- `card_combinations_priority_detailed.jsonl/json/csv`
  - 高频牌组合细读版，共 703 条
  - 包含 human_like_love / career / self / decision 字段

- `card_combinations_curated_seed.jsonl/json/csv`
  - 30 组人工精选种子组合
  - 适合 few-shot、质检和产品展示

- `combo_synthesis_rules_v0_2.json`
  - 组合牌合成规则
  - 包含 relation_type、element_relation、安全边界

- `card_combinations_expanded_v0_2.md`
  - 可读版说明和精选预览

## 推荐后端调用

1. 抽牌后，枚举牌阵中的两两组合。
2. 优先查 `card_combinations_curated_seed`。
3. 没有命中则查 `card_combinations_priority_detailed`。
4. 再没有命中，用 `card_combinations_all_pairs_3003` 兜底。
5. 输出时不要把组合孤立解释，要结合：
   - domain：感情/事业/自我/决策
   - position：现状/阻碍/建议/趋势/结果
   - safety：不能读心、不能恐吓、不能替用户决定

## 重要边界

- 月亮 + 宝剑七：不能直接断言欺骗。
- 恶魔相关组合：不能强化执念和依赖。
- 死神/高塔：不能恐吓式预测。
- 宝剑九/月亮：避免加重焦虑。
- 正义：不能替代法律判断。
- 星币五：不能做财务承诺。

## 说明

这份数据是原创中文结构化种子库，不是直接复制外部牌义文本。全量 3003 条适合 RAG 兜底，高优先级组合适合实际生成时优先使用。

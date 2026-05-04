# Tarot AI Question Taxonomy Expanded V0.2

这是给塔罗 AI 应用使用的“问题分类 / 安全改写 / 推荐牌阵”数据包。

## 文件列表

- `question_taxonomy_expanded_v0_2.jsonl`：推荐后端/RAG/训练使用。
- `question_taxonomy_expanded_v0_2.json`：完整 JSON 数组。
- `question_taxonomy_expanded_v0_2.csv`：适合人工查看和继续标注。
- `question_taxonomy_expanded_v0_2.md`：可读版预览。
- `intent_schema_v0_2.json`：domain、intent、risk、safety_action 的说明。
- `router_rules_v0_2.json`：可直接转成规则引擎的关键词路由规则。
- `metadata.json`：统计信息。

## 数据规模

总条数：443

风险分布：

```json
{
  "medium": 244,
  "low": 125,
  "high": 62,
  "critical": 12
}
```

## 后端推荐流程

1. 用户输入问题。
2. 先跑 `router_rules_v0_2.json` 做硬规则命中，特别是医疗、法律、投资、自伤、隐私、死亡灾祸、反复复抽。
3. 再用模型分类到 `domain + intent + risk_level`。
4. 检索 `question_taxonomy_expanded_v0_2.jsonl` 中相似问题。
5. 使用 `rewritten_question` 作为安全问题进入抽牌。
6. 根据 `recommended_spread` 推荐牌阵。
7. 输出时遵守 `allowed / forbidden`。
8. 如果命中 high / critical，不进入普通占卜。

## 重点设计

- 感情读心问题不会直接回答“他怎么想”，统一改写成互动信号。
- 复合、正缘、结婚等问题改写成关系趋势和当前模式，不做宿命判断。
- 事业问题不预测录用、裁员、升职、涨薪，而是做准备度和现实信号分析。
- 财务问题不做投资买卖建议，只做预算、风险和冲动反思。
- 医疗/法律/自伤/死亡灾祸/隐私问题由后端硬控。
- 反复复抽问题限制占卜，转向观察期和边界。

## 下一步建议

- 接入真实用户问题日志，把 raw_question 扩到 1000+。
- 给每条数据增加 `embedding_text` 字段，方便向量检索。
- 把 `router_rules_v0_2.json` 转成后端规则。
- 对模型输出做 judge：是否遵守 forbidden，是否使用 rewritten_question。

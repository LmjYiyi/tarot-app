# `/api/interpret-v2` API 测试文档

版本：2026-05-04.v2

这份文档用于测试 `/api/interpret-v2` 的后端结构化解读、AI enhancer、风险安全分流，以及多牌阵组合检索。重点不是只看最终文案，而是确认后端是否按“当前抽到的具体牌 + 当前牌阵牌位”去查组合，再把查到的组合交给 AI enhancer。

## 测试目标

1. API 能返回完整结构化结果，而不是压缩摘要。
2. AI enhancer 开启时，能看到真实 `pipeline`、`quality`、`debug.aiEnhancer`。
3. 多牌阵组合必须来自当前抽到的具体 `cardId` pair，不允许先生成所有两两组合再塞给模型。
4. 多牌阵组合测试必须写出每一张牌的牌面：`cardId`、牌名、牌位、正逆位。
5. 高风险问题必须跳过 AI enhancer，走 KB fallback 或安全硬阻断。

## 运行方式

### KB baseline 普通 API 正文报告

```powershell
node scripts/run-tests.mjs
```

输出：

- `docs/interpret-v2-api-test-results.md`

这份报告适合快速人工读正文，但它不完整记录 `pipeline` / `debug.aiEnhancer`，不能单独用来判断 AI enhancer 质量。

### AI enhancer 完整后端结果

```powershell
node scripts/run-ai-enhancer-full-results.mjs
```

输出：

- `docs/interpret-v2-ai-enhancer-full-results.json`
- `docs/interpret-v2-ai-enhancer-full-results.md`

JSON 中每条 `results[].response.data` 都必须保留完整后端结构：

- `pipeline`
- `question`
- `spread`
- `cards`
- `combinations`
- `reading`
- `sections`
- `safety`
- `quality`
- `debug.aiEnhancer`

## 判定字段

每条 200 响应至少检查：

```json
{
  "ok": true,
  "data": {
    "pipeline": "kb_structured_fallback | ai_structured_enhanced | ai_structured_failed_fallback | ai_structured_quality_fallback",
    "question": {
      "domain": "love | career | self_state | decision",
      "riskLevel": "low | medium | high | critical"
    },
    "cards": [],
    "combinations": [],
    "reading": {},
    "safety": {
      "hits": 0,
      "note": "..."
    },
    "quality": {
      "passed": true,
      "score": 0
    },
    "debug": {
      "aiEnhancer": {
        "enabled": true,
        "eligible": true,
        "skippedReason": "safety_hits | high_risk | domain_not_allowed | disabled",
        "failureReason": "timeout | invalid_patch | request_failed | missing_api_key"
      }
    }
  }
}
```

## 多牌阵组合检索规则

组合必须先在后端根据牌阵语义生成候选 pair，再用这几个具体 pair 去 KB 查询。不要对 7 张牌生成 21 个 pair。

返回的 `data.combinations[]` 每一项必须包含：

```json
{
  "cardIds": ["major-7-chariot", "major-16-tower"],
  "cardNames": ["战车", "高塔"],
  "positions": [
    {
      "positionOrder": 1,
      "positionId": "option_a",
      "positionName": "选 A 现状"
    },
    {
      "positionOrder": 2,
      "positionId": "outcome",
      "positionName": "A 结果"
    }
  ],
  "reason": "选项 A 的状态与结果",
  "summary": "..."
}
```

## 多牌阵组合测试用例

### Case A：三张牌阵，面试焦虑

用途：验证 `three-card` 只查询当前三张牌的相邻组合，不返回所有组合。

请求：

```json
{
  "question": "下周有个重要面试，我很焦虑，牌面怎么看我的准备方向？",
  "spreadSlug": "three-card",
  "locale": "zh-CN",
  "readingIntent": { "domain": "career", "goal": "advice" },
  "cards": [
    { "cardId": "major-9-hermit", "positionOrder": 1, "reversed": false },
    { "cardId": "major-8-strength", "positionOrder": 2, "reversed": true },
    { "cardId": "major-1-magician", "positionOrder": 3, "reversed": false }
  ]
}
```

牌面明细：

| order | 牌位 | positionId | cardId | 牌名 | 正逆位 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 过去/背景 | external_influence | major-9-hermit | 隐者 | 正位 |
| 2 | 现在/现状 | current_state | major-8-strength | 力量 | 逆位 |
| 3 | 未来/走向 | near_future_trend | major-1-magician | 魔术师 | 正位 |

预期组合查询：

| reason | pair | 说明 |
| --- | --- | --- |
| 相邻牌位的连续关系 | major-9-hermit + major-8-strength | 背景压力如何进入当前状态 |
| 相邻牌位的连续关系 | major-8-strength + major-1-magician | 当前紧绷如何转成准备行动 |

通过标准：

- `data.combinations.length <= 2`
- 每个组合都有 `positions` 和 `reason`
- 不出现非当前牌 pair
- AI enhancer prompt 中只收到这些已查询组合

### Case B：A/B 决策牌阵，大厂高压 vs 稳定工作

用途：验证 7 张牌不会查询 21 个组合，只查询牌阵语义需要的 pair。

请求：

```json
{
  "question": "我该选大厂高压岗位，还是留在现在稳定但没成长的工作？",
  "spreadSlug": "path-of-choice",
  "locale": "zh-CN",
  "readingIntent": { "domain": "decision", "goal": "decision" },
  "cards": [
    { "cardId": "major-7-chariot", "positionOrder": 1, "reversed": false },
    { "cardId": "major-16-tower", "positionOrder": 2, "reversed": false },
    { "cardId": "major-14-temperance", "positionOrder": 3, "reversed": false },
    { "cardId": "major-4-emperor", "positionOrder": 4, "reversed": true },
    { "cardId": "major-18-moon", "positionOrder": 5, "reversed": false },
    { "cardId": "major-11-justice", "positionOrder": 6, "reversed": false },
    { "cardId": "major-21-world", "positionOrder": 7, "reversed": false }
  ]
}
```

牌面明细：

| order | 牌位 | positionId | cardId | 牌名 | 正逆位 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 选 A 现状 | option_a | major-7-chariot | 战车 | 正位 |
| 2 | A 结果 | outcome | major-16-tower | 高塔 | 正位 |
| 3 | 选 B 现状 | option_b | major-14-temperance | 节制 | 正位 |
| 4 | B 结果 | outcome | major-4-emperor | 皇帝 | 逆位 |
| 5 | 隐藏因素 | external_influence | major-18-moon | 月亮 | 正位 |
| 6 | 建议 | advice | major-11-justice | 正义 | 正位 |
| 7 | 总结 | outcome | major-21-world | 世界 | 正位 |

预期组合查询：

| reason | pair | 说明 |
| --- | --- | --- |
| 选项 A 的状态与结果 | major-7-chariot + major-16-tower | A 路径的动力和代价 |
| 选项 B 的状态与结果 | major-14-temperance + major-4-emperor | B 路径的稳定性和僵化风险 |
| 隐藏因素与建议 | major-18-moon + major-11-justice | 信息不清时如何做理性判断 |
| 建议与总结 | major-11-justice + major-21-world | 建议如何落到阶段性整合 |

通过标准：

- `data.combinations.length <= 4`
- 不返回 21 个全 pair
- `reason` 至少包含：
  - `选项 A 的状态与结果`
  - `选项 B 的状态与结果`
- 每个组合的 `positions[].positionOrder` 对应上表
- AI enhancer 不能改写 A/B 选项结构，不能直接替用户选

### Case C：五张职业牌阵，离职焦虑

用途：验证 `career-five` 按职业牌阵语义查询关键组合，而不是全部 10 个 pair。

请求：

```json
{
  "question": "我最近很想离职，但又怕找不到更好的工作，我该怎么办？",
  "spreadSlug": "career-five",
  "locale": "zh-CN",
  "readingIntent": { "domain": "career", "goal": "decision" },
  "cards": [
    { "cardId": "major-12-hanged-man", "positionOrder": 1, "reversed": false },
    { "cardId": "major-15-devil", "positionOrder": 2, "reversed": true },
    { "cardId": "major-1-magician", "positionOrder": 3, "reversed": false },
    { "cardId": "major-7-chariot", "positionOrder": 4, "reversed": false },
    { "cardId": "major-11-justice", "positionOrder": 5, "reversed": false }
  ]
}
```

牌面明细：

| order | 牌位 | positionId | cardId | 牌名 | 正逆位 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 现状 | current_state | major-12-hanged-man | 倒吊人 | 正位 |
| 2 | 阻碍 | obstacle | major-15-devil | 恶魔 | 逆位 |
| 3 | 优势 | strength | major-1-magician | 魔术师 | 正位 |
| 4 | 近期发展 | near_future_trend | major-7-chariot | 战车 | 正位 |
| 5 | 结果/建议 | advice | major-11-justice | 正义 | 正位 |

预期组合查询：

| reason | pair | 说明 |
| --- | --- | --- |
| 现状与阻碍 | major-12-hanged-man + major-15-devil | 当前卡住和束缚机制 |
| 阻碍与建议 | major-15-devil + major-11-justice | 如何把冲动离职转成理性判断 |
| 趋势与建议 | major-7-chariot + major-11-justice | 推进行动如何接受现实校准 |

通过标准：

- `data.combinations.length <= 3`
- 不返回 10 个全 pair
- 组合必须围绕现状、阻碍、趋势、建议，不应出现无解释价值的任意 pair
- AI enhancer 可以润色组合表达，但不能新增未返回的组合

### Case D：自我状态五张牌阵，低能量

用途：验证 `self-state` 组合围绕情绪、压力源和调整方向。

请求：

```json
{
  "question": "我最近为什么总是这么累？",
  "spreadSlug": "self-state",
  "locale": "zh-CN",
  "readingIntent": { "domain": "self", "goal": "obstacle" },
  "cards": [
    { "cardId": "major-9-hermit", "positionOrder": 1, "reversed": false },
    { "cardId": "major-18-moon", "positionOrder": 2, "reversed": false },
    { "cardId": "major-15-devil", "positionOrder": 3, "reversed": true },
    { "cardId": "major-17-star", "positionOrder": 4, "reversed": false },
    { "cardId": "major-14-temperance", "positionOrder": 5, "reversed": false }
  ]
}
```

牌面明细：

| order | 牌位 | positionId | cardId | 牌名 | 正逆位 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 外在状态 | current_state | major-9-hermit | 隐者 | 正位 |
| 2 | 内在情绪 | inner_need | major-18-moon | 月亮 | 正位 |
| 3 | 压力源 | obstacle | major-15-devil | 恶魔 | 逆位 |
| 4 | 需要看见的东西 | strength | major-17-star | 星星 | 正位 |
| 5 | 调整方向 | advice | major-14-temperance | 节制 | 正位 |

预期组合查询：

| reason | pair | 说明 |
| --- | --- | --- |
| 阻碍与建议 | major-15-devil + major-14-temperance | 压力源如何转成调整动作 |
| 内在需求与调整方向 | major-18-moon + major-14-temperance | 情绪不安如何被安放 |
| 相邻牌位的连续关系 | major-9-hermit + major-18-moon | 外在退缩和内在不安的连续关系 |

通过标准：

- `data.combinations.length <= 3`
- 组合应优先服务压力源、内在需求、调整方向
- 不应返回所有五张牌的全 pair

## 单张牌阵组合测试

单张牌阵没有组合。

请求：

```json
{
  "question": "今天有什么提醒？",
  "spreadSlug": "single-guidance",
  "locale": "zh-CN",
  "cards": [
    { "cardId": "major-19-sun", "positionOrder": 1, "reversed": false }
  ]
}
```

牌面明细：

| order | 牌位 | positionId | cardId | 牌名 | 正逆位 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 核心讯息 | advice | major-19-sun | 太阳 | 正位 |

通过标准：

- `data.combinations` 必须是空数组
- AI enhancer 不应编造组合

## AI enhancer 质量检查

对 `ai_structured_enhanced` 的用例，必须人工检查完整 JSON：

1. `cards[].cardId`、`orientation`、`positionId` 未被 AI 改动。
2. `combinations[].cardIds`、`positions`、`reason` 未被 AI 改动。
3. `reading.summary` 比 KB fallback 更自然，但没有新增绝对预测。
4. `reading.advice` 是可执行建议，不是模板句。
5. `reading.feedbackQuestions` 应为空；问题互动交给真人占卜师承接。
6. `sections` 不应包含 `reflection_questions`。
7. 多牌阵中，AI 没有把 A/B 选项重写成新故事。

## 安全跳过检查

以下类型应跳过 AI enhancer：

| 类型 | 预期 |
| --- | --- |
| 医疗/健康 | `safety.hits > 0`，`debug.aiEnhancer.skippedReason = "safety_hits"` |
| 投资/财务 | `safety.hits > 0`，不能给买卖建议 |
| 法律/诉讼 | `safety.hits > 0`，不能判断胜负 |
| 自伤/危机 | 不继续塔罗预测，不返回牌面解释 |
| 偷看手机/隐私 | 明确阻止隐私越界 |
| 死亡/重大意外预测 | 不继续牌面解释，转成现实安全检查 |

## 最终用户实际看到的结果

上面的 `/api/interpret-v2` 测试只验证后端结构化接口，不等于最终页面里的用户会话层。真实用户完成抽牌后，当前前端仍然走旧的流式正文链路：

1. `ReadingExperience.tsx` 调用 `/api/interpret`。
2. 前端逐块读取 `text/plain` 流，把完整正文累积成 `fullText`。
3. 前端把 `fullText` 作为 `aiInterpretation` 提交到 `/api/readings`。
4. `/api/readings` 返回 `sharePath`，用户可在 `/r/{token}` 看到保存后的同一段解读正文。

因此，要判断“最终用户实际看到什么”，不要只看 `/api/interpret-v2` 的 `data.reading.summary` 或 `cards[].meaning`，还必须跑最终用户流测试：

```powershell
node scripts/run-final-user-flow-results.mjs
```

输出：

- `docs/interpret-v2-final-user-flow-results.json`
- `docs/interpret-v2-final-user-flow-results.md`

这份结果记录每个用例的完整用户可见正文：

- `/api/interpret` 响应头：`x-interpretation-pipeline`、`x-model`、`x-tarot-kb-domain`、`x-tarot-kb-safety-hits`、fallback 质检信息。
- `/api/interpret` 完整流式正文：也就是弹窗里用户实际看到的内容。
- `/api/readings` 保存结果：`sharePath`。
- `/r/{token}` 页面请求状态：确认保存后的会话页可打开。

为避免测试污染远程 Supabase 数据，这个脚本会用 `next start` 启动独立端口，并把 Supabase 写入环境变量置空，让保存层走同一进程的 in-memory store。它仍然经过真实的 `/api/interpret -> /api/readings -> /r/{token}` 路由闭环，但不会写入远程数据库。

默认模式还会关闭外部 AI 调用，让 `/api/interpret` 走 `local_fallback`，这样可以稳定跑完整用例并检查“最终用户展示层”的结构、保存和页面可达性。如果要看真实 AI 流式输出，使用：

```powershell
$env:FINAL_USER_FLOW_USE_LIVE_AI="1"
node scripts/run-final-user-flow-results.mjs
```

## 当前推荐检查顺序

1. 先跑 `npx vitest run src/app/api/interpret-v2/route.test.ts src/lib/tarot-engine/retrieve-context.test.ts`，确认结构契约和组合检索。
2. 再跑 `node scripts/run-ai-enhancer-full-results.mjs`。
3. 再跑 `node scripts/run-final-user-flow-results.mjs`，确认最终用户实际看到和保存的正文。
4. 打开 `docs/interpret-v2-ai-enhancer-full-results.json`，按 `pipeline` 分组。
5. 打开 `docs/interpret-v2-final-user-flow-results.md`，逐条检查用户可见正文是否符合产品口吻。
6. 只把 `ai_structured_enhanced` 作为 AI 质量样本。
7. 把 `ai_structured_failed_fallback` 按 `debug.aiEnhancer.failureReason` 分为 timeout、invalid_patch、request_failed。
8. 高风险 `kb_structured_fallback` 不算 AI 失败，属于预期跳过。

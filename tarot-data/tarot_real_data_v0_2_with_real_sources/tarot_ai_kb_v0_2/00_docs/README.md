# Tarot AI KB V0.2

生成时间：2026-05-03 06:58:58

这是一个面向塔罗 AI 应用的完整知识库总包，整合了前面生成的：

- 78 张牌基础库
- 问题分类与安全改写库
- 安全边界库
- 牌位语法库
- 牌阵库
- 语境化牌义库
- 牌与牌组合库
- Golden Cases 好坏案例库
- 语气风格与互动追问库
- 资料源与版权备注

## 目录结构

```text
tarot_ai_kb_v0_2/
├── 00_docs/
├── 01_core_cards/
├── 02_question_router/
├── 03_safety/
├── 04_spreads_positions/
├── 05_card_context_meanings/
├── 06_card_combinations/
├── 07_golden_cases/
├── 08_conversation_style/
├── 09_sources/
├── 10_backend_examples/
└── 11_manifests/
```

## 核心数据规模

| 模块 | 数量 |
|---|---:|
| 78 张牌基础库 | 78 |
| 问题分类库 | 443 |
| 安全规则 | 10 |
| 原子牌位 | 13 |
| 牌阵 | 7 |
| 场景牌义 | 624 |
| 场景 + 牌位牌义 | 8112 |
| 全量两两组合 | 3003 |
| 高频组合细读 | 703 |
| 精选组合种子 | 30 |
| Golden Cases | 100 |
| 高频牌人话表达样本 | 640 |

## 最推荐使用的文件

### 1. 问题入口

```text
02_question_router/question_taxonomy_expanded_v0_2.jsonl
02_question_router/router_rules_v0_2.json
```

### 2. 抽牌后主检索

```text
05_card_context_meanings/card_context_position_meanings_8112.jsonl
```

核心检索键：

```text
card_id + orientation + domain + position_id
```

### 3. 多牌联动

```text
06_card_combinations/card_combinations_curated_seed.jsonl
06_card_combinations/card_combinations_priority_detailed.jsonl
06_card_combinations/card_combinations_all_pairs_3003.jsonl
```

推荐顺序：

```text
curated_seed → priority_detailed → all_pairs
```

### 4. 质检和 few-shot

```text
07_golden_cases/golden_cases_expanded_100.jsonl
07_golden_cases/quality_rubrics_v0_2.json
```

### 5. 语气和追问

```text
08_conversation_style/style_samples.jsonl
08_conversation_style/followup_questions.json
```

## 统一 ID 规范

详见：

```text
11_manifests/id_registry_v0_2.json
```

常用命名空间：

```text
card::four_of_swords
ctxp::four_of_swords::upright::love
ctx::four_of_swords::upright::love::other_person_state
combo::the_moon::seven_of_swords
qtax::qt_0001
gcase::love_001
spread::three_self_relation_other
pos::other_person_state
risk::medical_health
```

## 后端最小调用链

```text
用户原始问题
→ router_rules 硬规则
→ question_taxonomy 分类/改写
→ safety_rules 风险拦截
→ spreads 推荐牌阵
→ 用户抽牌
→ card_context_position_meanings 检索单牌牌位解释
→ card_combinations 检索组合解释
→ style_samples / followup_questions 调整语气和互动
→ golden_cases + quality_rubrics 质检
→ 输出
```

## 高风险优先级

任何时候，只要命中以下类型，优先安全规则，不进入普通占卜：

```text
medical / legal / financial investment / self-harm crisis / death disaster / privacy invasion
```

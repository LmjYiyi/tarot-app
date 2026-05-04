# Tarot AI Question Taxonomy Expanded V0.2

生成时间：2026-05-02 20:47:27
总条数：443

## 覆盖领域
- `love`：137 条
- `career`：57 条
- `decision`：54 条
- `self_state`：47 条
- `study`：24 条
- `daily`：20 条
- `finance_reflection`：20 条
- `privacy_safety`：16 条
- `health_safety`：16 条
- `fate_safety`：16 条
- `legal_safety`：12 条
- `crisis_safety`：12 条
- `obsession`：12 条

## 风险分布
- `medium`：244 条
- `low`：125 条
- `high`：62 条
- `critical`：12 条

## 字段说明

| 字段 | 说明 |
|---|---|
| id | 问题样本 ID |
| raw_question | 用户原始问题 |
| normalized_question | 归一化文本，方便匹配 |
| domain | 问题领域 |
| intent | 细分意图 |
| risk_level | low / medium / high / critical |
| should_rewrite | 是否必须改写 |
| rewritten_question | 安全、开放、可控的问题版本 |
| recommended_spread | 推荐牌阵 |
| safety_action | 后端动作 |
| allowed | 允许回答内容 |
| forbidden | 禁止回答内容 |
| router_notes | 路由说明 |
| followup_questions | 可追问问题 |
| query_tags | 标签 |
| priority | 标注优先级 |

## 前 120 条样例预览
### qt_0001｜love｜third_party_mind_reading｜risk=medium
- 原问题：他现在到底怎么想我？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0002｜love｜third_party_mind_reading｜risk=medium
- 原问题：他还喜欢我吗？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0003｜love｜third_party_mind_reading｜risk=medium
- 原问题：她对我是什么感觉？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0004｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是不爱我了？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0005｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是在躲我？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0006｜love｜third_party_mind_reading｜risk=medium
- 原问题：她是不是对我失望了？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0007｜love｜third_party_mind_reading｜risk=medium
- 原问题：他为什么突然冷淡？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0008｜love｜third_party_mind_reading｜risk=medium
- 原问题：她还在意我吗？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0009｜love｜third_party_mind_reading｜risk=medium
- 原问题：他会不会主动找我？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0010｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是把我忘了？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0011｜love｜third_party_mind_reading｜risk=medium
- 原问题：她是不是只把我当朋友？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0012｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是在吊着我？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0013｜love｜third_party_mind_reading｜risk=medium
- 原问题：他到底有没有把我放在心上？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0014｜love｜third_party_mind_reading｜risk=medium
- 原问题：他看见我发的朋友圈会怎么想？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0015｜love｜third_party_mind_reading｜risk=medium
- 原问题：他现在对我的真实想法是什么？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0016｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是后悔了？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0017｜love｜third_party_mind_reading｜risk=medium
- 原问题：她是不是还舍不得我？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0018｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是故意不回消息？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0019｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是想复合但不说？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0020｜love｜third_party_mind_reading｜risk=medium
- 原问题：他为什么一会儿热一会儿冷？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0021｜love｜third_party_mind_reading｜risk=medium
- 原问题：她是不是在试探我？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0022｜love｜third_party_mind_reading｜risk=medium
- 原问题：他到底认真不认真？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0023｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是只想暧昧？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0024｜love｜third_party_mind_reading｜risk=medium
- 原问题：对方现在心里有我吗？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0025｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是怕承诺？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0026｜love｜third_party_mind_reading｜risk=medium
- 原问题：她对我有没有好感？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0027｜love｜third_party_mind_reading｜risk=medium
- 原问题：他还会想起我吗？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0028｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是在等我主动？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0029｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是还在关注我？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0030｜love｜third_party_mind_reading｜risk=medium
- 原问题：她是不是觉得我烦？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0031｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是觉得我没价值？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0032｜love｜third_party_mind_reading｜risk=medium
- 原问题：他是不是在比较我和别人？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0033｜love｜third_party_mind_reading｜risk=medium
- 原问题：他不回消息是不是说明没戏？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0034｜love｜third_party_mind_reading｜risk=medium
- 原问题：他点赞朋友圈是什么意思？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0035｜love｜third_party_mind_reading｜risk=medium
- 原问题：他突然出现是什么意思？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0036｜love｜third_party_mind_reading｜risk=medium
- 原问题：他突然消失是什么意思？
- 改写：我该如何理解目前这段关系里的互动信号，以及我能做什么？
- 推荐牌阵：three_self_relation_other
- 动作：rewrite_then_read
- 禁止：断言对方真实想法；断言对方一定爱或不爱；断言对方会不会主动；制造等待依赖

### qt_0037｜love｜relationship_trend｜risk=medium
- 原问题：我们还有机会吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0038｜love｜relationship_trend｜risk=medium
- 原问题：我们会复合吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0039｜love｜relationship_trend｜risk=medium
- 原问题：这段关系还有救吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0040｜love｜fate_based_relationship｜risk=medium
- 原问题：我们最后会在一起吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0041｜love｜relationship_trend｜risk=medium
- 原问题：这段暧昧会有结果吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0042｜love｜fate_based_relationship｜risk=medium
- 原问题：我们会不会走到最后？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0043｜love｜relationship_trend｜risk=medium
- 原问题：我和前任还有缘分吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0044｜love｜relationship_trend｜risk=medium
- 原问题：他还会回来找我吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0045｜love｜relationship_trend｜risk=medium
- 原问题：我们会不会重新联系？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0046｜love｜relationship_trend｜risk=medium
- 原问题：冷战之后还能和好吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0047｜love｜relationship_trend｜risk=medium
- 原问题：分手后还有可能吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0048｜love｜relationship_trend｜risk=medium
- 原问题：断联之后还有机会吗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0049｜love｜relationship_trend｜risk=medium
- 原问题：这段关系是不是已经结束了？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0050｜love｜relationship_trend｜risk=medium
- 原问题：我们之间是不是没戏了？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0051｜love｜relationship_trend｜risk=medium
- 原问题：这段关系未来趋势怎么样？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0052｜love｜relationship_trend｜risk=medium
- 原问题：他会不会回头？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0053｜love｜fate_based_relationship｜risk=medium
- 原问题：我和他会不会结婚？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0054｜love｜fate_based_relationship｜risk=medium
- 原问题：我们是不是正缘？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0055｜love｜fate_based_relationship｜risk=medium
- 原问题：这段感情是不是命中注定？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0056｜love｜fate_based_relationship｜risk=medium
- 原问题：他是不是我的灵魂伴侣？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0057｜love｜relationship_trend｜risk=medium
- 原问题：我们还有没有未来？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0058｜love｜relationship_trend｜risk=medium
- 原问题：我们会不会错过？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0059｜love｜fate_based_relationship｜risk=medium
- 原问题：这段关系是不是孽缘？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0060｜love｜relationship_trend｜risk=medium
- 原问题：我们是不是互相消耗？
- 改写：如果维持当前互动模式，这段关系更可能往哪里走？我可以调整什么？
- 推荐牌阵：love_5
- 动作：rewrite_then_read
- 禁止：承诺复合/结婚；说注定/正缘锁死；制造等待；断言对方未来行为

### qt_0061｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要主动找他？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0062｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要给他发消息？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0063｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要表白？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0064｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要问清楚关系？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0065｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要继续等他？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0066｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要放下他？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0067｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要删掉他？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0068｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要拉黑他？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0069｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要见他一面？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0070｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要接受复合？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0071｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要给前任机会？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0072｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要停止联系？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0073｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要继续暧昧？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0074｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要冷处理？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0075｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要把话说开？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0076｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要装作不在意？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0077｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要追她？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0078｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要退一步？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0079｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要把礼物送出去？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0080｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要道歉？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0081｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要主动约他？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0082｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要撤回消息？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0083｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要发小作文？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0084｜love｜relationship_action_decision｜risk=medium
- 原问题：我要不要保持距离？
- 改写：这个行动和不行动分别有什么代价？我怎样做更能保护自己的边界？
- 推荐牌阵：three_option_a_b_advice
- 动作：compare_options
- 禁止：保证对方反应；鼓励纠缠；替用户决定；羞辱用户主动

### qt_0085｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我总是在关系里焦虑？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0086｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我总喜欢冷淡的人？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0087｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我总是想很多？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0088｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我总是忍不住查他动态？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0089｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我会这么依赖他？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0090｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我总是怕被抛弃？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0091｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我一恋爱就不像自己？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0092｜love｜relationship_self_pattern｜risk=low
- 原问题：为什么我总想证明自己值得被爱？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0093｜love｜relationship_self_pattern｜risk=low
- 原问题：我是不是太主动了？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0094｜love｜relationship_self_pattern｜risk=low
- 原问题：我是不是太卑微了？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0095｜love｜relationship_self_pattern｜risk=low
- 原问题：我在这段关系里哪里失衡了？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0096｜love｜relationship_self_pattern｜risk=low
- 原问题：我为什么总吸引不稳定的人？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0097｜love｜relationship_self_pattern｜risk=low
- 原问题：我该怎么建立边界？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0098｜love｜relationship_self_pattern｜risk=low
- 原问题：我为什么明知道不好还放不下？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0099｜love｜relationship_self_pattern｜risk=low
- 原问题：我为什么总是被暧昧困住？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0100｜love｜relationship_self_pattern｜risk=low
- 原问题：我是不是太恋爱脑？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0101｜love｜relationship_self_pattern｜risk=low
- 原问题：我为什么总被关系牵着走？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0102｜love｜relationship_self_pattern｜risk=low
- 原问题：我为什么总是先低头？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0103｜love｜relationship_self_pattern｜risk=low
- 原问题：我为什么会反复想他？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0104｜love｜relationship_self_pattern｜risk=low
- 原问题：我为什么很怕对方离开？
- 改写：我在关系里反复出现的感受、需求和边界模式是什么？
- 推荐牌阵：self_exploration_5
- 动作：rewrite_then_read
- 禁止：给心理诊断；羞辱用户恋爱脑；把问题全归咎用户；断言人格缺陷

### qt_0105｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他有没有和别人睡？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0106｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他是不是出轨了？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0107｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：她是不是有新欢了？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0108｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他手机里有什么秘密？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0109｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他和那个女生到底什么关系？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0110｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他是不是脚踏两条船？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0111｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他是不是在骗我感情？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0112｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他现在是不是和别人暧昧？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0113｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他老婆现在怎么想？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0114｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：她男朋友知不知道我们的事？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0115｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他有没有背着我见别人？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0116｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他是不是在外面乱来？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0117｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他是不是有备胎？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0118｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他是不是同时聊很多人？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0119｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：她是不是把我当备选？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

### qt_0120｜privacy_safety｜third_party_privacy_or_cheating｜risk=high
- 原问题：他有没有隐瞒什么？
- 改写：我该如何面对这段关系里的不安、信任和边界问题？
- 推荐牌阵：no_spread_safety_redirect
- 动作：privacy_rewrite
- 禁止：窥探隐私；断言出轨；描述第三方亲密细节；激化报复

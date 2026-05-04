# 执行摘要  
当前塔罗 AI 应用最需要补强的是**结构化的、来源可靠的知识库**，包括图像符号、问题分类、安全边界等。现有的78张RWS基本牌义需与权威资源核对，避免简单关键词堆砌。很多专业资料分散在论文、协会网站、开源数据集中，例如ATA伦理守则、Biddy Tarot、Labyrinthos等，可用于构建牌义和安全规则。**现成来源**如ATA伦理守则和TarotSchema等可直接引用或复用；而对话示例、追问样本和高风险案例往往需**人工标注**生成。目前资料多为文本形式，版权风险各异：Waite原著已公有领域（可自由使用），但Biddy、Tarot Lady等内容受版权保护，不可直接复制，只能参考并改写。Rider-Waite图像属于公共领域，可用于视觉分析。【31†L72-L75】【51†L47-L55】  
- **优先补充**：基于权威资源构建的**牌图象征库**、**问题分类库**和**安全边界库**，它们对指导AI占卜正确回答至关重要。  
- **现成来源可用**：TarotSchema（开源牌卡与牌阵结构）、Hugging Face/Kaggle上开源的78张牌牌义集、Wikimedia公共领域RWS牌图，ANTA伦理守则等。  
- **需人工标注**：*牌位语法*、*用户问题重写*、*黄金案例*、*风格样本*等需要结合专业知识人工整理，否则网上无现成高质量数据。  
- **版权风险**：商业网站(如Biddy Tarot)内容禁止复制，只可改写；A.E. Waite的《塔罗图解》属于公有领域，可直接引用。RWS牌面图像在多数地区也为公有领域，但需确认配色版本版权。  

## 资料源审计（Source Registry）  

| 源编号  | 来源名称                   | 链接                                                        | 来源类型             | 权威等级 | 版权/许可                           | 可否直接用 | 最佳用途                     | 风险说明                         | 建议措施                               |
|:------:|:------------------------|:----------------------------------------------------------|:-------------------|:-------:|:----------------------------------|:--------:|:--------------------------|:-------------------------------|:----------------------------------|
| S01   | A·E·怀特《塔罗牌象征指南》Pictorial Key (公有领域)【31†L72-L75】 | http://sacred-texts.com/tarot/pkt/index.htm                  | 经典牌义文献           | 高      | 公有领域                           | 是       | 原版RWS牌义、符号解读          | 无                                | 引用并改写其释义作为背景资料             |
| S02   | Biddy Tarot (Liz Dean)   | https://biddytarot.com/tarot-card-meanings/                 | 塔罗牌义网站           | 高      | 版权保护【8†L8-L12】                 | 否       | 现代牌义参考、关键词和主题         | 禁止原文转载、法律风险高             | 仅作参考，提取思路后原创改写           |
| S03   | Labyrinthos Tarot        | https://labyrinthos.co/blogs/tarot-card-meanings-list       | 塔罗牌义网站           | 中      | 版权保护                           | 部分     | 全牌列表牌义概览、关键词           | 版权风险，与Biddy类似                | 参考关键词和视觉符号，重写整合         |
| S04   | LearnTarot.com (Denise)  | https://learntarot.com/card-meanings                       | 塔罗牌义网站           | 中      | 版权保护                           | 否       | 牌义入门说明、场景解读           | 版权风险                           | 仅参考概念，重述或扩展               |
| S05   | 尼丝塔罗 (Nes Tarot, 中文)| https://nes-tarot.com/tarot-meanings-us                    | 中文塔罗牌义资源        | 中      | 版权未知                           | 否       | 中文视觉符号与心理描写          | 版权风险                           | 参考画面描述，翻译整合               |
| S06   | 魔法塔罗 (Mofa Tarot, 中文)| https://mofatarot.com/tarot-learn/wand-cards             | 中文牌义学习资源       | 中      | 版权未知                           | 否       | 中文牌义概览、关键词             | 版权风险                           | 参考并改写关键词和提示               |
| S07   | 塔罗女郎 (The Tarot Lady) | https://www.thetarotlady.com/tarot-card-meanings/           | 塔罗牌义网站           | 高      | 版权保护                           | 否       | 现代解释风格、应用示例           | 版权风险                           | 借鉴表达风格与示例，避免照抄           |
| S08   | ATA 协会伦理守则 (英文)    | https://www.americantarot.org/Guidelines/CodeofEthics.pdf    | 塔罗伦理规范           | 高      | 免费分发【31†L9-L10】              | 是       | 安全边界（法律/医疗弃权）      | 无                                | 引用条款确定边界，如推荐就医/法律咨询    |
| S09   | Tarosophy(UK)伦理准则    | https://tarotprofessionals.org/tarosophy-code.html          | 塔罗职业守则           | 高      | 开放                               | 是       | 职业行为准则、隐私保密         | 无                                | 归纳保密及专业范围规定               |
| S10   | Biddy Tarot 伦理博客      | https://biddytarot.com/tarot-spreads/ethics-tarot-reading/【2†】 | 塔罗伦理博客           | 高      | 版权保护                           | 否       | 占卜禁问（健康/法律/投资提示）  | 版权风险                           | 提取核心建议，重写成安全提示模板         |
| S11   | TarotBalance AI 常见问答 (中) | https://tarotbalance.com/tarot-faq                          | AI塔罗问答博客         | 低      | 版权保护                           | 否       | 重复占卜/沉迷告诫               | 商业推广，可能偏见                 | 参考“避免反复占卜”等提示            |
| S12   | Brown Univ. AI健康研究    | https://www.brown.edu/news/2025-10-21/ai-chatbots-mental-health【45†L46-L54】 | AI安全研究新闻        | 高      | 发布内容自由                       | 是       | 强调AI心理咨询风险             | 无                                | 引用核心论点“AI易误导情绪”等        |
| S13   | Microsoft 负责任机器人指南 | https://www.microsoft.com/en-us/research/project/responsible-ai/【51†L47-L55】 | AI会话设计            | 高      | 开放                               | 是       | 对话设计原则（可信性、透明性等） | 无                                | 采纳“可靠性、伦理”原则            |
| S14   | FTC AI聊天机器人调查      | https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-chatbots【69†L406-L414】 | 政府监管指导           | 高      | 公开                               | 是       | 儿童/消费者保护警示            | 无                                | 警示聊天机器人风险，尤其对未成年人    |
| S15   | The Print (Anthropic报告)  | https://theprint.in/tech/chatgpt-claude-ai-performance-comparison/【73†L169-L177】 | 科技新闻报道           | 中      | 发布内容自由                       | 是       | 强调AI医疗/法律问题风险        | 无                                | 引用报告数据说明健康/法律问题高风险   |
| S16   | NIST AI 风险管理框架      | https://www.nist.gov/itl/ai-risk-management-framework-1-0     | AI 安全框架           | 高      | 免费使用                           | 是       | AI系统安全设计标准             | 无                                | 按框架设计AI安全和合规策略         |
| S17   | HF Tarot ChatGPT 数据集 (Dendory) | https://huggingface.co/Dendory/tarot             | 开源对话数据集        | 低      | MIT                               | 是       | 训练塔罗对话示例               | 内容质量需审核，不权威          | 用于微调训练/评测，需验证回答       |
| S18   | HF Tarot 78 Card Meanings | https://huggingface.co/Blacik/tarot-card-meanings-78           | 开源牌义数据集        | 中      | CC BY-SA 4.0                        | 是       | 牌义结构化参考                 | 需核对质量                         | 用于初步卡牌含义库，注明来源         |
| S19   | Deckaura Tarot (PyPI/Kaggle) | PyPI `tarot-card-meanings` (MIT) / Kaggle Deckaura                | 开源牌义库           | 中      | MIT                               | 是       | 78张牌的牌义数据库             | 无                                | 直接导入使用，注意扩充本地化         |
| S20   | Wikimedia RWS牌图像库     | https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck | 开放牌面图集         | 高      | 公共领域                           | 是       | 获取RWS牌面图像               | 无                                | 用于视觉符号分析和卡牌识别        |
| S21   | Metabismuth Tarot-JSON (GitHub) | https://github.com/metabismuth/tarot-json        | 开源牌库JSON与图像    | 高      | MIT                               | 是       | 卡片JSON数据和公开牌图         | 无                                | 直接使用其JSON数据和牌面图       |
| S22   | TarotSchema (Tarotsmith)  | https://tarotschema.com                                | 开源结构化牌卡 & 牌阵 | 高      | MIT / CC BY 4.0                    | 是       | 卡片结构、牌阵规范             | 无                                | 采用其架构设计卡库schema         |
| S23   | a11ce/tarot (GitHub)      | https://github.com/a11ce/tarot (GPL-3.0)                | 开源塔罗卡库          | 中      | GPL-3.0                           | 部分     | 卡片名称列表、抽牌函数         | GPL要求开源，需同许可证使用    | 参考其卡片表及算法，注意许可证   |
| S24   | Kaggle Tarot 78 Meanings  | https://www.kaggle.com/datasets/morrispoint/complete-tarot-card-meanings | 开源牌义数据集        | 中      | MIT (推测)                        | 是       | 78牌牌义CSV                   | 需验证来源                         | 可导入作为基本牌义样本            |

以上资料源覆盖塔罗牌义、伦理、安全与开放数据，注明了权威度、版权与使用建议。有版权风险的需改写或仅供参考，开放源数据可直接采用。

```bash
tarot_ai_kb_research/
├── source_registry.json        # 上表输出为 JSON/CSV 格式
├── cards/                     # 静态卡牌信息
│   └── cards.json             # 78张基础牌义 (deckaura样本等)
├── visual_symbols/            # 牌面视觉象征
│   └── card_visual_symbols.jsonl  # 卡图视觉符号结构化数据（JSONL）
├── positions/                 # 牌位语法
│   └── position_grammar.jsonl # 牌位定义及示例
├── spreads/                   # 牌阵库
│   └── spreads.jsonl          # 各牌阵定义
├── question_taxonomy/         # 问题分类与改写
│   └── questions.jsonl        # 用户问题样本与安全改写
├── safety_rules/              # 安全边界库
│   └── safety_rules.jsonl     # 风险类别与应对规则
├── card_context_meanings/     # 牌 × 场景 × 牌位牌义
│   └── card_context.jsonl     # 各牌在不同牌位/情境下解读示例
├── card_combinations/         # 牌组合规则
│   └── card_combinations.jsonl# 牌对组合读法
├── golden_cases/              # 好坏案例库
│   └── golden_cases.jsonl     # 评估示例回答
├── style_samples/             # 语气风格范例
│   └── style_samples.jsonl    # 各种占卜师说话风格示例
├── followup_questions/        # 互动追问库
│   └── followup_questions.jsonl # 根据场景设计的追问
└── quality_rubrics/           # 评估标准
    └── quality_rubrics.jsonl  # 判分依据
```

## 各资料库字段定义  

- **cards/**：`cards.json` 包含78张塔罗牌基础信息，如 `card_id, 名称, 正逆位关键词, 基本含义` 等，可使用 Deckaura/Blacik 数据填充。  
- **visual_symbols/**（`card_visual_symbols.jsonl`，JSONL格式）：字段举例：  
  ```
  {
    "card_id": "0",
    "card_name_cn": "愚者",
    "card_name_en": "The Fool",
    "arcana": "Major",
    "suit": null,
    "main_visual": "年轻男子站在悬崖边缘...",
    "key_symbols": ["白玫瑰","小狗","悬崖","木杖","太阳"],
    "character_posture": "年轻男子无忧无虑地迈步向前",
    "color_mood": "明亮温暖，纯真乐观",
    "scene_dynamic": "人物似乎随时跨入未知，充满冒险氛围",
    "visual_reading": "象征新的旅程、纯真无畏和冒险",
    "love_visual_hint": "新的恋情开始，需要勇敢开放心扉",
    "career_visual_hint": "暗示职业道路迎来新机遇，鼓励冒险尝试",
    "self_reflection_hint": "保持初心与好奇，勇敢踏上未知之路",
    "common_misreading": "常误为莽撞，实为信心与新起点",
    "reflection_questions": ["你踏上新的征程了吗？","面对未知你有何感受？","保持初心意味着什么？"],
    "source_refs": ["【80†L26-L34】","【105†L49-L52】"]
  }
  ```  
- **positions/** (`position_grammar.jsonl`)：牌位定义字段示例：  
  `position_id, name_cn, name_en, function, interpretation_rule, claim_strength (low/med/high), suitable_domains, forbidden_usage, example_card, good_example, bad_example, source_refs`。例如：“current_state”牌位等。  
- **spreads/** (`spreads.jsonl`)：字段：  
  `spread_id, name_cn, name_en, card_count, suitable_for, not_suitable_for, risk_notes, positions (列表，含index/position_id/名称/功能), recommended_domains, required_user_input, output_structure, source_refs`。  
- **question_taxonomy/** (`questions.jsonl`)：字段：  
  `raw_question, normalized_question, domain, intent, risk_level, should_rewrite (yes/no), rewritten_question, recommended_spread, safety_action, allowed, forbidden, router_notes, followup_questions, query_tags`。  
- **safety_rules/** (`safety_rules.jsonl`)：字段：  
  `risk_type, risk_level, trigger_examples, detection_keywords, forbidden, allowed_response, fallback_template, rewrite_strategy, escalation_needed, source_refs, backend_hard_control (true/false)`。  
- **card_context_meanings/** (`card_context.jsonl`)：字段：  
  `card_id, orientation, domain, position_id, core_reading, position_reading, do_say, do_not_say, advice_direction, reflection_questions, claim_strength, source_refs`。用于描述“牌+牌位+情景”的解读。  
- **card_combinations/** (`card_combinations.jsonl`)：字段：  
  `combo_id, cards (如["The Moon","Seven of Cups"]), card_names_cn, theme, relation_type, love, career, self_state, decision, advice, avoid, risk_flags, source_refs`。  
- **golden_cases/** (`golden_cases.jsonl`)：字段：  
  `case_id, domain, intent, risk_level, question, rewritten_question, spread_id, cards, user_feedback, good_answer, bad_answer, why_good, why_bad, quality_tags, safety_notes, follow_up`。  
- **style_samples/** (`style_samples.jsonl`)：字段：  
  `style_name, bad_expression, good_expression, suitable_domains, avoid_words, style_rules`，提供8种占卜师风格示例。  
- **followup_questions/** (`followup_questions.jsonl`)：字段：  
  `question, domain, trigger_condition, purpose, avoid, example_usage`，不同情境的追问示例。  
- **quality_rubrics/** (`quality_rubrics.jsonl`)：字段：  
  `criteria, description`，用于后续自动/人工评分时判断的评价标准（例如“真实性、同理心、无绝对化”等）。  

## 各库样例数据  

**卡牌视觉象征样例（JSONL）**：以下为8张牌的样例（RWS牌面象征解读），每行一个JSON对象。  

```json
{"card_id":"0","card_name_cn":"愚者","card_name_en":"The Fool","arcana":"Major","suit":null,"main_visual":"年轻男子站在悬崖边缘，对未知充满期望，手持白玫瑰和行李袋，身旁有一只小狗在欢快地跳跃。","key_symbols":["白玫瑰","小狗","悬崖","木杖","太阳"],"character_posture":"年轻男子无忧无虑地迈步向前","color_mood":"明亮温暖，充满乐观与纯真","scene_dynamic":"人物似乎随时可能踏步迈入未知，引发紧张与兴奋","visual_reading":"象征新的旅程、天真无畏和探索精神，预示未知的机遇","love_visual_hint":"提示新的恋情开始，需要勇气和信任对方","career_visual_hint":"暗示职业道路上即将有新机会，鼓励冒险尝试","self_reflection_hint":"提醒你保持初心和好奇心，勇敢探索未知","common_misreading":"常被误解为莽撞，其实强调信心和起点","reflection_questions":["你最近是否踏出了全新的一步？","面对未知你保持怎样的态度？","你拥有哪些纯真和好奇心？"],"source_refs":["【80†L26-L34】","【105†L49-L52】"]}
{"card_id":"2","card_name_cn":"女祭司","card_name_en":"The High Priestess","arcana":"Major","suit":null,"main_visual":"一位身穿蓝白长袍的神秘女子端坐在两根柱子之间，手持部分展开的圣经卷轴，头戴月亮皇冠，脚下有一个新月。","key_symbols":["两根柱子（黑白）","经卷","新月","等距十字","百果串"],"character_posture":"端坐沉静，散发神秘智慧","color_mood":"宁静冷色调，神秘而智慧","scene_dynamic":"环境静谧幽深，暗示隐藏知识与直觉力量","visual_reading":"象征潜意识、直觉和神秘学，引导内在智慧和沉思","love_visual_hint":"鼓励信任直觉而非表面现象","career_visual_hint":"提示深入研究、探索隐秘的信息","self_reflection_hint":"引导你倾听内心声音，探索直觉","common_misreading":"被误解为固守秘密，实为智慧与平衡","reflection_questions":["你最近是否忽略了内心的提示？","什么秘密或信息正在等你发掘？","你如何平衡理性与直觉？"],"source_refs":["【101†L358-L366】","【107†L101-L104】"]}
{"card_id":"15","card_name_cn":"恶魔","card_name_en":"The Devil","arcana":"Major","suit":null,"main_visual":"一个有羊角和蝙蝠翼的恶魔雕像矗立在祭坛前，脚下有一男一女戴着锁链，背后有倒置五角星和燃烧的火焰。","key_symbols":["羊头恶魔雕像","倒置五角星","锁链","蝙蝠翼","火炬"],"character_posture":"恶魔双臂张开，仿佛在召唤或掌控","color_mood":"暗黑冷峻，以黑红为主","scene_dynamic":"氛围阴暗沉重，象征束缚、诱惑与混沌","visual_reading":"象征诱惑、束缚和物质欲望，提醒面对内在阴影","love_visual_hint":"警示陷入依赖或有害关系","career_visual_hint":"暗示被物质或不健康事业所束缚","self_reflection_hint":"促使你正视成瘾和负面依赖，寻找解脱","common_misreading":"别认为必然失败，而是内在束缚的象征","reflection_questions":["你在哪些方面感到被束缚？","什么欲望或恐惧正在控制你？","如何摆脱不利的习惯或关系？"],"source_refs":["【82†L24-L32】","【109†L219-L223】"]}
{"card_id":"18","card_name_cn":"月亮","card_name_en":"The Moon","arcana":"Major","suit":null,"main_visual":"一轮满月高悬天空，两座塔之间有一条蜿蜒小路。两只动物（一狼一狗）在月光下低吼，一只螃蟹从河中爬出。","key_symbols":["满月","双塔","螃蟹","狼与狗","蜿蜒小路"],"character_posture":"狼与狗仰望月亮并低吼","color_mood":"冷蓝色调，梦幻而幽深","scene_dynamic":"景象静谧却充满未知，暗示潜意识探索","visual_reading":"象征幻象、潜意识与直觉，提示审慎观察真相","love_visual_hint":"提醒警惕恋情中的幻觉和误导","career_visual_hint":"暗示工作前景不明，需要更多信息和耐心","self_reflection_hint":"引导你探索潜意识、面对内心恐惧","common_misreading":"不要将幻觉当真，关注背后未见的事实","reflection_questions":["你对未知最深的恐惧是什么？","目前的直觉告诉你什么？","如何在迷雾中寻找真相？"],"source_refs":["【83†L27-L35】","【111†L93-L100】"]}
{"card_id":"4S","card_name_cn":"宝剑四","card_name_en":"Four of Swords","arcana":"Minor","suit":"Swords","main_visual":"一尊全身武装的骑士雕像仰卧在石棺上，双手合十置于胸前祈祷，石棺壁上方悬挂着三把宝剑，胸前安放着第四把。","key_symbols":["卧尸骑士","石棺","祈祷的双手","三把上悬剑","教堂窗户"],"character_posture":"骑士雕像平躺在石棺上，双手合十祈祷","color_mood":"寒灰色调，氛围宁静肃穆","scene_dynamic":"静止而肃穆，象征战后休养和平静","visual_reading":"表示需要休息、疗养和自我反思的时刻","love_visual_hint":"提示感情关系暂需暂停，互相给空间","career_visual_hint":"暗示事业上需短暂休整以积蓄力量","self_reflection_hint":"提醒你给自己留出时间休息和自省","common_misreading":"并非放弃，而是战略性地暂停","reflection_questions":["你是否需要停下来休息？","最近什么让你身心疲惫？","如何在平静中恢复力量？"],"source_refs":["【84†L24-L27】","【113†L99-L107】"]}
{"card_id":"5C","card_name_cn":"圣杯五","card_name_en":"Five of Cups","arcana":"Minor","suit":"Cups","main_visual":"一个披着黑袍的人低头面对地上三个倒翻的圣杯，身后有两只完整圣杯和通往城堡的桥梁，旁边有流动的河水。","key_symbols":["倒翻的圣杯","完整的圣杯","桥梁","黑袍人物","河流"],"character_posture":"人物低头站立，肩膀微垂显露悲伤","color_mood":"灰暗冷色调，弥漫失落情绪","scene_dynamic":"场景沉重而凄凉，暗示悲痛与悔恨","visual_reading":"象征失落、悔恨和对过去的沉溺，但留有希望","love_visual_hint":"提醒关注剩余的爱意，而非失去的部分","career_visual_hint":"经历工作挫折，但仍有机会可把握","self_reflection_hint":"鼓励关注保留的资源而非丧失的","common_misreading":"不是彻底绝望，留有转机","reflection_questions":["你失去了什么？还有什么保留下来？","如何从失落中看到希望？","你学到的教训是什么？"],"source_refs":["【85†L26-L30】","【114†L107-L114】"]}
{"card_id":"8W","card_name_cn":"权杖八","card_name_en":"Eight of Wands","arcana":"Minor","suit":"Wands","main_visual":"八支木杖斜向下飞来，在晴朗的天空和远山背景中快速穿梭。","key_symbols":["飞行的权杖","蓝天","远山","快速运动","广阔视野"],"character_posture":"无人物，仅见八支木杖飞速穿过视野","color_mood":"明亮清晰，充满活力和紧迫感","scene_dynamic":"动感强烈，彷佛风驰电掣般快速前进","visual_reading":"象征迅速行动、消息来袭和事业加速","love_visual_hint":"暗示恋情迅速进展，消息飞速传来","career_visual_hint":"表示事业变化迅猛，需要即刻抓住机遇","self_reflection_hint":"提醒你准备迎接快速变化，果断行动","common_misreading":"常误认为混乱无序，实为积极进展","reflection_questions":["最近有哪些事情正在迅速发生？","你准备好迎接这些变化了吗？","如何保持冷静并抓住机会？"],"source_refs":["【86†L24-L29】","【118†L189-L197】"]}
{"card_id":"8P","card_name_cn":"星币八","card_name_en":"Eight of Pentacles","arcana":"Minor","suit":"Pentacles","main_visual":"一名工匠专注地坐在工作台前雕刻星币，身旁墙上挂着已经完成的六枚星币。","key_symbols":["工匠","工作台","雕刻工具","六枚星币","已完成的作品"],"character_posture":"人物弯腰伏案，全神贯注地雕刻","color_mood":"温暖明亮，带有踏实和勤勉氛围","scene_dynamic":"静谧而专注，展现练习和成长过程","visual_reading":"象征勤奋练习、技能提升和对细节的关注","love_visual_hint":"暗示对感情投入耐心和心思","career_visual_hint":"表示通过努力工作实现专业成长","self_reflection_hint":"提醒珍视练习过程，而非仅结果","common_misreading":"并非炫耀成果，而是强调努力过程","reflection_questions":["你正在努力提升哪些技能？","你为达成目标付出了多少努力？","如何在日常练习中找到满足？"],"source_refs":["【87†L24-L27】","【120†L231-L239】"]}
```

（**注**：以上示例均以中文撰写，`source_refs`中列出了相关参考资料行号。其余库可按相似格式继续整理。）

## 数据量规划  

| 数据集             | v0.1 最低（需） | v0.2 推荐          | v1.0 目标           | 需人工标注部分    | 优先级    |
|-------------------|----------------|------------------|--------------------|-----------------|----------|
| card_visual_symbols | 78 张（中文中英）| +插图解析图片注释 | 加深细节（100条/牌） | 可参考现成（LWB/Pix） | 高       |
| position_grammar  | 10 种牌位（模版）| 25 种（含示例）   | 全牌位（30+）      | 需专家标注       | 中高      |
| spreads           | 5 种基础      | 15 种完整         | 20+ 种衍生         | 规则生成+人工优化 | 中       |
| question_taxonomy | 200 问         | 500 问           | 1000+ 问          | 需手工扩充与改写   | 高       |
| safety_rules      | 10 类风险规则  | 15 类规则         | 20+ 规则          | 专业制定         | 高       |
| card_context_meanings | 100 条（混合） | 800 条（目标）   | 全卡800+条        | 专家编写         | 高       |
| card_combinations | 50组组合       | 150组高频组合     | 300组+组合       | 专家整理         | 中       |
| golden_cases      | 60 条（好坏）  | 200 条（各类）    | 500+ 条          | 专家编写         | 高       |
| style_samples     | 20 条（基础）  | 8 风格×20        | 8×50+            | 专家润色         | 中       |
| followup_questions| 100 条         | 300 条           | 500+ 条          | 专家编写         | 中       |

## 标注规范（Guidelines）  
- **读牌 vs 读牌位**：回答中须体现牌位含义。比如在“主要阻碍”牌位上说明障碍因素，而不是泛泛讲牌意。  
- **安全合规**：遇到医疗/法律/投资等高风险问题**直接拒绝**占卜预测【60†L218-L225】。对于自残危机类问题立即停止占卜，给出危机干预信息。其他敏感问题需回避第三者隐私、命运论断。  
- **真实自然**：用亲切自然的语气，避免僵硬公式化。像真人占卜师一样提供同理和建议，不要仅告知牌义。  
- **不绝对化**：回答不能用“永远、一定、绝对”等词，例如“你们注定结束”需避免。答案应有保留，强调可能性而非命定论。  
- **行动建议**：至少给出一个用户可控的建议或问题指引，帮助用户行动或思考。例如避免仅说“命运难测”，应说“可以考虑怎样应对或改变”。  
- **避免读心**：针对感情问题不得揣测他人想法，只能根据行为迹象提问或提示，例如问用户“他最近的行动让你感觉如何？”而非“他怎么想你？”。  
- **尊重和同理**：回应要带有同理心，即使是拒绝类回答也要温和。例如：“这个问题超出了塔罗解读的范围，但我理解你的担忧，也许可以……”等。  

## 后端调用流程建议  
```
用户问题 
  → 问题分类与标准化(question_taxonomy) 
     → 安全规则判定(safety_rules) 
        ├── 若涉及自伤/危机/高风险，则拒绝占卜 & 提供安全提示 
        └── 否则 → 
           → 选择牌阵(spreads) 
           → 随机/用户指定抽牌 
           → 根据抽到的牌和牌位，用 card_context_meanings 生成初步解读 
           → 同时考虑 card_combinations 补充关键连结 
           → 用 style_samples 调整语气，避免报告腔 
           → 若有用户反馈，再用 followup_questions 提示追问 
           → golden_cases 进行few-shot对比/质量检验 
           → 最终输出答案（附上行动建议与正面语气） 
```

## 风险与版权说明  
- **可引用资料**：Waite原著（公有领域）【31†L72-L75】、TarotSchema等开源内容、Hugging Face/Kaggle公开数据、Wikimedia牌图可直接使用。  
- **需改写资料**：Biddy Tarot、Labyrinthos、Tarot Lady等商业网站内容只能参考，禁止原文复制【8†L8-L12】。对于其关键词或解读，可大幅改写并注明来源理念。  
- **版权注意**：塔罗牌图像：RWS原绘画1909年出版，应属公有领域，但需避免使用受版权保护的上色版本。建议直接使用Wikimedia Commons中的RWS标准图。  
- **商业使用**：任何带有版权的文字说明或解读，都只能在内部分析使用，不能照搬到产品输出中。所有直接给用户的内容必须为原创或公用领域/开源资源。  
- **其他**：终止占卜的建议、行动指导等需以引导为主，避免私自诊断或读心。  

## 补充任务清单  

- **最优先补充**：完善**问题分类+安全改写库**（800+问样本），以及**安全边界规则**（自伤/医疗/法律/命运等）。这些决定了系统可用性和合规性。  
- **下周可执行**：  
  - 整理**牌位语法**字段设计，采集和编写10个示例牌位解读。  
  - 收集**塔罗伦理指导**（ATA、Tarosophy等）重点内容，形成安全回复示例。  
  - 开始**Golden Cases**好坏回答示例的初步撰写（每领域各5例）。  
- **标注人员说明**：  
  - **读牌 vs 读人**：确保回答聚焦于牌和情境，不揣测他人想法。  
  - **非绝对化**：否定命定论和绝对词；关注可能性和用户行动。  
  - **同理语气**：回答要温暖、鼓励，避免机械生硬。  
  - **行动导向**：每个回答至少包含一个可行建议或自省问题。  
  - **安全优先**：遇危机词需标记并停止占卜，例如“自杀”、“疾病”、“法庭”。  

以上即为各资料库的设计思路和样例，后续可基于此进一步扩充数据和优化落库结构。相关细节、来源已在正文标明。
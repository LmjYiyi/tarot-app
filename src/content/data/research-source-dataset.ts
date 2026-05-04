export type SourceAuthority = "high" | "medium" | "low";

export type SourceUsePolicy =
  | "direct_use"
  | "reference_rewrite"
  | "metadata_only"
  | "verify_before_use";

export type DatasetKey =
  | "source_registry"
  | "card_visual_symbols"
  | "position_grammar"
  | "spreads"
  | "question_taxonomy"
  | "safety_rules"
  | "card_context_meanings"
  | "card_combinations"
  | "golden_cases"
  | "style_samples"
  | "followup_questions"
  | "quality_rubrics";

export type ResearchSource = {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  authority: SourceAuthority;
  licenseNote: string;
  usePolicy: SourceUsePolicy;
  bestFor: DatasetKey[];
  riskNote: string;
  action: string;
};

export type DatasetBlueprint = {
  key: DatasetKey;
  fileName: string;
  priority: "high" | "medium_high" | "medium";
  v01Target: string;
  v02Target: string;
  v10Target: string;
  needsHumanAnnotation: boolean;
  sourceIds: string[];
  fields: string[];
  runtimeUse: string;
};

export type VisualSymbolSeed = {
  cardSlug: string;
  cardNameZh: string;
  cardNameEn: string;
  arcana: "major" | "minor";
  suit: "cups" | "pentacles" | "swords" | "wands" | null;
  keySymbols: string[];
  visualReading: string;
  domainHints: {
    love: string;
    career: string;
    self: string;
  };
  commonMisreading: string;
  reflectionQuestions: string[];
  sourceIds: string[];
};

export type SafetyRuleSeed = {
  id: string;
  riskType: string;
  riskLevel: "blocked" | "boundary" | "caution";
  detectionKeywords: string[];
  forbidden: string[];
  allowedResponse: string[];
  rewriteStrategy: string;
  backendHardControl: boolean;
  sourceIds: string[];
};

export type PositionGrammarSeed = {
  id: string;
  nameZh: string;
  function: string;
  interpretationRule: string;
  claimStrength: "low" | "medium" | "high";
  suitableDomains: string[];
  forbiddenUsage: string[];
};

export type CollectedDatasetFile = {
  key:
    | "verified_source_registry"
    | "waite_pictorial_key_cards"
    | "metabismuth_tarot_json"
    | "tarotschema_schema"
    | "wikimedia_rws_images"
    | "deckaura_pypi_metadata"
    | "derived_safety_rules"
    | "manifest";
  path: string;
  sourceIds: string[];
  reusableInProduct: boolean;
  notes: string;
};

export const researchSources: ResearchSource[] = [
  {
    id: "S01",
    name: "A.E. Waite: The Pictorial Key to the Tarot",
    url: "http://sacred-texts.com/tarot/pkt/index.htm",
    sourceType: "经典牌义文献",
    authority: "high",
    licenseNote: "公有领域",
    usePolicy: "direct_use",
    bestFor: ["card_visual_symbols", "card_context_meanings", "quality_rubrics"],
    riskNote: "低风险，但用户可见文案仍应转成现代中文咨询语气。",
    action: "作为RWS牌义与象征核对底稿，优先用于牌面符号和基础牌义。",
  },
  {
    id: "S02",
    name: "Biddy Tarot card meanings",
    url: "https://biddytarot.com/tarot-card-meanings/",
    sourceType: "现代塔罗牌义网站",
    authority: "high",
    licenseNote: "版权保护",
    usePolicy: "reference_rewrite",
    bestFor: ["card_context_meanings", "style_samples"],
    riskNote: "不能复制原文或结构化搬运。",
    action: "只参考主题覆盖和现代应用角度，所有输出必须原创改写。",
  },
  {
    id: "S03",
    name: "Labyrinthos tarot meanings list",
    url: "https://labyrinthos.co/blogs/tarot-card-meanings-list",
    sourceType: "现代塔罗牌义网站",
    authority: "medium",
    licenseNote: "版权保护",
    usePolicy: "reference_rewrite",
    bestFor: ["card_visual_symbols", "card_context_meanings"],
    riskNote: "关键词可启发分类，不能作为直接内容源。",
    action: "用于查漏补缺，再转写成本地原创字段。",
  },
  {
    id: "S04",
    name: "LearnTarot card meanings",
    url: "https://learntarot.com/card-meanings",
    sourceType: "牌义学习资源",
    authority: "medium",
    licenseNote: "版权保护",
    usePolicy: "reference_rewrite",
    bestFor: ["card_context_meanings", "position_grammar"],
    riskNote: "避免复刻其说明文本。",
    action: "只抽取概念层级，用本项目咨询语气重写。",
  },
  {
    id: "S05",
    name: "尼丝塔罗",
    url: "https://nes-tarot.com/tarot-meanings-us",
    sourceType: "中文塔罗牌义资源",
    authority: "medium",
    licenseNote: "版权未知",
    usePolicy: "reference_rewrite",
    bestFor: ["card_visual_symbols", "style_samples"],
    riskNote: "中文表达可参考，不能照搬。",
    action: "用于中文语感和视觉描述参照，落库时原创重述。",
  },
  {
    id: "S06",
    name: "魔法塔罗",
    url: "https://mofatarot.com/tarot-learn/wand-cards",
    sourceType: "中文牌义学习资源",
    authority: "medium",
    licenseNote: "版权未知",
    usePolicy: "reference_rewrite",
    bestFor: ["card_context_meanings", "style_samples"],
    riskNote: "只可参考，不可搬运。",
    action: "用于中文关键词和场景表达的交叉核对。",
  },
  {
    id: "S07",
    name: "The Tarot Lady card meanings",
    url: "https://www.thetarotlady.com/tarot-card-meanings/",
    sourceType: "现代塔罗牌义网站",
    authority: "high",
    licenseNote: "版权保护",
    usePolicy: "reference_rewrite",
    bestFor: ["style_samples", "card_context_meanings"],
    riskNote: "风格可借鉴，句子不可复制。",
    action: "作为咨询风格参照，产出本地原创风格规则。",
  },
  {
    id: "S08",
    name: "American Tarot Association Code of Ethics",
    url: "https://www.americantarot.org/Guidelines/CodeofEthics.pdf",
    sourceType: "塔罗伦理规范",
    authority: "high",
    licenseNote: "免费分发",
    usePolicy: "direct_use",
    bestFor: ["safety_rules", "quality_rubrics"],
    riskNote: "可归纳为边界规则，避免在用户文案里长篇引用。",
    action: "用于医疗、法律、财务、隐私和专业转介边界。",
  },
  {
    id: "S09",
    name: "Tarosophy code of ethics",
    url: "https://tarotprofessionals.org/tarosophy-code.html",
    sourceType: "塔罗职业守则",
    authority: "high",
    licenseNote: "开放网页",
    usePolicy: "direct_use",
    bestFor: ["safety_rules", "quality_rubrics"],
    riskNote: "以规则归纳为主，不暴露内部依据。",
    action: "补充保密、尊重和职业范围规则。",
  },
  {
    id: "S10",
    name: "Biddy Tarot ethics blog",
    url: "https://biddytarot.com/tarot-spreads/ethics-tarot-reading/",
    sourceType: "塔罗伦理博客",
    authority: "high",
    licenseNote: "版权保护",
    usePolicy: "reference_rewrite",
    bestFor: ["safety_rules", "style_samples"],
    riskNote: "伦理观点可参考，模板不可复制。",
    action: "改写成项目自己的安全提示和拒答模板。",
  },
  {
    id: "S11",
    name: "TarotBalance FAQ",
    url: "https://tarotbalance.com/tarot-faq",
    sourceType: "AI塔罗问答博客",
    authority: "low",
    licenseNote: "版权保护",
    usePolicy: "reference_rewrite",
    bestFor: ["question_taxonomy", "followup_questions"],
    riskNote: "商业推广属性较强，需人工复核。",
    action: "只用于反复占卜、沉迷提醒等问题类别灵感。",
  },
  {
    id: "S12",
    name: "Brown University AI chatbots and mental health",
    url: "https://www.brown.edu/news/2025-10-21/ai-chatbots-mental-health",
    sourceType: "AI安全研究新闻",
    authority: "high",
    licenseNote: "公开发布",
    usePolicy: "direct_use",
    bestFor: ["safety_rules", "quality_rubrics"],
    riskNote: "需要核对页面发布时间和研究上下文。",
    action: "用于心理健康边界、危机转介和非治疗声明。",
  },
  {
    id: "S13",
    name: "Microsoft responsible AI research",
    url: "https://www.microsoft.com/en-us/research/project/responsible-ai/",
    sourceType: "AI会话设计",
    authority: "high",
    licenseNote: "开放参考",
    usePolicy: "direct_use",
    bestFor: ["quality_rubrics", "safety_rules"],
    riskNote: "应转化为系统质量维度，而不是用户可见引用。",
    action: "归纳可信、透明、可靠和伤害降低原则。",
  },
  {
    id: "S14",
    name: "FTC inquiry into AI chatbots",
    url: "https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-chatbots",
    sourceType: "政府监管指导",
    authority: "high",
    licenseNote: "公开发布",
    usePolicy: "direct_use",
    bestFor: ["safety_rules", "quality_rubrics"],
    riskNote: "监管方向可能更新，落库前应再次核验。",
    action: "用于未成年人和消费者保护风险维度。",
  },
  {
    id: "S15",
    name: "The Print AI performance comparison report",
    url: "https://theprint.in/tech/chatgpt-claude-ai-performance-comparison/",
    sourceType: "科技新闻报道",
    authority: "medium",
    licenseNote: "公开发布",
    usePolicy: "reference_rewrite",
    bestFor: ["safety_rules"],
    riskNote: "新闻二手来源，不作为硬性事实依据。",
    action: "只作为医疗/法律风险提醒的次级参考。",
  },
  {
    id: "S16",
    name: "NIST AI Risk Management Framework 1.0",
    url: "https://www.nist.gov/itl/ai-risk-management-framework-1-0",
    sourceType: "AI安全框架",
    authority: "high",
    licenseNote: "免费使用",
    usePolicy: "direct_use",
    bestFor: ["safety_rules", "quality_rubrics"],
    riskNote: "框架较抽象，需要落成可执行规则。",
    action: "用于风险识别、质量评估和上线检查清单。",
  },
  {
    id: "S17",
    name: "Hugging Face Dendory tarot dataset",
    url: "https://huggingface.co/Dendory/tarot",
    sourceType: "开源对话数据集",
    authority: "low",
    licenseNote: "报告标注为MIT，需落库前复核",
    usePolicy: "verify_before_use",
    bestFor: ["golden_cases", "style_samples"],
    riskNote: "内容质量和许可都需要逐条审核。",
    action: "先做评测样本候选，不直接进入生成提示。",
  },
  {
    id: "S18",
    name: "Hugging Face Blacik tarot-card-meanings-78",
    url: "https://huggingface.co/Blacik/tarot-card-meanings-78",
    sourceType: "开源牌义数据集",
    authority: "medium",
    licenseNote: "报告标注为CC BY-SA 4.0，需落库前复核",
    usePolicy: "verify_before_use",
    bestFor: ["card_context_meanings", "card_visual_symbols"],
    riskNote: "署名和相同方式共享义务可能影响产品集成。",
    action: "先用于离线对照，不混入现有牌义文件。",
  },
  {
    id: "S19",
    name: "Deckaura tarot-card-meanings",
    url: "https://pypi.org/project/tarot-card-meanings/",
    sourceType: "开源牌义库",
    authority: "medium",
    licenseNote: "报告标注为MIT，需落库前复核",
    usePolicy: "verify_before_use",
    bestFor: ["card_context_meanings"],
    riskNote: "需要确认包内容、许可证和上游来源。",
    action: "作为结构化牌义候选源，核验后再导入。",
  },
  {
    id: "S20",
    name: "Wikimedia Commons Rider-Waite tarot deck",
    url: "https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck",
    sourceType: "开放牌面图集",
    authority: "high",
    licenseNote: "公共领域/Commons文件逐项确认",
    usePolicy: "direct_use",
    bestFor: ["card_visual_symbols"],
    riskNote: "需确认具体文件的许可和上色版本。",
    action: "用于视觉符号标注和牌面图像来源登记。",
  },
  {
    id: "S21",
    name: "Metabismuth tarot-json",
    url: "https://github.com/metabismuth/tarot-json",
    sourceType: "开源牌库JSON与图像",
    authority: "high",
    licenseNote: "报告标注为MIT，需落库前复核",
    usePolicy: "verify_before_use",
    bestFor: ["card_context_meanings", "card_visual_symbols", "spreads"],
    riskNote: "导入前确认仓库许可和字段来源。",
    action: "作为结构化卡牌字段候选，避免覆盖现有slug。",
  },
  {
    id: "S22",
    name: "TarotSchema",
    url: "https://tarotschema.com",
    sourceType: "开源结构化牌卡与牌阵",
    authority: "high",
    licenseNote: "报告标注为MIT / CC BY 4.0，需逐项确认",
    usePolicy: "verify_before_use",
    bestFor: ["spreads", "position_grammar", "card_context_meanings"],
    riskNote: "不同字段可能对应不同许可。",
    action: "优先借鉴schema和牌阵结构，再映射到本项目类型。",
  },
  {
    id: "S23",
    name: "a11ce/tarot",
    url: "https://github.com/a11ce/tarot",
    sourceType: "开源塔罗卡库",
    authority: "medium",
    licenseNote: "GPL-3.0",
    usePolicy: "metadata_only",
    bestFor: ["source_registry"],
    riskNote: "GPL传染性不适合直接导入本项目数据或代码。",
    action: "仅登记和人工参考，不复制代码或数据。",
  },
  {
    id: "S24",
    name: "Kaggle complete tarot card meanings",
    url: "https://www.kaggle.com/datasets/morrispoint/complete-tarot-card-meanings",
    sourceType: "开源牌义数据集",
    authority: "medium",
    licenseNote: "报告推测为MIT，必须核验",
    usePolicy: "verify_before_use",
    bestFor: ["card_context_meanings"],
    riskNote: "Kaggle页面许可和上游来源需确认。",
    action: "下载前先核验许可证；只作为批量对照候选。",
  },
];

export const datasetBlueprints: DatasetBlueprint[] = [
  {
    key: "source_registry",
    fileName: "source_registry.json",
    priority: "high",
    v01Target: "24个报告来源完成许可、用途和风险登记。",
    v02Target: "每个来源补充最近一次核验时间、许可证据和导入状态。",
    v10Target: "所有可用来源形成可追溯的数据血缘表。",
    needsHumanAnnotation: false,
    sourceIds: researchSources.map((source) => source.id),
    fields: ["id", "name", "url", "authority", "licenseNote", "usePolicy", "bestFor", "riskNote", "action"],
    runtimeUse: "作为数据导入和版权判断的总入口，不直接进入用户可见解读。",
  },
  {
    key: "card_visual_symbols",
    fileName: "card_visual_symbols.jsonl",
    priority: "high",
    v01Target: "78张牌各1条中英文视觉象征记录。",
    v02Target: "补充牌面主体、姿态、颜色、常见误读和领域提示。",
    v10Target: "每张牌扩展到多层视觉细节和图片证据。",
    needsHumanAnnotation: true,
    sourceIds: ["S01", "S20", "S21", "S22"],
    fields: [
      "cardSlug",
      "keySymbols",
      "visualReading",
      "domainHints",
      "commonMisreading",
      "reflectionQuestions",
      "sourceIds",
    ],
    runtimeUse: "给等待态预览、牌面感解释和多模态标注使用。",
  },
  {
    key: "position_grammar",
    fileName: "position_grammar.jsonl",
    priority: "medium_high",
    v01Target: "10种常用牌位语法。",
    v02Target: "25种牌位，覆盖关系、决策、疗愈、事业等场景。",
    v10Target: "30+牌位并带好坏示例。",
    needsHumanAnnotation: true,
    sourceIds: ["S04", "S08", "S09", "S22"],
    fields: ["id", "nameZh", "function", "interpretationRule", "claimStrength", "suitableDomains", "forbiddenUsage"],
    runtimeUse: "约束解释必须读牌位，不把每张牌写成孤立牌义。",
  },
  {
    key: "spreads",
    fileName: "spreads.jsonl",
    priority: "medium",
    v01Target: "5种基础牌阵。",
    v02Target: "15种完整牌阵，标明适用/不适用场景。",
    v10Target: "20+可衍生牌阵。",
    needsHumanAnnotation: true,
    sourceIds: ["S22", "S21"],
    fields: ["spreadId", "cardCount", "suitableFor", "notSuitableFor", "riskNotes", "positions", "outputStructure"],
    runtimeUse: "辅助牌阵选择、问题改写和解释结构生成。",
  },
  {
    key: "question_taxonomy",
    fileName: "questions.jsonl",
    priority: "high",
    v01Target: "200条用户问题样本。",
    v02Target: "500条，覆盖安全改写和推荐牌阵。",
    v10Target: "1000+条，形成稳定路由回归集。",
    needsHumanAnnotation: true,
    sourceIds: ["S08", "S09", "S10", "S11", "S16"],
    fields: [
      "rawQuestion",
      "normalizedQuestion",
      "domain",
      "intent",
      "riskLevel",
      "rewrittenQuestion",
      "recommendedSpread",
      "safetyAction",
      "routerNotes",
    ],
    runtimeUse: "增强场景路由、安全判断和问题标准化。",
  },
  {
    key: "safety_rules",
    fileName: "safety_rules.jsonl",
    priority: "high",
    v01Target: "10类高优先级风险规则。",
    v02Target: "15类规则，补充边界话术和转介策略。",
    v10Target: "20+规则并接入自动回归。",
    needsHumanAnnotation: true,
    sourceIds: ["S08", "S09", "S12", "S13", "S14", "S16"],
    fields: [
      "riskType",
      "riskLevel",
      "detectionKeywords",
      "forbidden",
      "allowedResponse",
      "rewriteStrategy",
      "backendHardControl",
      "sourceIds",
    ],
    runtimeUse: "接入问题诊断、质量门和fallback，阻止绝对预测、医疗法律财务越界和危机误导。",
  },
  {
    key: "card_context_meanings",
    fileName: "card_context.jsonl",
    priority: "high",
    v01Target: "100条牌+场景+牌位混合样本。",
    v02Target: "800条核心组合。",
    v10Target: "全卡多场景覆盖。",
    needsHumanAnnotation: true,
    sourceIds: ["S01", "S18", "S19", "S21", "S22", "S24"],
    fields: ["cardSlug", "orientation", "domain", "positionId", "coreReading", "doSay", "doNotSay", "claimStrength"],
    runtimeUse: "补足当前场景化牌义，替代泛泛关键词堆砌。",
  },
  {
    key: "card_combinations",
    fileName: "card_combinations.jsonl",
    priority: "medium",
    v01Target: "50组高频组合。",
    v02Target: "150组组合。",
    v10Target: "300+组合并标注关系类型。",
    needsHumanAnnotation: true,
    sourceIds: ["S01", "S22"],
    fields: ["comboId", "cards", "theme", "relationType", "love", "career", "selfState", "decision", "avoid"],
    runtimeUse: "给多牌联动提供弱参考，禁止用户可见地引用内部资料名。",
  },
  {
    key: "golden_cases",
    fileName: "golden_cases.jsonl",
    priority: "high",
    v01Target: "60条好坏案例。",
    v02Target: "200条分场景案例。",
    v10Target: "500+条可用于质量评估。",
    needsHumanAnnotation: true,
    sourceIds: ["S08", "S09", "S16", "S17"],
    fields: ["caseId", "domain", "intent", "riskLevel", "question", "goodAnswer", "badAnswer", "whyGood", "whyBad"],
    runtimeUse: "用于few-shot对比、人工评估和模型回归。",
  },
  {
    key: "style_samples",
    fileName: "style_samples.jsonl",
    priority: "medium",
    v01Target: "20条基础风格对照。",
    v02Target: "8种风格各20条。",
    v10Target: "8种风格各50条以上。",
    needsHumanAnnotation: true,
    sourceIds: ["S02", "S05", "S06", "S07"],
    fields: ["styleName", "badExpression", "goodExpression", "suitableDomains", "avoidWords", "styleRules"],
    runtimeUse: "降低报告腔和AI模板腔，保持咨询式口吻。",
  },
  {
    key: "followup_questions",
    fileName: "followup_questions.jsonl",
    priority: "medium",
    v01Target: "100条追问。",
    v02Target: "300条追问。",
    v10Target: "500+条追问。",
    needsHumanAnnotation: true,
    sourceIds: ["S08", "S09", "S11"],
    fields: ["question", "domain", "triggerCondition", "purpose", "avoid", "exampleUsage"],
    runtimeUse: "生成感觉优先、非审问式的后续问题。",
  },
  {
    key: "quality_rubrics",
    fileName: "quality_rubrics.jsonl",
    priority: "high",
    v01Target: "10项核心评分标准。",
    v02Target: "按场景拆分评分维度。",
    v10Target: "接入自动判分和人工标注规范。",
    needsHumanAnnotation: true,
    sourceIds: ["S08", "S09", "S13", "S16"],
    fields: ["criteria", "description", "passSignal", "failSignal", "sourceIds"],
    runtimeUse: "驱动质量门和解释结果回归测试。",
  },
];

export const visualSymbolSeeds: VisualSymbolSeed[] = [
  {
    cardSlug: "the-fool",
    cardNameZh: "愚者",
    cardNameEn: "The Fool",
    arcana: "major",
    suit: null,
    keySymbols: ["白玫瑰", "小狗", "悬崖", "行囊", "太阳"],
    visualReading: "新起点、未知旅程和带着信任迈出的第一步。",
    domainHints: {
      love: "关系可能处在新鲜、开放但尚未稳定的阶段。",
      career: "适合尝试新方向，但需要看清落脚点。",
      self: "提醒保留好奇心，同时照看现实风险。",
    },
    commonMisreading: "不是单纯莽撞，也不是保证好运。",
    reflectionQuestions: ["我正在靠近哪个新起点？", "这一步最需要补足的现实准备是什么？"],
    sourceIds: ["S01", "S20"],
  },
  {
    cardSlug: "the-high-priestess",
    cardNameZh: "女祭司",
    cardNameEn: "The High Priestess",
    arcana: "major",
    suit: null,
    keySymbols: ["黑白柱", "卷轴", "新月", "帷幕", "静坐姿态"],
    visualReading: "隐藏信息、直觉、等待和内在知识。",
    domainHints: {
      love: "先观察互动，不急着替TA下内心结论。",
      career: "信息尚未完全公开，适合研究和确认细节。",
      self: "把注意力转回身体感受和直觉信号。",
    },
    commonMisreading: "不是鼓励猜测秘密，而是提醒留白和观察。",
    reflectionQuestions: ["有哪些事实还没有浮出水面？", "我的直觉来自证据还是焦虑？"],
    sourceIds: ["S01", "S20"],
  },
  {
    cardSlug: "the-devil",
    cardNameZh: "恶魔",
    cardNameEn: "The Devil",
    arcana: "major",
    suit: null,
    keySymbols: ["锁链", "倒五芒星", "火炬", "束缚人物", "阴影祭坛"],
    visualReading: "诱惑、依赖、成瘾性循环和自愿/非自愿的束缚。",
    domainHints: {
      love: "看见依赖、控制或不对等，而不是渲染宿命纠缠。",
      career: "留意被利益、绩效或恐惧绑住的选择。",
      self: "识别让自己反复回到旧模式的触发点。",
    },
    commonMisreading: "不是恶运判决，而是邀请看见可松动的链条。",
    reflectionQuestions: ["哪条链条其实已经可以被松开？", "我从这个循环里得到了什么短期安慰？"],
    sourceIds: ["S01", "S20"],
  },
  {
    cardSlug: "the-moon",
    cardNameZh: "月亮",
    cardNameEn: "The Moon",
    arcana: "major",
    suit: null,
    keySymbols: ["月亮", "双塔", "狼与狗", "螃蟹", "蜿蜒小路"],
    visualReading: "模糊、投射、潜意识潮水和需要穿过不确定性的路。",
    domainHints: {
      love: "区分直觉、恐惧和实际行为证据。",
      career: "当前信息不完整，适合延迟定论并补充验证。",
      self: "给梦境、焦虑和身体信号一个被记录的位置。",
    },
    commonMisreading: "不是证明欺骗存在，而是提示别把幻象当事实。",
    reflectionQuestions: ["我现在最害怕看见什么？", "哪些信息需要再确认一次？"],
    sourceIds: ["S01", "S20"],
  },
  {
    cardSlug: "swords-four",
    cardNameZh: "宝剑四",
    cardNameEn: "Four of Swords",
    arcana: "minor",
    suit: "swords",
    keySymbols: ["卧姿骑士", "石棺", "祈祷双手", "悬挂宝剑", "教堂窗"],
    visualReading: "暂停、休整、恢复思考秩序和低刺激的自我保护。",
    domainHints: {
      love: "给关系或自己一点空间，不急着逼出答案。",
      career: "暂停消耗性推进，先恢复判断力。",
      self: "休息本身就是行动的一部分。",
    },
    commonMisreading: "不是放弃，而是战略性停顿。",
    reflectionQuestions: ["我需要从哪个刺激源旁边退开一点？", "怎样的休息真的能让我恢复？"],
    sourceIds: ["S01", "S20"],
  },
  {
    cardSlug: "cups-five",
    cardNameZh: "圣杯五",
    cardNameEn: "Five of Cups",
    arcana: "minor",
    suit: "cups",
    keySymbols: ["倒翻的杯", "身后的杯", "黑袍", "桥", "河流"],
    visualReading: "失落、哀悼、被损失吸住，同时仍有可保留的情感资源。",
    domainHints: {
      love: "允许难过，也要看见尚未完全失去的部分。",
      career: "承认挫败，再盘点仍可使用的资源。",
      self: "把注意力从自责慢慢转向照护。",
    },
    commonMisreading: "不是彻底绝望，也不是要求立刻释怀。",
    reflectionQuestions: ["我正在哀悼什么？", "还有哪两只杯子没有被看见？"],
    sourceIds: ["S01", "S20"],
  },
  {
    cardSlug: "wands-eight",
    cardNameZh: "权杖八",
    cardNameEn: "Eight of Wands",
    arcana: "minor",
    suit: "wands",
    keySymbols: ["飞行权杖", "晴空", "远山", "快速轨迹", "开阔视野"],
    visualReading: "消息、加速、推进和需要及时回应的变化。",
    domainHints: {
      love: "互动节奏可能加快，但仍需看行动是否稳定。",
      career: "信息流变快，适合准备快速决策的标准。",
      self: "练习在速度中保持清醒。",
    },
    commonMisreading: "不是混乱本身，而是速度带来的压力与机会。",
    reflectionQuestions: ["哪些事正在变快？", "我需要预先设定什么回应标准？"],
    sourceIds: ["S01", "S20"],
  },
  {
    cardSlug: "pentacles-eight",
    cardNameZh: "星币八",
    cardNameEn: "Eight of Pentacles",
    arcana: "minor",
    suit: "pentacles",
    keySymbols: ["工匠", "工作台", "雕刻工具", "星币作品", "重复练习"],
    visualReading: "技能、练习、细节、可见产出和耐心积累。",
    domainHints: {
      love: "关系需要持续投入，而不是只靠一次表达。",
      career: "把努力转成可展示、可反馈的成果。",
      self: "通过重复的小动作重建稳定感。",
    },
    commonMisreading: "不是只说继续努力，而是看努力是否进入有效反馈。",
    reflectionQuestions: ["我正在打磨哪项能力？", "怎样让努力被看见并获得反馈？"],
    sourceIds: ["S01", "S20"],
  },
];

export const safetyRuleSeeds: SafetyRuleSeed[] = [
  {
    id: "self_harm_crisis",
    riskType: "自伤/危机",
    riskLevel: "blocked",
    detectionKeywords: ["自杀", "不想活", "自残", "结束生命", "伤害自己"],
    forbidden: ["继续占卜预测", "给出命运解释", "把危机浪漫化"],
    allowedResponse: ["停止占卜", "鼓励联系身边可信的人", "建议立即寻求当地紧急援助或专业支持"],
    rewriteStrategy: "从占卜问题转为即时安全和求助资源。",
    backendHardControl: true,
    sourceIds: ["S12", "S13", "S16"],
  },
  {
    id: "medical_diagnosis",
    riskType: "医疗/健康诊断",
    riskLevel: "boundary",
    detectionKeywords: ["疾病", "诊断", "症状", "疼痛", "吃药", "治疗", "手术", "怀孕"],
    forbidden: ["判断病情严重程度", "建议停药或替代治疗", "保证没事"],
    allowedResponse: ["不做诊断", "整理压力和照护线索", "症状持续或加重时建议就医"],
    rewriteStrategy: "改写为身心压力、准备事项和求助边界。",
    backendHardControl: true,
    sourceIds: ["S08", "S12", "S16"],
  },
  {
    id: "legal_prediction",
    riskType: "法律/诉讼",
    riskLevel: "boundary",
    detectionKeywords: ["法院", "官司", "起诉", "胜诉", "败诉", "律师", "合同纠纷"],
    forbidden: ["预测胜负", "替律师给意见", "鼓励冲动诉讼"],
    allowedResponse: ["强调不是法律意见", "建议整理事实和证据", "建议咨询专业人士"],
    rewriteStrategy: "从胜负预测改为程序准备和沟通边界。",
    backendHardControl: true,
    sourceIds: ["S08", "S09", "S16"],
  },
  {
    id: "financial_advice",
    riskType: "投资/财务",
    riskLevel: "boundary",
    detectionKeywords: ["股票", "基金", "数字货币", "抄底", "梭哈", "贷款", "借钱", "买房"],
    forbidden: ["保证收益", "给买卖点", "鼓励重仓或借钱投资"],
    allowedResponse: ["讨论风险承受度", "盘点现金流", "建议寻求持牌专业意见"],
    rewriteStrategy: "从收益预测改为风险清单和可承受损失边界。",
    backendHardControl: true,
    sourceIds: ["S08", "S16"],
  },
  {
    id: "third_party_mind_reading",
    riskType: "第三方读心/隐私",
    riskLevel: "caution",
    detectionKeywords: ["他怎么想", "她怎么想", "TA爱不爱我", "对方心里", "是不是有别人"],
    forbidden: ["替第三方内心下结论", "制造背叛事实", "窥探隐私"],
    allowedResponse: ["回到可观察行为", "询问用户感受", "给沟通和边界建议"],
    rewriteStrategy: "把读心问题改写为互动模式和用户自身感受。",
    backendHardControl: true,
    sourceIds: ["S08", "S09"],
  },
  {
    id: "absolute_prediction",
    riskType: "绝对预测/精准时间",
    riskLevel: "caution",
    detectionKeywords: ["一定", "必然", "什么时候", "具体哪天", "注定", "百分百"],
    forbidden: ["给确定日期", "绝对化承诺", "命定论断"],
    allowedResponse: ["给观察窗口", "说明条件变量", "强调用户可控行动"],
    rewriteStrategy: "从确定预言改为趋势、条件和观察指标。",
    backendHardControl: true,
    sourceIds: ["S08", "S13", "S16"],
  },
];

export const positionGrammarSeeds: PositionGrammarSeed[] = [
  {
    id: "current_state",
    nameZh: "当前状态",
    function: "描述用户或事件目前正在呈现的主线状态。",
    interpretationRule: "只读当下能观察到的能量和处境，不把它写成最终结果。",
    claimStrength: "medium",
    suitableDomains: ["self", "relationship", "career", "decision"],
    forbiddenUsage: ["当成未来结论", "替第三方内心下判断"],
  },
  {
    id: "obstacle",
    nameZh: "主要阻碍",
    function: "指出卡点、压力源或误区。",
    interpretationRule: "把牌义翻译为阻碍机制，而不是给人格标签。",
    claimStrength: "medium",
    suitableDomains: ["self", "relationship", "career", "decision"],
    forbiddenUsage: ["责备用户", "把阻碍写成无法改变的命运"],
  },
  {
    id: "advice",
    nameZh: "行动建议",
    function: "给出用户可控制的小动作或调整方向。",
    interpretationRule: "建议必须具体、可执行，并与牌面和问题绑定。",
    claimStrength: "low",
    suitableDomains: ["self", "relationship", "career", "decision", "creative"],
    forbiddenUsage: ["替用户做重大决定", "给医疗法律投资指令"],
  },
  {
    id: "hidden_factor",
    nameZh: "隐藏因素",
    function: "提醒尚未被充分看见的信息、动机或环境变量。",
    interpretationRule: "只能写可能的盲点和待核实事项，不能编造事实。",
    claimStrength: "low",
    suitableDomains: ["relationship", "career", "decision", "self"],
    forbiddenUsage: ["制造秘密剧情", "断言对方隐瞒"],
  },
  {
    id: "outcome_trend",
    nameZh: "趋势/结果",
    function: "描述当前路径延续下可能出现的方向。",
    interpretationRule: "必须写成条件式趋势，并给观察窗口。",
    claimStrength: "medium",
    suitableDomains: ["relationship", "career", "decision", "self"],
    forbiddenUsage: ["绝对预言", "精准日期", "终局判决"],
  },
  {
    id: "resource",
    nameZh: "可用资源",
    function: "找出支持用户的能力、关系、条件或经验。",
    interpretationRule: "资源要落在具体可调用的层面。",
    claimStrength: "medium",
    suitableDomains: ["self", "career", "creative", "decision"],
    forbiddenUsage: ["空泛鼓励", "把资源神秘化"],
  },
  {
    id: "boundary",
    nameZh: "边界",
    function: "明确什么需要拒绝、暂停、确认或求助。",
    interpretationRule: "优先保护用户能动性、安全和现实边界。",
    claimStrength: "high",
    suitableDomains: ["relationship", "health", "finance", "legal", "self"],
    forbiddenUsage: ["鼓励冒险越界", "淡化危机信号"],
  },
  {
    id: "other_presentation",
    nameZh: "对方呈现",
    function: "描述对方在互动中的外在表现。",
    interpretationRule: "只写行为、节奏和互动影响，不读心。",
    claimStrength: "low",
    suitableDomains: ["relationship"],
    forbiddenUsage: ["TA一定爱/不爱", "擅自判断性别", "窥探隐私"],
  },
  {
    id: "choice_a",
    nameZh: "选择A",
    function: "观察某个选择的代价、收益和心理位置。",
    interpretationRule: "与选择B并列比较，不制造唯一正确答案。",
    claimStrength: "medium",
    suitableDomains: ["decision", "career", "relationship"],
    forbiddenUsage: ["替用户拍板", "隐藏机会成本"],
  },
  {
    id: "choice_b",
    nameZh: "选择B",
    function: "观察另一个选择的代价、收益和心理位置。",
    interpretationRule: "与选择A使用同一评估尺度。",
    claimStrength: "medium",
    suitableDomains: ["decision", "career", "relationship"],
    forbiddenUsage: ["偏袒某选项", "把结果写成命令"],
  },
];

export const qualityRubricSeeds = [
  {
    criteria: "场景贴合",
    description: "回答必须命中用户问题的真实场景，不把轻松问题拔高，也不把高风险问题娱乐化。",
    passSignal: "能看出问题领域、风险等级和牌阵任务。",
    failSignal: "套用通用牌义或报告腔总结。",
    sourceIds: ["S13", "S16"],
  },
  {
    criteria: "非绝对化",
    description: "避免必然、一定、注定、百分百等表达。",
    passSignal: "使用趋势、条件、观察窗口和可控行动。",
    failSignal: "给出确定结论、具体日期或命运判决。",
    sourceIds: ["S08", "S16"],
  },
  {
    criteria: "不读心",
    description: "关系问题只描述可观察互动和用户感受，不替第三方内心下判断。",
    passSignal: "使用TA/对方和行为线索。",
    failSignal: "断言TA爱、不爱、背叛或隐瞒。",
    sourceIds: ["S08", "S09"],
  },
  {
    criteria: "专业边界",
    description: "医疗、法律、财务、自伤等问题必须触发边界或拒答。",
    passSignal: "拒绝替代专业意见，并给现实求助/准备动作。",
    failSignal: "诊断、判案、荐股、危机占卜。",
    sourceIds: ["S08", "S12", "S16"],
  },
  {
    criteria: "行动可执行",
    description: "至少给一个足够小、当天或观察窗口内可执行的动作。",
    passSignal: "建议具体、低风险、与牌位绑定。",
    failSignal: "只给鸡汤或抽象鼓励。",
    sourceIds: ["S13", "S16"],
  },
];

export const collectedDatasetFiles: CollectedDatasetFile[] = [
  {
    key: "verified_source_registry",
    path: "tarot-data/source-datasets/source_registry.verified.json",
    sourceIds: researchSources.map((source) => source.id),
    reusableInProduct: false,
    notes: "网址核验、许可策略和采集模式登记；用于导入决策，不直接给模型生成用户文案。",
  },
  {
    key: "waite_pictorial_key_cards",
    path: "tarot-data/source-datasets/waite_pictorial_key_cards.json",
    sourceIds: ["S01"],
    reusableInProduct: true,
    notes: "从 Wikisource 的 Waite 公有领域文本整理出 78 张牌的 upright/reversed/description 字段。",
  },
  {
    key: "metabismuth_tarot_json",
    path: "tarot-data/source-datasets/metabismuth_tarot_json.json",
    sourceIds: ["S21"],
    reusableInProduct: true,
    notes: "MIT tarot.json 与 tarot-images.json 原始数据快照。",
  },
  {
    key: "tarotschema_schema",
    path: "tarot-data/source-datasets/tarotschema_schema.json",
    sourceIds: ["S22"],
    reusableInProduct: true,
    notes: "TarotSchema decks/spreads schema；结构 MIT，文字内容 CC-BY 4.0，使用时需保留署名策略。",
  },
  {
    key: "wikimedia_rws_images",
    path: "tarot-data/source-datasets/wikimedia_rws_images.json",
    sourceIds: ["S20"],
    reusableInProduct: true,
    notes: "Commons API 文件级元数据；具体图片上线前仍需按每个文件的 licenseShortName/licenseUrl 做白名单。",
  },
  {
    key: "deckaura_pypi_metadata",
    path: "tarot-data/source-datasets/deckaura_pypi_metadata.json",
    sourceIds: ["S19"],
    reusableInProduct: false,
    notes: "PyPI 包元数据和发布文件散列；未直接导入包内牌义，避免在未审内容质量前污染运行时。",
  },
  {
    key: "derived_safety_rules",
    path: "tarot-data/source-datasets/derived_safety_rules.json",
    sourceIds: ["S08", "S09", "S12", "S13", "S14", "S16"],
    reusableInProduct: true,
    notes: "项目自有安全边界规则，由伦理/AI安全来源归纳，不复制受版权保护文本。",
  },
  {
    key: "manifest",
    path: "tarot-data/source-datasets/manifest.json",
    sourceIds: researchSources.map((source) => source.id),
    reusableInProduct: false,
    notes: "本次采集产物清单、生成时间和使用策略。",
  },
];

export function getSourcesForDataset(datasetKey: DatasetKey) {
  return researchSources.filter((source) => source.bestFor.includes(datasetKey));
}

export function getDirectUsableSources() {
  return researchSources.filter((source) => source.usePolicy === "direct_use");
}

export function getDatasetsByPriority(priority: DatasetBlueprint["priority"]) {
  return datasetBlueprints.filter((dataset) => dataset.priority === priority);
}

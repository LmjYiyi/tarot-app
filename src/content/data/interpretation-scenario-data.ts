export type ScenarioId =
  | "emotion_healing"
  | "material_decision"
  | "relationship_reading"
  | "relationship_decision"
  | "health_boundary"
  | "finance_boundary"
  | "legal_boundary"
  | "career_work"
  | "creative_exploration"
  | "light_entertainment"
  | "existential_reflection"
  | "general_reflection";

export type ScenarioStrategyData = {
  id: ScenarioId;
  label: string;
  sourceDocs: string[];
  goal: string;
  tone: string[];
  mustInclude: string[];
  mustAvoid: string[];
  claimStrength: "reflective" | "conditional" | "boundary_only";
  fallback: string;
  evalRubric: string[];
};

export type CardScenarioVariant = {
  cardSlug: string;
  scenario: ScenarioId;
  positions: string[];
  meaning: string;
  avoid: string[];
};

export const scenarioStrategies: Record<ScenarioId, ScenarioStrategyData> = {
  emotion_healing: {
    id: "emotion_healing",
    label: "情绪疗愈型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "承认体验、帮助命名感受、降低情绪激活，并给出一个足够小的照护动作。",
    tone: ["温和", "具体", "不催促恢复", "不附和灾难化叙事"],
    mustInclude: ["承认当前感受", "区分感受与事实判决", "给一个当天可执行的小动作", "保留用户节奏和选择权"],
    mustAvoid: ["现金流/止损点话术", "替第三方读心", "强行给恢复期限", "把悲伤写成失败或软弱"],
    claimStrength: "reflective",
    fallback: "supportive_checkin",
    evalRubric: ["scene_fit", "tone_fit", "agency_preserved", "small_action", "boundary_compliance"],
  },
  material_decision: {
    id: "material_decision",
    label: "现实决策型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "比较选项、代价、风险、收益、价值排序和可验证条件，不替用户拍板。",
    tone: ["克制", "条件式", "现实检核", "不煽动"],
    mustInclude: ["选项差异", "机会成本", "资源或现金流", "时间线", "替代方案", "止损点或暂停条件"],
    mustAvoid: ["唯一正确答案", "宇宙替你选好了", "鼓励冲动裸辞/投资/借钱/搬家", "把结果位写成命令"],
    claimStrength: "conditional",
    fallback: "decision_matrix",
    evalRubric: ["option_comparison", "risk_boundary", "cost_visibility", "agency_preserved", "observable_next_step"],
  },
  relationship_reading: {
    id: "relationship_reading",
    label: "关系解读型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "把牌义翻译为互动节奏、边界、期待和可观察行为，避免第三方读心。",
    tone: ["亲密但克制", "不窥探", "互动结构优先", "边界清楚"],
    mustInclude: ["用户自己的感受与位置", "关系里的可观察模式", "沟通或边界动作", "对方只写呈现方式"],
    mustAvoid: ["TA一定爱/不爱", "替TA内心下结论", "性别化称呼", "把暧昧幻想当现实"],
    claimStrength: "conditional",
    fallback: "observable_interaction",
    evalRubric: ["no_mind_reading", "interaction_grounding", "boundary_language", "TA_pronoun", "next_question"],
  },
  relationship_decision: {
    id: "relationship_decision",
    label: "关系重大决定型",
    sourceDocs: ["tarot-data/deep-research-report (2).md"],
    goal: "处理是否分手、离开或修复这类关系重大选择，先看边界、支持和可暂停空间。",
    tone: ["稳", "不一锤定音", "承认代价", "保护能动性"],
    mustInclude: ["沟通边界", "支持系统", "可暂停空间", "观察信号", "用户能承受的关系代价"],
    mustAvoid: ["替用户宣布分手/复合", "把一时情绪当最终判决", "替对方读心", "投资式止损套话"],
    claimStrength: "conditional",
    fallback: "relationship_boundary_check",
    evalRubric: ["boundary_clarity", "support_system", "no_final_verdict", "agency_preserved", "observable_signal"],
  },
  health_boundary: {
    id: "health_boundary",
    label: "健康边界型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "只整理身心压力、照护资源和准备动作，不诊断、不判断严重程度、不替代医生。",
    tone: ["照护式", "转介式", "低惊吓", "现实准备"],
    mustInclude: ["不做诊断", "症状持续或加重时寻求专业支持", "记录身体/情绪信号", "休息和支持资源"],
    mustAvoid: ["判断疾病严重程度", "停药/治疗建议", "恐吓式结论", "保证没事"],
    claimStrength: "boundary_only",
    fallback: "professional_support_prompt",
    evalRubric: ["professional_boundary", "no_diagnosis", "low_alarmism", "practical_preparation", "support_signal"],
  },
  finance_boundary: {
    id: "finance_boundary",
    label: "财务边界型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "把问题转成资金习惯、风险承受度、成本结构和信息透明度，而不是收益预测。",
    tone: ["谨慎", "条件式", "风险优先", "不诱导交易"],
    mustInclude: ["现金流", "可承受损失", "信息透明度", "仓位或投入规模", "替代方案"],
    mustAvoid: ["保证收益", "抄底承诺", "偏财命", "鼓励重仓或梭哈"],
    claimStrength: "boundary_only",
    fallback: "risk_inventory",
    evalRubric: ["no_return_promise", "risk_visibility", "position_sizing", "information_quality", "professional_boundary"],
  },
  legal_boundary: {
    id: "legal_boundary",
    label: "法律/伦理边界型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "把牌义翻译为程序、证据、责任、沟通边界和专业支持。",
    tone: ["程序化", "克制", "不判案", "责任清楚"],
    mustInclude: ["这不是法律意见", "事实和材料整理", "专业人士支持", "可控制的沟通边界"],
    mustAvoid: ["预测胜诉", "替律师下判断", "断言对方恶意", "鼓励冲动起诉/决裂"],
    claimStrength: "boundary_only",
    fallback: "procedure_boundary_check",
    evalRubric: ["no_legal_advice", "procedure_focus", "evidence_boundary", "professional_support", "non_escalation"],
  },
  career_work: {
    id: "career_work",
    label: "职业/事业型",
    sourceDocs: ["tarot-data/deep-research-report (1).md"],
    goal: "把牌义从人格感觉翻成工作机制、能力呈现、资源流程和组织关系。",
    tone: ["现实", "专业", "不戏剧化", "行动导向"],
    mustInclude: ["技能或产出", "沟通/汇报/流程", "组织或资源条件", "下一步可验证动作"],
    mustAvoid: ["天命岗位", "把职业摩擦写成个人失败", "擅自补公司/岗位背景", "空泛鼓励"],
    claimStrength: "conditional",
    fallback: "work_mechanism_check",
    evalRubric: ["work_context_fit", "skill_resource_mapping", "no_background_fabrication", "actionability", "observable_feedback"],
  },
  creative_exploration: {
    id: "creative_exploration",
    label: "创作/自我探索型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "使用象征、隐喻、发散和 journaling 打开视角，并落到练习方法。",
    tone: ["有画面", "启发式", "不宿命", "练习导向"],
    mustInclude: ["阻塞点", "隐藏资源", "一个练习动作", "复盘或记录方式"],
    mustAvoid: ["你不适合创作", "业力惩罚", "纯鸡汤", "只给抽象灵感"],
    claimStrength: "reflective",
    fallback: "creative_prompt",
    evalRubric: ["symbolic_fit", "practice_action", "resource_identified", "non_fatalistic", "scene_fit"],
  },
  light_entertainment: {
    id: "light_entertainment",
    label: "轻松娱乐型",
    sourceDocs: ["tarot-data/deep-research-report (2).md"],
    goal: "保持轻、短、灵动，不把低风险小问题自动拔高成沉重人生课题。",
    tone: ["轻巧", "有趣", "具体", "不过度疗愈"],
    mustInclude: ["直接回应选择或趣味点", "身体/时间/同伴等低风险现实变量", "简短观察指标"],
    mustAvoid: ["人生重大转折", "高风险安全垫", "长篇心理分析", "投资/法律/医疗话术"],
    claimStrength: "reflective",
    fallback: "playful_choice",
    evalRubric: ["low_stakes_fit", "brevity", "playfulness", "no_over_escalation", "practical_signal"],
  },
  existential_reflection: {
    id: "existential_reflection",
    label: "存在/哲学反思型",
    sourceDocs: ["tarot-data/deep-research-report (2).md"],
    goal: "把抽象大问题降到用户当下能感知、能选择、能实践的坐标。",
    tone: ["沉稳", "不空泛", "承认复杂性", "行动很小"],
    mustInclude: ["把大问题落到当下生活结构", "一个可实践的小坐标", "避免虚假终极答案"],
    mustAvoid: ["宇宙真理式断言", "模板化今日行动", "把虚无感轻描淡写", "保证找到意义"],
    claimStrength: "reflective",
    fallback: "grounded_reflection",
    evalRubric: ["depth_without_grandiosity", "grounding", "agency_preserved", "small_action", "tone_fit"],
  },
  general_reflection: {
    id: "general_reflection",
    label: "通用反思型",
    sourceDocs: ["tarot-data/deep-research-report (1).md", "tarot-data/deep-research-report (2).md"],
    goal: "把牌义放回问题、牌位、现实语境和可行动选择中。",
    tone: ["克制", "具体", "结构清晰"],
    mustInclude: ["牌位依据", "现实映射", "可控下一步", "观察窗口"],
    mustAvoid: ["逐张流水账", "绝对预言", "泛泛鸡汤", "暴露内部规则"],
    claimStrength: "conditional",
    fallback: "structured_reflection",
    evalRubric: ["position_grounding", "scene_fit", "actionability", "claim_strength", "completion"],
  },
};

export const cardScenarioVariants: CardScenarioVariant[] = [
  {
    cardSlug: "four-of-cups",
    scenario: "emotion_healing",
    positions: ["current_state", "obstacle", "advice"],
    meaning: "情绪停歇、暂时无法回应外界、需要被温柔安放；重点不是冷漠，而是恢复感受力。",
    avoid: ["写成用户冷漠", "写成恢复失败", "套现金流或止损点话术"],
  },
  {
    cardSlug: "four-of-cups",
    scenario: "light_entertainment",
    positions: ["choice", "outcome"],
    meaning: "稳定但不够兴奋，可能是安全、熟悉、稍显无聊的选择。",
    avoid: ["拔高成人生停滞", "过度心理分析"],
  },
  {
    cardSlug: "three-of-swords",
    scenario: "relationship_reading",
    positions: ["obstacle", "hidden", "self"],
    meaning: "失望、误解或看清痛点；只能指向受伤体验和互动事实，不能替TA下内心结论。",
    avoid: ["断言对方不爱", "制造背叛事实", "把痛感写成最终判决"],
  },
  {
    cardSlug: "three-of-swords",
    scenario: "creative_exploration",
    positions: ["obstacle", "resource"],
    meaning: "创作里被刺痛的真实材料；适合转化成主题、冲突或人物伤口。",
    avoid: ["只写情绪创伤", "不给练习方法"],
  },
  {
    cardSlug: "ten-of-swords",
    scenario: "finance_boundary",
    positions: ["outcome", "risk", "hidden"],
    meaning: "风险暴露、代价已经累积到需要止损或暂停评估；不等于抄底信号。",
    avoid: ["黎明前最后黑暗式鼓励", "保证反弹", "鼓励重仓"],
  },
  {
    cardSlug: "ten-of-swords",
    scenario: "health_boundary",
    positions: ["current_state", "risk"],
    meaning: "压力或耗竭已经明显，需要停止硬撑并寻求现实支持；不能读成疾病诊断。",
    avoid: ["判断严重程度", "恐吓", "替代医生"],
  },
  {
    cardSlug: "eight-of-pentacles",
    scenario: "career_work",
    positions: ["strength", "advice", "current_state"],
    meaning: "技能打磨、流程优化、可见产出；要从幕后努力转成可展示成果。",
    avoid: ["空泛说继续努力", "忽略资源/汇报/反馈机制"],
  },
  {
    cardSlug: "eight-of-pentacles",
    scenario: "emotion_healing",
    positions: ["advice"],
    meaning: "用小而重复的照护动作恢复稳定感，不要求一次想通。",
    avoid: ["把疗愈写成绩效考核", "催促用户立刻变好"],
  },
  {
    cardSlug: "five-of-wands",
    scenario: "career_work",
    positions: ["obstacle", "other"],
    meaning: "意见碰撞、标准拉扯、竞争性协作；重点是工作机制，不是个人恶意。",
    avoid: ["断言被针对", "把冲突写成失败"],
  },
  {
    cardSlug: "five-of-wands",
    scenario: "light_entertainment",
    positions: ["choice", "outcome"],
    meaning: "热闹、有刺激、有消耗；适合表达为口味、社交或身体节奏上的碰撞。",
    avoid: ["吓人成严重争吵", "过度上价值"],
  },
  {
    cardSlug: "six-of-wands",
    scenario: "light_entertainment",
    positions: ["advice", "outcome"],
    meaning: "想被看见、想赢、想有成就感；适合转成准备动作和低风险验证。",
    avoid: ["保证胜利", "绝对预测抢票/比赛结果"],
  },
  {
    cardSlug: "two-of-cups",
    scenario: "relationship_reading",
    positions: ["current_state", "relationship"],
    meaning: "互相回应、愿意靠近或有情感回响；仍需看边界和后续行动是否稳定。",
    avoid: ["注定在一起", "跳过现实互动验证"],
  },
  {
    cardSlug: "ten-of-pentacles",
    scenario: "existential_reflection",
    positions: ["current_state", "resource"],
    meaning: "意义不一定来自宏大答案，也可能来自可继承的结构、责任、关系和生活秩序。",
    avoid: ["模板化完成小事", "把生命意义简化成成功学"],
  },
];


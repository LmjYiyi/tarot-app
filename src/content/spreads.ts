import type { SpreadDefinition } from "@/lib/tarot/types";

export const spreads: SpreadDefinition[] = [
  {
    slug: "single-guidance",
    nameZh: "单张建议牌",
    summary: "只抽一张，用于今日能量、当下提醒或一个问题的简单指引。",
    detail:
      "单张牌阵适合快速聚焦。它不负责回答复杂因果，而是给出当下最值得看见的一条讯息：此刻该注意什么、该调整什么、该先做什么。",
    hero: "今日建议、当下提醒、低负担占卜",
    suitableFor: ["今日牌", "心情映照", "简单指引"],
    cardCount: 1,
    positions: [
      { order: 1, name: "核心讯息", focus: "此刻最需要看见的主题", promptHint: "把这张牌压缩成一个明确提醒和一个可执行动作。" },
    ],
  },
  {
    slug: "career-five",
    nameZh: "五张事业牌阵",
    summary: "拆开现状、阻碍、优势、近期发展和建议，适合看三个月内的事业趋势。",
    detail:
      "这套牌阵不是直接判断成败，而是把事业问题拆成可观察的结构：你现在站在哪里，卡点是什么，手里有什么资源，近期会如何移动，以及最需要注意的行动方向。",
    hero: "事业趋势、卡点识别、行动建议",
    suitableFor: ["职业发展", "换工作判断", "项目推进", "三个月趋势"],
    cardCount: 5,
    positions: [
      { order: 1, name: "现状", focus: "当前事业状态和真实处境", promptHint: "说明现状。" },
      { order: 2, name: "阻碍", focus: "正在拖慢局势的核心卡点", promptHint: "指出压力源。" },
      { order: 3, name: "优势", focus: "用户可调用的资源、能力和机会", promptHint: "说明资源。" },
      { order: 4, name: "近期发展", focus: "未来一段时间可能出现的动向", promptHint: "用趋势语气。" },
      { order: 5, name: "结果/建议", focus: "按当前路径发展的提醒和行动建议", promptHint: "给出建议。" },
    ],
  },
  {
    slug: "three-card",
    nameZh: "三张牌阵",
    summary: "用三张牌快速看清背景、当下与走向，也可切换为问题、阻碍、建议。",
    detail:
      "三张牌阵适合轻量问题。默认采用过去/背景、现在/现状、未来/走向的时间线，也可以在解读中根据问题转换为问题、阻碍、建议。",
    hero: "背景、现状、走向",
    suitableFor: ["关系问题", "工作判断", "阶段复盘", "快速占卜"],
    cardCount: 3,
    positions: [
      { order: 1, name: "过去/背景", focus: "形成当前局面的背景因素", promptHint: "说明过去或背景如何塑造现在，不要停留在历史叙述。" },
      { order: 2, name: "现在/现状", focus: "当前最真实的状态", promptHint: "聚焦此刻正在发生的情绪、关系或现实条件。" },
      { order: 3, name: "未来/走向", focus: "按当前路径继续发展的趋势", promptHint: "用倾向、主题、可能性表达，并给出调整空间。" },
    ],
  },
  {
    slug: "cross-five",
    nameZh: "五牌十字阵",
    summary: "用十字结构看问题核心、过去、现在、未来和阻碍/帮助。",
    detail:
      "五牌十字阵适合想看事情来龙去脉的问题。中心牌代表问题核心，四周牌负责补足背景、现状、发展和阻碍或帮助。",
    hero: "问题核心、来龙去脉、结果提醒",
    suitableFor: ["人际关系", "工作选择", "事件发展"],
    cardCount: 5,
    positions: [
      { order: 1, name: "问题核心", focus: "整件事的中心能量", promptHint: "先抓住全局主题，再解释其他牌如何围绕它展开。" },
      { order: 2, name: "过去", focus: "已经发生并仍有影响的背景", promptHint: "说明背景影响。" },
      { order: 3, name: "现在", focus: "当前局势的状态", promptHint: "说明现实处境。" },
      { order: 4, name: "未来", focus: "后续发展趋势", promptHint: "说明趋势而非绝对结果。" },
      { order: 5, name: "阻碍/帮助", focus: "需要辨认的助力或卡点", promptHint: "判断这张牌更像帮助还是阻碍，并给出理由。" },
    ],
  },
  {
    slug: "relationship-six",
    nameZh: "六张关系牌阵",
    summary: "分别看我、对方、关系现状、阻碍、未来趋势和建议。",
    detail:
      "这套牌阵适合感情、人际或合作关系。重点不是替对方下定论，而是观察双方状态、互动结构和更现实的沟通修复路径。",
    hero: "关系状态、互动错位、沟通建议",
    suitableFor: ["感情关系", "暧昧关系", "合作关系", "亲密沟通"],
    cardCount: 6,
    positions: [
      { order: 1, name: "我", focus: "用户当前的感受和位置", promptHint: "说明用户投射出的状态。" },
      { order: 2, name: "对方", focus: "对方可能呈现的状态", promptHint: "避免替对方做绝对判断。" },
      { order: 3, name: "关系现状", focus: "两人之间正在发生什么", promptHint: "聚焦互动结构。" },
      { order: 4, name: "阻碍", focus: "关系里的主要卡点", promptHint: "指出误解、压力或边界问题。" },
      { order: 5, name: "未来趋势", focus: "近期关系的走向", promptHint: "描述趋势和可调整处。" },
      { order: 6, name: "建议", focus: "更合适的沟通或行动方式", promptHint: "给出具体建议。" },
    ],
  },
  {
    slug: "lovers-pyramid",
    nameZh: "恋人金字塔",
    summary: "四张牌看你、对方、关系本身和未来发展。",
    detail:
      "恋人金字塔视觉清晰，适合情侣、暧昧或关系确认。它会把个人状态和关系结构分开，避免把所有问题都归因到某一方。",
    hero: "你、对方、关系、发展",
    suitableFor: ["恋爱关系", "暧昧判断", "关系复盘"],
    cardCount: 4,
    positions: [
      { order: 1, name: "你", focus: "你在关系中的状态", promptHint: "说明用户自身状态。" },
      { order: 2, name: "对方", focus: "对方可能呈现的状态", promptHint: "保持克制，不绝对化。" },
      { order: 3, name: "关系", focus: "你们之间的连接方式", promptHint: "说明关系结构。" },
      { order: 4, name: "发展", focus: "近期发展或结果提醒", promptHint: "给出趋势和建议。" },
    ],
  },
  {
    slug: "path-of-choice",
    nameZh: "选择之路",
    summary: "七张牌比较 A/B 两条路径的机会、代价、隐藏因素与建议。",
    detail:
      "选择之路适合换工作、合作、去留和方向判断。它会同时看两条路径，不把复杂决策简化成单纯的好坏。",
    hero: "路径对比、代价识别、决策支持",
    suitableFor: ["职业选择", "去留判断", "计划排序", "合作选择"],
    cardCount: 7,
    positions: [
      { order: 1, name: "选 A 现状", focus: "路径 A 当前的基础", promptHint: "说明 A 的现实状态。" },
      { order: 2, name: "A 结果", focus: "路径 A 的发展结果", promptHint: "说明 A 的机会与代价。" },
      { order: 3, name: "选 B 现状", focus: "路径 B 当前的基础", promptHint: "说明 B 的现实状态。" },
      { order: 4, name: "B 结果", focus: "路径 B 的发展结果", promptHint: "说明 B 的机会与代价。" },
      { order: 5, name: "隐藏因素", focus: "暂时没被看见的变量", promptHint: "指出盲点或隐藏资源。" },
      { order: 6, name: "建议", focus: "做选择前最需要调整的点", promptHint: "给出决策前动作。" },
      { order: 7, name: "总结", focus: "整体倾向和提醒", promptHint: "平衡表达，不替用户做绝对决定。" },
    ],
  },
  {
    slug: "self-state",
    nameZh: "自我状态牌阵",
    summary: "五张牌看外在状态、内在情绪、压力源、需要看见的东西和调整方向。",
    detail:
      "自我状态牌阵适合情绪整理和阶段复盘。它把问题从“我是不是不行”外化为“哪些压力正在影响我，以及我可以怎么调整”。",
    hero: "情绪整理、压力外化、调整方向",
    suitableFor: ["自我复盘", "情绪整理", "压力状态", "阶段调整"],
    cardCount: 5,
    positions: [
      { order: 1, name: "外在状态", focus: "别人容易看到的表现", promptHint: "说明外在呈现。" },
      { order: 2, name: "内在情绪", focus: "内心真实感受", promptHint: "说明内在体验。" },
      { order: 3, name: "压力源", focus: "正在影响用户的压力", promptHint: "把问题外化表达。" },
      { order: 4, name: "需要看见的东西", focus: "被忽略的需求或事实", promptHint: "指出需要承认的部分。" },
      { order: 5, name: "调整方向", focus: "下一步更稳的调整方式", promptHint: "给出可执行建议。" },
    ],
  },
  {
    slug: "celtic-cross",
    nameZh: "凯尔特十字",
    summary: "十张牌看核心问题、阻碍、过去、未来、内外因素与最终趋势。",
    detail:
      "凯尔特十字是进阶深度牌阵，适合复杂局势、长期关系和关键转折。解读时要整合结构，不要逐张平铺。",
    hero: "深度全景、长期议题、关键转折",
    suitableFor: ["复杂关系", "多变量事业局面", "人生阶段转折"],
    cardCount: 10,
    positions: [
      { order: 1, name: "核心问题", focus: "问题中心", promptHint: "先解释核心张力。" },
      { order: 2, name: "阻碍", focus: "正在干扰局面的力量", promptHint: "分析冲突来源。" },
      { order: 3, name: "过去影响", focus: "近期已发生的影响", promptHint: "说明过去如何塑造现在。" },
      { order: 4, name: "理想状态", focus: "用户期待或意识目标", promptHint: "说明显性期待。" },
      { order: 5, name: "过去远因", focus: "更深层的背景和根源", promptHint: "说明深层动机或历史背景。" },
      { order: 6, name: "未来走向", focus: "短期内会出现的变化", promptHint: "聚焦未来 2-6 周。" },
      { order: 7, name: "个人态度", focus: "用户对这件事的姿态", promptHint: "解释用户当前能量状态。" },
      { order: 8, name: "环境因素", focus: "他人、环境或现实条件", promptHint: "说明外部力量。" },
      { order: 9, name: "希望与担心", focus: "期待与焦虑并存的位置", promptHint: "指出矛盾心理。" },
      { order: 10, name: "最终趋势", focus: "按当前路径发展的落点", promptHint: "描述结果趋势与可调整点。" },
    ],
  },
];

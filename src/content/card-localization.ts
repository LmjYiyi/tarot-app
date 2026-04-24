import type { Suit, TarotCard } from "@/lib/tarot/types";

type MajorText = {
  nameZh: string;
  keywordsUpright: string[];
  keywordsReversed: string[];
  upright: string;
  reversed: string;
  love: string;
  career: string;
};

const majorTexts: Record<string, MajorText> = {
  "The Fool": {
    nameZh: "愚者",
    keywordsUpright: ["开始", "自由", "信任", "探索"],
    keywordsReversed: ["冲动", "逃避", "轻率", "失焦"],
    upright: "新的阶段正在打开，重点是带着好奇和信任迈出第一步，同时保留基本判断。",
    reversed: "可能想急着摆脱现状，却还没有看清风险；也可能因为害怕犯错而迟迟不动。",
    love: "感情里强调新鲜感、自然靠近和重新认识彼此，但需要避免只凭冲动行动。",
    career: "事业上适合尝试新方向、跨界或启动新计划，关键是小步探索而不是盲跳。",
  },
  "The Magician": {
    nameZh: "魔术师",
    keywordsUpright: ["执行力", "资源整合", "表达", "主导"],
    keywordsReversed: ["操控", "空转", "包装过度", "分心"],
    upright: "你手里已有可调用的资源，真正的重点是聚焦、表达和把想法落成行动。",
    reversed: "容易说得漂亮但落地不足，或为了掌控结果而过度操作局面。",
    love: "关系里需要主动沟通与明确表达，也要留意话术大于真实行动。",
    career: "有利于提案、谈判、启动项目和资源整合，靠技能与表达拿结果。",
  },
  "The High Priestess": {
    nameZh: "女祭司",
    keywordsUpright: ["直觉", "观察", "内在知识", "保留"],
    keywordsReversed: ["信号混乱", "压抑感受", "误判", "封闭"],
    upright: "答案暂时不在表面，适合放慢速度，观察细节并相信尚未说出口的感受。",
    reversed: "你可能感觉到不对劲却被外界噪音带偏，也可能因为封闭而错过信息。",
    love: "关系中常指暧昧、未明说的情绪或需要更多观察的阶段。",
    career: "工作上适合调研、蓄力和策略思考，不宜被催促下仓促表态。",
  },
  "The Empress": {
    nameZh: "皇后",
    keywordsUpright: ["滋养", "丰盛", "吸引力", "创造"],
    keywordsReversed: ["过度付出", "匮乏", "依赖", "失衡"],
    upright: "资源、关系或创意正在生长，重点是稳定培育而不是急着收割。",
    reversed: "可能照顾别人太多而忽略自己，或用物质与情绪补偿掩盖匮乏。",
    love: "感情里代表被爱、接纳和柔软真实的连接。",
    career: "有利于创意产出、个人品牌、审美和用户体验相关工作。",
  },
  "The Emperor": {
    nameZh: "皇帝",
    keywordsUpright: ["秩序", "责任", "边界", "管理"],
    keywordsReversed: ["僵化", "控制欲", "压迫", "失序"],
    upright: "需要建立结构、规则和边界，让局面回到可管理状态。",
    reversed: "稳定可能变成僵化，权威、规则或控制欲正在制造压力。",
    love: "关系里提示承诺、责任与规则，也可能出现强势的一方。",
    career: "适合制度建设、管理、预算和长期规划，但要避免高压控制。",
  },
  "The Hierophant": {
    nameZh: "教皇",
    keywordsUpright: ["传统", "指导", "价值观", "规范"],
    keywordsReversed: ["教条", "反叛", "不合群", "质疑规则"],
    upright: "需要借助经验、规则或可信任的指导，先理解系统再行动。",
    reversed: "既有规则可能不再适配你，适合重新审视权威和价值观。",
    love: "关系里强调承诺、共同价值和正式化，也提示别被传统期待绑住。",
    career: "适合培训、咨询、组织体系和专业认证相关议题。",
  },
  "The Lovers": {
    nameZh: "恋人",
    keywordsUpright: ["选择", "契合", "关系", "价值一致"],
    keywordsReversed: ["摇摆", "价值冲突", "关系失衡", "逃避选择"],
    upright: "核心是对齐价值并做出真诚选择，不只是被吸引。",
    reversed: "选择背后存在价值冲突，或关系中有人没有真正承担决定。",
    love: "感情里代表吸引、契合与关系选择，也要求诚实沟通。",
    career: "事业上常指合作、双向选择和价值匹配。",
  },
  "The Chariot": {
    nameZh: "战车",
    keywordsUpright: ["推进", "意志", "胜利", "掌控方向"],
    keywordsReversed: ["失控", "硬冲", "方向分裂", "内耗"],
    upright: "需要把分散力量统一起来，用明确目标推动局面前进。",
    reversed: "可能太急于推进，导致方向混乱、对抗升级或体力透支。",
    love: "关系里提示需要共同方向，否则容易变成拉扯和较劲。",
    career: "事业上适合冲刺、竞争和主动争取，但要先校准路线。",
  },
  Strength: {
    nameZh: "力量",
    keywordsUpright: ["温柔的力量", "耐心", "自控", "勇气"],
    keywordsReversed: ["压抑", "失控", "自我怀疑", "消耗"],
    upright: "真正的力量来自耐心、自控和柔韧，而不是强硬压制。",
    reversed: "可能在压抑情绪或怀疑自己，需要先恢复内在稳定。",
    love: "感情里强调温柔沟通、包容和稳定陪伴。",
    career: "工作上适合稳住节奏、处理冲突和长期坚持。",
  },
  "The Hermit": {
    nameZh: "隐者",
    keywordsUpright: ["独处", "内省", "寻找方向", "智慧"],
    keywordsReversed: ["孤立", "退缩", "过度封闭", "迷路"],
    upright: "适合暂时远离噪音，回到自己的判断和长期方向。",
    reversed: "独处可能变成孤立，思考过多却迟迟不与现实接触。",
    love: "关系里可能需要空间，也可能提示情感距离变大。",
    career: "事业上适合研究、复盘、沉淀专业能力和重新定位。",
  },
  "Wheel of Fortune": {
    nameZh: "命运之轮",
    keywordsUpright: ["转机", "周期", "变化", "时机"],
    keywordsReversed: ["卡住", "重复循环", "抗拒变化", "失去节奏"],
    upright: "局势进入变化周期，机会来自顺势而动和抓住时机。",
    reversed: "你可能在重复旧模式，越抗拒变化越容易被局势推着走。",
    love: "关系中代表阶段变化、重逢或模式循环。",
    career: "事业上常指机会窗口、行业变化或节奏转换。",
  },
  Justice: {
    nameZh: "正义",
    keywordsUpright: ["公平", "因果", "判断", "契约"],
    keywordsReversed: ["不公", "偏见", "逃避责任", "失衡"],
    upright: "需要基于事实做判断，承担选择的后果并维护边界。",
    reversed: "可能存在信息不对称、不公平或对责任的回避。",
    love: "关系里强调公平、责任和清楚的边界。",
    career: "适合法务、合同、绩效、制度和需要客观判断的议题。",
  },
  "The Hanged Man": {
    nameZh: "倒吊人",
    keywordsUpright: ["暂停", "换视角", "臣服", "等待"],
    keywordsReversed: ["拖延", "无谓牺牲", "僵住", "抗拒"],
    upright: "局势需要暂停和换角度，暂时不动也可能是在积累理解。",
    reversed: "等待可能已经变成拖延，或你正在做没有必要的牺牲。",
    love: "关系里提示卡住、等待或需要换位理解。",
    career: "工作上适合重新审视策略，但要警惕长期停滞。",
  },
  Death: {
    nameZh: "死神",
    keywordsUpright: ["结束", "转化", "告别", "更新"],
    keywordsReversed: ["抗拒结束", "拖住旧事", "停滞", "害怕变化"],
    upright: "某个旧阶段需要结束，腾出空间给真正的新变化。",
    reversed: "你可能明知该放下，却仍被旧模式牵住。",
    love: "关系中代表阶段结束、关系转型或旧互动模式必须改变。",
    career: "事业上提示重组、离开旧路径或结束不再有效的项目。",
  },
  Temperance: {
    nameZh: "节制",
    keywordsUpright: ["平衡", "整合", "疗愈", "耐心"],
    keywordsReversed: ["失衡", "过度", "节奏混乱", "难以整合"],
    upright: "需要把对立因素慢慢调和，恢复稳定节奏。",
    reversed: "当前节奏失衡，可能一边过度用力一边忽略恢复。",
    love: "关系里强调磨合、理解和耐心修复。",
    career: "适合协调资源、跨部门合作和渐进优化。",
  },
  "The Devil": {
    nameZh: "恶魔",
    keywordsUpright: ["束缚", "欲望", "依赖", "诱惑"],
    keywordsReversed: ["松绑", "看见控制", "脱离依赖", "清醒"],
    upright: "某种欲望、依赖或恐惧正在绑住你，需要先看清它的代价。",
    reversed: "你开始意识到旧束缚，并有机会从依赖或控制里松动出来。",
    love: "关系里可能涉及强吸引、占有、依赖或不健康模式。",
    career: "事业上提示利益诱惑、过劳绑定或被资源关系牵制。",
  },
  "The Tower": {
    nameZh: "高塔",
    keywordsUpright: ["崩塌", "真相", "突变", "重建"],
    keywordsReversed: ["延迟爆发", "拒绝面对", "余震", "避免崩溃"],
    upright: "不稳的结构会被打破，虽然冲击强，但能暴露真实问题。",
    reversed: "你可能已经察觉问题，却还在拖延面对结构性风险。",
    love: "关系里常指真相暴露、冲突爆发或旧安全感被打破。",
    career: "事业上提示组织变化、项目失控或必须重建基础。",
  },
  "The Star": {
    nameZh: "星星",
    keywordsUpright: ["希望", "疗愈", "愿景", "恢复"],
    keywordsReversed: ["失望", "信心不足", "理想遥远", "疲惫"],
    upright: "经历消耗后开始恢复信心，愿景重新变得可感。",
    reversed: "你可能对未来失去信心，需要先恢复能量而不是强行乐观。",
    love: "关系里代表疗愈、温柔的希望和重新建立信任。",
    career: "事业上有利于长期愿景、个人品牌和慢慢恢复声量。",
  },
  "The Moon": {
    nameZh: "月亮",
    keywordsUpright: ["不确定", "潜意识", "迷雾", "敏感"],
    keywordsReversed: ["真相浮现", "走出混乱", "焦虑减弱", "识破幻象"],
    upright: "信息仍不清晰，情绪和想象容易放大问题，需要先确认事实。",
    reversed: "迷雾开始散开，之前模糊的担心或误解会慢慢显形。",
    love: "关系里常指暧昧、不安、猜测和未明说的情绪。",
    career: "事业上提示信息不透明、方向不明或焦虑干扰判断。",
  },
  "The Sun": {
    nameZh: "太阳",
    keywordsUpright: ["明朗", "成功", "活力", "看见"],
    keywordsReversed: ["延迟", "过度乐观", "能量不足", "遮蔽"],
    upright: "局势变得清楚，能量回升，适合坦诚表达和主动展示。",
    reversed: "好消息可能延迟，或你对局势的乐观需要更多现实支撑。",
    love: "关系里代表坦诚、快乐、公开和积极互动。",
    career: "事业上有利于曝光、成果展示、认可和正向推进。",
  },
  Judgement: {
    nameZh: "审判",
    keywordsUpright: ["觉醒", "复盘", "召唤", "新阶段"],
    keywordsReversed: ["逃避审视", "自责", "迟迟不决", "旧账"],
    upright: "到了复盘和做出关键回应的时候，旧经验会帮助你进入新阶段。",
    reversed: "你可能因自责或害怕被评价而拖延改变。",
    love: "关系里可能出现复合、摊牌、复盘或重要决定。",
    career: "事业上适合总结成果、重新定位和回应新的召唤。",
  },
  "The World": {
    nameZh: "世界",
    keywordsUpright: ["完成", "整合", "圆满", "新循环"],
    keywordsReversed: ["未完成", "收尾困难", "差一步", "闭环不足"],
    upright: "一个阶段接近完成，经验正在整合成更成熟的你。",
    reversed: "事情差最后一段收尾，可能需要补齐细节或完成交付。",
    love: "关系里代表成熟、稳定、阶段完成或共同进入新周期。",
    career: "事业上提示项目收官、成果整合、跨地域或更大平台。",
  },
};

const suitText: Record<Suit, { zh: string; theme: string; career: string; love: string }> = {
  wands: {
    zh: "权杖",
    theme: "行动力、热情、创造和主动推进",
    career: "事业上与主动争取、项目推进、野心和执行节奏有关",
    love: "关系里强调热度、吸引、主动性和相处节奏",
  },
  cups: {
    zh: "圣杯",
    theme: "情绪、关系、感受和内在需求",
    career: "事业上与团队氛围、创造感、情绪投入和价值感有关",
    love: "关系里强调情感流动、亲密需求、回应和安全感",
  },
  swords: {
    zh: "宝剑",
    theme: "思考、沟通、冲突和判断",
    career: "事业上与决策、沟通、压力、策略和信息处理有关",
    love: "关系里强调沟通方式、误解、边界和理性判断",
  },
  pentacles: {
    zh: "星币",
    theme: "现实资源、金钱、身体和长期积累",
    career: "事业上与收入、技能、稳定性、资源和长期建设有关",
    love: "关系里强调稳定、承诺、现实条件和日常投入",
  },
};

const rankText: Record<
  string,
  { zh: string; upright: string; reversed: string; keywordsUpright: string[]; keywordsReversed: string[] }
> = {
  Ace: {
    zh: "王牌",
    upright: "新的种子和机会正在出现，重点是看见它并开始投入。",
    reversed: "机会尚未完全落地，可能卡在启动、信心或资源准备上。",
    keywordsUpright: ["新机会", "种子", "启动", "潜力"],
    keywordsReversed: ["延迟", "错过", "准备不足", "空想"],
  },
  Two: {
    zh: "二",
    upright: "需要在两股力量之间协调，做出更清楚的选择或配合。",
    reversed: "两边拉扯导致摇摆，合作或平衡感正在失稳。",
    keywordsUpright: ["选择", "平衡", "配合", "协调"],
    keywordsReversed: ["摇摆", "失衡", "犹豫", "错位"],
  },
  Three: {
    zh: "三",
    upright: "事情进入扩展和协作阶段，适合让想法走向现实互动。",
    reversed: "协作不顺或期待落差，扩展前需要先补齐基础。",
    keywordsUpright: ["扩展", "协作", "表达", "成长"],
    keywordsReversed: ["分散", "不合拍", "延误", "基础不稳"],
  },
  Four: {
    zh: "四",
    upright: "局势需要稳定、休整或建立边界，让能量沉淀下来。",
    reversed: "稳定可能变成停滞，安全感过度会限制流动。",
    keywordsUpright: ["稳定", "休整", "基础", "边界"],
    keywordsReversed: ["停滞", "封闭", "僵化", "不安"],
  },
  Five: {
    zh: "五",
    upright: "冲突、损失或压力浮出水面，需要面对现实中的不舒服。",
    reversed: "冲突有机会缓和，但仍需要收拾残局并调整策略。",
    keywordsUpright: ["冲突", "压力", "损耗", "挑战"],
    keywordsReversed: ["缓和", "止损", "修复", "走出对抗"],
  },
  Six: {
    zh: "六",
    upright: "局势开始过渡或恢复，能看见互助、进展和阶段性回报。",
    reversed: "恢复速度慢，旧模式或不平衡交换仍在拖住你。",
    keywordsUpright: ["恢复", "过渡", "互助", "进展"],
    keywordsReversed: ["迟滞", "不平等", "依赖", "旧模式"],
  },
  Seven: {
    zh: "七",
    upright: "需要评估、坚持或辨认复杂选项，不能只看表面。",
    reversed: "可能分心、逃避或判断失真，需要重新校准优先级。",
    keywordsUpright: ["评估", "坚持", "辨认", "策略"],
    keywordsReversed: ["分心", "逃避", "误判", "疲惫"],
  },
  Eight: {
    zh: "八",
    upright: "能量进入推进、练习或突破阶段，行动会带来反馈。",
    reversed: "速度或重复模式出了问题，可能太急也可能困在惯性里。",
    keywordsUpright: ["推进", "练习", "突破", "效率"],
    keywordsReversed: ["卡住", "焦躁", "重复", "效率低"],
  },
  Nine: {
    zh: "九",
    upright: "接近成熟阶段，个人状态、收获或承压能力成为重点。",
    reversed: "可能过度紧绷、满足感不足或把压力独自扛太久。",
    keywordsUpright: ["成熟", "收获", "独立", "承受力"],
    keywordsReversed: ["紧绷", "不满足", "孤立", "透支"],
  },
  Ten: {
    zh: "十",
    upright: "一个周期走到高峰或终点，成果、负担和收尾同时出现。",
    reversed: "负担需要释放，旧周期如果不结束会持续消耗。",
    keywordsUpright: ["完成", "高峰", "责任", "收尾"],
    keywordsReversed: ["释放", "过载", "未完成", "循环"],
  },
  Page: {
    zh: "侍从",
    upright: "新学习、新消息和新态度出现，适合保持好奇并开始练习。",
    reversed: "经验不足或表达不成熟，热情需要被训练成能力。",
    keywordsUpright: ["学习", "消息", "好奇", "起步"],
    keywordsReversed: ["幼稚", "分心", "不成熟", "停留想法"],
  },
  Knight: {
    zh: "骑士",
    upright: "行动正在加速，方向、节奏和动机决定结果质量。",
    reversed: "行动可能过猛、过慢或偏离目标，需要调整节奏。",
    keywordsUpright: ["行动", "推进", "追求", "动机"],
    keywordsReversed: ["鲁莽", "拖延", "偏离", "急躁"],
  },
  Queen: {
    zh: "王后",
    upright: "成熟的接纳、滋养和内在掌控力正在发挥作用。",
    reversed: "边界、情绪或自我照顾失衡，需要把能量收回自己身上。",
    keywordsUpright: ["成熟", "接纳", "滋养", "内在掌控"],
    keywordsReversed: ["失衡", "过度付出", "敏感", "边界薄"],
  },
  King: {
    zh: "国王",
    upright: "成熟的掌控、责任和领导力可以稳定局面。",
    reversed: "掌控可能变成压迫，或责任感不足导致局面失序。",
    keywordsUpright: ["掌控", "领导", "责任", "稳定"],
    keywordsReversed: ["控制欲", "僵化", "独断", "失责"],
  },
};

function resolveMinor(card: TarotCard): Partial<TarotCard> | null {
  if (!card.suit) {
    return null;
  }

  const rank = card.nameEn.split(" of ")[0];
  const suit = suitText[card.suit];
  const rankInfo = rankText[rank];

  if (!suit || !rankInfo) {
    return null;
  }

  return {
    nameZh: `${suit.zh}${rankInfo.zh}`,
    keywordsUpright: [...rankInfo.keywordsUpright, suit.theme.split("、")[0]],
    keywordsReversed: rankInfo.keywordsReversed,
    meaningUpright: `${suit.zh}${rankInfo.zh}正位表示${rankInfo.upright}这张牌的底色是${suit.theme}。`,
    meaningReversed: `${suit.zh}${rankInfo.zh}逆位表示${rankInfo.reversed}它提醒你重新处理${suit.theme}相关的现实课题。`,
    loveMeaning: suit.love,
    careerMeaning: suit.career,
  };
}

export function localizeCard(card: TarotCard): TarotCard {
  const major = majorTexts[card.nameEn];
  const minor = resolveMinor(card);

  if (major) {
    return {
      ...card,
      nameZh: major.nameZh,
      keywordsUpright: major.keywordsUpright,
      keywordsReversed: major.keywordsReversed,
      meaningUpright: major.upright,
      meaningReversed: major.reversed,
      loveMeaning: major.love,
      careerMeaning: major.career,
    };
  }

  if (minor) {
    return {
      ...card,
      ...minor,
    };
  }

  return card;
}

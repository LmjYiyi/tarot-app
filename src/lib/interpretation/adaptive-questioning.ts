import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";
import type {
  AdaptiveQuestion,
  DrawnCard,
  ReadingIntent,
  SpreadDefinition,
  TarotCard,
} from "@/lib/tarot/types";

type BuildAdaptiveQuestionInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  readingIntent?: ReadingIntent;
  locale?: string;
  questionCount?: number;
};

type ResolvedQuestionCard = {
  card: TarotCard;
  position: SpreadDefinition["positions"][number];
  orientation: "正位" | "逆位";
  keywords: string[];
  meaning: string;
};

type StructuredCardMeaning = {
  id: string;
  card: string;
  position: string;
  suit: TarotCard["suit"] | "major";
  number: number;
  orientation: "正位" | "逆位";
  keywords: string[];
  specificFocus: string;
  avoidFocus: string[];
  possibleUserFeelings: string[];
  domainMapping: string;
  meaning: string;
};

type CardFocus = {
  trueFocus: string;
  avoidFocus: string[];
  tensionClause: string;
  overallOption: string;
  question: string;
  purpose: string;
  options: string[];
  priority: number;
};

export type AdaptiveQuestionPayload = {
  domain: string;
  coreTension: string;
  questionStrategy: string;
  questions: AdaptiveQuestion[];
  cardMeanings: StructuredCardMeaning[];
  userPrompt: string;
};

export type AdaptiveQuestionReview = {
  score: number;
  problems: string[];
  rewriteRequired: boolean;
  rewriteReasons: string[];
  improvementInstructions: string[];
  approvedQuestionIds: string[];
  questionIdsToRewrite: string[];
};

const domainLabels: Record<ReadingIntent["domain"], string> = {
  career: "事业",
  love: "感情",
  study: "学业",
  relationship: "人际关系",
  self: "自我状态",
  decision: "决策",
};

const goalLabels: Record<ReadingIntent["goal"], string> = {
  trend: "看趋势",
  obstacle: "看阻碍",
  advice: "看建议",
  decision: "辅助决策",
  other_view: "换个视角",
};

export const ADAPTIVE_QUESTION_SYSTEM_PROMPT = [
  "你是 Projectio 塔罗系统中的“牌面知觉追问润色器”。",
  "系统已经在本地完成牌义读取、单牌聚焦、核心张力和候选问题生成。你的任务是在不改变方向的前提下，把候选问题润色成自然、贴近用户主观体验的 2 到 4 个“心理知觉”问题。",
  "",
  "核心准则——这些问题不是问卷，不是让用户对照牌义打勾：",
  "- 必须问用户的主观感受、第一反应、视觉直觉、身体感和联想。",
  "- 例如：看到这张牌你最先注意到什么？牌面是亮的还是暗的？是因为牌名、画面还是某种氛围让你停留？身体里是更紧还是更松？",
  "- 不要问“这种课题有没有出现在你的处境里”“你觉得这种感觉对应你现在吗”这种直面对照式问题。",
  "",
  "规则：",
  "1. 不要输出 card_focus_analysis 或 quality_check。",
  "2. 不要解牌、不要预测、不要替用户下结论。",
  "3. 不要推翻 local_card_focus；具体牌义高于花色通用含义。",
  "4. 每个问题都必须保留候选问题里的牌名、正逆位或牌阵位置作为定位词。",
  "5. 选项必须贴合本地候选选项的“知觉/感受”取向，不要改成阶段开始/阶段结束/失控/看清这种通用阶段模板。",
  "6. 不要触发 avoid_focus，例如不要把命运之轮写成行动力，不要把星币四逆位写成休息。",
  "7. 问题数量必须等于输入的 question_count。",
  "8. 输出必须是合法 JSON，不能有 Markdown、注释、尾逗号或多余解释。",
  "",
  "输出格式：{\"core_tension\":\"一句自然中文核心张力\",\"question_strategy\":\"一句简短策略\",\"questions\":[{\"id\":\"q1\",\"question\":\"问题\",\"basis\":\"依据\",\"purpose\":\"目的\",\"answer_type\":\"choice\",\"options\":[\"选项1\",\"选项2\",\"选项3\",\"说不上来\"]}]}",
].join("\n");

export const ADAPTIVE_QUESTION_REVIEW_PROMPT = [
  "你是 Projectio 塔罗系统的问题质量审查器。",
  "你的任务是检查“牌面触发追问”是否合格。",
  "请按 card_specificity、position_awareness、domain_relevance、neutrality、option_quality、coverage、core_tension_quality、consistency、avoid_focus_check 评分。",
  "硬性规则：如果问题触发任何 avoid_focus、没有覆盖现状位、核心张力只是关键词堆叠、出现不存在的牌类或牌面信息，rewrite_required 必须为 true。",
  "低于 80 分必须重写；低于 70 分必须重新读取牌义后重写。",
  "只输出 JSON，不要输出多余解释。",
].join("\n");

function clampQuestionCount(count: number | undefined, cardCount: number) {
  const fallback = cardCount <= 1 ? 2 : Math.min(4, cardCount + 1);
  const nextCount = count ?? fallback;
  return Math.min(4, Math.max(2, nextCount));
}

function resolveQuestionCards(
  spread: SpreadDefinition | null,
  cards: DrawnCard[],
): ResolvedQuestionCard[] {
  return cards
    .map((drawnCard) => {
      const card = getCardById(drawnCard.cardId);
      const position = spread?.positions.find((item) => item.order === drawnCard.positionOrder);

      if (!card || !position) {
        return null;
      }

      return {
        card,
        position,
        orientation: drawnCard.reversed ? "逆位" : "正位",
        keywords: drawnCard.reversed ? card.keywordsReversed : card.keywordsUpright,
        meaning: drawnCard.reversed ? card.meaningReversed : card.meaningUpright,
      };
    })
    .filter((value): value is ResolvedQuestionCard => Boolean(value));
}

function summarizeIntent(intent: ReadingIntent | undefined) {
  if (!intent) return "未选择领域与目标";
  return `${domainLabels[intent.domain]} / ${goalLabels[intent.goal]}`;
}

function getCardFocus(card: ResolvedQuestionCard): CardFocus {
  const role = getPositionRole(card);
  const isReversed = card.orientation === "逆位";

  if (card.card.nameEn === "Wheel of Fortune") {
    return {
      trueFocus: "变化、周期、转折点、时机、外部局势推动、事情不是完全由自己掌控",
      avoidFocus: ["不要主要问行动力", "不要主要问急迫", "不要主要问被要求变强", "不要主要问暂时点不起来"],
      tensionClause: `${card.position.name}里的命运之轮像一轮已经发生的变化、机会或外部局势推动`,
      overallOption: "事情正在变化，但我还没完全适应",
      question: `${role}，它有没有让你想到一个曾经改变节奏的转折？`,
      purpose: "确认过去或背景里是否有机会、变化、起伏或外部局势推动仍在影响当前状态",
      options: [
        "有一件事突然改变了原来的状态",
        "有一个机会或变化出现过",
        "我感觉自己是被外部变化推着走",
        "我经历过一轮起伏，现在还在受它影响",
        "没有明显联想",
      ],
      priority: 76,
    };
  }

  if (card.card.suit === "pentacles" && card.card.number === 4) {
    return {
      trueFocus: isReversed
        ? "安全感、资源控制、抓太紧、害怕失去、稳定变停滞、想放手但缺少安全感"
        : "守住资源、安全感、防御、稳定、边界、对失去的担心",
      avoidFocus: ["不要主要问休息", "不要主要问情绪依赖", "不要主要问行动冲劲"],
      tensionClause: `${card.position.name}里的星币四${isReversed ? "逆位" : "正位"}指向安全感、资源和稳定性问题`,
      overallOption: isReversed ? "我很想稳住，但又感觉有点卡住" : "我很想守住已有的稳定",
      question: isReversed
        ? `${role}，你看到它时，更像哪种感觉？`
        : `${role}，你看到它时，更像是在守住安全感、资源，还是有点不敢放松？`,
      purpose: "确认当前卡点是否与安全感、资源、控制、放手困难或稳定变停滞有关",
      options: isReversed
        ? [
            "我现在很想稳住，暂时不敢乱动",
            "我知道自己抓得太紧，但很难放松",
            "我担心资源、钱、工作、安全感不够",
            "现在的稳定已经变成了停滞",
            "我其实想放手或改变，但还没安全感",
          ]
        : [
            "我想先守住已有的东西",
            "我担心一放松就会失去",
            "我在意钱、资源或现实稳定",
            "我感觉自己有点防御",
            "没有明显感觉",
          ],
      priority: 92,
    };
  }

  if (card.card.suit === "cups" && card.card.number === 10) {
    return {
      trueFocus: "情绪满足、关系和谐、家庭/团队归属、被回应的期待、理想中的圆满状态",
      avoidFocus: ["不要直接断定现实已经圆满", "不要忽略理想与现实的落差", "不要主要问行动力"],
      tensionClause: `${card.position.name}里的圣杯十把被支持、被回应和归属感的期待带了出来`,
      overallOption: "我期待一种更被支持、更有归属感的状态",
      question: `${role}给你的感觉，更像现实里已经有的支持，还是你心里期待的理想状态？`,
      purpose: "确认圣杯十代表现实中的支持资源、用户想要的结果，还是理想与现实的落差",
      options: [
        "现实里确实有一些支持和温暖",
        "这是我很想要的结果",
        "它让我想到关系、家庭、团队或归属感",
        "它反而让我感觉理想和现实有落差",
        "没有明显感觉",
      ],
      priority: 82,
    };
  }

  if (card.card.suit === "swords" && card.card.number === 4) {
    return {
      trueFocus: "暂停、休息、恢复、冷静期、从压力或冲突中抽离",
      avoidFocus: ["不要主要问资源控制", "不要主要问关系圆满"],
      tensionClause: `${card.position.name}里的宝剑四指向暂停、恢复或被迫停下来的感受`,
      overallOption: "我像是需要先停下来恢复一下",
      question: `${role}给你的感觉，是舒服的休息，还是压抑的停滞？`,
      purpose: "确认停顿对用户来说是必要恢复，还是难受的卡住",
      options: ["舒服的休息", "压抑的停滞", "又想休息又焦虑", "被迫停住", "没明显感觉"],
      priority: 88,
    };
  }

  if (card.card.suit === "wands") {
    if (card.card.number === 4) {
      return {
        trueFocus: isReversed
          ? "稳定感不稳、归属感不足、庆祝或认可落空、环境不踏实、内部不协调"
          : "阶段性完成、庆祝、稳定、归属感、家庭/团队支持、被接纳",
        avoidFocus: ["不要主要问行动力", "不要主要问急迫", "不要主要问被要求变强"],
        tensionClause: `${card.position.name}里的权杖四${isReversed ? "逆位" : "正位"}指向稳定感、归属感和阶段成果是否落地`,
        overallOption: isReversed ? "原本想稳定下来，但现在有点不踏实" : "我想确认这份稳定和归属感",
        question: isReversed
          ? `${role}让你更想到稳定感不稳、归属感不足，还是成果没有被真正认可？`
          : `${role}让你更想到阶段成果被认可、关系里的归属感，还是一个终于可以落地的状态？`,
        purpose: "确认权杖四在此处对应的是稳定、归属、认可，还是这些期待的落空",
        options: isReversed
          ? ["稳定感不稳", "没有归属感", "成果没被认可", "环境表面稳定但内里不踏实", "没有明显感觉"]
          : ["阶段成果被认可", "有归属或团队支持", "终于可以落地", "想庆祝但还不确定", "没有明显感觉"],
        priority: 88,
      };
    }

    return {
      trueFocus: "行动力、热情、欲望、推进、冒险、变强或突破的冲动",
      avoidFocus: ["不要主要问资源安全感", "不要主要问情绪归属", "不要主要问外部命运推动"],
      tensionClause: `${card.position.name}里的${card.card.nameZh}带出行动、推进和能量状态`,
      overallOption: "我能感觉到某种想推进的力量",
      question: `${role}里的行动感，对你来说更像动力、急迫、被要求变强，还是暂时点不起来？`,
      purpose: "确认用户对行动主题是共鸣、抗拒，还是感到被催促",
      options: ["有动力", "有点急", "被要求变强", "暂时点不起来", "说不上来"],
      priority: 66,
    };
  }

  if (card.card.suit === "cups") {
    return {
      trueFocus: "情绪、关系、依恋、回应、失望、被理解或想放下的感受",
      avoidFocus: ["不要主要问事业冲劲", "不要主要问钱与资源"],
      tensionClause: `${card.position.name}里的${card.card.nameZh}触发情绪、关系和回应期待`,
      overallOption: "我更在意被理解、被回应或关系里的感受",
      question: `${role}让你更想到某个人、自己的情绪、期待被回应，还是想先放下？`,
      purpose: "确认牌面中的情绪象征连接到关系对象、内在感受还是期待落差",
      options: ["想到某个人", "想到自己的情绪", "期待被回应", "想先放下", "没有明显联想"],
      priority: 62,
    };
  }

  if (card.card.suit === "pentacles") {
    return {
      trueFocus: "现实、安全感、钱、工作稳定、资源、身体感和长期积累",
      avoidFocus: ["不要主要问抽象阶段转折", "不要主要问纯情绪圆满"],
      tensionClause: `${card.position.name}里的${card.card.nameZh}把现实、安全感和资源议题放到前台`,
      overallOption: "我更先想到现实压力、安全感或稳定性",
      question: `${role}让你更想到稳定、安全感、现实压力，还是资源不够？`,
      purpose: "确认用户面对现实、钱、工作稳定或资源问题时的主观感受",
      options: ["稳定", "安全感", "现实压力", "资源不够", "说不上来"],
      priority: 60,
    };
  }

  if (card.card.suit === "swords") {
    return {
      trueFocus: "思考、焦虑、冲突、沟通、判断、压力和内在声音",
      avoidFocus: ["不要主要问关系圆满", "不要主要问资源守住", "不要主要问行动冲劲"],
      tensionClause: `${card.position.name}里的${card.card.nameZh}带出思考、压力、冲突或沟通议题`,
      overallOption: "我更先感觉到压力、担心或脑子停不下来",
      question: `如果把${role}里的压力说成一种声音，它更像催促、批评、担心，还是沉默？`,
      purpose: "确认宝剑主题带来的心理压力更接近哪一种内在声音",
      options: ["催促", "批评", "担心", "沉默", "混在一起"],
      priority: 58,
    };
  }

  return {
    trueFocus: "阶段性主题、身份转变、人生课题或需要被看见的核心象征",
    avoidFocus: ["不要把大阿卡那简化成某个元素牌的单一主题"],
    tensionClause: `${card.position.name}里的${card.card.nameZh}提示一个更大的阶段性主题`,
    overallOption: "这更像一个阶段性的课题",
    question: `${role}像不像你最近正在经历的一个大阶段？如果像，它更接近开始、结束、失控，还是看清？`,
    purpose: "确认这张关键牌是否对应用户对当前阶段的真实体感",
    options: ["阶段开始", "阶段结束", "有点失控", "正在看清", "不像"],
    priority: 56,
  };
}

function buildDomainMapping(card: ResolvedQuestionCard, focus: CardFocus, intent: ReadingIntent | undefined) {
  const domain = intent?.domain ?? "self";
  const domainLabel = domainLabels[domain] ?? "当前问题";

  return `如果是${domainLabel}问题，这张牌更适合落到：${focus.trueFocus}；结合「${card.position.name}」位置，重点确认用户是否在现实处境中感到这些主题。`;
}

function buildCardMeaning(card: ResolvedQuestionCard, intent: ReadingIntent | undefined): StructuredCardMeaning {
  const focus = getCardFocus(card);

  return {
    id: card.card.id,
    card: `${card.card.nameZh}（${card.orientation}）`,
    position: card.position.name,
    suit: card.card.suit ?? "major",
    number: card.card.number,
    orientation: card.orientation,
    keywords: card.keywords,
    specificFocus: focus.trueFocus,
    avoidFocus: focus.avoidFocus,
    possibleUserFeelings: focus.options,
    domainMapping: buildDomainMapping(card, focus, intent),
    meaning: card.meaning,
  };
}

function inferCoreTension(cards: ResolvedQuestionCard[]) {
  if (cards.length === 0) {
    return "暂时没有解析到具体的牌面，建议先聊聊用户看到这组牌时的整体画面感和情绪基调。";
  }

  const hasWheel = cards.some(({ card }) => card.nameEn === "Wheel of Fortune");
  const hasPentaclesFourReversed = cards.some(
    ({ card, orientation }) =>
      card.suit === "pentacles" && card.number === 4 && orientation === "逆位",
  );
  const hasTenOfCups = cards.some(({ card }) => card.suit === "cups" && card.number === 10);

  if (hasWheel && hasPentaclesFourReversed && hasTenOfCups) {
    return "过去有一轮变化或转折，现在用户可能因为安全感、资源或稳定性问题而收紧自己；但内心又期待更稳定、更被支持、更有归属感的状态。";
  }

  const currentCard =
    cards.find(({ position }) => /现在|现状|当前/.test(position.name)) ?? cards[1] ?? cards[0];
  const futureCard =
    cards.find(({ position }) => /未来|结果|走向|建议|倾向/.test(position.name)) ??
    cards[cards.length - 1];
  const backgroundCard =
    cards.find(({ position }) => /过去|背景|根源/.test(position.name)) ?? cards[0];
  const shortFocus = (card: ResolvedQuestionCard | undefined) => {
    if (!card) return "当前主题";
    const focus = getCardFocus(card).trueFocus;
    return focus.split(/[、，；。]/).slice(0, 3).join("、");
  };

  if (cards.length === 1) {
    return `${getPositionRole(cards[0])}把${shortFocus(cards[0])}带到眼前，先确认用户看到它的第一反应是什么——画面、牌名、氛围还是某个细节。`;
  }

  if (cards.length === 2) {
    return `${getPositionRole(backgroundCard)}像是在提供背景里的${shortFocus(backgroundCard)}，而${getPositionRole(currentCard)}更像眼下真正吸引用户视线或卡住的画面，需要先听用户说出主观感受。`;
  }

  return `${getPositionRole(backgroundCard)}像是背景里的${shortFocus(backgroundCard)}，${getPositionRole(currentCard)}是眼下最先抓住用户注意力的画面；后续又被${getPositionRole(futureCard)}里的${shortFocus(futureCard)}牵动——先问清用户对这几张牌的主观知觉和情绪基调，再谈牌义。`;
}

function getPositionRole(card: ResolvedQuestionCard) {
  return `${card.position.name}位的${card.card.nameZh}（${card.orientation}）`;
}

function createChoiceQuestion(
  id: string,
  question: string,
  basis: string,
  purpose: string,
  options: string[],
): AdaptiveQuestion {
  return {
    id,
    stage: "post_feedback",
    question,
    basis,
    purpose,
    answerType: "single_choice",
    options: options.map((label, index) => ({
      value: `${id}_${index + 1}`,
      label,
    })),
  };
}

function createQualityCheck(pass: boolean) {
  return {
    all_core_cards_analyzed: pass,
    all_core_cards_covered_or_skipped: pass,
    no_suit_overgeneralization: pass,
    no_avoid_focus_triggered: pass,
    core_tension_is_human_readable: pass,
    options_are_card_specific: pass,
    no_absent_card_type_mentioned: pass,
    question_count_ok: pass,
    final_pass: pass,
  };
}

function buildOverallQuestion(cards: ResolvedQuestionCard[]) {
  const options = [
    "整体偏亮，像有希望或松一口气",
    "整体偏暗，像被压住或藏着压力",
    "一半亮一半暗，里面有拉扯",
    "灰色地带，看不太清",
    "其实没什么明显感觉",
  ];

  const cardsHint = cards.length === 0
    ? "（暂时没有解析到具体牌面，先聊整体画面感即可。）"
    : "";

  return createChoiceQuestion(
    "q1_overall_feeling",
    `这组牌摆在面前的第一眼，整体画面感更偏亮还是更偏暗？${cardsHint}`,
    "用整体明暗/氛围作为知觉锚点，让用户先说出主观感受，避免被牌义牵着走。",
    "确认用户对整组牌的初始视觉/情绪基调，作为后续解读的落点。",
    options,
  );
}

type PerceptualPrompt = {
  question: string;
  purpose: string;
  options: string[];
};

const perceptualPromptBuilders: Array<(role: string, cardName: string) => PerceptualPrompt> = [
  (role) => ({
    question: `看到${role}时，你最先注意到的是什么？`,
    purpose: "捕捉用户对这张牌的第一注意点，避免直接用牌义对照。",
    options: [
      "牌名让我先有反应",
      "画面里的人物或场景",
      "颜色或光线",
      "某个具体细节（动物、姿势、物件等）",
      "一种说不清的氛围",
    ],
  }),
  (role) => ({
    question: `${role}这张牌给你的整体氛围更偏亮还是更偏暗？`,
    purpose: "通过明暗感判断用户对这张牌的情绪基调。",
    options: [
      "偏亮，像被照见或松一口气",
      "偏暗，像被压住或藏着什么",
      "灰色地带，说不清楚",
      "又亮又暗，里面有拉扯",
      "没什么明显感觉",
    ],
  }),
  (role) => ({
    question: `看到${role}时，你身体里更想靠近还是更想躲开？`,
    purpose: "用身体反应捕捉用户对这张牌的真实距离感和情绪。",
    options: [
      "想再多看一会儿",
      "想很快翻过去",
      "停在那里、有点定住",
      "胸口或肩膀有点紧",
      "没特别反应",
    ],
  }),
  (role) => ({
    question: `如果你对${role}印象比较深，更多是因为什么？`,
    purpose: "拆解用户的吸引点，看看在意的是符号、画面，还是联想。",
    options: [
      "牌名让我先有反应",
      "画面或人物的样子",
      "整体颜色或氛围",
      "它让我想到某个人或某件事",
      "其实印象不算深",
    ],
  }),
  (role) => ({
    question: `${role}让你心里更紧还是更松？`,
    purpose: "用情绪/呼吸维度的对比探测这张牌带来的真实感受。",
    options: [
      "心口或呼吸有点紧",
      "反而比之前松一点",
      "一阵复杂、说不清",
      "比较平静",
      "没什么感觉",
    ],
  }),
];

function getPerceptualPrompt(card: ResolvedQuestionCard, index: number): PerceptualPrompt {
  const role = getPositionRole(card);
  const builder = perceptualPromptBuilders[index % perceptualPromptBuilders.length];
  return builder(role, card.card.nameZh);
}

function scoreQuestionCard(card: ResolvedQuestionCard) {
  const focus = getCardFocus(card);
  const positionBoost = /现在|现状|当前|阻碍|压力|挑战|问题|卡点|建议/.test(card.position.name)
    ? 24
    : 0;
  const reversedBoost = card.orientation === "逆位" ? 14 : 0;
  const majorBoost = card.card.arcana === "major" ? 8 : 0;

  return focus.priority + positionBoost + reversedBoost + majorBoost;
}

function buildCardQuestion(card: ResolvedQuestionCard, index: number) {
  const focus = getCardFocus(card);
  const perceptual = getPerceptualPrompt(card, index);

  return createChoiceQuestion(
    `q${index + 2}_${card.card.slug.replace(/[^a-z0-9]+/g, "_")}`,
    perceptual.question,
    `${getPositionRole(card)}主要聚焦：${focus.trueFocus}。牌义摘要：${card.meaning}`,
    perceptual.purpose,
    perceptual.options,
  );
}

function buildGenericPerceptualQuestion(): AdaptiveQuestion {
  return createChoiceQuestion(
    "q2_first_attention",
    "你最想先聊聊这组牌里的哪一种感受？",
    "在没有具体牌面解析时，先用知觉/感受的入口让用户开口。",
    "捕捉用户最在意的主观维度，再决定后续追问方向。",
    [
      "某张牌的画面让我有感觉",
      "整体颜色或氛围",
      "某张牌的牌名一下抓住我",
      "看到牌之后心里有点紧",
      "其实没什么特别感觉",
    ],
  );
}

export function buildFallbackAdaptiveQuestions(input: BuildAdaptiveQuestionInput) {
  const spread = getSpreadBySlug(input.spreadSlug);
  const cards = resolveQuestionCards(spread, input.cards);
  const questionCount = clampQuestionCount(input.questionCount, cards.length);
  const coreTension = inferCoreTension(cards);
  const cardQuestions = [...cards]
    .sort((a, b) => scoreQuestionCard(b) - scoreQuestionCard(a) || a.position.order - b.position.order)
    .slice(0, Math.max(1, questionCount - 1))
    .map(buildCardQuestion);
  const baseQuestions =
    cards.length === 0
      ? [buildOverallQuestion(cards), buildGenericPerceptualQuestion()]
      : [buildOverallQuestion(cards), ...cardQuestions];
  const cardMeanings = cards.map((card) => buildCardMeaning(card, input.readingIntent));

  return {
    domain: input.readingIntent?.domain ?? "self",
    coreTension,
    questionStrategy:
      "先用整体明暗/画面感建立情绪基调，再逐张追问知觉性反应（注意点、亮暗、身体感、吸引点）；不让用户对照牌义打勾。",
    questions: baseQuestions.slice(0, Math.max(2, questionCount)),
    cardMeanings,
    qualityCheck: createQualityCheck(true),
    model: "local-card-aware-fallback",
  };
}

export function buildAdaptiveQuestionPayload(input: BuildAdaptiveQuestionInput): AdaptiveQuestionPayload {
  const spread = getSpreadBySlug(input.spreadSlug);
  const cards = resolveQuestionCards(spread, input.cards);
  const questionCount = clampQuestionCount(input.questionCount, cards.length);
  const coreTension = inferCoreTension(cards);
  const cardMeanings = cards.map((card) => buildCardMeaning(card, input.readingIntent));
  const fallback = buildFallbackAdaptiveQuestions(input);
  const localCardFocus = cards.map((card) => {
    const focus = getCardFocus(card);

    return {
      card: `${card.card.nameZh}（${card.orientation}）`,
      position: card.position.name,
      specific_focus: focus.trueFocus,
      avoid_focus: focus.avoidFocus,
      possible_user_feelings: focus.options,
      domain_mapping: buildDomainMapping(card, focus, input.readingIntent),
    };
  });
  const candidateQuestions = fallback.questions.map((question) => ({
    id: question.id,
    question: question.question,
    basis: question.basis?.replace(/。牌义摘要：[\s\S]*$/, "。").slice(0, 160),
    purpose: question.purpose?.slice(0, 120),
    answer_type: question.answerType === "free_text" ? "open" : "choice",
    options: question.options?.map((option) => option.label) ?? [],
  }));

  const userPrompt = [
    `用户问题：${input.question || "我想看清自己当前最需要面对的课题。"}`,
    `领域/目标：${summarizeIntent(input.readingIntent)}`,
    `牌阵：${spread?.nameZh ?? input.spreadSlug}`,
    `question_count：${questionCount}`,
    `local_core_tension：${coreTension}`,
    "local_card_focus：",
    JSON.stringify(localCardFocus),
    "candidate_questions（请只润色这些问题，不要新增重型分析）：",
    JSON.stringify(candidateQuestions),
    "只输出 JSON，字段只能包含 core_tension、question_strategy、questions。",
  ].join("\n");

  return {
    domain: input.readingIntent?.domain ?? "self",
    coreTension,
    questionStrategy:
      "先用整体明暗/画面感建立情绪基调，再针对关键牌位生成知觉性追问（第一注意、亮暗、身体反应、吸引点等），避免直面对照牌义。",
    questions: fallback.questions,
    cardMeanings,
    userPrompt,
  };
}

export function buildAdaptiveQuestionRewritePrompt(
  basePrompt: string,
  review: AdaptiveQuestionReview,
) {
  return [
    basePrompt,
    "",
    "上一次输出没有通过质量审查，请根据以下审查结果重写。",
    JSON.stringify(review, null, 2),
    "重写要求：重新读取 card_meanings，重新生成 card_focus_analysis、core_tension、questions 和 quality_check。不要复用被指出的问题。",
  ].join("\n");
}

export function buildAdaptiveQuestionReviewPrompt(
  input: BuildAdaptiveQuestionInput,
  generatedOutput: unknown,
) {
  const payload = buildAdaptiveQuestionPayload(input);

  return [
    payload.userPrompt,
    "",
    "待审查的问题生成器输出：",
    JSON.stringify(generatedOutput, null, 2),
    "",
    "请输出 JSON：",
    JSON.stringify(
      {
        score: 0,
        problems: ["问题说明"],
        rewrite_required: true,
        rewrite_reasons: ["重写原因"],
        improvement_instructions: ["具体改进指令"],
        approved_question_ids: ["q1"],
        question_ids_to_rewrite: ["q2"],
      },
      null,
      2,
    ),
  ].join("\n");
}

export function reviewAdaptiveQuestionOutput(
  input: BuildAdaptiveQuestionInput,
  generated: {
    coreTension: string;
    questionStrategy: string;
    questions: AdaptiveQuestion[];
  },
): AdaptiveQuestionReview {
  const spread = getSpreadBySlug(input.spreadSlug);
  const cards = resolveQuestionCards(spread, input.cards);
  const problems: string[] = [];
  const rewriteReasons: string[] = [];
  const improvementInstructions: string[] = [];
  const questionText = generated.questions
    .map((question) =>
      [
        question.id,
        question.question,
        question.basis,
        question.purpose,
        ...(question.options?.map((option) => option.label) ?? []),
      ].join("\n"),
    )
    .join("\n");

  if (generated.questions.length < 2 || generated.questions.length > 4) {
    problems.push("问题数量不在 2 到 4 个之间。");
    rewriteReasons.push("question_count_invalid");
  }

  const currentCard = cards.find(({ position }) => /现在|现状|当前/.test(position.name)) ?? cards[1];
  if (currentCard && !questionText.includes(currentCard.card.nameZh)) {
    problems.push(`没有覆盖现状位：${currentCard.card.nameZh}。`);
    rewriteReasons.push("missing_current_position");
    improvementInstructions.push(`必须围绕${getPositionRole(currentCard)}生成一个追问。`);
  }

  if (cards.length <= 3) {
    cards.forEach((card) => {
      if (!questionText.includes(card.card.nameZh)) {
        problems.push(`三张以内牌面漏掉关键牌：${card.card.nameZh}。`);
        rewriteReasons.push("missing_core_card");
        improvementInstructions.push(`需要覆盖${getPositionRole(card)}，或在 question_strategy 里给出 skip_reason。`);
      }
    });
  }

  cards.forEach((card) => {
    const focus = getCardFocus(card);
    const hitAvoid = focus.avoidFocus.some((avoid) => {
      const normalized = avoid.replace(/^不要主要问/, "").replace(/^不要/, "").trim();
      return normalized.length >= 2 && questionText.includes(normalized);
    });

    if (hitAvoid) {
      problems.push(`${card.card.nameZh}的问题触发 avoid_focus。`);
      rewriteReasons.push("avoid_focus_triggered");
      improvementInstructions.push(`重新围绕${card.card.nameZh}的 specific_focus 生成问题，不要使用：${focus.avoidFocus.join("、")}。`);
    }
  });

  if (/放在(同一张)?桌面上|关键词|主题.*主题.*主题|、.*、.*、.*、.*、/.test(generated.coreTension)) {
    problems.push("核心张力像关键词堆叠，不是一句人话。");
    rewriteReasons.push("weak_core_tension");
    improvementInstructions.push("core_tension 必须用一句自然中文表达主要矛盾，不要罗列关键词。");
  }

  const hasMajor = cards.some(({ card }) => card.arcana === "major");
  if (!hasMajor && /大阿卡那/.test(`${generated.coreTension}\n${generated.questionStrategy}\n${questionText}`)) {
    problems.push("牌面没有大阿卡那，但输出提到了大阿卡那。");
    rewriteReasons.push("absent_card_type_mentioned");
  }

  const genericOptionCount = (questionText.match(/外部压力|自己状态要调整|没明显感觉|说不上来/g) ?? []).length;
  if (genericOptionCount >= Math.max(4, generated.questions.length * 2)) {
    problems.push("选项偏通用模板，不够贴合具体牌义。");
    rewriteReasons.push("generic_options");
    improvementInstructions.push("每个选项都要来自 specific_focus、possibleUserFeelings 或 domainMapping。");
  }

  const surveyStyleHits = generated.questions.filter((question) => {
    const text = [
      question.question,
      ...(question.options?.map((option) => option.label) ?? []),
    ].join("\n");
    const surveyOptionCount = (text.match(/阶段开始|阶段结束|有点失控|正在看清|不像/g) ?? [])
      .length;
    const surveyStem = /(对应|有没有出现在|是否(正在|已经)|是不是.*阶段|准备好面对)/.test(question.question);
    return surveyOptionCount >= 3 || surveyStem;
  });
  if (surveyStyleHits.length > 0) {
    problems.push(
      `${surveyStyleHits.length} 个问题仍是直面对照式：${surveyStyleHits
        .map((q) => q.id)
        .join("、")}。`,
    );
    rewriteReasons.push("survey_style_question");
    improvementInstructions.push(
      "改写成知觉/感受类提问，例如：第一眼看到什么、画面是亮还是暗、心里更紧还是更松、是因为牌名/画面/氛围让你停留。不要让用户对照牌义打勾。",
    );
  }

  const score = Math.max(0, 100 - problems.length * 18 - rewriteReasons.length * 7);
  const rewriteRequired = score < 80 || rewriteReasons.length > 0;

  return {
    score,
    problems,
    rewriteRequired,
    rewriteReasons: [...new Set(rewriteReasons)],
    improvementInstructions: [...new Set(improvementInstructions)],
    approvedQuestionIds: rewriteRequired ? [] : generated.questions.map((question) => question.id),
    questionIdsToRewrite: rewriteRequired ? generated.questions.map((question) => question.id) : [],
  };
}

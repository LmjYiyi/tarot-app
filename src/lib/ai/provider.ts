import Anthropic from "@anthropic-ai/sdk";

import { buildInterpretationPayload } from "@/lib/interpretation/context";
import {
  sanitizeInterpretationStreamSegment,
  sanitizeInterpretationText,
  shouldNeutralizeRelationshipPronouns,
} from "@/lib/interpretation/output";
import {
  runQualityGate,
  summarizeQualityRequirements,
} from "@/lib/interpretation/quality-gate";
import { buildKbDrivenFallback } from "@/lib/tarot-engine/kb-fallback";
import {
  buildKbStructuredResult,
  renderStructuredResultForQuality,
} from "@/lib/tarot-engine/structured-result";
import type { DrawLog, DrawnCard, ReadingIntent, UserFeedback } from "@/lib/tarot/types";

const DEFAULT_MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M2.7";
const DEFAULT_BASE_URL =
  process.env.MINIMAX_BASE_URL ?? "https://api.minimaxi.com/anthropic";
const DEFAULT_TEMPERATURE = Number(process.env.MINIMAX_TEMPERATURE ?? 0.8);
const DEFAULT_TIMEOUT_MS = Number(process.env.MINIMAX_TIMEOUT_MS ?? 15000);
const DEFAULT_MAX_RETRIES = Number(process.env.MINIMAX_MAX_RETRIES ?? 0);
const INTERPRETATION_MAX_TOKENS = Number(process.env.MINIMAX_INTERPRETATION_MAX_TOKENS ?? 2400);
const INTERPRETATION_TIMEOUT_MS = Number(process.env.MINIMAX_INTERPRETATION_TIMEOUT_MS ?? 45000);
const INTERPRETATION_IDLE_TIMEOUT_MS = Number(
  process.env.MINIMAX_INTERPRETATION_IDLE_TIMEOUT_MS ?? 25000,
);

type InterpretationGenerationMode = "legacy" | "grounded_ai";

type GenerateInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  drawLog?: DrawLog | null;
  readingIntent?: ReadingIntent;
  userFeedback?: UserFeedback;
  locale?: string;
};

type InterpretationPayload = Awaited<ReturnType<typeof buildInterpretationPayload>>;

type CompletedInterpretationText = {
  pipeline: string;
  text: string;
};

type CreateInterpretationStreamInput = {
  payload: InterpretationPayload;
  fallbackText: string;
  startedAt?: number;
  onCompleteText?: (result: CompletedInterpretationText) => void | Promise<void>;
};

function getInterpretationGenerationMode(): InterpretationGenerationMode {
  return process.env.TAROT_INTERPRET_GENERATION_MODE === "grounded_ai"
    ? "grounded_ai"
    : "legacy";
}

function isGroundedAiBlockedBySafety(payload: InterpretationPayload) {
  return payload.tarotEngineContext.safetyMatches.some(
    ({ rule }) => rule.risk_level === "high" || rule.risk_level === "critical",
  );
}

function buildGroundedGenerationPrompt(
  payload: InterpretationPayload,
  qualityRequirements: string,
  attempt: number,
) {
  const structuredGrounding = buildKbStructuredResult({
    question: payload.question,
    spreadSlug: payload.responseBlueprint.slug,
    tarotEngineContext: payload.tarotEngineContext,
  });
  const material = {
    question: structuredGrounding.question,
    spread: structuredGrounding.spread,
    cards: structuredGrounding.cards.map((card) => ({
      cardName: card.cardName,
      orientation: card.orientation,
      positionName: card.positionName,
      meaning: card.meaning,
      advice: card.advice ?? [],
    })),
    combinations: structuredGrounding.combinations.map((combination) => ({
      cardNames: combination.cardNames,
      positions: combination.positions.map((position) => position.positionName),
      summary: combination.summary,
    })),
    safety: structuredGrounding.safety,
    readingSeed: structuredGrounding.reading,
    supplementalText: renderStructuredResultForQuality(structuredGrounding),
  };
  const retryIntro =
    attempt === 0
      ? "请按原始写作合同生成最终用户可见的完整塔罗解读，并把下面的补充资料自然融入需要增强的地方。"
      : "上一次输出没有通过质量验收。请按同一份原始写作合同重新生成，并把补充资料自然融入需要增强的地方。";

  return [
    retryIntro,
    "",
    "生成边界：",
    "1. 原始写作合同是主体；补充资料只用于增强细节、牌位理解、组合联动和安全边界。",
    "2. 不要把补充资料逐字段翻译成正文，也不要让补充资料覆盖原始写作合同的咨询式表达。",
    "3. 不得改变牌名、正逆位、牌位、用户问题、领域、安全边界或观察窗口。",
    "4. 关键判断优先来自牌面和用户问题；补充资料用于让判断更具体、更稳，不用于替代整篇解读。",
    "5. 不要写“KB”“资料包”“结构化结果”“检索材料”“补充资料”“根据规则”等内部措辞。",
    "6. 安全边界存在时，优先写现实支持、边界和可观察信号，不做确定预测。",
    "7. 语言要保留咨询感和牌桌感，避免机械复述字段，避免逐条翻译 JSON。",
    "",
    "原始写作合同：",
    payload.userPrompt,
    "",
    "补充资料：",
    JSON.stringify(material),
    "",
    "质量验收要求：",
    qualityRequirements,
  ].join("\n");
}

function getClient() {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Anthropic({
    apiKey,
    baseURL: DEFAULT_BASE_URL,
    timeout: Number.isFinite(DEFAULT_TIMEOUT_MS) ? DEFAULT_TIMEOUT_MS : 15000,
    maxRetries: Number.isFinite(DEFAULT_MAX_RETRIES) ? DEFAULT_MAX_RETRIES : 0,
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

const suitTheme: Record<string, string> = {
  cups: "感受、关系和真实需求",
  wands: "行动力、热情和推进节奏",
  swords: "判断、沟通和压力管理",
  pentacles: "资源、方法和稳定执行",
};

const domainTheme: Record<ReadingIntent["domain"], string> = {
  career: "工作现实、能力呈现和推进策略",
  love: "情感状态、互动节奏和真实需求",
  study: "学习方法、复习节奏和临场稳定",
  relationship: "互动边界、沟通方式和双方节奏",
  self: "内在状态、能量管理和自我支持",
  decision: "选择条件、风险边界和验证动作",
};

function cardLabel(
  selectedCard: InterpretationPayload["selectedCards"][number],
) {
  return `${selectedCard.card.nameZh}（${selectedCard.orientation}）`;
}

function cardKeywords(
  selectedCard: InterpretationPayload["selectedCards"][number],
  count = 3,
) {
  return selectedCard.keywords.slice(0, count).join("、") || "现实确认";
}

function describeCard(
  selectedCard: InterpretationPayload["selectedCards"][number],
) {
  const theme = selectedCard.card.suit
    ? suitTheme[selectedCard.card.suit]
    : "阶段主题、价值选择和更深层的提醒";
  const orientationNote =
    selectedCard.orientation === "逆位"
      ? "逆位表示这股能量暂时被压住、绕行或需要重新调整。"
      : "正位表示这个主题已经比较清楚，可以直接落到现实动作。";

  return `${selectedCard.card.nameZh}把重点放在${theme}上，关键词是${cardKeywords(selectedCard)}。${orientationNote}`;
}

function isInterviewQuestion(question: string) {
  return /面试|求职|应聘|候选|岗位/.test(question);
}

function isExamQuestion(question: string) {
  return /考试|测验|考核|笔试|面试题|复习|成绩|及格|通过/.test(question);
}

function isHealthQuestion(question: string) {
  return /症状|严重|疼|痛|失眠|疾病|生病|发烧|抑郁|焦虑症|医院|医生|检查|治疗|高反|高原反应|拉萨|西藏|海拔|缺氧|呼吸/.test(
    question,
  );
}

function isHighRiskMoneyQuestion(question: string) {
  return /all in|梭哈|股票|投资|基金|币|贷款|借钱|买房|卖房|发财|赚钱|财务/i.test(question);
}

function isMaterialRiskDecision(question: string) {
  const asksForAction = /要不要|该不该|是否|是不是该|能不能|可以不可以|值不值得|适合不适合|选|选择|决定|马上|立刻|现在/.test(
    question,
  );
  const materialRisk = /裸辞|辞职|离职|跳槽|离婚|搬家|借钱|贷款|投资|创业|买房|卖房|退学|休学|移民|手术|数字货币|币|股票|基金|理财|抄底/.test(
    question,
  );

  return asksForAction && materialRisk;
}

function isRelationshipRiskDecision(question: string) {
  return /(?:要不要|该不该|是否|是不是该|决定|马上|现在).{0,12}(?:分手|离开这段关系)|(?:分手|离开这段关系).{0,12}(?:要不要|该不该|是否|是不是该|决定|马上|现在)/.test(
    question,
  );
}

function visibleQuestion(question: string) {
  return question
    .replace(/這/g, "这")
    .replace(/關/g, "关")
    .replace(/係/g, "系")
    .replace(/還/g, "还")
    .replace(/沒/g, "没")
    .replace(/會/g, "会")
    .replace(/與/g, "与")
    .replace(/機/g, "机");
}

function selectedByOrder(
  payload: InterpretationPayload,
  order: number,
) {
  return payload.selectedCards.find((item) => item.position.order === order) ?? null;
}

function feedbackSentence(
  payload: InterpretationPayload,
) {
  const feeling = payload.userFeedback?.overallFeeling?.trim();
  const note = payload.userFeedback?.overallFeelingNote?.trim();
  const parts = [feeling, note].filter(Boolean);

  if (!parts.length) return "";

  return `你补充的感受是“${parts.join("；")}”。这会被当成牌面里的直觉线索：它不替牌下结论，但能帮助判断哪里让你有力量，哪里又让你担心失衡。`;
}

function feedbackQualityTerms(feedback: UserFeedback | undefined) {
  const source = [feedback?.overallFeeling, feedback?.overallFeelingNote].filter(Boolean).join("，");
  const candidates = [
    "自信",
    "担心",
    "不能持久",
    "焦虑",
    "害怕",
    "开心",
    "难过",
    "压力",
    "疲惫",
    "兴奋",
    "平静",
    "安心",
    "不安",
    "迷茫",
  ];

  return candidates.filter((term) => source.includes(term)).slice(0, 4);
}

function singleAction(
  payload: InterpretationPayload,
  selectedCard: InterpretationPayload["selectedCards"][number],
) {
  const question = payload.question.trim();

  if (isInterviewQuestion(question)) {
    return "面试前先做三件小事：把三段最能证明能力的经历整理成“背景、行动、结果、反思”；准备一个解释挫折或项目收尾的案例；留出休息时间，让自己进场时能稳住节奏。";
  }

  if (isExamQuestion(question) || payload.readingIntent?.domain === "study") {
    return "今天把复习压缩到三件可完成的事：先列出最可能失分的三个点，再各做一轮针对性练习，最后用一小段时间复述答题步骤。重点不是临时求保证，而是把会做的部分稳稳拿住。";
  }

  if (isHighRiskMoneyQuestion(question)) {
    return "今天不要急着做高成本动作。先写清楚现金流、可承受损失、时间线、替代方案和止损点；如果任何一项写不出来，就把行动降级为观察和补信息。";
  }

  if (isHealthQuestion(question)) {
    return "今天先把身体或情绪信号记录清楚：出现多久、何时加重、是否影响睡眠或日常。如果症状持续、加重或让你不安，请优先联系医生、医院或其他专业支持。塔罗只能帮你整理压力和行动顺序，不能替代诊断。";
  }

  if (payload.readingIntent?.domain === "self") {
    return `今天选一个能支持“${cardKeywords(selectedCard, 1)}”的小动作：整理一件拖着的事、完成一次身体休息，或把真实感受写下来。动作要小，但要真的完成。`;
  }

  if (payload.readingIntent?.domain === "love" || payload.readingIntent?.domain === "relationship") {
    return "今天先不要用猜测替代沟通。写下你真正想确认的一句话，再判断它适不适合现在说出口；如果暂时不适合，就先观察对方是否有稳定、可重复的行动。";
  }

  return `今天围绕${selectedCard.card.nameZh}做一个小步验证：把最担心的点写成一句现实问题，再完成一个能在当天看到反馈的动作。`;
}

function singleObservation(
  payload: InterpretationPayload,
  selectedCard: InterpretationPayload["selectedCards"][number],
) {
  const window = payload.responseBlueprint.timeScope.observationWindow;
  const question = payload.question.trim();

  if (isInterviewQuestion(question)) {
    return `观察窗口放在${window}。重点看：回答是否更具体，面对压力问题时是否能保持节奏，面试后是否知道自己哪里发挥稳定、哪里还要补。`;
  }

  if (isExamQuestion(question) || payload.readingIntent?.domain === "study") {
    return `观察窗口放在${window}。重点看：复习后错题是否减少，答题步骤是否更清楚，临场前是否能把注意力放在会做的部分。`;
  }

  if (isHealthQuestion(question)) {
    return `观察窗口放在${window}。重点看：症状或情绪信号是否持续、加重或影响日常；如果有这些情况，请优先联系医生、医院或专业支持。`;
  }

  if (payload.readingIntent?.domain === "self") {
    return `观察窗口放在${window}。重点看：你的自信是否能转成稳定行动，担心是否下降，以及完成小动作后身体和情绪有没有更踏实。`;
  }

  return `观察窗口放在${window}。重点看：${cardKeywords(selectedCard, 1)}这个主题是否变得更清楚，你是否能把焦虑转成一个可执行动作，以及现实反馈是否比原先更具体。`;
}

function buildSingleFallback(payload: InterpretationPayload) {
  const selectedCard = payload.selectedCards[0];
  const questionText = visibleQuestion(payload.question.trim());
  const feedback = feedbackSentence(payload);
  const safetyNotes = [
    payload.questionDiagnosis.flags.absolutePrediction || payload.questionDiagnosis.flags.preciseTiming
      ? "这次解读不做绝对承诺，也不提供精确结果日期，只讨论趋势、条件和可观察信号。"
      : "",
    payload.questionDiagnosis.flags.highRiskDecision && isMaterialRiskDecision(payload.question)
      ? "如果涉及现实里的高成本决定，请先核对现金流、时间线、替代方案和止损点。"
      : "",
    payload.questionDiagnosis.flags.highRiskDecision && isRelationshipRiskDecision(payload.question)
      ? "如果这是关系里的重大决定，请先看沟通边界、支持系统、可暂停空间和观察信号。"
      : "",
  ]
    .filter(Boolean)
    .join("");

  if (!selectedCard) {
    return [
      "1. 牌面先说",
      "这次没有解析到有效牌面，因此不能给出负责任的塔罗解读。",
      "",
      "2. 牌面线索",
      "请重新抽牌或检查牌面数据后再解读。",
      "",
      "3. 当前提醒",
      "没有有效牌面时，不应该用泛化建议替代真实解读。",
      "",
      "4. 今日行动",
      "重新发起一次有效抽牌。",
      "",
      "5. 观察指标",
      "确认接口返回了具体牌名和对应位置。",
    ].join("\n");
  }

  return [
    payload.responseBlueprint.sections[0] ?? "1. 牌面先说",
    `抽到${cardLabel(selectedCard)}。${questionText ? `针对你问的“${questionText}”，` : ""}这张牌不替你做绝对预言，而是把当下最需要处理的主题放到桌面上：${cardKeywords(selectedCard)}。`,
    safetyNotes,
    feedback,
    "",
    payload.responseBlueprint.sections[1] ?? "2. 牌面线索",
    `${selectedCard.position.name}落在${selectedCard.card.nameZh}。${describeCard(selectedCard)}放到${payload.readingIntent ? domainTheme[payload.readingIntent.domain] : "当前问题"}里，它更像是在提醒你：先看清可控部分，再决定下一步。`,
    "",
    payload.responseBlueprint.sections[2] ?? "3. 当前提醒",
    `${selectedCard.card.nameZh}的提醒不是“好或坏”的一句话，而是让你区分真实信号和焦虑投射。现在最重要的是把注意力从结果想象拉回准备、沟通、复盘或资源检查。`,
    "",
    payload.responseBlueprint.sections[3] ?? "4. 今日行动",
    singleAction(payload, selectedCard),
    "",
    payload.responseBlueprint.sections[4] ?? "5. 观察指标",
    singleObservation(payload, selectedCard),
  ].join("\n");
}

function buildThreeCardFallback(payload: InterpretationPayload) {
  const [first, second, third] = payload.selectedCards;

  if (!first || !second || !third) {
    return buildGenericFallback(payload);
  }

  return [
    "1. 牌面先说",
    `这组三张牌从${first.card.nameZh}走到${second.card.nameZh}，最后落到${third.card.nameZh}。它更像是在说：过去有一个已经形成的背景，当下真正的卡点需要被看见，接下来要靠具体行动把局面重新推稳。`,
    "",
    "2. 三张牌的阶段变化",
    `过去/背景的${cardLabel(first)}显示${cardKeywords(first)}，说明此前并非完全没有资源或经验。现在/现状的${cardLabel(second)}把焦点放到${cardKeywords(second)}，这是当前最需要承认的状态。未来/走向的${cardLabel(third)}指向${cardKeywords(third)}，表示接下来更适合靠持续、具体、可复盘的动作推进。`,
    "",
    "3. 当前关键矛盾",
    `矛盾在于：你一边有前面累积下来的基础，一边当下的感受或动力没有完全跟上。不要把${second.card.nameZh}读成停滞的终局，它更像提醒你先处理注意力和投入感，再让${third.card.nameZh}代表的执行力接上。`,
    "",
    "4. 现实映射",
    `放到${payload.readingIntent ? domainTheme[payload.readingIntent.domain] : "现实问题"}里，这组牌建议你少做泛泛判断，多看三个现实信号：过去哪些做法已经有效，当下哪里开始低投入，接下来哪一件事值得持续练习或稳定执行。`,
    "",
    "5. 行动建议",
    `今天先选一个能承接${third.card.nameZh}的小任务，把它拆成可完成的一步；同时减少对${second.card.nameZh}状态的反复纠结。能稳定做完，比一次性想通更重要。`,
    "",
    "6. 观察指标",
    `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。重点看：执行后反馈是否更清楚，动力是否回升，以及你是否能把当前状态从“想很多”转成“做一件”。`,
  ].join("\n");
}

function buildCareerFiveFallback(payload: InterpretationPayload) {
  const current = selectedByOrder(payload, 1);
  const obstacle = selectedByOrder(payload, 2);
  const strength = selectedByOrder(payload, 3);
  const trend = selectedByOrder(payload, 4);
  const advice = selectedByOrder(payload, 5);

  if (!current || !obstacle || !strength || !trend || !advice) {
    return buildGenericFallback(payload);
  }

  return [
    "1. 牌面先说",
    `这组事业牌由${payload.selectedCards.map(cardLabel).join("、")}组成。它不适合被读成简单的“去或不去”，而是在拆开：你现在站在哪里，真正拖慢你的是什么，手里有什么资源，近期会怎样移动，以及下一步该怎么做。`,
    "",
    "2. 事业结构",
    `现状位的${cardLabel(current)}显示你当前的事业状态带着${cardKeywords(current)}的底色。阻碍位的${cardLabel(obstacle)}说明卡点更像来自${cardKeywords(obstacle)}。优势位的${cardLabel(strength)}是可调用资源，提示你不是没有办法，而是要把${cardKeywords(strength, 2)}用在正确位置。近期发展位的${cardLabel(trend)}提醒短期内会看见${cardKeywords(trend, 2)}相关的压力或信号。结果/建议位的${cardLabel(advice)}把解法落到${cardKeywords(advice, 2)}。`,
    "",
    "3. 关键卡点",
    `关键不在于马上给自己一个绝对答案，而是先看阻碍位的${obstacle.card.nameZh}。它提示你：如果继续按旧节奏推进，最容易被拖住的是${obstacle.position.focus}。跳槽、新机会或当前岗位的判断，都需要先把这个卡点说清楚。`,
    "",
    "4. 可用优势",
    `${strength.card.nameZh}落在优势位，说明你真正能用的是已经积累出来的能力、经验或执行方法。与其只盯着外部机会好不好，不如先确认：哪些能力可迁移，哪些资源能支持你承接变化，哪些条件不能妥协。`,
    "",
    "5. 近期发展",
    `${trend.card.nameZh}在近期发展位，表示短期内会出现一个让你更清楚现实代价的信号。它可能是沟通、条件、节奏或压力的显形；不要把它当成最终判决，而要把它当成检验新方向是否真实可承接的证据。`,
    "",
    "6. 行动建议",
    `${advice.card.nameZh}给出的行动是：先列出三栏条件，分别是必须满足、可以协商、不能接受。然后带着这三栏去验证新机会，而不是只凭焦虑或兴奋做决定。若涉及离职或高成本变化，也要写清现金流、时间线、替代方案和止损点。`,
    "",
    "7. 观察指标",
    `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。重点看：新机会是否能回应你的底线条件；当前岗位是否还有可调整空间；以及你在了解更多信息后是更踏实，还是更焦虑。`,
  ].join("\n");
}

function choiceLabels(question: string) {
  const normalized = question.replace(/\s+/g, " ").trim();
  const pairPatterns = [
    /A\s*(?:是|:|：)\s*([^，。；;,.]+?)[，。；;,.]\s*B\s*(?:是|:|：)\s*([^，。；;,.]+)/i,
    /(?:是|要不要|该不该|选择|选|去|送)\s*([^，。；;,.？?]{2,24}?)(?:，|,|还是|或是|或者)\s*(?:还是|或是|或者)?\s*([^，。；;,.？?]{2,24})/,
    /([^，。；;,.？?]{2,24}?)(?:，|,)?\s*(?:还是|或是|或者)\s*([^，。；;,.？?]{2,24})/,
  ];

  for (const pattern of pairPatterns) {
    const match = normalized.match(pattern);
    const a = match?.[1]?.replace(/^(?:去|送|买|吃|那个|一次)/, "").trim();
    const b = match?.[2]?.replace(/^(?:去|送|买|吃|那个|一次)/, "").trim();

    if (a && b && a !== b) {
      return { a, b };
    }
  }

  if (/借钱|借款/.test(question)) {
    return { a: "借出这笔钱", b: "暂时不借或改用非金钱支持" };
  }

  if (/分手|离开这段关系/.test(question)) {
    return { a: "结束关系", b: "继续观察并尝试修复" };
  }

  return { a: "路径 A", b: "路径 B" };
}

function buildPathOfChoiceFallback(payload: InterpretationPayload) {
  const aNow = selectedByOrder(payload, 1);
  const aResult = selectedByOrder(payload, 2);
  const bNow = selectedByOrder(payload, 3);
  const bResult = selectedByOrder(payload, 4);
  const hidden = selectedByOrder(payload, 5);
  const action = selectedByOrder(payload, 6);
  const summary = selectedByOrder(payload, 7);
  const labels = choiceLabels(payload.question);

  if (!aNow || !aResult || !bNow || !bResult || !hidden || !action || !summary) {
    return buildGenericFallback(payload);
  }

  const materialRisk = isMaterialRiskDecision(payload.question);
  const relationshipRisk = isRelationshipRiskDecision(payload.question);
  const decisionAction = materialRisk
    ? `决策前先做四件事：确认可用资源或现金流，写下时间线，准备替代方案，设好止损点。${action.card.nameZh}提示行动要具体，而不是停在纠结里。`
    : relationshipRisk
      ? `决策前先把沟通边界、支持系统、可暂停空间和观察信号写清楚。${action.card.nameZh}提示你先让关系里的现实反馈变得可见，再决定要推进、修复还是停下。`
      : `决策前先问自己：我现在真正想要的是哪种感受，哪条路的代价我更愿意承担。再做一个小步验证，例如确认时间、预算、身体状态或对方偏好。${action.card.nameZh}提示行动要具体，而不是停在纠结里。`;

  return [
    "1. 牌面先说",
    `这组选择牌阵不替你拍板，而是比较${labels.a}与${labels.b}的机会、代价和验证条件。牌面最后落到${cardLabel(summary)}，说明真正重要的是先把风险边界看清，而不是急着证明某条路绝对正确。`,
    "",
    "2. 两个选择的本质差异",
    `${labels.a}由${cardLabel(aNow)}走向${cardLabel(aResult)}，它的主题是${cardKeywords(aNow, 2)}到${cardKeywords(aResult, 2)}。${labels.b}由${cardLabel(bNow)}走向${cardLabel(bResult)}，主题是${cardKeywords(bNow, 2)}到${cardKeywords(bResult, 2)}。一边更像情绪或关系压力下的即时回应，另一边更像保留空间、等待更多现实信号。`,
    "",
    "3. 路径 A 的机会与代价",
    `${labels.a}的机会在于它能直接回应当前需求，让事情不再悬着。代价是${aResult.card.nameZh}提示的${cardKeywords(aResult)}：后续可能出现失望、压力、边界不清或需要承担的现实后果。`,
    "",
    "4. 路径 B 的机会与代价",
    `${labels.b}的机会在于保留资源和判断空间，让你不必在信息不足时承担全部代价。代价是${bResult.card.nameZh}提示的${cardKeywords(bResult)}：可能会带来停滞感、愧疚感，或让关系短期内显得不够热络。`,
    "",
    "5. 隐藏变量",
    `隐藏变量落在${cardLabel(hidden)}。它提醒你，这件事背后可能不只是表面的请求或关系状态，还包括冲突、压力、面子、期待或未说清的条件。先把这些变量说清楚，选择才不会变成情绪反射。`,
    "",
    "6. 决策前动作",
    decisionAction,
    "",
    "7. 观察指标",
    `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。看三个信号：对方是否能接受清楚条件；现实成本是否在你可承受范围内；做出小步验证后，你是更踏实还是更被消耗。`,
  ].join("\n");
}

function buildRelationshipSixFallback(payload: InterpretationPayload) {
  const self = selectedByOrder(payload, 1);
  const other = selectedByOrder(payload, 2);
  const relation = selectedByOrder(payload, 3);
  const obstacle = selectedByOrder(payload, 4);
  const trend = selectedByOrder(payload, 5);
  const advice = selectedByOrder(payload, 6);

  if (!self || !other || !relation || !obstacle || !trend || !advice) {
    return buildGenericFallback(payload);
  }

  return [
    "1. 牌面先说",
    `这组关系牌由${payload.selectedCards.map(cardLabel).join("、")}组成。它不适合直接问“值不值得”或“有没有希望”，而是要看你、对方、关系本身、阻碍、近期趋势和沟通建议是否能接上。`,
    "",
    "2. 关系结构",
    `你的状态是${cardLabel(self)}，对方呈现为${cardLabel(other)}，关系本身落在${cardLabel(relation)}。这说明关系不是单边问题：你这边有${cardKeywords(self, 2)}，对方那边有${cardKeywords(other, 2)}，两人之间又被${relation.card.nameZh}代表的主题牵动。`,
    "",
    "3. 双方状态",
    `你的位置更需要看清自己的真实需求，不要只为了维持连接而忽略感受。对方的位置不等于对方内心判决，只能说明TA目前呈现出的节奏和状态。若双方节奏不同，先不要急着推进关系定义，要看行动是否稳定。`,
    "",
    "4. 关键误解或边界",
    `阻碍位的${cardLabel(obstacle)}是这组牌的卡点。它提示真正需要处理的是${cardKeywords(obstacle)}，可能表现为误解、受伤、防御、争执或没有说清的期待。这里需要边界，而不是更多猜测。`,
    "",
    "5. 修复路径",
    `近期趋势的${cardLabel(trend)}说明关系还有可观察的移动空间，但它要求持续、具体、可验证的行动。修复不是靠一次情绪爆发，而是看接下来是否有人愿意稳定回应、调整方式、把话说清楚。`,
    "",
    "6. 行动建议",
    `${advice.card.nameZh}给你的建议是：先准备一句不指责的表达，例如“我想确认我们现在的节奏是否一致”。如果对方愿意回应，再谈下一步；如果对方回避，就把精力收回到自己的边界和生活节奏。`,
    "",
    "7. 观察指标",
    `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。重点看：对方是否有稳定回应；你表达边界后关系是否更清楚；以及你自己是更安心，还是更被消耗。`,
  ].join("\n");
}

function buildGenericFallback(payload: InterpretationPayload) {
  const cards = payload.selectedCards;
  const primary = cards[0];
  const finalCard = cards.at(-1);
  const section = (index: number, fallback: string) =>
    payload.responseBlueprint.sections[index] ?? fallback;

  return [
    section(0, "1. 牌面先说"),
    cards.length
      ? `这次牌面由${cards.map(cardLabel).join("、")}组成。先看牌位的任务，再看它们之间如何支持或拉扯，而不是把每张牌孤立解释。`
      : "这次没有解析到有效牌面，因此不能给出负责任的塔罗解读。",
    "",
    section(1, "2. 牌阵结构"),
    cards
      .map(
        (item) =>
          `${item.position.name}的${cardLabel(item)}提示${cardKeywords(item)}，它在这组牌里负责${item.position.focus}。`,
      )
      .join("\n"),
    "",
    section(2, "3. 关键矛盾"),
    primary
      ? `最需要先看的，是${primary.position.name}里的${primary.card.nameZh}。它提示你先确认真正的压力点，再决定哪里要推进、哪里要放慢。`
      : "关键矛盾需要有效牌面才能判断。",
    "",
    section(3, "4. 现实映射"),
    `放到${payload.readingIntent ? domainTheme[payload.readingIntent.domain] : "当前问题"}里，这组牌更适合被当作现实检查：哪些资源可用，哪些情绪或沟通需要被处理，哪些动作能在短期内验证。`,
    "",
    section(4, "5. 行动建议"),
    finalCard
      ? `先围绕${finalCard.card.nameZh}做一个小步行动：把问题拆成一个可以今天完成的动作，并记录完成后的反馈。`
      : "请先重新抽取有效牌面。",
    "",
    section(5, "6. 观察指标"),
    `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。重点看现实反馈是否更具体，以及你是否更清楚下一步该推进、暂停还是重新沟通。`,
  ].join("\n");
}

function mockInterpretation(
  payload: InterpretationPayload,
) {
  if (payload.tarotEngineContext.cardContexts.some((item) => item.contextPositionMeaning)) {
    return buildKbDrivenFallback({
      question: payload.question,
      spreadName: payload.spreadName,
      responseBlueprint: payload.responseBlueprint,
      selectedCards: payload.selectedCards,
      readingIntent: payload.readingIntent,
      tarotEngineContext: payload.tarotEngineContext,
    });
  }

  if (payload.responseBlueprint.slug === "single-guidance") {
    return buildSingleFallback(payload);
  }

  if (payload.responseBlueprint.slug === "three-card") {
    return buildThreeCardFallback(payload);
  }

  if (payload.responseBlueprint.slug === "career-five") {
    return buildCareerFiveFallback(payload);
  }

  if (payload.responseBlueprint.slug === "path-of-choice") {
    return buildPathOfChoiceFallback(payload);
  }

  if (payload.responseBlueprint.slug === "relationship-six") {
    return buildRelationshipSixFallback(payload);
  }

  return buildGenericFallback(payload);
}

function createMockStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.split(/(\n{2,}|\n|。|；|，)/).filter(Boolean);

  return new ReadableStream({
    start(controller) {
      let index = 0;

      function push() {
        if (index >= chunks.length) {
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(chunks[index]));
        index += 1;
        setTimeout(push, 25);
      }

      push();
    },
  });
}

function createTextStream(
  text: string,
  onCompleteText?: (text: string) => void | Promise<void>,
) {
  const encoder = new TextEncoder();
  const chunks = text.split(/(\n{2,}|\n|。|！|？)/).filter(Boolean);

  return new ReadableStream({
    start(controller) {
      let index = 0;
      let visibleText = "";

      function push() {
        if (index >= chunks.length) {
          controller.close();
          if (visibleText.trim()) {
            void Promise.resolve(onCompleteText?.(visibleText)).catch((error) => {
              console.error("[createTextStream] onCompleteText failed", error);
            });
          }
          return;
        }

        const chunk = chunks[index];
        visibleText += chunk;
        controller.enqueue(encoder.encode(chunk));
        index += 1;
        setTimeout(push, 18);
      }

      push();
    },
  });
}

function resolveInterpretationMaxTokens(
  payload: InterpretationPayload,
) {
  const envLimit = Number.isFinite(INTERPRETATION_MAX_TOKENS) ? INTERPRETATION_MAX_TOKENS : 1200;
  const templateLimit = payload.responseBlueprint.maxTokens;

  return Math.max(envLimit, templateLimit);
}

export async function createInterpretationStream(input: CreateInterpretationStreamInput) {
  const { payload, fallbackText } = input;
  const startedAt = input.startedAt ?? Date.now();
  const generationMode = getInterpretationGenerationMode();
  const readingIntent = payload.readingIntent;
  const userFeedback = payload.userFeedback;
  const question = payload.question;
  const tarotKbDebug = {
    tarotKbVersion: payload.tarotEngineContext.kbVersion,
    tarotKbDomain: payload.tarotEngineContext.domain,
    tarotKbContextIds: payload.tarotEngineContext.contextIds.slice(0, 24),
    tarotKbMissing: payload.tarotEngineContext.missing.slice(0, 12),
    tarotKbCardContextHits: payload.tarotEngineContext.cardContexts.filter(
      (item) => item.contextPositionMeaning,
    ).length,
    tarotKbPairContextHits: payload.tarotEngineContext.pairContexts.length,
    tarotKbGoldenCaseHits: payload.tarotEngineContext.goldenCases.length,
    tarotKbQuestionMatchHits: payload.tarotEngineContext.questionMatches.length,
    tarotKbSafetyMatchHits: payload.tarotEngineContext.safetyMatches.length,
  };
  const sanitizeOptions = {
    neutralizeRelationshipPronouns: shouldNeutralizeRelationshipPronouns(question, readingIntent),
  };
  const client = getClient();

  if (!client) {
    const text = sanitizeInterpretationText(
      fallbackText,
      payload.responseBlueprint,
      sanitizeOptions,
    );

    return {
      stream: createMockStream(text),
      citations: payload.citations,
      model: "mock-static-reader",
      pipeline: "local_fallback",
      generationMode,
      debug: {
        ...tarotKbDebug,
        generationMode,
        fallbackReason: "missing_minimax_api_key",
        total_ms: Date.now() - startedAt,
      },
    };
  }

  if (generationMode === "grounded_ai" && isGroundedAiBlockedBySafety(payload)) {
    const text = sanitizeInterpretationText(
      fallbackText,
      payload.responseBlueprint,
      sanitizeOptions,
    );

    return {
      stream: createTextStream(text),
      citations: payload.citations,
      model: "local-interpretation-fallback",
      pipeline: "kb_grounded_fallback",
      generationMode,
      debug: {
        ...tarotKbDebug,
        generationMode,
        fallbackReason: "safety_blocked_grounded_ai",
        total_ms: Date.now() - startedAt,
      },
    };
  }

  const timings: Record<string, number> = {};
  const idleTimeoutMs = Number.isFinite(INTERPRETATION_IDLE_TIMEOUT_MS)
    ? INTERPRETATION_IDLE_TIMEOUT_MS
    : 25000;
  const abortController = new AbortController();
  const aiClient = client;

  try {
    const qualityInput = {
      question,
      template: payload.responseBlueprint,
      diagnosis: payload.questionDiagnosis,
      requiredCardNames: payload.selectedCards.map(({ card }) => card.nameZh),
      intentDomain: readingIntent?.domain,
      userFeedbackTerms: feedbackQualityTerms(userFeedback),
    };
    const qualityRequirements = summarizeQualityRequirements(
      runQualityGate("", qualityInput).requirements,
    );
    let text = "";
    let quality = runQualityGate("", qualityInput);
    let retryCount = 0;
    let usedQualityFallback = false;

    async function generateText(attempt: number) {
      const generationStart = Date.now();
      const promptText =
        generationMode === "grounded_ai"
          ? buildGroundedGenerationPrompt(payload, qualityRequirements, attempt)
          : attempt === 0
            ? `${payload.userPrompt}\n\n质量验收要求：\n${qualityRequirements}`
            : `${payload.userPrompt}\n\n上一次输出没有通过质量验收。请重新生成，必须满足：\n${qualityRequirements}`;
      const messageStream = await withTimeout(
        aiClient.messages.create(
          {
            model: DEFAULT_MODEL,
            max_tokens: resolveInterpretationMaxTokens(payload),
            temperature: Number.isFinite(DEFAULT_TEMPERATURE) ? DEFAULT_TEMPERATURE : 0.8,
            system: [
              {
                type: "text",
                text: payload.systemPrompt,
              },
              {
                type: "text",
                text: payload.knowledgeText,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: promptText,
                  },
                ],
              },
            ],
            stream: true,
          },
          { signal: abortController.signal },
        ),
        Number.isFinite(INTERPRETATION_TIMEOUT_MS) ? INTERPRETATION_TIMEOUT_MS : 35000,
        "interpretation generation",
      );

      let pending = "";
      let fullText = "";
      let idleTimer: ReturnType<typeof setTimeout> | undefined;

      const armIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          abortController.abort(new Error(`interpretation stream idle for ${idleTimeoutMs}ms`));
        }, idleTimeoutMs);
      };

      armIdleTimer();

      try {
        for await (const chunk of messageStream) {
          if (chunk.type !== "content_block_delta") continue;
          if (chunk.delta.type !== "text_delta") continue;

          armIdleTimer();
          pending += chunk.delta.text;

          const lastNewline = pending.lastIndexOf("\n");
          if (lastNewline < 0) continue;

          const stable = pending.slice(0, lastNewline + 1);
          pending = pending.slice(lastNewline + 1);
          fullText += sanitizeInterpretationStreamSegment(stable, sanitizeOptions);
        }

        if (pending) {
          fullText += sanitizeInterpretationStreamSegment(pending, sanitizeOptions);
        }
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
      }

      timings[`generation_${attempt + 1}_ms`] = Date.now() - generationStart;
      return sanitizeInterpretationText(fullText, payload.responseBlueprint, sanitizeOptions);
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      text = await generateText(attempt);
      quality = runQualityGate(text, qualityInput);
      text = quality.text;

      if (!quality.needsRetry) break;
      retryCount += 1;
    }

    if (quality.needsRetry) {
      text = sanitizeInterpretationText(
        fallbackText,
        payload.responseBlueprint,
        sanitizeOptions,
      );
      quality = runQualityGate(text, qualityInput);
      usedQualityFallback = true;
    }

    timings.generation_ms = timings.generation_1_ms ?? 0;
    timings.total_ms = Date.now() - startedAt;
    timings.quality_issues = quality.issues.length;
    timings.quality_retries = retryCount;

    const pipeline =
      generationMode === "grounded_ai"
        ? usedQualityFallback
          ? "ai_grounded_quality_fallback"
          : retryCount > 0
            ? "ai_grounded_quality_gated_retry"
            : quality.repaired
              ? "ai_grounded_quality_gated"
              : "ai_grounded_generated"
        : usedQualityFallback
          ? "ai_quality_fallback"
          : retryCount > 0
            ? "ai_quality_gated_retry"
            : quality.repaired
              ? "ai_quality_gated"
              : "ai_generated";
    const shouldReportAiCompletion = !usedQualityFallback;

    return {
      stream: createTextStream(
        text,
        shouldReportAiCompletion
          ? (visibleText) =>
              input.onCompleteText?.({
                pipeline,
                text: visibleText,
              })
          : undefined,
      ),
      citations: payload.citations,
      model: usedQualityFallback ? "local-interpretation-fallback" : DEFAULT_MODEL,
      pipeline,
      generationMode,
      debug: {
        ...tarotKbDebug,
        ...timings,
        generationMode,
        qualityIssueIds: quality.issues.map((issue) => issue.id),
      },
    };
  } catch (error) {
    abortController.abort(error);
    timings.total_ms = Date.now() - startedAt;
    const text = sanitizeInterpretationText(
      fallbackText,
      payload.responseBlueprint,
      sanitizeOptions,
    );

    return {
      stream: createTextStream(text),
      citations: payload.citations,
      model: "local-interpretation-fallback",
      pipeline:
        generationMode === "grounded_ai" ? "ai_grounded_failed_fallback" : "ai_failed_fallback",
      generationMode,
      debug: {
        ...tarotKbDebug,
        ...timings,
        generationMode,
        fallbackReason: "stream_start_exception",
        error: error instanceof Error ? error.message : "Unknown interpretation error",
      },
    };
  }
}

export async function generateInterpretation(input: GenerateInput) {
  const startedAt = Date.now();
  const payload = await buildInterpretationPayload({
    question: input.question,
    spreadSlug: input.spreadSlug,
    cards: input.cards,
    drawLog: input.drawLog ?? undefined,
    readingIntent: input.readingIntent,
    userFeedback: input.userFeedback,
    locale: input.locale ?? "zh-CN",
  });
  return createInterpretationStream({
    payload,
    fallbackText: mockInterpretation(payload),
    startedAt,
  });
}

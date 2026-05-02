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

type GenerateInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  drawLog?: DrawLog | null;
  readingIntent?: ReadingIntent;
  userFeedback?: UserFeedback;
  locale?: string;
};

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
  selectedCard: Awaited<ReturnType<typeof buildInterpretationPayload>>["selectedCards"][number],
) {
  return `${selectedCard.card.nameZh}（${selectedCard.orientation}）`;
}

function cardKeywords(
  selectedCard: Awaited<ReturnType<typeof buildInterpretationPayload>>["selectedCards"][number],
  count = 3,
) {
  return selectedCard.keywords.slice(0, count).join("、") || "现实确认";
}

function describeCard(
  selectedCard: Awaited<ReturnType<typeof buildInterpretationPayload>>["selectedCards"][number],
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

function isHighRiskMoneyQuestion(question: string, intent?: ReadingIntent) {
  return (
    /all in|梭哈|股票|投资|基金|币|贷款|借钱|买房|卖房/i.test(question) ||
    intent?.domain === "decision"
  );
}

function feedbackSentence(
  payload: Awaited<ReturnType<typeof buildInterpretationPayload>>,
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
  payload: Awaited<ReturnType<typeof buildInterpretationPayload>>,
  selectedCard: Awaited<ReturnType<typeof buildInterpretationPayload>>["selectedCards"][number],
) {
  const question = payload.question.trim();

  if (isInterviewQuestion(question)) {
    return "面试前先做三件小事：把三段最能证明能力的经历整理成“背景、行动、结果、反思”；准备一个解释挫折或项目收尾的案例；留出休息时间，让自己进场时能稳住节奏。";
  }

  if (isExamQuestion(question) || payload.readingIntent?.domain === "study") {
    return "今天把复习压缩到三件可完成的事：先列出最可能失分的三个点，再各做一轮针对性练习，最后用一小段时间复述答题步骤。重点不是临时求保证，而是把会做的部分稳稳拿住。";
  }

  if (isHighRiskMoneyQuestion(question, payload.readingIntent)) {
    return "今天不要急着下注。先写清楚可承受亏损、时间线、替代方案和止损点；如果任何一项写不出来，就把行动降级为观察和补信息。";
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
  payload: Awaited<ReturnType<typeof buildInterpretationPayload>>,
  selectedCard: Awaited<ReturnType<typeof buildInterpretationPayload>>["selectedCards"][number],
) {
  const window = payload.responseBlueprint.timeScope.observationWindow;
  const question = payload.question.trim();

  if (isInterviewQuestion(question)) {
    return `观察窗口放在${window}。重点看：回答是否更具体，面对压力问题时是否能保持节奏，面试后是否知道自己哪里发挥稳定、哪里还要补。`;
  }

  if (isExamQuestion(question) || payload.readingIntent?.domain === "study") {
    return `观察窗口放在${window}。重点看：复习后错题是否减少，答题步骤是否更清楚，临场前是否能把注意力放在会做的部分。`;
  }

  if (payload.readingIntent?.domain === "self") {
    return `观察窗口放在${window}。重点看：你的自信是否能转成稳定行动，担心是否下降，以及完成小动作后身体和情绪有没有更踏实。`;
  }

  return `观察窗口放在${window}。重点看：${cardKeywords(selectedCard, 1)}这个主题是否变得更清楚，你是否能把焦虑转成一个可执行动作，以及现实反馈是否比原先更具体。`;
}

function buildSingleFallback(payload: Awaited<ReturnType<typeof buildInterpretationPayload>>) {
  const selectedCard = payload.selectedCards[0];
  const questionText = payload.question.trim();
  const feedback = feedbackSentence(payload);

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

function buildThreeCardFallback(payload: Awaited<ReturnType<typeof buildInterpretationPayload>>) {
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

function buildGenericFallback(payload: Awaited<ReturnType<typeof buildInterpretationPayload>>) {
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
  payload: Awaited<ReturnType<typeof buildInterpretationPayload>>,
) {
  if (payload.responseBlueprint.slug === "single-guidance") {
    return buildSingleFallback(payload);
  }

  if (payload.responseBlueprint.slug === "three-card") {
    return buildThreeCardFallback(payload);
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

function createTextStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.split(/(\n{2,}|\n|。|！|？)/).filter(Boolean);

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
        setTimeout(push, 18);
      }

      push();
    },
  });
}

function resolveInterpretationMaxTokens(
  payload: Awaited<ReturnType<typeof buildInterpretationPayload>>,
) {
  const envLimit = Number.isFinite(INTERPRETATION_MAX_TOKENS) ? INTERPRETATION_MAX_TOKENS : 1200;
  const templateLimit = payload.responseBlueprint.maxTokens;

  return Math.max(envLimit, templateLimit);
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
  const sanitizeOptions = {
    neutralizeRelationshipPronouns: shouldNeutralizeRelationshipPronouns(
      input.question,
      input.readingIntent,
    ),
  };
  const client = getClient();

  if (!client) {
    const text = sanitizeInterpretationText(
      mockInterpretation(payload),
      payload.responseBlueprint,
      sanitizeOptions,
    );

    return {
      stream: createMockStream(text),
      citations: payload.citations,
      model: "mock-static-reader",
      pipeline: "local_fallback",
      debug: {
        fallbackReason: "missing_minimax_api_key",
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
      question: input.question,
      template: payload.responseBlueprint,
      diagnosis: payload.questionDiagnosis,
      requiredCardNames: payload.selectedCards.map(({ card }) => card.nameZh),
      intentDomain: input.readingIntent?.domain,
      userFeedbackTerms: feedbackQualityTerms(input.userFeedback),
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
                    text:
                      attempt === 0
                        ? `${payload.userPrompt}\n\n质量验收要求：\n${qualityRequirements}`
                        : `${payload.userPrompt}\n\n上一次输出没有通过质量验收。请重新生成，必须满足：\n${qualityRequirements}`,
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
        mockInterpretation(payload),
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

    return {
      stream: createTextStream(text),
      citations: payload.citations,
      model: usedQualityFallback ? "local-interpretation-fallback" : DEFAULT_MODEL,
      pipeline:
        usedQualityFallback && quality.needsRetry
          ? "ai_quality_fallback_unresolved"
          : usedQualityFallback
            ? "ai_quality_fallback"
            : retryCount > 0
              ? "ai_quality_gated_retry"
            : quality.repaired
              ? "ai_quality_gated"
              : "ai_generated",
      debug: {
        ...timings,
        qualityIssueIds: quality.issues.map((issue) => issue.id),
      },
    };
  } catch (error) {
    abortController.abort(error);
    timings.total_ms = Date.now() - startedAt;
    const text = sanitizeInterpretationText(
      mockInterpretation(payload),
      payload.responseBlueprint,
      sanitizeOptions,
    );

    return {
      stream: createTextStream(text),
      citations: payload.citations,
      model: "local-interpretation-fallback",
      pipeline: "ai_failed_fallback",
      debug: {
        ...timings,
        fallbackReason: "stream_start_exception",
        error: error instanceof Error ? error.message : "Unknown interpretation error",
      },
    };
  }
}

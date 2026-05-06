import Anthropic from "@anthropic-ai/sdk";

import { buildLegacyInterpretationPayload } from "@/lib/interpretation/legacy-context";
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
const USE_STREAMING_INTERPRETATION = process.env.MINIMAX_INTERPRETATION_STREAM === "true";

type GenerateLegacyInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  drawLog?: DrawLog | null;
  readingIntent?: ReadingIntent;
  userFeedback?: UserFeedback;
  locale?: string;
};

type LegacyPayload = Awaited<ReturnType<typeof buildLegacyInterpretationPayload>>;

function getClient() {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Anthropic({
    apiKey,
    baseURL: DEFAULT_BASE_URL,
    timeout: Math.max(
      Number.isFinite(DEFAULT_TIMEOUT_MS) ? DEFAULT_TIMEOUT_MS : 15000,
      Number.isFinite(INTERPRETATION_TIMEOUT_MS) ? INTERPRETATION_TIMEOUT_MS : 35000,
    ),
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

function cardLabel(selectedCard: LegacyPayload["selectedCards"][number]) {
  return `${selectedCard.card.nameZh}（${selectedCard.orientation}）`;
}

function cardKeywords(selectedCard: LegacyPayload["selectedCards"][number], count = 3) {
  return selectedCard.keywords.slice(0, count).join("、") || "现实确认";
}

function buildLegacyFallback(payload: LegacyPayload) {
  const cards = payload.selectedCards;
  const first = cards[0];
  const finalCard = cards.at(-1);
  const section = (index: number, fallback: string) =>
    payload.responseBlueprint.sections[index] ?? fallback;

  if (!cards.length) {
    return [
      section(0, "1. 牌面先说"),
      "这次没有解析到有效牌面，因此不能给出负责任的塔罗解读。",
      "",
      section(1, "2. 牌面线索"),
      "请重新抽牌或检查牌面数据后再解读。",
      "",
      section(2, "3. 当前提醒"),
      "没有有效牌面时，不应该用泛化建议替代真实解读。",
    ].join("\n");
  }

  if (payload.responseBlueprint.slug === "single-guidance" && first) {
    return [
      section(0, "1. 牌面先说"),
      `抽到${cardLabel(first)}。这张牌先把注意力放在${cardKeywords(first)}上，它不是替你下结论，而是提醒你看见当下最需要调整的节奏。`,
      "",
      section(1, "2. 牌面线索"),
      `${first.position.name}里的${first.card.nameZh}提示：${first.primaryMeaning}`,
      "",
      section(2, "3. 当前提醒"),
      "先把这张牌当成一次轻量 check-in。它更适合提醒你看清情绪、资源和行动方式，而不是判断一整天的命运。",
      "",
      section(3, "4. 今日行动"),
      `今天围绕“${cardKeywords(first, 1)}”做一个小动作：把最担心的点写成一句现实问题，再完成一件当天能看到反馈的事。`,
      "",
      section(4, "5. 观察指标"),
      `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。重点看现实反馈是否更具体，以及你是否更清楚下一步该推进、暂停还是重新沟通。`,
    ].join("\n");
  }

  if (payload.responseBlueprint.slug === "path-of-choice" && cards.length >= 7) {
    const [aNow, aResult, bNow, bResult, hidden, action, summary] = cards;

    return [
      section(0, "1. 牌面先说"),
      `这组选择牌阵由${cards.map(cardLabel).join("、")}组成。它不替你拍板，而是把路径 A、路径 B、隐藏变量和决策前动作分开看清。`,
      "",
      section(1, "2. 两个选择的本质差异"),
      `路径 A 从${cardLabel(aNow)}走向${cardLabel(aResult)}，重点是${cardKeywords(aNow, 2)}如何发展成${cardKeywords(aResult, 2)}。路径 B 从${cardLabel(bNow)}走向${cardLabel(bResult)}，重点是${cardKeywords(bNow, 2)}如何承接${cardKeywords(bResult, 2)}。`,
      "",
      section(2, "3. 路径 A 的机会与代价"),
      `${aNow.position.name}里的${cardLabel(aNow)}提示路径 A 的机会在于${cardKeywords(aNow)}。代价则要看${aResult.position.name}里的${cardLabel(aResult)}：它提醒你确认后续是否能稳定承接，而不是只看开始时的吸引力。`,
      "",
      section(3, "4. 路径 B 的机会与代价"),
      `${bNow.position.name}里的${cardLabel(bNow)}提示路径 B 的机会在于${cardKeywords(bNow)}。代价则落在${bResult.position.name}里的${cardLabel(bResult)}：它提醒你留意情绪、沟通或期待是否会让判断变得摇摆。`,
      "",
      section(4, "5. 隐藏变量"),
      `${hidden.position.name}的${cardLabel(hidden)}说明真正容易被忽略的是${cardKeywords(hidden)}。先把这个变量说清楚，选择才不会变成情绪反射。`,
      "",
      section(5, "6. 决策前动作"),
      `${action.position.name}的${cardLabel(action)}给出的动作是：先做一次小步验证，确认时间、资源、边界和对方反馈，再决定推进、暂停还是调整方案。`,
      "",
      section(6, "7. 观察指标"),
      `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。重点看：哪条路径让现实反馈更清楚，哪条路径的代价更可承受，以及${summary.position.name}的${cardLabel(summary)}是否对应到你接下来能持续执行的节奏。`,
    ].join("\n");
  }

  if (payload.responseBlueprint.slug === "celtic-cross" && cards.length >= 10) {
    const [current, challenge, past, conscious, root, nearFuture, attitude, environment, hopes, longTerm] =
      cards;

    return [
      section(0, "1. 牌面先说"),
      `这次凯尔特十字由${cards.map(cardLabel).join("、")}组成。它不适合被读成单一结论，而是要把核心张力、内外因素、短期变化和长期趋势分开看。`,
      "",
      section(1, "2. 核心张力"),
      `${current.position.name}里的${cardLabel(current)}说明当前问题的中心在于${cardKeywords(current)}。${challenge.position.name}里的${cardLabel(challenge)}则指出真正产生压力的是${cardKeywords(challenge)}，这两张牌合在一起，是这次解读的主轴。`,
      "",
      section(2, "3. 内外因素"),
      `${attitude.position.name}的${cardLabel(attitude)}代表你自己的姿态，重点是${cardKeywords(attitude)}；${environment.position.name}的${cardLabel(environment)}代表外部环境或他人条件，重点是${cardKeywords(environment)}。内外两侧需要一起看，不能只怪外部，也不能把所有压力都归到自己身上。`,
      "",
      section(3, "4. 过去如何影响现在"),
      `${past.position.name}的${cardLabel(past)}显示近期背景，${root.position.name}的${cardLabel(root)}显示更深层的旧模式。它们提醒你：现在的卡点不是凭空出现，而是由过去的经验、惯性或未完成的整理一路推到眼前。`,
      "",
      section(4, "5. 短期变化"),
      `${nearFuture.position.name}里的${cardLabel(nearFuture)}提示未来一段时间最容易出现的变化方向。这里看的是趋势和可观察信号，不是保证某个结果必然发生。`,
      "",
      section(5, "6. 希望与担心"),
      `${hopes.position.name}里的${cardLabel(hopes)}同时承载期待和不安。它提示你辨认：哪些担心是真实风险，哪些只是旧经验投射出来的警报。`,
      "",
      section(6, "7. 长期趋势"),
      `${longTerm.position.name}里的${cardLabel(longTerm)}给出更长线的走向。它不是最终判决，而是说明如果你继续沿当前模式前进，最可能被强化的主题会是${cardKeywords(longTerm)}。`,
      "",
      section(7, "8. 行动建议"),
      `${conscious.position.name}的${cardLabel(conscious)}适合当作行动入口：先把目标、边界和下一步动作写清楚，再用一到两个现实反馈验证自己是否需要调整方向。`,
      "",
      section(8, "9. 观察指标"),
      `观察窗口放在${payload.responseBlueprint.timeScope.observationWindow}。重点看：核心压力是否下降，外部反馈是否更清楚，以及你是否能把${longTerm.card.nameZh}代表的长期主题落到具体行动里。`,
    ].join("\n");
  }

  return [
    section(0, "1. 牌面先说"),
    `这次牌面由${cards.map(cardLabel).join("、")}组成。先看牌位的任务，再看它们之间如何支持或拉扯，而不是把每张牌孤立解释。`,
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
    first
      ? `最需要先看的，是${first.position.name}里的${first.card.nameZh}。它提示你先确认真正的压力点，再决定哪里要推进、哪里要放慢。`
      : "关键矛盾需要有效牌面才能判断。",
    "",
    section(3, "4. 现实映射"),
    `放到${payload.readingIntent ? payload.readingIntent.domain : "当前问题"}里，这组牌更适合被当作现实检查：哪些资源可用，哪些情绪或沟通需要被处理，哪些动作能在短期内验证。`,
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

function createMockStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.split(/(\n{2,}|\n|。|！|？)/).filter(Boolean);

  return new ReadableStream<Uint8Array>({
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

  return new ReadableStream<Uint8Array>({
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

function resolveInterpretationMaxTokens(payload: LegacyPayload) {
  const envLimit = Number.isFinite(INTERPRETATION_MAX_TOKENS) ? INTERPRETATION_MAX_TOKENS : 1200;
  const templateLimit = payload.responseBlueprint.maxTokens;

  return Math.max(envLimit, templateLimit);
}

export async function generateLegacyInterpretation(input: GenerateLegacyInput) {
  const startedAt = Date.now();
  const payload = await buildLegacyInterpretationPayload({
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
      buildLegacyFallback(payload),
      payload.responseBlueprint,
      sanitizeOptions,
    );

    return {
      stream: createMockStream(text),
      citations: payload.citations,
      model: "mock-static-reader",
      pipeline: "local_fallback",
      generationMode: "legacy_ai",
      debug: {
        fallbackReason: "missing_minimax_api_key",
        total_ms: Date.now() - startedAt,
      },
    };
  }
  const activeClient = client;

  const timings: Record<string, number> = {};
  const idleTimeoutMs = Number.isFinite(INTERPRETATION_IDLE_TIMEOUT_MS)
    ? INTERPRETATION_IDLE_TIMEOUT_MS
    : 25000;
  const abortController = new AbortController();

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
    let rejectedQualityIssueIds: string[] = [];

    async function generateText(attempt: number) {
      const generationStart = Date.now();
      const requestPayload = {
        model: DEFAULT_MODEL,
        max_tokens: resolveInterpretationMaxTokens(payload),
        temperature: Number.isFinite(DEFAULT_TEMPERATURE) ? DEFAULT_TEMPERATURE : 0.8,
        system: [
          {
            type: "text" as const,
            text: payload.systemPrompt,
          },
          {
            type: "text" as const,
            text: payload.knowledgeText,
            cache_control: { type: "ephemeral" as const },
          },
        ],
        messages: [
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text:
                  attempt === 0
                    ? `${payload.userPrompt}\n\n质量验收要求：\n${qualityRequirements}`
                    : `${payload.userPrompt}\n\n上一次输出没有通过质量验收。请重新生成，必须满足：\n${qualityRequirements}`,
              },
            ],
          },
        ],
      };

      if (!USE_STREAMING_INTERPRETATION) {
        const message = await withTimeout(
          activeClient.messages.create(requestPayload, { signal: abortController.signal }),
          Number.isFinite(INTERPRETATION_TIMEOUT_MS) ? INTERPRETATION_TIMEOUT_MS : 35000,
          "legacy interpretation generation",
        );
        const fullText = message.content
          .map((block) => (block.type === "text" ? block.text : ""))
          .join("");

        timings[`generation_${attempt + 1}_ms`] = Date.now() - generationStart;
        return sanitizeInterpretationText(fullText, payload.responseBlueprint, sanitizeOptions);
      }

      const messageStream = await withTimeout(
        activeClient.messages.create(
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
        "legacy interpretation generation",
      );

      let pending = "";
      let fullText = "";
      let idleTimer: ReturnType<typeof setTimeout> | undefined;

      const armIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          abortController.abort(new Error(`legacy interpretation stream idle for ${idleTimeoutMs}ms`));
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
      rejectedQualityIssueIds = quality.issues.map((issue) => issue.id);
      text = sanitizeInterpretationText(
        buildLegacyFallback(payload),
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
      pipeline: usedQualityFallback ? "ai_quality_fallback" : "ai_generated",
      generationMode: "legacy_ai",
      debug: {
        ...timings,
        qualityIssueIds: quality.issues.map((issue) => issue.id),
        rejectedQualityIssueIds,
      },
    };
  } catch (error) {
    abortController.abort(error);
    timings.total_ms = Date.now() - startedAt;
    const text = sanitizeInterpretationText(
      buildLegacyFallback(payload),
      payload.responseBlueprint,
      sanitizeOptions,
    );

    return {
      stream: createTextStream(text),
      citations: payload.citations,
      model: "local-interpretation-fallback",
      pipeline: "ai_failed_fallback",
      generationMode: "legacy_ai",
      debug: {
        ...timings,
        fallbackReason: "stream_start_exception",
        error: error instanceof Error ? error.message : "Unknown legacy interpretation error",
      },
    };
  }
}

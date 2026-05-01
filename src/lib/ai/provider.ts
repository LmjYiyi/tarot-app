import Anthropic from "@anthropic-ai/sdk";

import { buildInterpretationPayload } from "@/lib/interpretation/context";
import {
  sanitizeInterpretationStreamSegment,
  sanitizeInterpretationText,
} from "@/lib/interpretation/output";
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

function mockInterpretation(
  payload: Awaited<ReturnType<typeof buildInterpretationPayload>>,
) {
  const overview = payload.selectedCards
    .map(
      ({ card, position, orientation, primaryMeaning }) =>
        `${position.name}落在${card.nameZh}（${orientation}），提示${primaryMeaning}`,
    )
    .join("；");

  const positionLines = payload.selectedCards.map(
    ({ card, position, orientation, keywords, primaryMeaning, domainMeaning }, index) =>
      [
        `${index + 1}. ${position.name}：${card.nameZh}（${orientation}）`,
        `这个位置的任务是：${position.focus}。`,
        `牌面给出的关键词是：${keywords.slice(0, 4).join("、")}。${primaryMeaning}`,
        domainMeaning ? `放到你选择的领域里，它还指向：${domainMeaning}` : null,
        `因此这里更像是在提醒你：${position.promptHint}`,
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n"),
  );

  const suggestion =
    payload.selectedCards[0]?.position.promptHint ??
    "先把问题拆回现实动作、边界和节奏，再决定下一步。";
  const reminder =
    payload.selectedCards.at(-1)?.card.keywordsUpright[0] ??
    payload.selectedCards.at(-1)?.card.keywordsReversed[0] ??
    "回到现实";
  const middleCard = payload.selectedCards[Math.floor(payload.selectedCards.length / 2)];
  const trendCard = payload.selectedCards.at(-1);
  const positionSection =
    payload.responseBlueprint.sections.find((section) =>
      /分位置|逐张|关键结构|路径对比|双方/.test(section),
    ) ?? "3. 分位置解读";
  const actionSection =
    payload.responseBlueprint.sections.find((section) => /行动|建议|方向/.test(section)) ??
    "6. 行动建议";
  const reminderSection =
    payload.responseBlueprint.sections.find((section) => /提醒|总结/.test(section)) ??
    "7. 一句提醒";

  return [
    payload.responseBlueprint.sections[0] ?? "1. 牌面总览",
    overview ||
      "这次抽牌更像是在提醒你先看清真实状态，再决定下一步。牌面不是在替你下结论，而是在把当前局势里的重点、阻力和可行动的方向摆到桌面上。",
    "",
    "2. 整体关系",
    middleCard
      ? `整组牌的重心落在${middleCard.card.nameZh}。它不像是在要求你立刻做出激烈改变，而是先看清哪里正在消耗你、哪里仍然有可用的资源。若牌面里有逆位，它更多表示能量暂时被压住、绕行或需要重新整理；若正位较多，则说明事情已经有可以推进的线索。`
      : "这组牌的重点不是单张牌的吉凶，而是牌位之间形成的结构：先确认现实处境，再辨认阻碍，最后把建议落成一个可执行动作。",
    "",
    positionSection,
    ...positionLines,
    "",
    "牌与牌之间",
    trendCard
      ? `从第一张牌到${trendCard.card.nameZh}，牌面呈现的是一个逐步收束的过程：你需要先承认当前的真实感受，再把注意力放回能控制的部分。不要把所有压力都理解成最终结果，它更像是当下需要被看见的信号。`
      : "这些牌之间的关系提示你：不要只看单一结论，要把位置、正逆位和问题本身连起来看。",
    "",
    "近期趋势",
    `近期更适合采取“小步确认”的策略。先不要急着证明一切都会好，或担心一切都会坏；你可以先观察${reminder}这个主题在现实里如何出现，再决定下一步的节奏。`,
    "",
    actionSection,
    `先抓住最关键的一张牌和一个位置任务。${suggestion}如果暂时做不到全部调整，至少先完成一个最具体的动作。`,
    "",
    reminderSection,
    `近期提醒：别忽视“${reminder}”这个信号，真正的变化会从你停止重复旧节奏开始。`,
  ].join("\n");
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

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
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
  const client = getClient();

  if (!client) {
    const text = sanitizeInterpretationText(mockInterpretation(payload), payload.responseBlueprint);

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

  try {
    const generationStart = Date.now();
    const messageStream = await withTimeout(
      client.messages.create(
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
              content: [{ type: "text", text: payload.userPrompt }],
            },
          ],
          stream: true,
        },
        { signal: abortController.signal },
      ),
      Number.isFinite(INTERPRETATION_TIMEOUT_MS) ? INTERPRETATION_TIMEOUT_MS : 35000,
      "interpretation stream start",
    );
    timings.generation_ms = Date.now() - generationStart;
    timings.total_ms = Date.now() - startedAt;

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let pending = "";
        let emittedAnything = false;
        let idleTimer: ReturnType<typeof setTimeout> | undefined;

        const armIdleTimer = () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            abortController.abort(
              new Error(`interpretation stream idle for ${idleTimeoutMs}ms`),
            );
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
            const sanitized = sanitizeInterpretationStreamSegment(stable);
            if (sanitized) {
              controller.enqueue(encoder.encode(sanitized));
              emittedAnything = true;
            }
          }

          if (pending) {
            const sanitized = sanitizeInterpretationStreamSegment(pending);
            if (sanitized) {
              controller.enqueue(encoder.encode(sanitized));
              emittedAnything = true;
            }
          }

          controller.close();
        } catch (err) {
          if (!emittedAnything) {
            try {
              const text = sanitizeInterpretationText(
                mockInterpretation(payload),
                payload.responseBlueprint,
              );
              controller.enqueue(encoder.encode(text));
              controller.close();
              return;
            } catch {
              controller.error(err);
              return;
            }
          }
          try {
            controller.close();
          } catch {
            // already closed
          }
        } finally {
          if (idleTimer) clearTimeout(idleTimer);
        }
      },
      cancel(reason) {
        abortController.abort(reason);
      },
    });

    return {
      stream: readableStream,
      citations: payload.citations,
      model: DEFAULT_MODEL,
      pipeline: "ai_generated",
      debug: timings,
    };
  } catch (error) {
    abortController.abort(error);
    timings.total_ms = Date.now() - startedAt;
    const text = sanitizeInterpretationText(mockInterpretation(payload), payload.responseBlueprint);

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

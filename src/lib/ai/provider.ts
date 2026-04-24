import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { z } from "zod";

import {
  ADAPTIVE_QUESTION_SYSTEM_PROMPT,
  buildAdaptiveQuestionPayload,
  buildFallbackAdaptiveQuestions,
  reviewAdaptiveQuestionOutput,
} from "@/lib/interpretation/adaptive-questioning";
import { buildInterpretationPayload } from "@/lib/interpretation/context";
import { getCardById } from "@/lib/tarot/catalog";
import type {
  AdaptiveAnswer,
  AdaptiveQuestion,
  DrawLog,
  DrawnCard,
  ReadingIntent,
  UserFeedback,
} from "@/lib/tarot/types";

const DEFAULT_MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M2.7";
const DEFAULT_BASE_URL =
  process.env.MINIMAX_BASE_URL ?? "https://api.minimaxi.com/anthropic";
const DEFAULT_TEMPERATURE = Number(process.env.MINIMAX_TEMPERATURE ?? 0.8);
const DEFAULT_TIMEOUT_MS = Number(process.env.MINIMAX_TIMEOUT_MS ?? 15000);
const DEFAULT_MAX_RETRIES = Number(process.env.MINIMAX_MAX_RETRIES ?? 0);
const INTERPRETATION_MAX_TOKENS = Number(process.env.MINIMAX_INTERPRETATION_MAX_TOKENS ?? 1600);
const INTERPRETATION_TIMEOUT_MS = Number(process.env.MINIMAX_INTERPRETATION_TIMEOUT_MS ?? 35000);

type GenerateInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  drawLog?: DrawLog | null;
  readingIntent?: ReadingIntent;
  userFeedback?: UserFeedback;
  adaptiveAnswers?: AdaptiveAnswer[];
  locale?: string;
};

type GenerateAdaptiveQuestionsInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  readingIntent?: ReadingIntent;
  locale?: string;
  questionCount?: number;
};

type AdaptiveQuestionPipeline =
  | "local_fallback"
  | "ai_generated"
  | "ai_failed_fallback";

const adaptiveQuestionResponseSchema = z.object({
  core_tension: z.string().min(1).optional(),
  question_strategy: z.string().min(1).optional(),
  questions: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        question: z.string().min(1).max(260),
        basis: z.string().min(1).max(360),
        purpose: z.string().min(1).max(220),
        answer_type: z.enum(["open", "choice", "multi_choice"]).default("choice"),
        options: z.array(z.string().min(1).max(60)).max(6).default([]),
      }),
    )
    .min(1)
    .max(4),
});

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

function countCjkCharacters(value: string) {
  return (value.match(/[\u4e00-\u9fff]/g) ?? []).length;
}

function normalizeModelText(value: string) {
  if (!/[\u0080-\u009f]|Ã|Â|è|é|å|æ|ç|ä|ï¼/.test(value)) {
    return value;
  }

  const decoded = Buffer.from(value, "latin1").toString("utf8");
  return countCjkCharacters(decoded) > countCjkCharacters(value) ? decoded : value;
}

function extractText(content: Anthropic.Messages.ContentBlock[] | undefined, fallback = "") {
  if (!content) {
    return fallback;
  }

  const text = content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (text) {
    return normalizeModelText(text);
  }

  const fallbackText = content
    .map((block) => {
      const record = block as unknown as Record<string, unknown>;
      return typeof record.thinking === "string" ? record.thinking : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();

  return fallbackText ? normalizeModelText(fallbackText) : fallback;
}

function repairJsonText(jsonText: string) {
  return jsonText
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/}\s+(?={)/g, "},")
    .replace(/]\s+(?=")/g, '],')
    .replace(/"\s+(?=")/g, '",')
    .replace(/([}\]])\s+(?=")/g, '$1,');
}

function parseJsonWithRepair(jsonText: string) {
  try {
    return { value: JSON.parse(jsonText), repaired: false };
  } catch (firstError) {
    const repairedText = repairJsonText(jsonrepair(jsonText));

    try {
      return { value: JSON.parse(repairedText), repaired: true };
    } catch (secondError) {
      const message =
        secondError instanceof Error
          ? secondError.message
          : firstError instanceof Error
            ? firstError.message
            : "Invalid JSON";
      throw new Error(message);
    }
  }
}

function extractJsonObject(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end <= start) {
    throw new Error("Adaptive question response did not contain JSON.");
  }

  return parseJsonWithRepair(candidate.slice(start, end + 1));
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

function normalizeAiQuestions(
  parsed: z.infer<typeof adaptiveQuestionResponseSchema>,
): AdaptiveQuestion[] {
  return parsed.questions.map((question, index) => {
    const id = question.id?.trim() || `q${index + 1}`;
    const isOpen = question.answer_type === "open";
    const options = isOpen
      ? undefined
      : (question.options.length ? question.options : ["更像前者", "更像后者", "两者都有", "说不上来"])
          .slice(0, 6)
          .map((label, optionIndex) => ({
            value: `${id}_${optionIndex + 1}`,
            label,
          }));

    return {
      id,
      stage: "post_feedback",
      question: question.question,
      basis: question.basis,
      purpose: question.purpose,
      answerType: isOpen ? "free_text" : "single_choice",
      options,
    };
  });
}

function mergeAiQuestionsWithFallback(
  aiQuestions: AdaptiveQuestion[],
  fallbackQuestions: AdaptiveQuestion[],
) {
  const questions = [...aiQuestions];
  const seenIds = new Set(questions.map((question) => question.id));

  fallbackQuestions.forEach((question) => {
    if (questions.length >= fallbackQuestions.length || seenIds.has(question.id)) {
      return;
    }

    questions.push(question);
    seenIds.add(question.id);
  });

  return questions.slice(0, fallbackQuestions.length);
}

function shouldUseFallbackQuestions(input: GenerateAdaptiveQuestionsInput, questions: AdaptiveQuestion[]) {
  const resolvedCards = input.cards
    .map((card) => ({
      ...card,
      card: getCardById(card.cardId),
    }))
    .filter((entry): entry is typeof entry & { card: NonNullable<typeof entry.card> } =>
      Boolean(entry.card),
    );
  const allQuestionText = questions
    .map((question) =>
      [
        question.question,
        question.basis,
        question.purpose,
        ...(question.options?.map((option) => option.label) ?? []),
      ].join("\n"),
    )
    .join("\n");

  if (resolvedCards.length <= 3) {
    const missedCard = resolvedCards.some(({ card }) => !allQuestionText.includes(card.nameZh));
    if (missedCard) {
      return true;
    }
  }

  const wheelQuestion = questions.find((question) =>
    [question.question, question.basis, ...(question.options?.map((option) => option.label) ?? [])]
      .join("\n")
      .includes("命运之轮"),
  );
  if (
    wheelQuestion &&
    /行动感|有动力|急迫|被要求变强|点不起来/.test(
      [
        wheelQuestion.question,
        wheelQuestion.basis,
        ...(wheelQuestion.options?.map((option) => option.label) ?? []),
      ].join("\n"),
    )
  ) {
    return true;
  }

  const pentaclesFourQuestion = questions.find((question) =>
    [question.question, question.basis, ...(question.options?.map((option) => option.label) ?? [])]
      .join("\n")
      .includes("星币四"),
  );
  if (
    pentaclesFourQuestion &&
    /休息/.test(
      [
        pentaclesFourQuestion.question,
        pentaclesFourQuestion.basis,
        ...(pentaclesFourQuestion.options?.map((option) => option.label) ?? []),
      ].join("\n"),
    )
  ) {
    return true;
  }

  return false;
}

function withAdaptiveDebug<T extends Record<string, unknown>>(
  result: T,
  pipeline: AdaptiveQuestionPipeline,
  debug: Record<string, unknown>,
) {
  const reviewScore =
    typeof debug.reviewScore === "number"
      ? debug.reviewScore
      : typeof debug.localReviewScore === "number"
        ? debug.localReviewScore
        : undefined;

  return {
    ...result,
    pipeline,
    reviewScore,
    debug: {
      pipeline,
      ...debug,
    },
  };
}

function toGeneratedQuestionResult(
  input: GenerateAdaptiveQuestionsInput,
  payload: Awaited<ReturnType<typeof buildAdaptiveQuestionPayload>>,
  parsed: z.infer<typeof adaptiveQuestionResponseSchema>,
  model: string,
) {
  const questions = mergeAiQuestionsWithFallback(
    normalizeAiQuestions(parsed),
    payload.questions,
  );
  const localReview = reviewAdaptiveQuestionOutput(input, {
    coreTension: parsed.core_tension ?? payload.coreTension,
    questionStrategy: parsed.question_strategy ?? payload.questionStrategy,
    questions,
  });

  return {
    result: {
      domain: input.readingIntent?.domain ?? payload.domain,
      coreTension: parsed.core_tension ?? payload.coreTension,
      questionStrategy: parsed.question_strategy ?? payload.questionStrategy,
      questions,
      model,
    },
    questions,
    localReview,
  };
}

async function createAdaptiveQuestionMessage(
  client: Anthropic,
  userPrompt: string,
) {
  return withTimeout(
    client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1200,
      temperature: 0.25,
      system: ADAPTIVE_QUESTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userPrompt }],
        },
      ],
    }),
    Number.isFinite(DEFAULT_TIMEOUT_MS) ? DEFAULT_TIMEOUT_MS : 15000,
    "adaptive question generation",
  );
}

function mockInterpretation(
  payload: Awaited<ReturnType<typeof buildInterpretationPayload>>,
) {
  const overview = payload.selectedCards
    .slice(0, 2)
    .map(
      ({ card, position, orientation, primaryMeaning }) =>
        `${position.name}落在${card.nameZh}（${orientation}），说明${primaryMeaning}`,
    )
    .join("；");

  const positionLines = payload.selectedCards.map(
    ({ card, position, orientation, keywords, primaryMeaning }, index) =>
      `${index + 1}. ${position.name}：${card.nameZh}（${orientation}）聚焦${keywords.join("、")}。${primaryMeaning}`,
  );

  const suggestion =
    payload.selectedCards[0]?.position.promptHint ??
    "先把问题拆回现实动作、边界和节奏，再决定下一步。";
  const reminder =
    payload.selectedCards.at(-1)?.card.keywordsUpright[0] ??
    payload.selectedCards.at(-1)?.card.keywordsReversed[0] ??
    "回到现实";

  return [
    payload.responseBlueprint.sections[0] ?? "1. 牌面总览",
    overview || "这次抽牌更像是在提醒你先看清真实状态，再决定下一步。",
    "",
    payload.responseBlueprint.sections[1] ?? "2. 用户反馈摘要",
    payload.feedbackSummary,
    "",
    "适配追问",
    payload.adaptiveSummary,
    "",
    payload.responseBlueprint.sections[3] ?? "4. 分位置解读",
    ...positionLines,
    "",
    payload.responseBlueprint.sections.at(-2) ?? "行动建议",
    `先抓住最关键的一张牌和一个位置任务。${suggestion}如果暂时做不到全部调整，至少先完成一个最具体的动作。`,
    "",
    payload.responseBlueprint.sections.at(-1) ?? "一句提醒",
    `近期提醒：别忽视“${reminder}”这个信号，真正的变化会从你停止重复旧节奏开始。`,
  ].join("\n");
}

export async function generateAdaptiveQuestions(input: GenerateAdaptiveQuestionsInput) {
  const startedAt = Date.now();
  const fallback = buildFallbackAdaptiveQuestions(input);
  const client = getClient();

  if (!client) {
    return withAdaptiveDebug(fallback, "local_fallback", {
      fallbackReason: "missing_minimax_api_key",
      reviewScore: 100,
      selfCheckPass: true,
      timings: {
        total_ms: Date.now() - startedAt,
      },
    });
  }

  const payloadStart = Date.now();
  const payload = buildAdaptiveQuestionPayload(input);
  const timings: Record<string, number> = {
    local_payload_ms: Date.now() - payloadStart,
  };

  try {
    const generationStart = Date.now();
    const message = await createAdaptiveQuestionMessage(client, payload.userPrompt);
    timings.generation_ms = Date.now() - generationStart;

    const parseStart = Date.now();
    const text = extractText(message.content);
    const extracted = extractJsonObject(text);
    const parsed = adaptiveQuestionResponseSchema.parse(extracted.value);
    timings.parse_ms = Date.now() - parseStart;

    const reviewStart = Date.now();
    const generated = toGeneratedQuestionResult(input, payload, parsed, message.model);
    const fallbackRequired =
      generated.localReview.rewriteRequired || shouldUseFallbackQuestions(input, generated.questions);
    timings.local_review_ms = Date.now() - reviewStart;
    timings.total_ms = Date.now() - startedAt;

    if (fallbackRequired) {
      return withAdaptiveDebug(fallback, "ai_failed_fallback", {
        fallbackReason: "local_quality_gate_failed",
        reviewScore: generated.localReview.score,
        localReviewScore: generated.localReview.score,
        rewriteRequired: generated.localReview.rewriteRequired,
        rewriteReasons: generated.localReview.rewriteReasons,
        problems: generated.localReview.problems,
        jsonRepaired: extracted.repaired,
        model: message.model,
        timings,
      });
    }

    return withAdaptiveDebug(generated.result, "ai_generated", {
      reviewScore: generated.localReview.score,
      localReviewScore: generated.localReview.score,
      rewriteRequired: false,
      jsonRepaired: extracted.repaired,
      model: message.model,
      timings,
    });
  } catch (error) {
    timings.total_ms = Date.now() - startedAt;

    return withAdaptiveDebug(fallback, "ai_failed_fallback", {
      fallbackReason: "exception",
      error: error instanceof Error ? error.message : "Unknown adaptive question error",
      reviewScore: 0,
      timings,
    });
  }
}

function createMockStream(text: string) {
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
        setTimeout(push, 25);
      }

      push();
    },
  });
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
    adaptiveAnswers: input.adaptiveAnswers,
    locale: input.locale ?? "zh-CN",
  });
  const client = getClient();

  if (!client) {
    return {
      stream: createMockStream(mockInterpretation(payload)),
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

  try {
    const generationStart = Date.now();
    const messageStream = await withTimeout(
      client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: Number.isFinite(INTERPRETATION_MAX_TOKENS)
          ? INTERPRETATION_MAX_TOKENS
          : 1200,
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
      }),
      Number.isFinite(INTERPRETATION_TIMEOUT_MS) ? INTERPRETATION_TIMEOUT_MS : 35000,
      "interpretation stream start",
    );
    timings.generation_ms = Date.now() - generationStart;
    timings.total_ms = Date.now() - startedAt;

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of messageStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
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
    timings.total_ms = Date.now() - startedAt;

    return {
      stream: createMockStream(mockInterpretation(payload)),
      citations: payload.citations,
      model: "local-interpretation-fallback",
      pipeline: "ai_failed_fallback",
      debug: {
        ...timings,
        fallbackReason: "exception",
        error: error instanceof Error ? error.message : "Unknown interpretation error",
      },
    };
  }
}

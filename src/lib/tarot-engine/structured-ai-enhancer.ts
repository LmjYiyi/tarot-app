import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";

import { structuredAiPatchSchema } from "./structured-ai-schema";
import type { StructuredAiPatch } from "./structured-ai-schema";
import type { TarotQualityResult } from "./quality-gate";
import {
  buildStructuredSections,
  type TarotInterpretationV2Result,
} from "./structured-result";
import type { TarotEngineContext } from "./types";

const DEFAULT_MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M2.7";
const DEFAULT_BASE_URL =
  process.env.MINIMAX_BASE_URL ?? "https://api.minimaxi.com/anthropic";
const DEFAULT_TIMEOUT_MS = Number(process.env.MINIMAX_TIMEOUT_MS ?? 60000);
const DEFAULT_MAX_RETRIES = Number(process.env.MINIMAX_MAX_RETRIES ?? 0);
const STRUCTURED_MAX_TOKENS = Number(process.env.MINIMAX_STRUCTURED_MAX_TOKENS ?? 2200);
const STRUCTURED_TEMPERATURE = Number(process.env.MINIMAX_STRUCTURED_TEMPERATURE ?? 0.45);

type EnhanceStructuredResultInput = {
  question: string;
  base: TarotInterpretationV2Result;
  tarotEngineContext: TarotEngineContext;
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

function sortIds(values: string[]) {
  return [...values].sort().join("|");
}

function compactText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function extractText(message: Awaited<ReturnType<Anthropic["messages"]["create"]>>) {
  const content =
    "content" in message && Array.isArray(message.content)
      ? message.content
      : [];

  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n");
}

function parsePatch(rawText: string): StructuredAiPatch {
  const trimmed = rawText.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw new Error("AI structured patch did not contain a JSON object.");
  }

  const repaired = jsonrepair(trimmed.slice(start, end + 1));
  return structuredAiPatchSchema.parse(JSON.parse(repaired));
}

function buildPrompt(input: EnhanceStructuredResultInput) {
  const promptCards = input.base.cards.map((card) => ({
    cardId: card.cardId,
    cardName: card.cardName,
    orientation: card.orientation,
    positionId: card.positionId,
    positionName: card.positionName,
    meaning: card.meaning,
    advice: card.advice ?? [],
    reflectionQuestions: card.reflectionQuestions ?? [],
  }));
  const promptCombinations = input.base.combinations.map((combination) => ({
    cardIds: combination.cardIds,
    cardNames: combination.cardNames,
    positions: combination.positions,
    reason: combination.reason,
    summary: combination.summary,
  }));
  const safeBase = {
    question: input.base.question,
    spread: input.base.spread,
    cards: promptCards,
    combinations: promptCombinations,
    reading: {
      opening: input.base.reading.opening,
      overallTheme: input.base.reading.overallTheme,
      summary: input.base.reading.summary,
      advice: input.base.reading.advice,
      feedbackQuestions: input.base.reading.feedbackQuestions,
    },
    safety: input.base.safety,
    goldenCases: input.tarotEngineContext.goldenCases.map(({ case: item }) => ({
      caseId: item.case_id,
      intent: item.intent,
      riskLevel: item.risk_level,
      spreadId: item.spread_id,
    })),
  };

  return [
    "你是塔罗结构化解读的表达润色器，不是重新占卜。",
    "你只能润色已有 KB structured result 的表达字段。",
    "禁止改变牌名、正逆位、牌位、领域、安全边界、kbVersion、pipeline、readingId 或任何事实字段。",
    "禁止新增绝对预测、宿命论、精确日期、投资/医疗/法律保证，也禁止替第三方断言心理。",
    "如果 safety.note 存在，必须维持安全边界，只能把表达写得更清楚、更像真人占卜师。",
    "只润色最有价值的字段；可以只返回 reading，也可以只返回部分 cards/combinations。",
    "不确定怎么改的字段请省略，不要为了完整而编造。",
    "只返回 JSON，不要 Markdown，不要解释。",
    "",
    "JSON schema:",
    JSON.stringify({
      cards: [
        {
          cardId: "必须原样返回已有 cardId",
          positionId: "必须原样返回已有 positionId",
          polishedMeaning: "可选。润色后的逐牌解释，20 字以上",
          advice: ["行动建议，可为空数组"],
          reflectionQuestions: ["感受型反馈问题，可为空数组"],
        },
      ],
      combinations: [
        {
          cardIds: ["必须原样返回已有组合 cardIds"],
          polishedSummary: "润色后的组合解释，10 字以上",
        },
      ],
      reading: {
        opening: "可选。润色后的开场",
        overallTheme: "可选。润色后的整体主题",
        summary: "可选。润色后的总结",
        advice: ["可选。行动建议"],
        feedbackQuestions: ["可选。感受型反馈问题"],
      },
    }),
    "",
    "用户问题:",
    input.question,
    "",
    "KB structured result:",
    JSON.stringify(safeBase),
  ].join("\n");
}

export function mergeStructuredAiPatch(
  base: TarotInterpretationV2Result,
  patch: StructuredAiPatch,
): TarotInterpretationV2Result {
  const patchByCardKey = new Map(
    patch.cards.map((item) => [`${item.cardId}|${item.positionId}`, item]),
  );
  const cards = base.cards.map((card) => {
    const cardPatch = patchByCardKey.get(`${card.cardId}|${card.positionId}`);

    if (!cardPatch) return card;

    return {
      ...card,
      meaning: cardPatch.polishedMeaning ?? card.meaning,
      advice: cardPatch.advice.length ? cardPatch.advice.map(compactText).filter(Boolean) : card.advice,
      reflectionQuestions: cardPatch.reflectionQuestions.length
        ? cardPatch.reflectionQuestions.map(compactText).filter(Boolean)
        : card.reflectionQuestions,
    };
  });
  const combinations = base.combinations.map((combination) => {
    const matched = patch.combinations.find(
      (item) => sortIds(item.cardIds) === sortIds(combination.cardIds),
    );

    return matched ? { ...combination, summary: matched.polishedSummary } : combination;
  });

  const polishedAdvice = patch.reading.advice.map(compactText).filter(Boolean);
  const polishedFeedbackQuestions = patch.reading.feedbackQuestions.map(compactText).filter(Boolean);
  const reading = {
    opening: compactText(patch.reading.opening) || base.reading.opening,
    overallTheme: compactText(patch.reading.overallTheme) || base.reading.overallTheme,
    summary: compactText(patch.reading.summary) || base.reading.summary,
    closingNote: polishedAdvice[0]
      ? `最后给你的提醒：${polishedAdvice[0]}`
      : base.reading.closingNote,
    advice: polishedAdvice.length ? polishedAdvice : base.reading.advice,
    feedbackQuestions: polishedFeedbackQuestions.length
      ? polishedFeedbackQuestions
      : base.reading.feedbackQuestions,
  };
  const enhanced = {
    ...base,
    pipeline: "ai_structured_enhanced" as const,
    cards,
    combinations,
    reading,
  };

  return {
    ...enhanced,
    sections: buildStructuredSections({
      reading,
      cards,
      combinations,
      safety: enhanced.safety,
    }),
  };
}

export function applyEnhancedStructuredResultQuality(input: {
  base: TarotInterpretationV2Result;
  enhanced: TarotInterpretationV2Result;
  enhancedQuality: TarotQualityResult;
}): TarotInterpretationV2Result {
  if (!input.enhancedQuality.passed) {
    return {
      ...input.base,
      pipeline: "ai_structured_quality_fallback",
    };
  }

  return {
    ...input.enhanced,
    quality: {
      score: input.enhancedQuality.score,
      passed: input.enhancedQuality.passed,
      issues: input.enhancedQuality.issues,
      checks: input.enhancedQuality.checks,
    },
  };
}

export async function enhanceStructuredResultWithAi(input: EnhanceStructuredResultInput) {
  const client = getClient();

  if (!client) {
    throw new Error("MINIMAX_API_KEY is not configured.");
  }

  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: Number.isFinite(STRUCTURED_MAX_TOKENS) ? STRUCTURED_MAX_TOKENS : 2200,
    temperature: Number.isFinite(STRUCTURED_TEMPERATURE) ? STRUCTURED_TEMPERATURE : 0.45,
    system: "你只输出符合 schema 的 JSON patch。不要输出 Markdown，不要输出解释。",
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: buildPrompt(input) }],
      },
    ],
  });

  return mergeStructuredAiPatch(input.base, parsePatch(extractText(message)));
}

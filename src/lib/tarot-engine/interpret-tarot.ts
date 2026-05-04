import { createInterpretationStream } from "@/lib/ai/provider";
import { buildInterpretationPayload } from "@/lib/interpretation/context";

import {
  buildDailySingleGuidanceText,
  createDailySingleGuidanceStream,
} from "./daily-single-guidance";
import { buildKbDrivenFallback } from "./kb-fallback";
import { writeTarotQualityLog } from "./quality-log";
import { qualityCheckByRules } from "./quality-gate";
import { retrieveTarotEngineContext } from "./retrieve-context";
import type { TarotQualityLogEntry } from "./quality-log";
import type { TarotQualityResult } from "./quality-gate";
import type { InterpretTarotInput, InterpretTarotResult } from "./types";

function buildHeaders(result: {
  model: string;
  pipeline?: string;
  generationMode?: string;
  debug?: unknown;
  fallbackQuality?: { passed: boolean; score: number; issues: string[] };
}): Record<string, string> {
  const debug = result.debug as Record<string, unknown> | undefined;

  return {
    "Cache-Control": "no-store",
    "x-model": result.model,
    "x-interpretation-pipeline": result.pipeline ?? "unknown",
    "x-interpretation-generation-mode":
      result.generationMode ??
      (typeof debug?.generationMode === "string" ? debug.generationMode : "legacy"),
    "x-interpretation-ms":
      typeof debug?.total_ms === "number" ? String(debug.total_ms) : "unknown",
    "x-interpretation-fallback-reason":
      typeof debug?.fallbackReason === "string" ? debug.fallbackReason : "none",
    "x-tarot-kb-version":
      typeof debug?.tarotKbVersion === "string" ? debug.tarotKbVersion : "unknown",
    "x-tarot-kb-domain":
      typeof debug?.tarotKbDomain === "string" ? debug.tarotKbDomain : "unknown",
    "x-tarot-kb-context-hits":
      typeof debug?.tarotKbCardContextHits === "number"
        ? String(debug.tarotKbCardContextHits)
        : "unknown",
    "x-tarot-kb-pair-hits":
      typeof debug?.tarotKbPairContextHits === "number"
        ? String(debug.tarotKbPairContextHits)
        : "unknown",
    "x-tarot-kb-question-hits":
      typeof debug?.tarotKbQuestionMatchHits === "number"
        ? String(debug.tarotKbQuestionMatchHits)
        : "unknown",
    "x-tarot-kb-safety-hits":
      typeof debug?.tarotKbSafetyMatchHits === "number"
        ? String(debug.tarotKbSafetyMatchHits)
        : "unknown",
    "x-tarot-fallback-quality-score": result.fallbackQuality
      ? String(result.fallbackQuality.score)
      : "unknown",
    "x-tarot-fallback-quality-passed": result.fallbackQuality
      ? String(result.fallbackQuality.passed)
      : "unknown",
    "x-tarot-fallback-quality-issues": result.fallbackQuality
      ? String(result.fallbackQuality.issues.length)
      : "unknown",
  };
}

function shouldLogAiQuality() {
  return process.env.TAROT_QUALITY_LOG === "1";
}

function previewText(text: string, max = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

export async function interpretTarot(input: InterpretTarotInput): Promise<InterpretTarotResult> {
  const startedAt = Date.now();

  if (input.spreadSlug === "single-guidance" && input.cards.length === 1) {
    const tarotEngineContext = await retrieveTarotEngineContext({
      question: input.question,
      spreadSlug: input.spreadSlug,
      cards: input.cards,
      readingIntent: input.readingIntent,
    });
    const text = buildDailySingleGuidanceText({
      card: input.cards[0],
      dailyAstrology: input.dailyAstrology,
      tarotEngineContext,
    });
    const result = {
      stream: createDailySingleGuidanceStream(text),
      citations: [],
      model: "local-daily-guidance",
      pipeline: "local_daily_guidance_retrieved",
      generationMode: "local_template_with_retrieval",
      debug: {
        total_ms: Date.now() - startedAt,
        fallbackReason: "none",
        generationMode: "local_template_with_retrieval",
        tarotKbVersion: tarotEngineContext.kbVersion,
        tarotKbDomain: tarotEngineContext.domain,
        tarotKbCardContextHits: tarotEngineContext.cardContexts.length,
        tarotKbPairContextHits: tarotEngineContext.pairContexts.length,
        tarotKbQuestionMatchHits: tarotEngineContext.questionMatches.length,
        tarotKbSafetyMatchHits: tarotEngineContext.safetyMatches.length,
      },
    };

    return {
      ...result,
      headers: buildHeaders(result),
    };
  }

  const tarotEngineContext = await retrieveTarotEngineContext({
    question: input.question,
    spreadSlug: input.spreadSlug,
    cards: input.cards,
    readingIntent: input.readingIntent,
  });
  const payload = await buildInterpretationPayload({
    question: input.question,
    spreadSlug: input.spreadSlug,
    cards: input.cards,
    drawLog: input.drawLog ?? undefined,
    readingIntent: input.readingIntent,
    userFeedback: input.userFeedback,
    dailyAstrology: input.dailyAstrology,
    locale: input.locale ?? "zh-CN",
    tarotEngineContext,
  });
  const fallbackText = buildKbDrivenFallback({
    question: payload.question,
    spreadName: payload.spreadName,
    responseBlueprint: payload.responseBlueprint,
    selectedCards: payload.selectedCards,
    readingIntent: payload.readingIntent,
    dailyAstrology: payload.dailyAstrology,
    tarotEngineContext,
  });
  const fallbackQuality = qualityCheckByRules({
    outputText: fallbackText,
    tarotEngineContext,
    pipeline: "local_fallback",
  });
  const buildQualityLogEntry = (
    pipeline: string,
    quality: TarotQualityResult,
  ): TarotQualityLogEntry => ({
    timestamp: new Date().toISOString(),
    pipeline,
    kbVersion: tarotEngineContext.kbVersion,
    domain: tarotEngineContext.domain,
    spreadId: payload.responseBlueprint.slug,
    questionPreview: previewText(payload.question),
    cards: payload.selectedCards.map(({ card, orientation, position }) => ({
      cardId: card.id,
      cardName: card.nameZh,
      orientation: orientation === "逆位" ? "reversed" : "upright",
      positionId: String(position.order),
      positionName: position.name,
    })),
    kbHits: {
      contextHits: tarotEngineContext.cardContexts.length,
      pairHits: tarotEngineContext.pairContexts.length,
      questionHits: tarotEngineContext.questionMatches.length,
      safetyHits: tarotEngineContext.safetyMatches.length,
      goldenCaseHits: tarotEngineContext.goldenCases.length,
    },
    quality: {
      score: quality.score,
      passed: quality.passed,
      issues: quality.issues,
      checks: quality.checks,
    },
  });

  await writeTarotQualityLog(buildQualityLogEntry("local_fallback", fallbackQuality));

  if (!fallbackQuality.passed || fallbackQuality.issues.length > 0) {
    console.log("[tarot-quality:fallback]", {
      score: fallbackQuality.score,
      passed: fallbackQuality.passed,
      issues: fallbackQuality.issues,
      domain: tarotEngineContext.domain,
      contextHits: tarotEngineContext.cardContexts.length,
      pairHits: tarotEngineContext.pairContexts.length,
      questionHits: tarotEngineContext.questionMatches.length,
      safetyHits: tarotEngineContext.safetyMatches.length,
    });
  }

  const streamResult = await createInterpretationStream({
    payload,
    fallbackText,
    startedAt,
    onCompleteText: async ({ pipeline, text }) => {
      if (!shouldLogAiQuality()) return;
      if (!pipeline.startsWith("ai") || pipeline.includes("fallback")) return;

      const aiQuality = qualityCheckByRules({
        outputText: text,
        tarotEngineContext,
        pipeline: "ai",
      });
      await writeTarotQualityLog(buildQualityLogEntry(pipeline, aiQuality));

      console.log("[tarot-quality:ai]", {
        pipeline,
        score: aiQuality.score,
        passed: aiQuality.passed,
        issues: aiQuality.issues,
        checks: aiQuality.checks,
        kbVersion: tarotEngineContext.kbVersion,
        domain: tarotEngineContext.domain,
        contextHits: tarotEngineContext.cardContexts.length,
        pairHits: tarotEngineContext.pairContexts.length,
        questionHits: tarotEngineContext.questionMatches.length,
        safetyHits: tarotEngineContext.safetyMatches.length,
      });
    },
  });
  const fallbackQualitySummary = {
    passed: fallbackQuality.passed,
    score: fallbackQuality.score,
    issues: fallbackQuality.issues,
  };

  return {
    ...streamResult,
    fallbackQuality: fallbackQualitySummary,
    headers: buildHeaders({ ...streamResult, fallbackQuality: fallbackQualitySummary }),
  };
}

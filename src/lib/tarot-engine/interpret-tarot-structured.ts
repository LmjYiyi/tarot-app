import "server-only";

import {
  applyEnhancedStructuredResultQuality,
  enhanceStructuredResultWithAi,
} from "./structured-ai-enhancer";
import {
  buildKbStructuredResult,
  renderStructuredResultForQuality,
} from "./structured-result";
import { qualityCheckByRules } from "./quality-gate";
import { writeTarotQualityLog } from "./quality-log";
import { retrieveTarotEngineContext } from "./retrieve-context";
import type { InterpretTarotInput } from "./types";

function previewText(text: string, max = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function shouldEnhanceWithAi() {
  return process.env.TAROT_V2_AI_STRUCTURED === "1";
}

export async function interpretTarotStructured(input: InterpretTarotInput) {
  const tarotEngineContext = await retrieveTarotEngineContext({
    question: input.question,
    spreadSlug: input.spreadSlug,
    cards: input.cards,
    readingIntent: input.readingIntent,
  });
  const draftResult = buildKbStructuredResult({
    question: input.question,
    spreadSlug: input.spreadSlug,
    tarotEngineContext,
  });
  const quality = qualityCheckByRules({
    outputText: renderStructuredResultForQuality(draftResult),
    tarotEngineContext,
    pipeline: "kb_structured_fallback",
  });
  const baseResult = buildKbStructuredResult({
    question: input.question,
    spreadSlug: input.spreadSlug,
    tarotEngineContext,
    quality,
  });
  let result = baseResult;

  if (shouldEnhanceWithAi()) {
    try {
      const enhanced = await enhanceStructuredResultWithAi({
        question: input.question,
        base: baseResult,
        tarotEngineContext,
      });
      const enhancedQuality = qualityCheckByRules({
        outputText: renderStructuredResultForQuality(enhanced),
        tarotEngineContext,
        pipeline: "ai_structured_enhanced",
      });

      result = applyEnhancedStructuredResultQuality({
        base: baseResult,
        enhanced,
        enhancedQuality,
      });
    } catch (error) {
      console.error("[interpretTarotStructured] ai structured enhancer failed", error);
      result = {
        ...baseResult,
        pipeline: "ai_structured_failed_fallback",
      };
    }
  }

  await writeTarotQualityLog({
    timestamp: new Date().toISOString(),
    readingId: result.readingId,
    pipeline: result.pipeline,
    kbVersion: tarotEngineContext.kbVersion,
    domain: tarotEngineContext.domain,
    spreadId: result.spread.spreadId,
    questionPreview: previewText(input.question),
    cards: result.cards.map((card) => ({
      cardId: card.cardId,
      cardName: card.cardName,
      orientation: card.orientation,
      positionId: card.positionId,
      positionName: card.positionName,
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

  return result;
}

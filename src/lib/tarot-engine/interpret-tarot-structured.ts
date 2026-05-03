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
import type { TarotInterpretationV2Result } from "./structured-result";
import type { InterpretTarotInput } from "./types";

const DEFAULT_AI_ENHANCER_DOMAINS = ["love", "career", "self_state", "decision", "daily"];

function previewText(text: string, max = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function normalizeDomain(value: string) {
  const normalized = value.trim();
  if (normalized === "self" || normalized === "daily") return "self_state";
  return normalized;
}

function getStructuredAiDomains() {
  const raw = process.env.TAROT_V2_AI_DOMAINS;
  const values = raw
    ? raw.split(",").map(normalizeDomain).filter(Boolean)
    : DEFAULT_AI_ENHANCER_DOMAINS;

  return new Set(values);
}

function getAiEnhancerSkippedReason(input: {
  enabled: boolean;
  domain: string;
  safetyHits: number;
  riskLevel?: string;
  allowedDomains: Set<string>;
}) {
  if (!input.enabled) return "disabled";
  if (input.safetyHits > 0) return "safety_hits";
  if (input.riskLevel === "high") return "high_risk";
  if (!input.allowedDomains.has(normalizeDomain(input.domain))) return "domain_not_allowed";

  return undefined;
}

function getErrorName(error: unknown) {
  if (error instanceof Error && error.name) return error.name;

  return "Error";
}

function getAiFailureReason(error: unknown) {
  const name = getErrorName(error).toLowerCase();
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (name.includes("timeout") || message.includes("timeout") || message.includes("timed out")) {
    return "timeout";
  }

  if (message.includes("api_key") || message.includes("not configured")) {
    return "missing_api_key";
  }

  if (message.includes("json") || message.includes("schema") || message.includes("parse")) {
    return "invalid_patch";
  }

  return "request_failed";
}

export function shouldUseStructuredAiEnhancer(input: {
  enabled: boolean;
  domain: string;
  safetyHits: number;
  riskLevel?: string;
  allowedDomains?: Set<string>;
}) {
  if (!input.enabled) return false;
  if (input.safetyHits > 0) return false;
  if (input.riskLevel === "high") return false;

  return (input.allowedDomains ?? getStructuredAiDomains()).has(normalizeDomain(input.domain));
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
  const aiAllowedDomains = getStructuredAiDomains();
  const aiEnabled = process.env.TAROT_V2_AI_STRUCTURED === "1";
  const aiSkippedReason = getAiEnhancerSkippedReason({
    enabled: aiEnabled,
    domain: tarotEngineContext.domain,
    safetyHits: tarotEngineContext.safetyMatches.length,
    riskLevel: baseResult.question.riskLevel,
    allowedDomains: aiAllowedDomains,
  });
  const aiEnhancerDebug: NonNullable<TarotInterpretationV2Result["debug"]>["aiEnhancer"] = {
    enabled: aiEnabled,
    eligible: !aiSkippedReason,
    allowedDomains: [...aiAllowedDomains],
    ...(aiSkippedReason ? { skippedReason: aiSkippedReason } : {}),
  };

  if (
    shouldUseStructuredAiEnhancer({
      enabled: aiEnabled,
      domain: tarotEngineContext.domain,
      safetyHits: tarotEngineContext.safetyMatches.length,
      riskLevel: baseResult.question.riskLevel,
      allowedDomains: aiAllowedDomains,
    })
  ) {
    const aiStartedAt = Date.now();

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
      aiEnhancerDebug.durationMs = Date.now() - aiStartedAt;
    } catch (error) {
      aiEnhancerDebug.durationMs = Date.now() - aiStartedAt;
      aiEnhancerDebug.failureReason = getAiFailureReason(error);
      aiEnhancerDebug.errorName = getErrorName(error);
      console.error("[interpretTarotStructured] ai structured enhancer failed", error);
      result = {
        ...baseResult,
        pipeline: "ai_structured_failed_fallback",
      };
    }
  }

  result = {
    ...result,
    debug: {
      kbHits: result.debug?.kbHits ?? {
        contextHits: tarotEngineContext.cardContexts.length,
        pairHits: tarotEngineContext.pairContexts.length,
        questionHits: tarotEngineContext.questionMatches.length,
        safetyHits: tarotEngineContext.safetyMatches.length,
        goldenCaseHits: tarotEngineContext.goldenCases.length,
      },
      aiEnhancer: aiEnhancerDebug,
    },
  };

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
      score: result.quality.score,
      passed: result.quality.passed,
      issues: result.quality.issues,
      checks: result.quality.checks,
    },
    aiEnhancer: aiEnhancerDebug,
  });

  return result;
}

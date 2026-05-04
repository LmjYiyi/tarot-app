import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  applyEnhancedStructuredResultQuality,
  mergeStructuredAiPatch,
} from "./structured-ai-enhancer";
import {
  interpretTarotStructured,
  shouldUseStructuredAiEnhancer,
} from "./interpret-tarot-structured";
import type { TarotQualityResult } from "./quality-gate";
import {
  buildStructuredSections,
  type TarotInterpretationV2Result,
} from "./structured-result";

const passingQuality: TarotQualityResult = {
  score: 95,
  passed: true,
  checks: {
    answersQuestion: true,
    readsCards: true,
    usesPositions: true,
    usesKbContext: true,
    usesCombinations: true,
    avoidsAbsolutePrediction: true,
    avoidsThirdPartyMindReading: true,
    safetyPassed: true,
    hasActionableAdvice: true,
    soundsLikeHumanReader: true,
  },
  issues: [],
};

const failingQuality: TarotQualityResult = {
  ...passingQuality,
  score: 60,
  passed: false,
  checks: {
    ...passingQuality.checks,
    safetyPassed: false,
  },
  issues: ["命中安全规则后，没有正确降级或提示边界。"],
};

function baseResult(): TarotInterpretationV2Result {
  const result: TarotInterpretationV2Result = {
    readingId: "reading-1",
    kbVersion: "v0.2",
    pipeline: "kb_structured_fallback",
    question: {
      original: "他现在到底怎么想我？",
      rewritten: "我该如何理解目前这段关系里的互动信号，以及我能做什么？",
      domain: "love",
      riskLevel: "medium",
    },
    spread: {
      spreadId: "three_state_obstacle_advice",
      name: "三张牌阵",
    },
    cards: [
      {
        cardId: "major-0-fool",
        cardName: "愚者",
        orientation: "upright",
        positionId: "external_influence",
        positionName: "过去/背景",
        meaning: "过去/背景的愚者显示：先看见关系里的新鲜感和不确定性。",
        advice: ["先观察互动是否稳定。"],
        reflectionQuestions: [],
      },
      {
        cardId: "major-1-magician",
        cardName: "魔术师",
        orientation: "upright",
        positionId: "current_state",
        positionName: "现在/现状",
        meaning: "现在/现状的魔术师显示：沟通和主动表达是当前重点。",
        advice: ["把想确认的话说清楚。"],
        reflectionQuestions: [],
      },
    ],
    combinations: [
      {
        cardIds: ["major-0-fool", "major-1-magician"],
        cardNames: ["愚者", "魔术师"],
        positions: [
          {
            positionOrder: 1,
            positionId: "external_influence",
            positionName: "过去/背景",
          },
          {
            positionOrder: 2,
            positionId: "current_state",
            positionName: "现在/现状",
          },
        ],
        reason: "相邻牌位的连续关系",
        summary: "这组牌提醒你，关系里有启动感，也需要具体表达。",
      },
    ],
    reading: {
      opening: "这次先把问题调整成互动模式来观察。",
      overallTheme: "整体主题是看互动是否能落到真实行动。",
      summary: "不要急着替对方下结论，先看对方是否有稳定回应。",
      closingNote: "最后给你的提醒：先看真实互动，再判断下一步。",
      advice: ["先观察一个可验证信号。"],
      feedbackQuestions: [],
    },
    sections: [],
    safety: {
      passed: true,
      hits: 0,
    },
    quality: passingQuality,
    debug: {
      kbHits: {
        contextHits: 2,
        pairHits: 1,
        questionHits: 1,
        safetyHits: 0,
        goldenCaseHits: 1,
      },
    },
  };
  result.sections = buildStructuredSections({
    reading: result.reading,
    cards: result.cards,
    combinations: result.combinations,
    safety: result.safety,
  });

  return result;
}

describe("structured AI enhancer", () => {
  afterEach(() => {
    delete process.env.TAROT_V2_AI_STRUCTURED;
    delete process.env.TAROT_V2_AI_DOMAINS;
  });

  it("only changes expression fields and keeps fact fields locked", () => {
    const base = baseResult();
    const merged = mergeStructuredAiPatch(base, {
      cards: [
        {
          cardId: "major-0-fool",
          positionId: "external_influence",
          polishedMeaning: "过去/背景的愚者更像是在说，这段关系曾经有轻盈和试探，但还没有形成稳定节奏。",
          advice: ["先看轻松互动能否重复出现。"],
        },
      ],
      combinations: [
        {
          cardIds: ["major-1-magician", "major-0-fool"],
          polishedSummary: "愚者和魔术师放在一起，像是从试探走向表达：有机会，但需要更清楚的行动。",
        },
      ],
      reading: {
        opening: "这次不替对方下心理结论，而是把牌面放回你们的互动节奏里看。",
        overallTheme: "整体主题是：可能性需要靠稳定表达来验证。",
        summary: "牌面更支持你观察真实互动，而不是在猜测里消耗自己。",
        advice: ["先确认一次轻松但清楚的沟通。"],
      },
    });

    expect(merged.pipeline).toBe("ai_structured_enhanced");
    expect(merged.cards[0]).toMatchObject({
      cardId: base.cards[0].cardId,
      cardName: base.cards[0].cardName,
      orientation: base.cards[0].orientation,
      positionId: base.cards[0].positionId,
      positionName: base.cards[0].positionName,
    });
    expect(merged.cards[0].meaning).not.toBe(base.cards[0].meaning);
    expect(merged.cards[1]).toEqual(base.cards[1]);
    expect(merged.question).toEqual(base.question);
    expect(merged.safety).toEqual(base.safety);
    expect(merged.kbVersion).toBe(base.kbVersion);
    expect(merged.combinations[0].summary).not.toBe(base.combinations[0].summary);
    expect(merged.reading.opening).not.toBe(base.reading.opening);
  });

  it("ignores card patches that do not match cardId and positionId", () => {
    const base = baseResult();
    const merged = mergeStructuredAiPatch(base, {
      cards: [
        {
          cardId: "major-99-made-up",
          positionId: "external_influence",
          polishedMeaning: "这条 patch 不应该进入结果，因为 cardId 对不上。",
          advice: ["不应该出现。"],
        },
      ],
      combinations: [],
      reading: base.reading,
    });

    expect(merged.cards).toEqual(base.cards);
  });

  it("falls back to the KB result when enhanced quality fails", () => {
    const base = baseResult();
    const enhanced = {
      ...base,
      pipeline: "ai_structured_enhanced" as const,
      reading: {
        ...base.reading,
        summary: "他一定还爱你，你们注定会复合。",
      },
    };
    const result = applyEnhancedStructuredResultQuality({
      base,
      enhanced,
      enhancedQuality: failingQuality,
    });

    expect(result.pipeline).toBe("ai_structured_quality_fallback");
    expect(result.reading.summary).toBe(base.reading.summary);
    expect(result.quality).toEqual(base.quality);
  });

  it("keeps structured interpretation on KB fallback when feature flag is off", async () => {
    process.env.TAROT_V2_AI_STRUCTURED = "0";

    const result = await interpretTarotStructured({
      question: "今天有什么提醒？",
      spreadSlug: "single-guidance",
      cards: [{ cardId: "major-19-sun", positionOrder: 1, reversed: false }],
      locale: "zh-CN",
    });

    expect(result.pipeline).toBe("kb_structured_fallback");
    expect(result.quality.passed).toBe(true);
  });

  it("gates AI enhancement by domain, safety hits, and risk level", () => {
    expect(
      shouldUseStructuredAiEnhancer({
        enabled: true,
        domain: "love",
        safetyHits: 0,
        riskLevel: "medium",
        allowedDomains: new Set(["love", "career"]),
      }),
    ).toBe(true);
    expect(
      shouldUseStructuredAiEnhancer({
        enabled: true,
        domain: "love",
        safetyHits: 1,
        riskLevel: "medium",
        allowedDomains: new Set(["love", "career"]),
      }),
    ).toBe(false);
    expect(
      shouldUseStructuredAiEnhancer({
        enabled: true,
        domain: "decision",
        safetyHits: 0,
        riskLevel: "high",
        allowedDomains: new Set(["decision"]),
      }),
    ).toBe(false);
    expect(
      shouldUseStructuredAiEnhancer({
        enabled: true,
        domain: "daily",
        safetyHits: 0,
        riskLevel: "low",
        allowedDomains: new Set(["self_state"]),
      }),
    ).toBe(true);
    expect(
      shouldUseStructuredAiEnhancer({
        enabled: true,
        domain: "legal",
        safetyHits: 0,
        riskLevel: "low",
        allowedDomains: new Set(["love", "career"]),
      }),
    ).toBe(false);
  });

  it("does not call AI enhancement for high-risk safety cases", async () => {
    process.env.TAROT_V2_AI_STRUCTURED = "1";

    const result = await interpretTarotStructured({
      question: "塔罗看我这个病会不会恶化？",
      spreadSlug: "single-guidance",
      cards: [{ cardId: "major-5-hierophant", positionOrder: 1, reversed: false }],
      locale: "zh-CN",
    });

    expect(result.pipeline).toBe("kb_structured_fallback");
    expect(result.safety.hits).toBeGreaterThan(0);
    expect(result.question.riskLevel).toBe("high");
    expect(result.debug?.aiEnhancer).toMatchObject({
      enabled: true,
      eligible: false,
      skippedReason: "safety_hits",
    });
  });
});

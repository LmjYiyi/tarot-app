import { describe, expect, it } from "vitest";

import type { QuestionDiagnosis, SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";
import type { SpreadPosition, TarotCard } from "@/lib/tarot/types";

import { buildScenarioStrategyNotes, inferScenarioStrategy } from "./scenario-strategy";

const baseDiagnosis: QuestionDiagnosis = {
  riskLevel: "low",
  issues: [],
  flags: {
    highRiskDecision: false,
    absolutePrediction: false,
    preciseTiming: false,
    mindReading: false,
  },
  safetyDirectives: [],
};

function diagnosis(overrides: Partial<QuestionDiagnosis["flags"]> = {}): QuestionDiagnosis {
  return {
    ...baseDiagnosis,
    flags: {
      ...baseDiagnosis.flags,
      ...overrides,
    },
  };
}

function selectedCard(cardSlug: string, cardName: string, position: Partial<SpreadPosition>): SelectedCardForAnalysis {
  const tarotCard: TarotCard = {
    id: cardSlug,
    slug: cardSlug,
    nameZh: cardName,
    nameEn: cardSlug,
    arcana: "minor",
    suit: "cups",
    number: 4,
    keywordsUpright: [],
    keywordsReversed: [],
    meaningUpright: "",
    meaningReversed: "",
  };

  return {
    card: tarotCard,
    position: {
      order: position.order ?? 1,
      name: position.name ?? "现状",
      focus: position.focus ?? "当前状态",
      promptHint: position.promptHint ?? "",
    },
    orientation: "正位",
    keywords: [],
    primaryMeaning: "",
    domainMeaning: null,
  };
}

describe("scenario strategy", () => {
  it("routes breakup grief to emotion healing instead of relationship decision", () => {
    const strategy = inferScenarioStrategy({
      question: "分手三个月了，我还是在深夜会突然大哭。我该如何处理这种孤独感？",
      intent: { domain: "self", goal: "advice" },
      diagnosis: diagnosis(),
    });

    expect(strategy.id).toBe("emotion_healing");
    expect(strategy.mustAvoid.join("\n")).toContain("现金流");
  });

  it("routes explicit breakup choice to relationship decision", () => {
    const strategy = inferScenarioStrategy({
      question: "我现在要不要分手，还是继续修复这段关系？",
      intent: { domain: "relationship", goal: "decision" },
      diagnosis: diagnosis({ highRiskDecision: true }),
    });

    expect(strategy.id).toBe("relationship_decision");
    expect(strategy.mustInclude.join("\n")).toContain("沟通边界");
  });

  it("adds card scenario variants to notes", () => {
    const strategy = inferScenarioStrategy({
      question: "分手三个月了，我还是很孤独。",
      intent: { domain: "self", goal: "advice" },
      diagnosis: diagnosis(),
    });
    const notes = buildScenarioStrategyNotes({
      strategy,
      selectedCards: [selectedCard("four-of-cups", "圣杯四", { name: "现状", focus: "当前状态" })],
    });

    expect(notes).toContain("情绪停歇");
    expect(notes).toContain("现金流或止损点");
  });
});


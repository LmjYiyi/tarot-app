import { describe, expect, it } from "vitest";

import type { SpreadDefinition, TarotCard } from "@/lib/tarot/types";

import { analyzeGeneralStructure, diagnoseQuestion } from "./general";
import type { SelectedCardForAnalysis } from "./types";

const spread: SpreadDefinition = {
  slug: "three-card",
  nameZh: "三张牌阵",
  summary: "",
  detail: "",
  hero: "",
  suitableFor: [],
  cardCount: 3,
  positions: [
    { order: 1, name: "过去", focus: "背景", promptHint: "" },
    { order: 2, name: "现在", focus: "现状", promptHint: "" },
    { order: 3, name: "未来", focus: "趋势", promptHint: "" },
  ],
};

function card(overrides: Partial<TarotCard>): TarotCard {
  return {
    id: overrides.id ?? "card",
    slug: overrides.slug ?? "card",
    nameZh: overrides.nameZh ?? "测试牌",
    nameEn: overrides.nameEn ?? "Test Card",
    arcana: overrides.arcana ?? "minor",
    suit: overrides.suit ?? "cups",
    number: overrides.number ?? 1,
    keywordsUpright: [],
    keywordsReversed: [],
    meaningUpright: "",
    meaningReversed: "",
    ...overrides,
  };
}

function selected(
  tarotCard: TarotCard,
  positionOrder: number,
  orientation: "正位" | "逆位" = "正位",
): SelectedCardForAnalysis {
  const position = spread.positions.find((item) => item.order === positionOrder);

  if (!position) {
    throw new Error(`missing position ${positionOrder}`);
  }

  return {
    card: tarotCard,
    position,
    orientation,
    keywords: [],
    primaryMeaning: "",
    domainMeaning: null,
  };
}

describe("general tarot structure analysis", () => {
  it("summarizes arcana, suit and reversed profiles", () => {
    const analysis = analyzeGeneralStructure({
      question: "我该怎么推进项目？",
      spread,
      selectedCards: [
        selected(card({ id: "tower", nameZh: "高塔", arcana: "major", suit: null, number: 16 }), 1),
        selected(card({ id: "cups-2", nameZh: "圣杯二", suit: "cups", number: 2 }), 2, "逆位"),
        selected(card({ id: "swords-3", nameZh: "宝剑三", suit: "swords", number: 3 }), 3, "逆位"),
      ],
    });

    expect(analysis.arcanaProfile.eventLevel).toBe("阶段课题");
    expect(analysis.suitProfile.counts.cups).toBe(1);
    expect(analysis.suitProfile.counts.swords).toBe(1);
    expect(analysis.reversedProfile.mode).toBe("内化");
    expect(analysis.numberStage.numbers).toEqual([2, 3]);
    expect(analysis.relationPairs.tension.length).toBeGreaterThan(0);
  });

  it("detects court cards as role hints", () => {
    const analysis = analyzeGeneralStructure({
      question: "关系接下来怎么沟通？",
      spread,
      selectedCards: [
        selected(card({ id: "queen", nameZh: "圣杯王后", suit: "cups", number: 13 }), 1),
      ],
    });

    expect(analysis.courtCards).toHaveLength(1);
    expect(analysis.courtCards[0].roleHint).toBe("未知角色");
  });

  it("diagnoses absolute or mind-reading questions", () => {
    const diagnosis = diagnoseQuestion("他一定会回来联系我吗？");

    expect(diagnosis.riskLevel).toBe("high");
    expect(diagnosis.flags.absolutePrediction).toBe(true);
    expect(diagnosis.flags.mindReading).toBe(true);
    expect(diagnosis.issues.length).toBeGreaterThanOrEqual(2);
    expect(diagnosis.safetyDirectives.join("\n")).toContain("绝对预测纠偏");
    expect(diagnosis.safetyDirectives.join("\n")).toContain("读心纠偏");
    expect(diagnosis.suggestedReframe).toBeTruthy();
  });

  it("adds safety cushion directives for high-risk decisions", () => {
    const diagnosis = diagnoseQuestion("我现在要不要裸辞？A是马上辞职休息，B是继续忍到找到下家。", {
      domain: "decision",
      goal: "decision",
    });

    expect(diagnosis.flags.highRiskDecision).toBe(true);
    expect(diagnosis.riskLevel).toBe("high");
    expect(diagnosis.safetyDirectives.join("\n")).toContain("资源/现金流");
    expect(diagnosis.safetyDirectives.join("\n")).toContain("止损点");
    expect(diagnosis.safetyDirectives.join("\n")).toContain("不得鼓励冲动裸辞");
  });

  it("adds timing correction for precise prediction questions", () => {
    const diagnosis = diagnoseQuestion("我们最后一定会复合吗？如果会，大概什么时候？");

    expect(diagnosis.flags.absolutePrediction).toBe(true);
    expect(diagnosis.flags.preciseTiming).toBe(true);
    expect(diagnosis.safetyDirectives.join("\n")).toContain("不做绝对承诺");
    expect(diagnosis.safetyDirectives.join("\n")).toContain("不要给具体日期");
  });
});

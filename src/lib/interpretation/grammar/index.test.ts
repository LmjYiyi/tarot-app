import { describe, expect, it } from "vitest";

import type { SpreadDefinition, TarotCard } from "../../tarot/types";
import type { SelectedCardForAnalysis } from "../analysis/types";
import { getSpreadReadingTemplate } from "../templates";

import { analyzeReadingGrammar } from "./index";

const spread: SpreadDefinition = {
  slug: "relationship-six",
  nameZh: "六张关系牌阵",
  summary: "",
  detail: "",
  hero: "",
  suitableFor: [],
  cardCount: 6,
  positions: [
    { order: 1, name: "我", focus: "用户当前状态", promptHint: "" },
    { order: 2, name: "对方", focus: "对方呈现方式", promptHint: "" },
    { order: 3, name: "关系现状", focus: "关系结构", promptHint: "" },
    { order: 4, name: "阻碍", focus: "互动阻碍", promptHint: "" },
    { order: 5, name: "未来趋势", focus: "近期趋势", promptHint: "" },
    { order: 6, name: "建议", focus: "沟通建议", promptHint: "" },
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

  if (!position) throw new Error(`missing position ${positionOrder}`);

  return {
    card: tarotCard,
    position,
    orientation,
    keywords: [],
    primaryMeaning: "",
    domainMeaning: null,
  };
}

describe("reading grammar analysis", () => {
  it("adds time scope and position weights from the spread template", () => {
    const template = getSpreadReadingTemplate("relationship-six");
    const grammar = analyzeReadingGrammar({
      template,
      selectedCards: [
        selected(card({ id: "cups-queen", nameZh: "圣杯王后", suit: "cups", number: 13 }), 1),
        selected(card({ id: "swords-king", nameZh: "宝剑国王", suit: "swords", number: 14 }), 2),
      ],
    });

    expect(grammar.timeScope.defaultWindow).toContain("4-8 周");
    expect(grammar.weightedPositions[0].weight).toBe("primary");
    expect(grammar.weightedPositions[0].role).toContain("用户");
  });

  it("detects suit dynamics, court archetypes and reversal grammar", () => {
    const template = getSpreadReadingTemplate("relationship-six");
    const grammar = analyzeReadingGrammar({
      template,
      selectedCards: [
        selected(card({ id: "cups-queen", nameZh: "圣杯王后", suit: "cups", number: 13 }), 1),
        selected(card({ id: "swords-king", nameZh: "宝剑国王", suit: "swords", number: 14 }), 2, "逆位"),
        selected(card({ id: "wands-five", nameZh: "权杖五", suit: "wands", number: 5 }), 4),
      ],
    });

    expect(grammar.suitDynamics.interactions.some((item) => item.type.includes("圣杯"))).toBe(true);
    expect(grammar.courtRoles.map((role) => role.archetype).join("\n")).toContain("圣杯王后");
    expect(grammar.reversalNotes.map((note) => note.note).join("\n")).toContain("对方");
  });

  it("detects major arcana narrative chains and repeated-number patterns", () => {
    const template = getSpreadReadingTemplate("relationship-six");
    const grammar = analyzeReadingGrammar({
      template,
      selectedCards: [
        selected(card({ id: "tower", slug: "the-tower", nameZh: "高塔", arcana: "major", suit: null, number: 16 }), 1),
        selected(card({ id: "star", slug: "the-star", nameZh: "星星", arcana: "major", suit: null, number: 17 }), 2),
        selected(card({ id: "cups-five", nameZh: "圣杯五", suit: "cups", number: 5 }), 3),
        selected(card({ id: "wands-five", nameZh: "权杖五", suit: "wands", number: 5 }), 4),
      ],
    });

    expect(grammar.majorArcanaChains.map((chain) => chain.theme).join("\n")).toContain("崩塌之后");
    expect(grammar.patterns.map((pattern) => pattern.type).join("\n")).toContain("重复数字 5");
  });
});

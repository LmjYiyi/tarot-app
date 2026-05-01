import { describe, expect, it } from "vitest";

import type { TarotCard } from "@/lib/tarot/types";

import { buildCombinationSummary } from "./combination-summary";

function card(overrides: Partial<TarotCard>): TarotCard {
  return {
    id: overrides.id ?? "card",
    slug: overrides.slug ?? "card",
    nameZh: overrides.nameZh ?? "测试牌",
    nameEn: overrides.nameEn ?? "Test Card",
    arcana: overrides.arcana ?? "major",
    suit: overrides.suit ?? null,
    number: overrides.number ?? 0,
    keywordsUpright: [],
    keywordsReversed: [],
    meaningUpright: "",
    meaningReversed: "",
    ...overrides,
  };
}

describe("buildCombinationSummary", () => {
  it("does not pass raw combination meanings into the prompt", () => {
    const summary = buildCombinationSummary([
      {
        card: card({
          id: "strength",
          slug: "strength",
          nameZh: "力量",
          combinations: [
            {
              cardSlug: "the-sun",
              cardName: "太阳",
              meaning: "意味著你那超凡脫俗的個性，讓你身邊的每個人都嫉妒",
            },
          ],
        }),
        position: { order: 1, name: "调整方向", focus: "", promptHint: "" },
      },
      {
        card: card({ id: "sun", slug: "the-sun", nameZh: "太阳" }),
        position: { order: 2, name: "外在状态", focus: "", promptHint: "" },
      },
    ]);

    expect(summary).toContain("存在组合资料");
    expect(summary).toContain("不得引用组合资料原句");
    expect(summary).not.toContain("嫉妒");
    expect(summary).not.toContain("超凡");
  });
});

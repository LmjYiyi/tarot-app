import { describe, expect, it } from "vitest";

import { qualityCheckByRules } from "./quality-gate";
import { retrieveTarotEngineContext } from "./retrieve-context";
import type { TarotEngineContext } from "./types";

function qualityReadyText(context: TarotEngineContext, unsafeSentence: string) {
  const cards = context.cardContexts
    .map((card) => {
      const positionName = card.appPosition?.name ?? card.positionRule?.name_cn ?? card.kbPositionId;
      return `${positionName}的${card.appCard.nameZh}显示牌面正在提醒你看清现实信号，不把单张牌读成绝对结论。`;
    })
    .join("\n");

  return [
    "1. 牌面先说",
    unsafeSentence,
    cards,
    "这组牌的组合联动提醒你，牌与牌一起看时，更适合整理条件、边界和观察指标。",
    "建议你先确认一个可验证信号，再决定下一步。观察过程中保留现实支持，不把塔罗当成替代专业判断的工具。",
  ].join("\n");
}

describe("qualityCheckByRules regression fixtures", () => {
  it("fails absolute third-party mind-reading promises", async () => {
    const tarotEngineContext = await retrieveTarotEngineContext({
      question: "他是不是已经不爱我了？",
      spreadSlug: "three-card",
      readingIntent: { domain: "love", goal: "trend" },
      cards: [
        { cardId: "major-6-lovers", positionOrder: 1, reversed: true },
        { cardId: "major-12-hanged-man", positionOrder: 2, reversed: false },
        { cardId: "major-14-temperance", positionOrder: 3, reversed: false },
      ],
    });
    const result = qualityCheckByRules({
      outputText: qualityReadyText(
        tarotEngineContext,
        "他一定还爱你，你们注定会复合，这一点不需要再观察。",
      ),
      tarotEngineContext,
      pipeline: "fixture_bad_text",
    });

    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(75);
    expect(result.checks.avoidsAbsolutePrediction).toBe(false);
    expect(result.checks.avoidsThirdPartyMindReading).toBe(false);
    expect(result.issues).toContain("出现了过度绝对化或宿命化表达。");
    expect(result.issues).toContain("存在替第三方读心的风险。");
  });

  it("fails unsafe health predictions", async () => {
    const tarotEngineContext = await retrieveTarotEngineContext({
      question: "塔罗看我这个病会不会恶化？",
      spreadSlug: "single-guidance",
      cards: [{ cardId: "major-5-hierophant", positionOrder: 1, reversed: false }],
    });
    const result = qualityCheckByRules({
      outputText: qualityReadyText(
        tarotEngineContext,
        "教皇给出的答案是：你这个病不会恶化，不用担心，也不需要再去确认。",
      ),
      tarotEngineContext,
      pipeline: "fixture_bad_text",
    });

    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(75);
    expect(result.checks.safetyPassed).toBe(false);
    expect(result.issues).toContain("命中安全规则后，没有正确降级或提示边界。");
  });

  it("fails unsafe finance promises", async () => {
    const tarotEngineContext = await retrieveTarotEngineContext({
      question: "我买这个股票会不会赚钱？",
      spreadSlug: "single-guidance",
      readingIntent: { domain: "decision", goal: "decision" },
      cards: [{ cardId: "major-10-wheel-of-fortune", positionOrder: 1, reversed: true }],
    });
    const result = qualityCheckByRules({
      outputText: qualityReadyText(
        tarotEngineContext,
        "命运之轮说明这只股票一定会发财，也一定涨，可以买，不会亏。",
      ),
      tarotEngineContext,
      pipeline: "fixture_bad_text",
    });

    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(75);
    expect(result.checks.avoidsAbsolutePrediction).toBe(false);
    expect(result.checks.safetyPassed).toBe(false);
    expect(result.issues).toContain("出现了过度绝对化或宿命化表达。");
    expect(result.issues).toContain("命中安全规则后，没有正确降级或提示边界。");
  });
});

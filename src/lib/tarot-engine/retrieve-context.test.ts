import { describe, expect, it } from "vitest";

import { formatTarotEngineContext } from "./format-context";
import { retrieveTarotEngineContext } from "./retrieve-context";

describe("retrieveTarotEngineContext research datasets", () => {
  it("attaches verified card evidence and derived safety rules to the backend context", async () => {
    const context = await retrieveTarotEngineContext({
      question: "塔罗看我这个病会不会恶化？",
      spreadSlug: "single-guidance",
      cards: [{ cardId: "major-0-fool", positionOrder: 1, reversed: false }],
    });

    expect(context.researchDataset.matchedCardEvidence).toBe(1);
    expect(context.cardContexts[0]?.researchCardEvidence).toMatchObject({
      cardName: "The Fool",
      license: "public_domain",
    });
    expect(context.safetyMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: expect.objectContaining({
            risk_type: "medical_or_health_advice",
            risk_level: "high",
          }),
        }),
      ]),
    );
  });

  it("formats research evidence without exposing source-dataset internals as user copy", async () => {
    const context = await retrieveTarotEngineContext({
      question: "今天有什么提醒？",
      spreadSlug: "single-guidance",
      cards: [{ cardId: "wands-14-wands-king", positionOrder: 1, reversed: false }],
    });
    const text = formatTarotEngineContext(context);

    expect(text).toContain("核验资料集");
    expect(text).toContain("核验牌义：Waite公有领域底本");
    expect(text).toContain("牌面描述核对");
  });

  it("does not let an empty question match every safety rule", async () => {
    const context = await retrieveTarotEngineContext({
      question: "",
      spreadSlug: "single-guidance",
      cards: [{ cardId: "major-0-fool", positionOrder: 1, reversed: false }],
    });

    expect(context.safetyMatches).toHaveLength(0);
    expect(context.researchDataset.matchedSafetyRules).toBe(0);
  });

  it("catches death prediction and privacy invasion questions", async () => {
    const deathContext = await retrieveTarotEngineContext({
      question: "我今年会不会出重大意外？请直接告诉我会不会死。",
      spreadSlug: "single-guidance",
      cards: [{ cardId: "major-13-death", positionOrder: 1, reversed: false }],
    });
    const privacyContext = await retrieveTarotEngineContext({
      question: "我能不能偷偷看TA手机确认TA有没有别人？",
      spreadSlug: "three-card",
      cards: [
        { cardId: "major-18-moon", positionOrder: 1, reversed: false },
        { cardId: "major-15-devil", positionOrder: 2, reversed: false },
        { cardId: "major-11-justice", positionOrder: 3, reversed: false },
      ],
    });

    expect(deathContext.safetyMatches.map((match) => match.rule.risk_type)).toEqual(
      expect.arrayContaining(["death_disaster_prediction", "absolute_or_precise_prediction"]),
    );
    expect(privacyContext.safetyMatches.map((match) => match.rule.risk_type)).toEqual(
      expect.arrayContaining(["privacy_sensitive", "third_party_mind_reading_or_privacy"]),
    );
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "./route";

type InterpretV2Payload = {
  question: string;
  spreadSlug: string;
  locale?: string;
  readingIntent?: {
    domain: "career" | "love" | "study" | "relationship" | "self" | "decision";
    goal: "trend" | "obstacle" | "advice" | "decision" | "other_view";
  };
  cards: Array<{
    cardId: string;
    positionOrder: number;
    reversed: boolean;
  }>;
};

const fixtures: Array<{
  name: string;
  payload: InterpretV2Payload;
  expectedDomain: string;
  expectedCardCount: number;
  expectsSafetyNote?: boolean;
}> = [
  {
    name: "love",
    expectedDomain: "love",
    expectedCardCount: 3,
    payload: {
      question: "他现在到底怎么想我？",
      spreadSlug: "three-card",
      locale: "zh-CN",
      readingIntent: { domain: "love", goal: "trend" },
      cards: [
        { cardId: "major-0-fool", positionOrder: 1, reversed: false },
        { cardId: "major-1-magician", positionOrder: 2, reversed: false },
        { cardId: "major-2-high-priestess", positionOrder: 3, reversed: true },
      ],
    },
  },
  {
    name: "career",
    expectedDomain: "career",
    expectedCardCount: 5,
    payload: {
      question: "我最近事业发展怎么样？",
      spreadSlug: "career-five",
      locale: "zh-CN",
      readingIntent: { domain: "career", goal: "trend" },
      cards: [
        { cardId: "major-1-magician", positionOrder: 1, reversed: false },
        { cardId: "major-4-emperor", positionOrder: 2, reversed: true },
        { cardId: "major-3-empress", positionOrder: 3, reversed: false },
        { cardId: "major-7-chariot", positionOrder: 4, reversed: false },
        { cardId: "major-8-strength", positionOrder: 5, reversed: false },
      ],
    },
  },
  {
    name: "health",
    expectedDomain: "self_state",
    expectedCardCount: 1,
    expectsSafetyNote: true,
    payload: {
      question: "塔罗看我这个病会不会恶化？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      cards: [{ cardId: "major-5-hierophant", positionOrder: 1, reversed: false }],
    },
  },
  {
    name: "finance",
    expectedDomain: "decision",
    expectedCardCount: 1,
    expectsSafetyNote: true,
    payload: {
      question: "我买这个股票会不会赚钱？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "decision", goal: "decision" },
      cards: [{ cardId: "major-10-wheel-of-fortune", positionOrder: 1, reversed: true }],
    },
  },
  {
    name: "third-party",
    expectedDomain: "love",
    expectedCardCount: 3,
    payload: {
      question: "他是不是已经不爱我了？",
      spreadSlug: "three-card",
      locale: "zh-CN",
      readingIntent: { domain: "love", goal: "trend" },
      cards: [
        { cardId: "major-6-lovers", positionOrder: 1, reversed: true },
        { cardId: "major-12-hanged-man", positionOrder: 2, reversed: false },
        { cardId: "major-14-temperance", positionOrder: 3, reversed: false },
      ],
    },
  },
  {
    name: "decision",
    expectedDomain: "decision",
    expectedCardCount: 7,
    payload: {
      question: "我要不要离职？",
      spreadSlug: "path-of-choice",
      locale: "zh-CN",
      readingIntent: { domain: "decision", goal: "decision" },
      cards: [
        { cardId: "major-1-magician", positionOrder: 1, reversed: false },
        { cardId: "major-4-emperor", positionOrder: 2, reversed: true },
        { cardId: "major-3-empress", positionOrder: 3, reversed: false },
        { cardId: "major-7-chariot", positionOrder: 4, reversed: false },
        { cardId: "major-9-hermit", positionOrder: 5, reversed: false },
        { cardId: "major-11-justice", positionOrder: 6, reversed: false },
        { cardId: "major-8-strength", positionOrder: 7, reversed: false },
      ],
    },
  },
  {
    name: "self",
    expectedDomain: "self_state",
    expectedCardCount: 5,
    payload: {
      question: "我最近为什么这么累？",
      spreadSlug: "self-state",
      locale: "zh-CN",
      readingIntent: { domain: "self", goal: "obstacle" },
      cards: [
        { cardId: "major-9-hermit", positionOrder: 1, reversed: false },
        { cardId: "major-18-moon", positionOrder: 2, reversed: false },
        { cardId: "major-15-devil", positionOrder: 3, reversed: true },
        { cardId: "major-17-star", positionOrder: 4, reversed: false },
        { cardId: "major-14-temperance", positionOrder: 5, reversed: false },
      ],
    },
  },
  {
    name: "daily",
    expectedDomain: "self_state",
    expectedCardCount: 1,
    payload: {
      question: "今天有什么提醒？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      cards: [{ cardId: "major-19-sun", positionOrder: 1, reversed: false }],
    },
  },
];

async function postInterpretV2(payload: InterpretV2Payload) {
  const request = new Request("http://localhost/api/interpret-v2", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const response = await POST(request);
  const json = await response.json();

  return { response, json };
}

describe("/api/interpret-v2 contract", () => {
  it.each(fixtures)("returns stable structured data for $name", async (fixture) => {
    const { response, json } = await postInterpretV2(fixture.payload);
    const data = json.data;

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(response.headers.get("x-tarot-pipeline")).toBe("kb_structured_fallback");
    expect(response.headers.get("x-tarot-quality-passed")).toBe("true");
    expect(data.kbVersion).toBeTruthy();
    expect(data.pipeline).toBe("kb_structured_fallback");
    expect(data.question.domain).toBe(fixture.expectedDomain);
    expect(data.cards).toHaveLength(fixture.expectedCardCount);
    expect(data.quality.passed).toBe(true);

    for (const card of data.cards) {
      expect(card.cardId).toBeTruthy();
      expect(card.cardName).toBeTruthy();
      expect(card.positionName).toBeTruthy();
      expect(card.meaning).toBeTruthy();
    }

    if (fixture.expectsSafetyNote) {
      expect(data.safety.hits).toBeGreaterThan(0);
      expect(data.safety.note).toBeTruthy();
    }
  });
});

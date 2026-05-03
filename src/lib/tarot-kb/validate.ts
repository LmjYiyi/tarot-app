import type { TarotKb } from "./types";

const EXPECTED_COUNTS = {
  cards: 78,
  questionTaxonomy: 443,
  safetyRules: 10,
  positions: 13,
  spreads: 7,
  contextMeanings: 624,
  contextPositionMeanings: 8112,
  combinations: 3003,
  highFreqCombinations: 703,
  curatedCombinations: 30,
  goldenCases: 100,
} as const;

type ExpectedCountKey = keyof typeof EXPECTED_COUNTS;

export function validateTarotKb(kb: TarotKb) {
  const mismatches = (Object.keys(EXPECTED_COUNTS) as ExpectedCountKey[])
    .map((key) => ({
      key,
      expected: EXPECTED_COUNTS[key],
      actual: kb.counts[key],
    }))
    .filter((item) => item.actual !== item.expected);

  if (mismatches.length > 0) {
    const details = mismatches
      .map((item) => `${item.key}: expected ${item.expected}, got ${item.actual}`)
      .join("; ");

    throw new Error(`Tarot KB count validation failed: ${details}`);
  }

  if (kb.contextPositionByKey.size !== kb.counts.contextPositionMeanings) {
    throw new Error("Tarot KB context-position index has duplicate keys.");
  }

  if (kb.combinationsByPairKey.size !== kb.counts.combinations) {
    throw new Error("Tarot KB combination index has duplicate or invalid pair keys.");
  }

  return true;
}

export function getExpectedTarotKbCounts() {
  return EXPECTED_COUNTS;
}

import type {
  CardCombination,
  Orientation,
  RawTarotKb,
  TarotKb,
  TarotKbCounts,
} from "./types";

export function makeContextKey(input: {
  cardId: string;
  orientation: Orientation;
  domain: string;
}) {
  return [input.cardId, input.orientation, input.domain].join("|");
}

export function makeContextPositionKey(input: {
  cardId: string;
  orientation: Orientation;
  domain: string;
  positionId: string;
}) {
  return [input.cardId, input.orientation, input.domain, input.positionId].join("|");
}

export function makePairKey(cardA: string, cardB: string) {
  return [cardA, cardB].sort().join("|");
}

function getCombinationPairKey(item: CardCombination) {
  const [cardA, cardB] = item.cards;

  if (!cardA || !cardB) {
    return null;
  }

  return makePairKey(cardA, cardB);
}

function countRawKb(raw: RawTarotKb): TarotKbCounts {
  return {
    cards: raw.cards.length,
    questionTaxonomy: raw.questionTaxonomy.length,
    safetyRules: raw.safetyRules.length,
    positions: raw.positions.length,
    spreads: raw.spreads.length,
    contextMeanings: raw.contextMeanings.length,
    contextPositionMeanings: raw.contextPositionMeanings.length,
    combinations: raw.combinations.length,
    highFreqCombinations: raw.highFreqCombinations.length,
    curatedCombinations: raw.curatedCombinations.length,
    goldenCases: raw.goldenCases.length,
    styleSamples: raw.styleSamples.length,
  };
}

function buildCombinationMap(items: CardCombination[]) {
  const entries = items
    .map((item) => {
      const key = getCombinationPairKey(item);
      return key ? ([key, item] as const) : null;
    })
    .filter((entry): entry is readonly [string, CardCombination] => Boolean(entry));

  return new Map(entries);
}

export function buildTarotKbIndexes(raw: RawTarotKb): TarotKb {
  return {
    ...raw,
    loadedAt: new Date().toISOString(),
    counts: countRawKb(raw),
    cardsById: new Map(raw.cards.map((card) => [card.card_id, card])),
    questionTaxonomyById: new Map(raw.questionTaxonomy.map((item) => [item.id, item])),
    safetyRulesByType: new Map(raw.safetyRules.map((rule) => [rule.risk_type, rule])),
    positionsById: new Map(raw.positions.map((position) => [position.position_id, position])),
    spreadsById: new Map(raw.spreads.map((spread) => [spread.spread_id, spread])),
    contextByKey: new Map(
      raw.contextMeanings.map((item) => [
        makeContextKey({
          cardId: item.card_id,
          orientation: item.orientation,
          domain: item.domain,
        }),
        item,
      ]),
    ),
    contextPositionByKey: new Map(
      raw.contextPositionMeanings.map((item) => [
        makeContextPositionKey({
          cardId: item.card_id,
          orientation: item.orientation,
          domain: item.domain,
          positionId: item.position_id,
        }),
        item,
      ]),
    ),
    combinationsByPairKey: buildCombinationMap(raw.combinations),
    highFreqCombinationsByPairKey: buildCombinationMap(raw.highFreqCombinations),
    curatedCombinationsByPairKey: buildCombinationMap(raw.curatedCombinations),
  };
}

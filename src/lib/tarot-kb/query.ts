import {
  makeContextKey,
  makeContextPositionKey,
  makePairKey,
} from "./indexes";
import type { Orientation, TarotKb } from "./types";

export function getCardContext(params: {
  kb: TarotKb;
  cardId: string;
  orientation: Orientation;
  domain: string;
}) {
  return params.kb.contextByKey.get(
    makeContextKey({
      cardId: params.cardId,
      orientation: params.orientation,
      domain: params.domain,
    }),
  );
}

export function getCardPositionContext(params: {
  kb: TarotKb;
  cardId: string;
  orientation: Orientation;
  domain: string;
  positionId: string;
}) {
  return params.kb.contextPositionByKey.get(
    makeContextPositionKey({
      cardId: params.cardId,
      orientation: params.orientation,
      domain: params.domain,
      positionId: params.positionId,
    }),
  );
}

export function getCombinationContext(params: {
  kb: TarotKb;
  cardA: string;
  cardB: string;
}) {
  const pairKey = makePairKey(params.cardA, params.cardB);

  return {
    curated: params.kb.curatedCombinationsByPairKey.get(pairKey),
    highFrequency: params.kb.highFreqCombinationsByPairKey.get(pairKey),
    base: params.kb.combinationsByPairKey.get(pairKey),
  };
}

import { getAllCards } from "@/lib/tarot/catalog";
import type { DrawnCard } from "@/lib/tarot/types";

const UINT32_RANGE = 0x1_0000_0000;
export const DEFAULT_REVERSED_RATE = 0.35;
export const DEFAULT_DRAW_RULE = "seeded_fisher_yates_top_n";

type DrawCardsOptions = {
  reversedRate?: number;
  seed?: string;
};

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed) || 0x6d2b79f5;

  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

function randomInt(max: number, randomFloat: () => number) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError(`max must be a positive integer, received ${max}`);
  }

  return Math.floor(randomFloat() * max);
}

function cryptoRandomFloat() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / UINT32_RANGE;
}

function resolveReversedRate(reversedRate: number | undefined) {
  if (reversedRate === undefined) {
    return DEFAULT_REVERSED_RATE;
  }

  if (!Number.isFinite(reversedRate) || reversedRate < 0 || reversedRate > 1) {
    throw new RangeError(`reversedRate must be between 0 and 1, received ${reversedRate}`);
  }

  return reversedRate;
}

export function createDrawSeed() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `${Date.now().toString(36)}-${values[0].toString(36)}-${values[1].toString(36)}`;
}

export function drawCards(cardCount: number, options: DrawCardsOptions = {}): DrawnCard[] {
  const deck = [...getAllCards()];
  const reversedRate = resolveReversedRate(options.reversedRate);
  const randomFloat = options.seed ? createSeededRandom(options.seed) : cryptoRandomFloat;

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1, randomFloat);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, cardCount).map((card, index) => ({
    cardId: card.id,
    positionOrder: index + 1,
    reversed: randomFloat() < reversedRate,
  }));
}

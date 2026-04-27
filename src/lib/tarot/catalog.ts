import { tarotCards } from "@/content/cards";
import { localizeCard } from "@/content/card-localization";
import { structuredCardData } from "@/content/data/structured-card-data";
import { spreads } from "@/content/spreads";
import type { TarotCard } from "@/lib/tarot/types";

const structuredCardBySlug = new Map(structuredCardData.map((card) => [card.slug, card]));

function mergeStructuredData(card: TarotCard): TarotCard {
  const structuredCard = structuredCardBySlug.get(card.slug);

  if (!structuredCard) {
    return card;
  }

  const structuredPatch = structuredCard as Partial<TarotCard>;

  return {
    ...card,
    ...structuredPatch,
    id: card.id,
    slug: card.slug,
    nameZh: card.nameZh,
    nameEn: card.nameEn,
    arcana: card.arcana,
    suit: card.suit,
    number: card.number,
    keywordsUpright: card.keywordsUpright,
    keywordsReversed: card.keywordsReversed,
    imageUrl: card.imageUrl,
  };
}

const localizedCards = tarotCards.map(localizeCard).map(mergeStructuredData);

export function getAllCards() {
  return localizedCards;
}

export function getCardById(cardId: string) {
  return localizedCards.find((card) => card.id === cardId) ?? null;
}

export function getCardBySlug(slug: string) {
  return localizedCards.find((card) => card.slug === slug) ?? null;
}

export function getAllSpreads() {
  return spreads;
}

export function getSpreadBySlug(slug: string) {
  return spreads.find((spread) => spread.slug === slug) ?? null;
}

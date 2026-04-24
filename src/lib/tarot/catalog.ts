import { tarotCards } from "@/content/cards";
import { localizeCard } from "@/content/card-localization";
import { spreads } from "@/content/spreads";

const localizedCards = tarotCards.map(localizeCard);

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

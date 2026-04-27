"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import type { SpreadDefinition, TarotCard } from "@/lib/tarot/types";
import { cn } from "@/lib/utils";

type ResolvedCard = {
  card: TarotCard;
  reversed: boolean;
  positionOrder: number;
};

type MobileStickyDeckProps = {
  visible: boolean;
  spread: SpreadDefinition;
  cards: ResolvedCard[];
};

export function MobileStickyDeck({ visible, spread, cards }: MobileStickyDeckProps) {
  const cardWidthClass =
    cards.length <= 3
      ? "w-[68px]"
      : cards.length <= 5
        ? "w-[54px]"
        : "w-[46px]";
  const wrapsHorizontally = cards.length > 5;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="mobile-sticky-deck"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.34, ease: [0.22, 0.65, 0.2, 1] }}
          className="pointer-events-none fixed inset-x-0 top-20 z-30 px-3 xl:hidden"
        >
          <div className="pointer-events-auto mx-auto max-w-[680px] rounded-[18px] border border-[rgba(243,210,138,0.42)] bg-[rgba(12,16,36,0.72)] px-3 py-2.5 shadow-[0_18px_42px_rgba(8,10,28,0.6)] backdrop-blur-md">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="font-occult text-[9px] uppercase tracking-[0.32em] text-[rgba(243,210,138,0.78)]">
                Mensa · {spread.cardCount}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-[rgba(243,210,138,0.45)] via-[rgba(243,210,138,0.15)] to-transparent" />
            </div>
            <div
              className={cn(
                "flex items-start gap-2",
                wrapsHorizontally
                  ? "overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  : "flex-wrap justify-center",
              )}
            >
              {cards.map(({ card, reversed, positionOrder }) => {
                const position = spread.positions.find(
                  (item) => item.order === positionOrder,
                );
                if (!position) return null;

                return (
                  <div
                    key={`sticky-${card.id}-${positionOrder}`}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-1",
                      cardWidthClass,
                    )}
                  >
                    <span
                      className="w-full truncate text-center font-occult text-[8px] uppercase leading-tight tracking-[0.18em] text-[rgba(243,210,138,0.88)]"
                      title={position.name}
                    >
                      {position.name}
                    </span>
                    <div className="relative w-full overflow-hidden rounded-[6px] border border-[rgba(197,154,76,0.45)] bg-gradient-to-br from-[var(--nebula)] to-[var(--velvet)] shadow-[0_3px_10px_rgba(8,8,16,0.55)]">
                      <div className="aspect-[2/3.5] w-full">
                        {card.imageUrl ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={card.imageUrl}
                              alt={card.nameZh}
                              fill
                              sizes="68px"
                              className="object-cover"
                              style={
                                reversed ? { transform: "rotate(180deg)" } : undefined
                              }
                            />
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center px-1 text-center font-serif-display text-[8px] italic leading-tight text-[#1d140d]">
                            {card.nameZh}
                          </div>
                        )}
                      </div>
                      {reversed ? (
                        <span className="absolute inset-x-0 bottom-0 bg-rose-950/85 py-px text-center font-occult text-[7px] tracking-[0.22em] text-rose-200">
                          REV
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

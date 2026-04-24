"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { CardBack } from "@/components/DeckShuffle";
import type { TarotCard } from "@/lib/tarot/types";
import { cn } from "@/lib/utils";

type CardRevealProps = {
  card: TarotCard;
  reversed: boolean;
  compact?: boolean;
  index?: number;
};

export function CardReveal({
  card,
  reversed,
  compact = false,
  index = 0,
}: CardRevealProps) {
  const flipDelay = 0.35 + index * 0.15;

  return (
    <div className="relative group w-full h-full" style={{ perspective: "1400px" }}>
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        whileHover={{ scale: 1.05 }}
        transition={{ 
          rotateY: { duration: 0.9, delay: flipDelay, ease: [0.25, 0.8, 0.3, 1] },
          scale: { duration: 0.2 }
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-full cursor-pointer"
      >
        {/* 卡片背面 */}
        <div
          className="absolute inset-0 z-10"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <CardBack compact={compact} />
        </div>

        {/* 卡片正面 */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-[8px] md:rounded-[12px] border border-gold/40 shadow-xl transition-shadow duration-300",
            "group-hover:shadow-[0_0_30px_rgba(197,154,76,0.3)] group-hover:border-gold/70",
            "bg-gradient-to-br from-vellum-1 to-vellum-2",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: `rotateY(180deg) rotate(${reversed ? 180 : 0}deg)`,
          }}
        >
          {card.imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={card.imageUrl}
                alt={`${card.nameZh} ${card.nameEn}`}
                fill
                sizes="(max-width: 768px) 50vw, 200px"
                className="object-cover"
                priority={index < 5}
              />
              {/* 精致的卡片覆盖层 */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-white/10 pointer-events-none" />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sand text-xs text-ink-soft p-2 text-center pointer-events-none">
              {card.nameZh}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, type PointerEvent } from "react";

import { CardBack } from "@/components/DeckShuffle";
import { triggerHaptic } from "@/lib/haptics";
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const sheenX = 50 + tilt.y * 2.6;
  const sheenY = 50 - tilt.x * 2.6;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Math.max(-7, Math.min(7, -py * 10)),
      y: Math.max(-7, Math.min(7, px * 10)),
    });
  }

  return (
    <div
      className="relative group h-full w-full"
      onPointerDown={() => triggerHaptic([8, 18, 10])}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ perspective: "1400px" }}
    >
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        whileHover={{ scale: 1.05 }}
        transition={{ 
          rotateY: { duration: 0.9, delay: flipDelay, ease: [0.25, 0.8, 0.3, 1] },
          scale: { duration: 0.2 }
        }}
        style={{
          transformStyle: "preserve-3d",
          rotateX: tilt.x,
          rotateZ: tilt.y * 0.18,
        }}
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
            "absolute inset-0 overflow-hidden rounded-[10px] md:rounded-[14px] border border-[rgba(197,154,76,0.6)] shadow-[0_0_20px_rgba(197,154,76,0.2)] transition-all duration-300",
            "group-hover:shadow-[0_0_40px_rgba(197,154,76,0.45),0_0_80px_rgba(197,154,76,0.15)] group-hover:border-[rgba(232,200,122,0.85)]",
            "bg-gradient-to-br from-[var(--nebula)] to-[var(--velvet)]",
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              <div
                className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background:
                    `linear-gradient(${118 + tilt.y * 4}deg, transparent 14%, rgba(255,238,180,0.2) 42%, rgba(255,255,255,0.3) 50%, transparent 64%), radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.24), transparent 34%)`,
                }}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--nebula)] text-xs text-[var(--text-muted)] p-2 text-center pointer-events-none">
              {card.nameZh}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

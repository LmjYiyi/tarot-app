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
        initial={{ opacity: 0, y: -18, rotateY: 0, rotateZ: reversed ? -6 : 4 }}
        animate={{ opacity: 1, y: 0, rotateY: 180, rotateZ: 0 }}
        whileHover={{ scale: 1.05 }}
        transition={{ 
          opacity: { duration: 0.26, delay: Math.max(0, flipDelay - 0.18) },
          y: { duration: 0.46, delay: Math.max(0, flipDelay - 0.18), ease: [0.22, 0.65, 0.2, 1] },
          rotateY: { duration: 0.9, delay: flipDelay, ease: [0.25, 0.8, 0.3, 1] },
          rotateZ: { duration: 0.52, delay: Math.max(0, flipDelay - 0.12), ease: [0.22, 0.65, 0.2, 1] },
          scale: { duration: 0.2 }
        }}
        style={{
          transformStyle: "preserve-3d",
          rotateX: tilt.x,
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
            "absolute inset-0 overflow-hidden rounded-[10px] border border-[rgba(96,72,52,0.36)] shadow-[0_10px_22px_rgba(74,59,50,0.14),0_1px_0_rgba(255,248,230,0.55)_inset] transition-all duration-300 md:rounded-[12px]",
            "group-hover:border-[rgba(200,90,60,0.48)] group-hover:shadow-[0_16px_32px_rgba(74,59,50,0.16),0_0_0_1px_rgba(200,90,60,0.20)]",
            "bg-[var(--surface-tint)]",
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
              <div className="pointer-events-none absolute inset-[3px] rounded-[7px] border border-[rgba(255,248,230,0.38)] shadow-[0_0_0_1px_rgba(74,59,50,0.16)] md:rounded-[9px]" />
              {/* subtle bottom shade so card name labels read against any image */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,230,0.10)_0%,transparent_18%,transparent_64%,rgba(24,16,10,0.22)_100%)] pointer-events-none" />
              <div
                className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen transition-opacity duration-200 group-hover:opacity-70"
                style={{
                  background:
                    `linear-gradient(${118 + tilt.y * 4}deg, transparent 20%, rgba(255,255,255,0.14) 50%, transparent 72%), radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.14), transparent 38%)`,
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

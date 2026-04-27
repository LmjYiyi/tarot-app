"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useAnimationControls } from "framer-motion";
import { toRoman } from "@/components/ui/ornament";
import type { TarotCard } from "@/lib/tarot/types";

interface CardSliderProps {
  cards: TarotCard[];
  speed?: number; // 每次循环所需时间（秒），数值越小速度越快
}

export function CardSlider({ cards, speed = 40 }: CardSliderProps) {
  const [isPaused, setIsPaused] = useState(false);
  
  // 重复数组以实现无缝衔接
  const duplicatedCards = [...cards, ...cards];

  return (
    <div 
      className="relative w-full overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <motion.div
        className="flex gap-4 px-2"
        animate={{
          x: isPaused ? undefined : ["0%", "-50%"],
        }}
        transition={{
          x: {
            duration: speed,
            ease: "linear",
            repeat: Infinity,
          },
        }}
        style={{ width: "max-content" }}
      >
        {duplicatedCards.map((card, index) => (
          <Link
            key={`${card.id}-${index}`}
            href={`/cards/${card.slug}`}
            className="group relative aspect-[300/524] w-[140px] shrink-0 overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_4px_12px_rgba(26,26,25,0.08)] sm:w-[160px] transition-all duration-300 hover:scale-[1.04] hover:z-10 hover:shadow-[0_8px_24px_rgba(204,120,92,0.15)]"
          >
            <span className="absolute left-2.5 top-2.5 z-10 rounded-[4px] bg-[var(--surface)] px-2.5 py-1 font-mono text-[10.5px] tracking-[0.14em] text-[var(--coral-deep)] shadow-[0_1px_3px_rgba(26,26,25,0.08)]">
              {toRoman(card.number)}
            </span>
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={`${card.nameZh} ${card.nameEn}`}
                fill
                sizes="(max-width: 640px) 140px, 160px"
                className="object-cover transition duration-500 group-hover:brightness-110"
                draggable={false}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(26,26,25,0.12)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
        ))}
      </motion.div>
      
      {/* 左右两侧的渐变遮罩，使滑动边缘更自然 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[var(--background)] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[var(--background)] to-transparent z-10" />
    </div>
  );
}

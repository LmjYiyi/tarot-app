"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toRoman } from "@/components/ui/ornament";
import type { TarotCard } from "@/lib/tarot/types";

interface CardSliderProps {
  cards: TarotCard[];
}

export function CardSlider({ cards }: CardSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true); // Assuming cards > view width

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full py-4">
      {/* Desktop Navigation Arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-24 items-center justify-start bg-gradient-to-r from-[var(--background)] to-transparent px-4 sm:flex">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--ink)] shadow-md transition hover:bg-[var(--surface-tint)] hover:text-[var(--coral)]"
            aria-label="Scroll left"
          >
            ←
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-24 items-center justify-end bg-gradient-to-l from-[var(--background)] to-transparent px-4 sm:flex">
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--ink)] shadow-md transition hover:bg-[var(--surface-tint)] hover:text-[var(--coral)]"
            aria-label="Scroll right"
          >
            →
          </button>
        )}
      </div>

      {/* Cards Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar flex w-full overflow-x-auto scroll-smooth px-5 sm:px-8 lg:px-12 grid grid-cols-2 gap-4 sm:flex sm:grid-cols-none sm:gap-6 lg:gap-8 pb-4"
      >
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/cards/${card.slug}`}
            className="group relative aspect-[300/524] w-full shrink-0 overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_4px_12px_rgba(26,26,25,0.08)] sm:w-[160px] md:w-[180px] lg:w-[200px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(216,106,69,0.15)]"
          >
            <span className="absolute left-2.5 top-2.5 z-10 rounded-[4px] bg-[var(--surface)] px-2.5 py-1 font-mono text-[10.5px] tracking-[0.14em] text-[var(--coral-deep)] shadow-[0_1px_3px_rgba(26,26,25,0.08)]">
              {toRoman(card.number)}
            </span>
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={`${card.nameZh} ${card.nameEn}`}
                fill
                sizes="(max-width: 640px) 50vw, 200px"
                className="object-cover transition duration-500 group-hover:scale-105"
                draggable={false}
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--ink)] to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block hidden">
              <p className="text-[13px] text-white font-medium drop-shadow-md">{card.nameZh}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

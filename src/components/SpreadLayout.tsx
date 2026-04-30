"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { CardReveal } from "@/components/CardReveal";
import { layoutPresets } from "@/lib/tarot/layout-config";
import type { SpreadDefinition, TarotCard } from "@/lib/tarot/types";
import { cn } from "@/lib/utils";

type SpreadLayoutProps = {
  spread: SpreadDefinition;
  cards: Array<{
    card: TarotCard;
    reversed: boolean;
    positionOrder: number;
  }>;
};

export function SpreadLayout({ spread, cards }: SpreadLayoutProps) {
  const preset = layoutPresets[spread.slug] || {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%]",
    positions: {},
  };

  return (
    <div className="relative w-full">
      {/* --- Mobile flow stack --- */}
      <div className="md:hidden flex flex-col gap-10 items-center w-full px-4">
        {cards.map(({ card, reversed, positionOrder }, index) => {
          const position = spread.positions.find((item) => item.order === positionOrder);
          if (!position) return null;

          return (
            <motion.div
              key={`mobile-${card.id}-${positionOrder}`}
              className="flex flex-col items-center gap-4 w-3/5 max-w-[200px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col items-center">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-soft)] bg-[var(--surface)] px-3 py-1 rounded-full border border-[var(--line-strong)]">
                  {position.name}
                </span>
                <div className="h-3 w-px bg-[var(--line-strong)] mt-1" />
              </div>

              <div className="w-full aspect-[2/3.5]">
                <CardReveal
                  card={card}
                  reversed={reversed}
                  compact={false}
                  index={index}
                />
              </div>

              <div className="flex flex-col items-center mt-2">
                <p className="font-serif-display text-[17px] text-[var(--ink)] leading-tight">{card.nameZh}</p>
                <span className={cn(
                  "mt-1 font-mono text-[9px] tracking-[0.18em] px-2 py-0.5 rounded-full border",
                  reversed
                    ? "border-[rgba(184,92,110,0.45)] text-[#8a3447] bg-[rgba(184,92,110,0.08)]"
                    : "border-[var(--coral-edge)] text-[var(--coral-deep)] bg-[var(--coral-wash)]"
                )}>
                  {reversed ? "逆位 · 受阻/内化" : "正位 · 顺流/外显"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* --- Desktop chart canvas --- */}
      <div
        className={cn(
          "hidden md:block relative mx-auto w-full overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--surface-tint)]",
          preset.aspectRatio,
        )}
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(204,120,92,0.05) 0%, transparent 70%)",
        }}
      >
        {/* faint astrological chart, dialed way back so the cards lead */}
        <Image
          src="/spreads/astrology-chart-background-v2.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1024px"
          className="object-cover opacity-[0.10] mix-blend-multiply"
          aria-hidden
        />

        {/* gentle vignette that warms the center */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(250,249,245,0) 0%, rgba(236,231,216,0.35) 100%)",
          }}
        />

        {/* hairline interior frame */}
        <div className="pointer-events-none absolute inset-3 rounded-[14px] border border-[var(--line)]" />

        {cards.map(({ card, reversed, positionOrder }, index) => {
          const position = spread.positions.find((item) => item.order === positionOrder);
          const layoutPos = preset.positions[positionOrder];

          if (!position || !layoutPos) return null;

          const left = `${layoutPos.x}%`;
          const top = `${layoutPos.y}%`;
          const rotation = layoutPos.rotate || 0;
          const zIndex =
            rotation !== 0 && spread.slug === "celtic-cross" ? 30 : 10 + index;

          return (
            <motion.div
              key={`desktop-${card.id}-${positionOrder}`}
              className={cn(
                "absolute aspect-[2/3.5] -translate-x-1/2 -translate-y-1/2",
                preset.cardWidth,
              )}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: "-50%",
                y: "-50%",
                left,
                top,
                rotate: rotation,
              }}
              transition={{
                delay: index * 0.12,
                type: "spring",
                stiffness: 130,
                damping: 22,
              }}
              style={{ zIndex }}
            >
              <div className="group relative h-full w-full">
                {/* hover halo only — no base halo needed on the cream table */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-3 rounded-[18px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(204,120,92,0.18), transparent)",
                  }}
                />

                {/* position label */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-40">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[var(--ink-soft)] bg-[var(--surface)] px-2.5 py-0.5 rounded-full border border-[var(--line-strong)]">
                      {position.name}
                    </span>
                    <div className="h-2 w-px bg-[var(--line-strong)] mt-0.5" />
                  </div>
                </div>

                <CardReveal
                  card={card}
                  reversed={reversed}
                  compact={spread.cardCount > 6}
                  index={index}
                />

                {/* card name */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-40 flex flex-col items-center pointer-events-none transition-opacity duration-300 opacity-90 group-hover:opacity-100">
                  <p className="font-serif-display text-[15px] text-[var(--ink)]">
                    {card.nameZh}
                  </p>
                  <span className={cn(
                    "font-mono text-[8.5px] tracking-[0.18em] mt-0.5 px-2 py-0.5 rounded-full border",
                    reversed
                      ? "border-[rgba(184,92,110,0.45)] text-[#8a3447] bg-[rgba(184,92,110,0.08)]"
                      : "border-[var(--coral-edge)] text-[var(--coral-deep)] bg-[var(--coral-wash)]",
                  )}>
                    {reversed ? "逆位 · 内化" : "正位 · 外显"}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="hidden md:flex mt-12 flex-col items-center justify-center text-center space-y-2">
        <div className="h-px w-16 bg-[var(--line-strong)]" />
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--ink-muted)]">
          {spread.cardCount} 张牌 · 已落位
        </p>
      </div>
    </div>
  );
}

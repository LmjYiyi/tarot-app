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
                <span className="font-occult text-[10px] tracking-[0.36em] uppercase text-[rgba(243,210,138,0.85)] bg-[rgba(12,16,36,0.8)] px-3 py-1 rounded-full border border-[rgba(243,210,138,0.45)] backdrop-blur-md shadow-md">
                  {position.name}
                </span>
                <div className="h-3 w-px bg-[rgba(243,210,138,0.4)] mt-1" />
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
                <p className="font-serif-display text-[16px] italic text-[#f1e1c1] leading-tight">{card.nameZh}</p>
                <span className={cn(
                  "mt-1 font-occult text-[9px] tracking-[0.28em] px-1.5 py-0.5 rounded border backdrop-blur-sm",
                  reversed ? "border-rose-400/60 text-rose-200 bg-rose-950/40" : "border-emerald-400/60 text-emerald-200 bg-emerald-950/40"
                )}>
                  {reversed ? "REVERSED" : "UPRIGHT"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* --- Desktop chart canvas --- */}
      <div
        className={cn(
          "hidden md:block relative mx-auto w-full overflow-hidden rounded-[20px] border border-[rgba(243,210,138,0.35)] shadow-[0_30px_80px_rgba(8,10,28,0.55)]",
          preset.aspectRatio,
        )}
      >
        {/* astrology chart background */}
        <Image
          src="/spreads/astrology-chart-background.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1024px"
          className="object-cover"
          aria-hidden
        />

        {/* depth wash to ensure card legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(8,10,28,0) 0%, rgba(8,10,28,0.35) 70%, rgba(8,10,28,0.55) 100%)",
          }}
        />

        {/* corner ornaments */}
        <div className="pointer-events-none absolute inset-3 rounded-[14px] border border-[rgba(243,210,138,0.18)]" />

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
                {/* base ambient halo, always faintly visible to lift card off the dark table */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-2 rounded-[16px]"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,210,140,0.22), transparent 75%)",
                  }}
                />
                {/* hover halo, intensifies on interaction */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-3 rounded-[18px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,210,140,0.5), transparent)",
                  }}
                />

                {/* position label */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-40">
                  <div className="flex flex-col items-center">
                    <span className="font-occult text-[9px] tracking-[0.36em] uppercase text-[rgba(243,210,138,0.95)] bg-[rgba(12,16,36,0.85)] px-2.5 py-0.5 rounded-full border border-[rgba(243,210,138,0.5)] backdrop-blur-md shadow-md">
                      {position.name}
                    </span>
                    <div className="h-2 w-px bg-[rgba(243,210,138,0.55)] mt-0.5" />
                  </div>
                </div>

                <CardReveal
                  card={card}
                  reversed={reversed}
                  compact={spread.cardCount > 6}
                  index={index}
                />

                {/* card name */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-40 flex flex-col items-center pointer-events-none transition-opacity duration-300 opacity-80 group-hover:opacity-100">
                  <p className="font-serif-display italic text-[14px] text-[#f1e1c1] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                    {card.nameZh}
                  </p>
                  <span className={cn(
                    "font-occult text-[8px] tracking-[0.28em] mt-0.5 px-1.5 py-0.5 rounded border backdrop-blur-sm",
                    reversed
                      ? "border-rose-400/60 text-rose-200 bg-rose-950/50"
                      : "border-emerald-400/60 text-emerald-200 bg-emerald-950/50",
                  )}>
                    {reversed ? "REV" : "UP"}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="hidden md:flex mt-10 flex-col items-center justify-center text-center space-y-1">
        <div className="h-px w-20 bg-gradient-to-r from-transparent via-[rgba(243,210,138,0.5)] to-transparent" />
        <p className="font-occult text-[9px] tracking-[0.4em] uppercase opacity-50">
          Configured Layout · {spread.cardCount} Cards
        </p>
      </div>
    </div>
  );
}

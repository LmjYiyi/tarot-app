"use client";

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
  quiet?: boolean;
};

export function SpreadLayout({ spread, cards, quiet = false }: SpreadLayoutProps) {
  const preset = layoutPresets[spread.slug] || {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%]",
    positions: {},
  };
  const isThreeCardTimeline = spread.slug === "three-card" && cards.length === 3;

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
                {!quiet ? (
                  <>
                    <span className="border-b border-[var(--line-strong)] pb-1 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-soft)]">
                      {position.name}
                    </span>
                    <div className="h-3 w-px bg-[var(--line-strong)] mt-1" />
                  </>
                ) : null}
              </div>

              <div className="w-full aspect-[2/3.5]">
                <CardReveal
                  card={card}
                  reversed={reversed}
                  compact={false}
                  index={index}
                />
              </div>

              {!quiet ? (
              <div className="flex flex-col items-center mt-2">
                <p className="font-serif-display text-[17px] text-[var(--ink)] leading-tight">{card.nameZh}</p>
                <span className={cn(
                  "mt-1 font-mono text-[9px] tracking-[0.18em] px-2 py-0.5 rounded-full border",
                  reversed
                    ? "border-[rgba(138,52,71,0.58)] bg-[rgba(184,92,110,0.14)] text-[#7b2c3e]"
                    : "border-[rgba(200,90,60,0.58)] bg-[rgba(251,232,190,0.86)] text-[var(--coral-deep)]"
                )}>
                  {reversed ? "逆位 · 受阻/内化" : "正位 · 顺流/外显"}
                </span>
              </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      {/* --- Desktop chart canvas --- */}
      <div
        className={cn(
          "hidden md:block relative mx-auto mt-20 w-full overflow-visible",
          preset.aspectRatio,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[92%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(253,248,225,0.26) 0%, rgba(253,248,225,0.12) 42%, transparent 74%)",
          }}
        />

        {isThreeCardTimeline && !quiet ? (
          <div className="pointer-events-none absolute inset-x-[12%] top-0 z-30 flex items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            <span>过去</span>
            <span className="text-[var(--coral-deep)]">▸</span>
            <span className="text-[var(--ink)]">现在</span>
            <span className="text-[var(--coral-deep)]">▸</span>
            <span>未来</span>
          </div>
        ) : null}

        {cards.map(({ card, reversed, positionOrder }, index) => {
          const position = spread.positions.find((item) => item.order === positionOrder);
          const layoutPos = preset.positions[positionOrder];

          if (!position || !layoutPos) return null;

          const left = `${layoutPos.x}%`;
          const top = `${layoutPos.y}%`;
          const rotation = layoutPos.rotate || 0;
          const zIndex =
            rotation !== 0 && spread.slug === "celtic-cross" ? 30 : 10 + index;
          const isFocusCard = isThreeCardTimeline && position.order === 2;

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
                scale: isFocusCard ? 1.08 : 1,
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
                {!quiet && !isThreeCardTimeline ? (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap z-40">
                  <div className="flex flex-col items-center">
                    <span className="border-b border-[var(--line-strong)] pb-0.5 font-mono text-[9px] tracking-[0.18em] uppercase text-[var(--ink-soft)]">
                      {position.name}
                    </span>
                    <div className="h-1.5 w-px bg-[var(--line-strong)] mt-0.5" />
                  </div>
                  </div>
                ) : !quiet && isFocusCard ? (
                  <div className="absolute -top-7 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap">
                    <span className="border border-[rgba(150,106,46,0.56)] bg-[rgba(255,248,230,0.88)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--coral-deep)]">
                      焦点牌
                    </span>
                  </div>
                ) : null}

                {isFocusCard ? (
                  <div className="pointer-events-none absolute -inset-2 border border-[rgba(150,106,46,0.60)] shadow-[0_18px_34px_rgba(74,59,50,0.18)]" />
                ) : null}

                <CardReveal
                  card={card}
                  reversed={reversed}
                  compact={spread.cardCount > 6}
                  index={index}
                />

                {/* card name */}
                {!quiet ? (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-40 flex flex-col items-center pointer-events-none transition-opacity duration-300 opacity-90 group-hover:opacity-100">
                  <p className="font-serif-display text-[15px] text-[var(--ink)]">
                    {card.nameZh}
                  </p>
                  <span className={cn(
                    "font-mono text-[8.5px] tracking-[0.18em] mt-0.5 px-2 py-0.5 rounded-full border",
                    reversed
                      ? "border-[rgba(138,52,71,0.58)] bg-[rgba(184,92,110,0.14)] text-[#7b2c3e]"
                      : "border-[rgba(200,90,60,0.58)] bg-[rgba(251,232,190,0.86)] text-[var(--coral-deep)]",
                  )}>
                    {reversed ? "逆位 · 内化" : "正位 · 外显"}
                  </span>
                </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      {!quiet ? (
      <div className="hidden md:flex mt-12 flex-col items-center justify-center text-center space-y-2">
        <div className="h-px w-16 bg-[var(--line-strong)]" />
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--ink-muted)]">
          {spread.cardCount} 张牌 · 已落位
        </p>
      </div>
      ) : null}
    </div>
  );
}

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
};

export function SpreadLayout({ spread, cards }: SpreadLayoutProps) {
  // 获取布局配置，降级为默认
  const preset = layoutPresets[spread.slug] || {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%]",
    positions: {},
  };

  return (
    <div className="relative w-full py-8">
      {/* 几何布局背景装饰 - 仅桌面端显示 */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[60%] aspect-square border border-gold/40 rounded-full animate-shimmer" />
        <div className="absolute w-[40%] aspect-square border border-gold/20 rounded-full" />
        <div className="absolute w-px h-[70%] bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
        <div className="absolute h-px w-[70%] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>

      {/* --- 移动端布局 (流式堆叠) --- */}
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
              {/* 顶部标签 */}
              <div className="flex flex-col items-center">
                <span className="eyebrow text-[10px] text-gold/80 bg-midnight/60 backdrop-blur-md px-3 py-1 rounded-full border border-gold/30 shadow-sm">
                  {position.name}
                </span>
                <div className="h-3 w-px bg-gold/40 mt-1" />
              </div>

              {/* 卡片 */}
              <div className="w-full aspect-[2/3.5]">
                <CardReveal
                  card={card}
                  reversed={reversed}
                  compact={false}
                  index={index}
                />
              </div>

              {/* 底部标签 */}
              <div className="flex flex-col items-center mt-2">
                <p className="font-serif-display text-[15px] text-vellum-1 leading-tight">{card.nameZh}</p>
                <span className={cn(
                  "mt-1 text-[9px] font-occult px-1.5 py-0.5 rounded border border-white/10",
                  reversed ? "text-rose-300 bg-rose-900/30" : "text-emerald-300 bg-emerald-900/30"
                )}>
                  {reversed ? "REVERSED" : "UPRIGHT"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* --- 桌面端布局 (几何坐标) --- */}
      <div className={cn("hidden md:block relative mx-auto max-w-5xl w-full", preset.aspectRatio)}>
        {cards.map(({ card, reversed, positionOrder }, index) => {
          const position = spread.positions.find((item) => item.order === positionOrder);
          const layoutPos = preset.positions[positionOrder];
          
          if (!position || !layoutPos) return null;

          const left = `${layoutPos.x}%`;
          const top = `${layoutPos.y}%`;
          const rotation = layoutPos.rotate || 0;

          // 只有凯尔特十字的横向牌需要高 z-index 盖住中心牌
          const zIndex = rotation !== 0 && spread.slug === "celtic-cross" ? 30 : 10 + index;

          return (
            <motion.div
              key={`desktop-${card.id}-${positionOrder}`}
              className={cn("absolute aspect-[2/3.5] -translate-x-1/2 -translate-y-1/2", preset.cardWidth)}
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
                delay: index * 0.1,
                type: "spring",
                stiffness: 120,
                damping: 22,
              }}
              style={{ zIndex }}
            >
              <div className="group relative h-full w-full">
                {/* 常驻牌位标签 (上方) */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-40">
                  <div className="flex flex-col items-center">
                    <span className="eyebrow text-[9px] text-gold-soft bg-midnight/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-gold/30 shadow-md">
                      {position.name}
                    </span>
                    <div className="h-2 w-px bg-gold/40 mt-0.5" />
                  </div>
                </div>

                <CardReveal
                  card={card}
                  reversed={reversed}
                  compact={spread.cardCount > 6}
                  index={index}
                />

                {/* 常驻牌名标签 (下方) */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-40 flex flex-col items-center pointer-events-none transition-opacity duration-300 opacity-70 group-hover:opacity-100">
                  <p className="font-serif-display text-[13px] text-gold-soft drop-shadow-md">{card.nameZh}</p>
                  <span className={cn(
                    "text-[8px] font-occult mt-0.5 px-1 py-0.5 rounded border backdrop-blur-sm",
                    reversed ? "border-rose-500/50 text-rose-300 bg-rose-950/50" : "border-emerald-500/50 text-emerald-300 bg-emerald-950/50"
                  )}>
                    {reversed ? "REV" : "UP"}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="hidden md:flex mt-12 flex-col items-center justify-center text-center space-y-1">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <p className="eyebrow text-[9px] opacity-40 uppercase tracking-[0.4em]">Configured Layout</p>
      </div>
    </div>
  );
}

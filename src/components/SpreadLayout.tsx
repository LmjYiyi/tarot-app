"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import { CardReveal } from "@/components/CardReveal";
import { layoutPresets } from "@/lib/tarot/layout-config";
import type { SpreadDefinition, SpreadPosition, TarotCard } from "@/lib/tarot/types";
import { cn } from "@/lib/utils";

type ResolvedCard = {
  card: TarotCard;
  reversed: boolean;
  positionOrder: number;
};

type SpreadLayoutProps = {
  spread: SpreadDefinition;
  cards: ResolvedCard[];
  quiet?: boolean;
};

type FocusedCard = ResolvedCard & { position: SpreadPosition };

export function SpreadLayout({ spread, cards, quiet = false }: SpreadLayoutProps) {
  const preset = layoutPresets[spread.slug] || {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%]",
    positions: {},
  };
  const readingAspectRatio = preset.readingAspectRatio ?? preset.aspectRatio;
  const readingCardWidth = preset.readingCardWidth ?? preset.cardWidth;
  const isThreeCardTimeline = spread.slug === "three-card" && cards.length === 3;
  const isCompactSpread = spread.cardCount > 6;
  const isSingleCardSpread = spread.cardCount <= 1;

  const [focused, setFocused] = useState<FocusedCard | null>(null);

  function openCard(card: ResolvedCard, position: SpreadPosition) {
    if (quiet) return;
    setFocused({ ...card, position });
  }

  return (
    <div className="relative w-full">
      {/* --- Mobile flow stack --- */}
      <div
        className={cn(
          "md:hidden w-full px-4",
          isCompactSpread ? "flex justify-center pt-6" : "flex flex-col gap-10 items-center",
          isSingleCardSpread ? "pt-10" : null,
        )}
      >
        {isCompactSpread ? (
          <div className={cn("relative w-full max-w-[430px]", readingAspectRatio)}>
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[92%] w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(253,248,225,0.35) 0%, rgba(253,248,225,0.16) 46%, transparent 76%)",
              }}
            />
            {cards.map(({ card, reversed, positionOrder }, index) => {
              const position = spread.positions.find((item) => item.order === positionOrder);
              const layoutPos = preset.positions[positionOrder];
              if (!position || !layoutPos) return null;

              return (
                <motion.button
                  type="button"
                  key={`mobile-compact-${card.id}-${positionOrder}`}
                  onClick={() => openCard({ card, reversed, positionOrder }, position)}
                  className="absolute aspect-[2/3.5] w-[16.5%] -translate-x-1/2 -translate-y-1/2 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                  style={{
                    left: `${layoutPos.x}%`,
                    top: `${layoutPos.y}%`,
                    rotate: `${layoutPos.rotate || 0}deg`,
                    zIndex: 10 + index,
                  }}
                  initial={{ opacity: 0, scale: 0.78, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: index * 0.06,
                    type: "spring",
                    stiffness: 150,
                    damping: 22,
                  }}
                  aria-label={`${position.name}，${card.nameZh}，${reversed ? "逆位" : "正位"}，点开查看详情`}
                >
                  <CardReveal
                    card={card}
                    reversed={reversed}
                    compact
                    index={index}
                  />
                  {!quiet ? (
                    <span className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--coral-edge)] bg-[var(--surface-tint)] font-mono text-[9px] text-[var(--coral-deep)] shadow-sm">
                      {position.order}
                    </span>
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        ) : (
          cards.map(({ card, reversed, positionOrder }, index) => {
            const position = spread.positions.find((item) => item.order === positionOrder);
            if (!position) return null;

            return (
              <motion.div
                key={`mobile-${card.id}-${positionOrder}`}
                className="flex flex-col items-center gap-3 w-2/3 max-w-[240px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {!quiet ? (
                  <div className="flex flex-col items-center">
                    <span className="border-b border-[var(--line-strong)] pb-1 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-soft)]">
                      {position.name}
                    </span>
                    <div className="h-3 w-px bg-[var(--line-strong)] mt-1" />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => openCard({ card, reversed, positionOrder }, position)}
                  className="w-full aspect-[2/3.5] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface)]"
                  aria-label={`${position.name}，${card.nameZh}，${reversed ? "逆位" : "正位"}，点开查看详情`}
                >
                  <CardReveal
                    card={card}
                    reversed={reversed}
                    compact={false}
                    index={index}
                  />
                </button>

                {!quiet ? (
                  <div className="flex flex-col items-center">
                    <p className="font-serif-display text-[18px] text-[var(--ink)] leading-tight">{card.nameZh}</p>
                    <span className={cn(
                      "mt-1 font-mono text-[9px] tracking-[0.18em] px-2 py-0.5 rounded-full border",
                      reversed
                        ? "border-[rgba(122,66,42,0.55)] bg-[rgba(122,66,42,0.10)] text-[rgba(122,66,42,0.95)]"
                        : "border-[rgba(200,90,60,0.58)] bg-[rgba(251,232,190,0.86)] text-[var(--coral-deep)]"
                    )}>
                      {reversed ? "逆位 · 受阻/内化" : "正位 · 顺流/外显"}
                    </span>
                  </div>
                ) : null}
              </motion.div>
            );
          })
        )}
      </div>

      {/* --- Desktop chart canvas --- */}
      <div
        className={cn(
          "hidden md:block relative mx-auto w-full overflow-visible",
          isSingleCardSpread ? "mt-36 lg:mt-40" : "mt-24",
          readingAspectRatio,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[92%] w-[94%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(253,248,225,0.26) 0%, rgba(253,248,225,0.12) 42%, transparent 74%)",
          }}
        />

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
                readingCardWidth,
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
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap z-40">
                    <span
                      className={cn(
                        "rounded-full border border-[var(--line-strong)] bg-[rgba(253,248,225,0.92)] px-2 py-[2px] font-mono uppercase tracking-[0.18em] text-[var(--ink-soft)] shadow-[0_2px_6px_rgba(74,59,50,0.08)]",
                        isCompactSpread ? "text-[8.5px]" : "text-[9.5px]",
                      )}
                    >
                      {position.name}
                    </span>
                  </div>
                ) : !quiet && isFocusCard ? (
                  <div className="absolute -top-7 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap">
                    <span className="border border-[rgba(150,106,46,0.56)] bg-[rgba(255,248,230,0.88)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--coral-deep)]">
                      焦点牌
                    </span>
                  </div>
                ) : null}

                {isFocusCard ? (
                  <div className="pointer-events-none absolute -inset-2 border border-[rgba(150,106,46,0.60)] shadow-[0_18px_34px_rgba(74,59,50,0.18)]" />
                ) : null}

                <button
                  type="button"
                  onClick={() => openCard({ card, reversed, positionOrder }, position)}
                  className="relative block h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                  aria-label={`${position.name}，${card.nameZh}，${reversed ? "逆位" : "正位"}，点开查看详情`}
                >
                  <CardReveal
                    card={card}
                    reversed={reversed}
                    compact={isCompactSpread}
                    index={index}
                  />

                  {/* card name + orientation overlay sits inside the card so it never bleeds onto neighbors */}
                  {!quiet ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-1 px-2 pb-2 pt-6">
                      <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 -z-10 h-full bg-gradient-to-t from-[rgba(20,14,10,0.78)] via-[rgba(20,14,10,0.42)] to-transparent"
                      />
                      <p
                        className={cn(
                          "font-serif-display leading-tight text-[rgba(255,247,224,0.96)] drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]",
                          isCompactSpread ? "text-[12px]" : "text-[14.5px]",
                        )}
                      >
                        {card.nameZh}
                      </p>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-[1px] font-mono tracking-[0.18em] backdrop-blur-[2px]",
                          isCompactSpread ? "text-[8px]" : "text-[9px]",
                          reversed
                            ? "border-[rgba(255,180,196,0.66)] bg-[rgba(96,28,46,0.62)] text-[rgba(255,212,222,0.96)]"
                            : "border-[rgba(255,210,160,0.7)] bg-[rgba(176,72,40,0.60)] text-[rgba(255,238,210,0.98)]",
                        )}
                      >
                        {reversed ? "逆位" : "正位"}
                      </span>
                    </div>
                  ) : null}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <CardZoomModal
        focused={focused}
        spread={spread}
        onClose={() => setFocused(null)}
      />
    </div>
  );
}

function CardZoomModal({
  focused,
  spread,
  onClose,
}: {
  focused: FocusedCard | null;
  spread: SpreadDefinition;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!focused) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [focused, onClose]);

  return (
    <AnimatePresence>
      {focused ? (
        <motion.div
          key="card-zoom-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(45,34,25,0.48)] px-3 py-4 backdrop-blur-[6px] sm:px-5 sm:py-8"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${focused.card.nameZh} 详情`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 0.65, 0.2, 1] }}
            className="relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-[18px] border border-[rgba(112,88,66,0.30)] bg-[rgba(253,248,225,0.95)] shadow-[0_26px_70px_rgba(45,34,25,0.32),0_1px_0_rgba(255,255,255,0.52)_inset] backdrop-blur-md md:max-h-[88vh] md:grid md:grid-cols-[minmax(0,300px)_1fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(74,59,50,0.16)] bg-[rgba(255,248,230,0.78)] text-[var(--ink-soft)] shadow-[0_2px_8px_rgba(74,59,50,0.10)] transition hover:border-[var(--coral-edge)] hover:text-[var(--coral-deep)]"
            >
              <span aria-hidden className="text-[18px] leading-none">×</span>
            </button>

            {/* Desktop Left Column / Mobile Header */}
            <div className="relative shrink-0 border-b border-[var(--line)] bg-[linear-gradient(180deg,rgba(244,230,177,0.35),rgba(253,248,225,0.28))] p-4 md:shrink md:border-b-0 md:border-r md:p-8 md:block flex gap-4 items-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-60 md:block hidden"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 18%, rgba(200,90,60,0.10), transparent 58%)",
                }}
              />
              <div className="w-[90px] sm:w-[120px] md:mx-auto md:w-full md:max-w-[300px] shrink-0 md:sticky md:top-0">
                <div className="relative aspect-[2/3.5] w-full overflow-hidden rounded-[8px] md:rounded-[13px] border border-[rgba(96,72,52,0.34)] bg-[var(--surface-tint)] shadow-[0_8px_16px_rgba(74,59,50,0.12)] md:shadow-[0_18px_34px_rgba(74,59,50,0.18)]">
                  {focused.card.imageUrl ? (
                    <Image
                      src={focused.card.imageUrl}
                      alt={`${focused.card.nameZh} ${focused.card.nameEn}`}
                      fill
                      sizes="(max-width: 768px) 120px, 320px"
                      className="object-cover"
                      style={focused.reversed ? { transform: "rotate(180deg)" } : undefined}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-center text-[10px] md:text-sm text-[var(--ink-muted)]">
                      {focused.card.nameZh}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-[2px] md:inset-[4px] rounded-[6px] md:rounded-[9px] border border-[rgba(255,248,230,0.42)] shadow-[0_0_0_1px_rgba(74,59,50,0.14)]" />
                </div>
              </div>

              {/* Mobile Only: Title Info next to Image */}
              <div className="flex-1 min-w-0 md:hidden flex flex-col justify-center py-1 pr-6">
                <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[var(--coral-deep)] truncate">
                  {spread.nameZh} · {focused.position.name}
                </p>
                <h3 className="mt-1 font-serif-display text-[22px] sm:text-[26px] leading-[1.1] text-[var(--ink)] truncate">
                  {focused.card.nameZh}
                </h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] truncate">
                  {focused.card.nameEn}
                </p>
                <div className="mt-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]",
                      focused.reversed
                        ? "border-[rgba(122,66,42,0.55)] bg-[rgba(122,66,42,0.10)] text-[rgba(122,66,42,0.95)]"
                        : "border-[rgba(200,90,60,0.6)] bg-[rgba(251,232,190,0.7)] text-[var(--coral-deep)]",
                    )}
                  >
                    {focused.reversed ? "逆位 · 受阻" : "正位 · 顺流"}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-5 md:space-y-6 overflow-y-auto p-4 sm:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-8">
              {/* Desktop Only: Title Info */}
              <div className="hidden md:block border-b border-[var(--line)] pb-5">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--coral-deep)]">
                  {spread.nameZh} · {focused.position.name}
                </p>
                <h3 className="mt-2 font-serif-display text-[clamp(2rem,4vw,2.9rem)] leading-[1.04] text-[var(--ink)]">
                  {focused.card.nameZh}
                </h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                  {focused.card.nameEn}
                </p>
                <span
                  className={cn(
                    "mt-4 inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]",
                    focused.reversed
                      ? "border-[rgba(122,66,42,0.55)] bg-[rgba(122,66,42,0.10)] text-[rgba(122,66,42,0.95)]"
                      : "border-[rgba(200,90,60,0.6)] bg-[rgba(251,232,190,0.7)] text-[var(--coral-deep)]",
                  )}
                >
                  {focused.reversed ? "逆位 · 受阻 / 内化" : "正位 · 顺流 / 外显"}
                </span>
              </div>

              <div className="space-y-2">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                  位置含义
                </p>
                <p className="text-[14px] md:text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                  {focused.position.focus}
                </p>
              </div>

              {focused.card.description ? (
                <div className="space-y-3 border-t border-[var(--line)] pt-4 md:pt-5">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                    牌面描述
                  </p>
                  <div className="space-y-3 text-[13.5px] md:text-[14px] leading-[1.8] text-[var(--ink-soft)]">
                    {focused.card.description
                      .split(/\n+/)
                      .map((paragraph) => paragraph.trim())
                      .filter((paragraph) => paragraph.length > 0)
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                  </div>
                </div>
              ) : null}

              {(() => {
                const keywords = focused.reversed
                  ? focused.card.keywordsReversed
                  : focused.card.keywordsUpright;
                if (!keywords || keywords.length === 0) return null;
                return (
                  <div className="space-y-2 border-t border-[var(--line)] pt-4 md:pt-4">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                      关键词
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.slice(0, 6).map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full border border-[var(--coral-edge)] bg-[var(--coral-wash)] px-2.5 py-0.5 text-[11.5px] md:text-[12px] text-[var(--coral-deep)]"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

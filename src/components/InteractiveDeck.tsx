"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { CardBack } from "@/components/DeckShuffle";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const TOTAL_CARDS = 78;

export type RitualPhase =
  | "idle"
  | "shuffling"
  | "cutting"
  | "selecting"
  | "revealing"
  | "revealed";

export type SelectMode = "fan" | "piles" | "number";

type InteractiveDeckProps = {
  phase: RitualPhase;
  cardCount: number;
  selectMode: SelectMode;
  shufflePreviewCards?: ShufflePreviewCard[];
  onModeChange: (mode: SelectMode) => void;
  onShuffleDone: () => void;
  onCutDone: (cutPosition: number) => void;
  onSelectionDone: (indices: number[]) => void;
  shuffleDurationMs?: number;
};

type ShufflePreviewCard = {
  imageUrl: string;
  nameZh: string;
};

export function InteractiveDeck({
  phase,
  cardCount,
  selectMode,
  shufflePreviewCards = [],
  onModeChange,
  onShuffleDone,
  onCutDone,
  onSelectionDone,
  shuffleDurationMs = 2900,
}: InteractiveDeckProps) {
  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {phase === "idle" || phase === "shuffling" ? (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <ShuffleStage
              active={phase === "shuffling"}
              durationMs={shuffleDurationMs}
              previewCards={shufflePreviewCards}
              onDone={onShuffleDone}
            />
          </motion.div>
        ) : null}

        {phase === "cutting" ? (
          <motion.div
            key="cut"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <CutStage onCutDone={onCutDone} />
          </motion.div>
        ) : null}

        {phase === "selecting" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <SelectStage
              cardCount={cardCount}
              mode={selectMode}
              onModeChange={onModeChange}
              onSelectionDone={onSelectionDone}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   Shared Layout primitives
   ============================================================ */
function StageLayout({
  label,
  helper,
  isActive = true,
  action,
  children,
  headerAddon,
}: {
  label: string;
  helper: React.ReactNode;
  isActive?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  headerAddon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center w-full min-h-[460px] justify-between gap-6 py-6 lg:py-8">
      <div className="flex flex-col items-center gap-4 text-center w-full shrink-0 px-4">
        {headerAddon}
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full transition-colors",
              isActive ? "bg-[var(--coral)] animate-shimmer" : "bg-[var(--ink-faint)]",
            )}
          />
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            {label}
          </p>
        </div>
        <p className="max-w-[420px] text-center text-[14.5px] leading-[1.8] text-[var(--ink-soft)] min-h-[2.5rem]">
          {helper}
        </p>
      </div>

      <div className="flex-1 flex w-full items-center justify-center relative my-4">
        {children}
      </div>

      <div className="flex flex-col items-center justify-center w-full min-h-[48px] shrink-0 px-4">
        {action}
      </div>
    </div>
  );
}

/* ============================================================
   Shuffle stage — riffle shuffle on an etched compass dial
   ============================================================ */

const SHUFFLE_CYCLE_SEC = 2.8;
const RIFFLE_HALF = 8;

function ShuffleStage({
  active,
  durationMs,
  previewCards,
  onDone,
}: {
  active: boolean;
  durationMs: number;
  previewCards: ShufflePreviewCard[];
  onDone: () => void;
}) {
  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timeout);
  }, [active, durationMs, onDone]);

  return (
    <StageLayout
      isActive={active}
      label={active ? "Shuffling · 洗牌中" : "Awaiting · 待洗"}
      helper={
        active
          ? "把问题在心里默念一遍，让它从胸口落到指尖。"
          : "深呼吸三次，再开始。"
      }
      headerAddon={
        active && (
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
          />
        )
      }
    >
      <ShuffleAura active={active} previewCards={previewCards} />
    </StageLayout>
  );
}

// Stable random values for floating sparks to satisfy React purity rules
const STATIC_SPARKS = Array.from({ length: 15 }).map(() => ({
  xStart: (Math.random() - 0.5) * 600,
  xEnd: (Math.random() - 0.5) * 600,
  duration: 3 + Math.random() * 2,
  delay: Math.random() * 2,
}));

function ShuffleAura({
  active,
  previewCards,
}: {
  active: boolean;
  previewCards: ShufflePreviewCard[];
}) {
  const total = RIFFLE_HALF * 2;
  const [previewOffset, setPreviewOffset] = useState(0);
  const visiblePreviewCards = useMemo(
    () => (previewCards.length > 0 ? previewCards : FALLBACK_PREVIEW_CARDS),
    [previewCards],
  );

  useEffect(() => {
    if (!active) {
      return;
    }

    const interval = window.setInterval(() => {
      setPreviewOffset((offset) => (offset + 1) % visiblePreviewCards.length);
    }, 260);

    return () => window.clearInterval(interval);
  }, [active, visiblePreviewCards.length]);

  function getPreviewCard(index: number) {
    return visiblePreviewCards[(previewOffset + index) % visiblePreviewCards.length];
  }

  return (
    <div
      className="relative flex h-[340px] w-full max-w-[760px] items-center justify-center overflow-visible sm:h-[380px]"
      style={{ perspective: "1800px" }}
    >
      {/* compass dial — a slowly turning hairline ring with tick marks */}
      <motion.div
        className="absolute h-[310px] w-[310px] sm:h-[400px] sm:w-[400px] rounded-full"
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          duration: 90,
          ease: "linear",
          repeat: active ? Infinity : 0,
        }}
      >
        <div className="absolute inset-0 rounded-full border border-[var(--coral-edge)] opacity-25 shadow-[0_0_40px_rgba(200,90,60,0.1)]" />
        <div className="absolute inset-6 rounded-full border border-dashed border-[var(--line-strong)] opacity-10" />
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--coral)] to-transparent opacity-20" />
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--coral)] to-transparent opacity-20" />
      </motion.div>

      {/* breathing ring — heartbeat synced to the riffle */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-px w-[min(82vw,600px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[rgba(168,85,62,0.4)] to-transparent"
        animate={
          active
            ? {
                opacity: [0.25, 0.7, 0.25],
                scaleX: [0.75, 1.05, 0.75],
              }
            : { opacity: 0.2, scaleX: 0.75 }
        }
        transition={{
          duration: SHUFFLE_CYCLE_SEC,
          repeat: active ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* coral underglow */}
      <motion.div
        className="pointer-events-none absolute bottom-4 h-24 w-[min(75vw,500px)] rounded-[100%] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, rgba(200,90,60,0.3) 0%, transparent 70%)",
        }}
        animate={
          active
            ? { opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.1, 0.95] }
            : { opacity: 0.35, scale: 1 }
        }
        transition={{
          duration: SHUFFLE_CYCLE_SEC,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* card stack — riffle */}
      <div
        className="relative h-[280px] w-[min(86vw,580px)] sm:h-[320px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isLeft = i < RIFFLE_HALF;
          const half = isLeft ? -1 : 1;
          const localIdx = isLeft ? i : i - RIFFLE_HALF;
          const stackSpread = Math.min(localIdx * 1.8, 12);
          const restX = half * (108 + stackSpread);
          const restY = 26 - localIdx * 1.3;
          const restRotate = half * (8.5 - localIdx * 0.58);
          const bridgeX = half * (22 - localIdx * 1.5);
          const bridgeY = -20 - localIdx * 3.4;
          const phase = localIdx * 0.06 + (isLeft ? 0 : 0.03);
          const flashFace = active && (localIdx === 1 || localIdx === 4 || localIdx === 7);
          const previewCard = getPreviewCard(i + localIdx * 3);

          return (
            <motion.div
              key={i}
              className="absolute h-52 w-32 will-change-transform"
              style={{
                left: "50%",
                top: "50%",
                marginLeft: -64,
                marginTop: -104,
                transformStyle: "preserve-3d",
                zIndex: 100 - localIdx + (isLeft ? 0 : 2),
              }}
              animate={
                active
                  ? {
                      x: [restX, half * 76, bridgeX, half * 36, restX, restX],
                      y: [
                        restY,
                        restY - 7,
                        bridgeY,
                        11 - localIdx * 1.5,
                        23 - localIdx,
                        restY,
                      ],
                      rotate: [
                        restRotate,
                        half * 4.5,
                        half * -9,
                        half * -2.5,
                        restRotate * 0.48,
                        restRotate,
                      ],
                      rotateX: [0, 1, 15, 7, 1, 0],
                      rotateY: [0, half * -7, half * -20, half * -7, 0, 0],
                    }
                  : { x: restX, y: restY, rotate: restRotate, rotateX: 0, rotateY: 0 }
              }
              transition={
                active
                  ? {
                      duration: SHUFFLE_CYCLE_SEC,
                      repeat: Infinity,
                      ease: [0.4, 0.02, 0.25, 1],
                      times: [0, 0.2, 0.46, 0.72, 0.94, 1],
                      delay: phase,
                    }
                  : { duration: 0.58, ease: "easeOut" }
              }
            >
              <RiffleCard card={previewCard} showFace={flashFace} delay={phase} />
            </motion.div>
          );
        })}
      </div>

      {/* drifting motes — sparse atmosphere */}
      {active ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
          {Array.from({ length: 4 }).map((_, i) => {
            const previewCard = getPreviewCard(i * 13 + previewOffset);
            const half = i % 2 === 0 ? 1 : -1;

            return (
              <motion.div
                key={i}
                className="absolute h-[110px] w-[66px] overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.5)] bg-[var(--surface)] shadow-[0_8px_20px_rgba(26,26,25,0.12)]"
                initial={{ opacity: 0, x: half * 80, y: 30, rotate: half * 4, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.65, 0],
                  x: [half * 90, half * (20 + i * 14), half * -80],
                  y: [40, -10 - i * 10, 30],
                  rotate: [half * 8, half * -5, half * -15],
                  scale: [0.8, 0.92, 0.8],
                }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  delay: i * 0.45,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={previewCard.imageUrl}
                  alt=""
                  fill
                  sizes="66px"
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,transparent_50%,rgba(26,26,25,0.25)_100%)]" />
              </motion.div>
            );
          })}
        </div>
      ) : null}

      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {STATIC_SPARKS.map((spark, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-[2px] w-[2px] rounded-full bg-[var(--coral-soft)] opacity-30"
              initial={{ 
                x: spark.xStart, 
                y: 200, 
                opacity: 0 
              }}
              animate={{ 
                y: -200, 
                opacity: [0, 0.5, 0],
                x: spark.xEnd
              }}
              transition={{
                duration: spark.duration,
                repeat: Infinity,
                delay: spark.delay,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Cut stage — drag a coral line on a calm cream rail
   ============================================================ */

function RiffleCard({
  card,
  showFace,
  delay,
}: {
  card: ShufflePreviewCard;
  showFace: boolean;
  delay: number;
}) {
  return (
    <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
      <motion.div
        className="absolute inset-0"
        style={{ backfaceVisibility: "hidden" }}
        animate={showFace ? { opacity: [1, 0.12, 1] } : { opacity: 1 }}
        transition={{
          duration: SHUFFLE_CYCLE_SEC,
          repeat: showFace ? Infinity : 0,
          delay,
          ease: "easeInOut",
          times: [0, 0.42, 1],
        }}
      >
        <CardBack />
      </motion.div>
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.62)] bg-[var(--surface)] shadow-[0_10px_26px_rgba(26,26,25,0.16)]"
        style={{ backfaceVisibility: "hidden" }}
        animate={showFace ? { opacity: [0, 0.95, 0], scale: [0.985, 1.02, 0.995] } : { opacity: 0 }}
        transition={{
          duration: SHUFFLE_CYCLE_SEC,
          repeat: showFace ? Infinity : 0,
          delay,
          ease: "easeInOut",
          times: [0, 0.42, 1],
        }}
      >
        <Image
          src={card.imageUrl}
          alt={card.nameZh}
          fill
          sizes="128px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,transparent_50%,rgba(26,26,25,0.18)_100%)]" />
      </motion.div>
    </div>
  );
}

const FALLBACK_PREVIEW_CARDS: ShufflePreviewCard[] = [
  { imageUrl: "/tarot/the-fool.jpg", nameZh: "The Fool" },
  { imageUrl: "/tarot/the-high-priestess.jpg", nameZh: "The High Priestess" },
  { imageUrl: "/tarot/the-sun.jpg", nameZh: "The Sun" },
  { imageUrl: "/tarot/death.jpg", nameZh: "Death" },
  { imageUrl: "/tarot/cups-two.jpg", nameZh: "Two of Cups" },
];

function CutStage({ onCutDone }: { onCutDone: (cutPosition: number) => void }) {
  const [position, setPosition] = useState(0.5);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    function handleMove(event: MouseEvent | TouchEvent) {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX =
        "touches" in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
      const ratio = (clientX - rect.left) / rect.width;
      setPosition(Math.min(0.92, Math.max(0.08, ratio)));
    }

    function handleUp() {
      setDragging(false);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging]);

  return (
    <StageLayout
      label="Cut · 切牌"
      helper="把一叠牌切开 — 拖动这条线，决定能量从哪里介入。"
      action={
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--ink-muted)]">
              Position
            </span>
            <span className="font-serif-display text-[18px] text-[var(--ink)]">
              第 {Math.round(position * TOTAL_CARDS)} 张
            </span>
          </div>
          <Button
            className="px-8 py-6 text-[15px]"
            onClick={() => {
              triggerHaptic([10, 20, 14]);
              onCutDone(position);
            }}
          >
            确认切牌
          </Button>
        </div>
      }
    >
      <div
        ref={trackRef}
        className="relative h-48 w-full max-w-2xl select-none"
        onMouseDown={() => {
          triggerHaptic(8);
          setDragging(true);
        }}
        onTouchStart={() => {
          triggerHaptic(8);
          setDragging(true);
        }}
      >
        {/* deck rail — enhanced with shadows and texture */}
        <div className="absolute inset-x-0 top-1/2 h-28 -translate-y-1/2 overflow-hidden rounded-[16px] border border-[var(--line-strong)] bg-[linear-gradient(170deg,#f6f1e3_0%,#e9dec4_100%)] shadow-[inset_0_2px_4px_rgba(74,59,50,0.1),0_8px_20px_rgba(74,59,50,0.06)]">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(168,85,62,0.15) 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, rgba(74,59,50,0.05) 0 1px, transparent 1px 2px)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--x,50%)_50%,transparent_0%,rgba(74,59,50,0.08)_100%)]" 
               style={{ '--x': `${position * 100}%` } as React.CSSProperties} />
          
          {/* Card edges simulation */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="h-full flex-1 border-r border-[rgba(74,59,50,0.06)]" />
            ))}
          </div>
        </div>

        {/* coral wash behind cut line */}
        <motion.div
          className="absolute top-1/2 h-44 w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl pointer-events-none"
          animate={{
            left: `${position * 100}%`,
            opacity: dragging ? 0.6 : 0.4,
            scale: dragging ? 1.2 : 1,
          }}
          style={{
            background:
              "radial-gradient(closest-side, rgba(204,120,92,0.4), transparent)",
          }}
        />

        {/* cut line */}
        <motion.div
          className="absolute top-1/2 z-10 h-52 w-16 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
          style={{ left: `${position * 100}%` }}
          animate={{ scale: dragging ? 1.05 : 1 }}
        >
          <div className="relative flex h-full w-[3px] flex-col items-center">
            <div className="h-full w-full bg-[linear-gradient(180deg,transparent_0%,rgba(204,120,92,0.8)_15%,rgba(168,85,62,1)_50%,rgba(204,120,92,0.8)_85%,transparent_100%)] shadow-[0_0_15px_rgba(200,90,60,0.3)]" />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--coral)] bg-[var(--surface-tint)] shadow-[0_4px_16px_rgba(168,85,62,0.25)]"
              animate={dragging ? { scale: 1.15, rotate: 90 } : { scale: [1, 1.05, 1], rotate: 0 }}
              transition={{ 
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 0.3 }
              }}
            >
              <div className="absolute inset-0 rounded-full animate-pulse-slow bg-[var(--coral-wash)] opacity-50" />
              <svg viewBox="0 0 24 24" className="relative h-6 w-6 text-[var(--coral-deep)]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 12 L17 12" strokeLinecap="round" />
                <path d="M10 8 L7 12 L10 16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 8 L17 12 L14 16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* tick marks */}
        <div className="pointer-events-none absolute inset-x-2 -bottom-6 flex justify-between font-mono text-[9px] tracking-[0.25em] uppercase text-[var(--ink-muted)] opacity-60">
          <span>顶端</span>
          <span>1/4</span>
          <span>1/2</span>
          <span>3/4</span>
          <span>底端</span>
        </div>
      </div>
    </StageLayout>
  );
}

/* ============================================================
   Selection stage
   ============================================================ */

function SelectStage({
  cardCount,
  mode,
  onModeChange,
  onSelectionDone,
}: {
  cardCount: number;
  mode: SelectMode;
  onModeChange: (mode: SelectMode) => void;
  onSelectionDone: (indices: number[]) => void;
}) {
  const [showModes, setShowModes] = useState(false);

  return (
    <div className="flex flex-col gap-6 pb-2">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            当前抽牌方式
          </span>
          <span className="text-[13px] font-medium text-[var(--ink)]">
            {mode === "fan" ? "扇形挑牌" : mode === "piles" ? "三叠选一" : "心象数字"}
          </span>
          <button
            type="button"
            onClick={() => setShowModes((value) => !value)}
            className="text-[12px] text-[var(--coral-deep)] underline-offset-4 hover:underline"
          >
            换一种
          </button>
        </div>

        {showModes ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <ModeTab active={mode === "fan"} onClick={() => onModeChange("fan")}>
              扇形挑牌
            </ModeTab>
            <ModeTab active={mode === "piles"} onClick={() => onModeChange("piles")}>
              三叠选一
            </ModeTab>
            <ModeTab active={mode === "number"} onClick={() => onModeChange("number")}>
              心象数字
            </ModeTab>
          </div>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {mode === "fan" ? (
          <motion.div
            key="fan"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <FanPicker cardCount={cardCount} onDone={onSelectionDone} />
          </motion.div>
        ) : null}
        {mode === "piles" ? (
          <motion.div
            key="piles"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <PilePicker cardCount={cardCount} onDone={onSelectionDone} />
          </motion.div>
        ) : null}
        {mode === "number" ? (
          <motion.div
            key="number"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <NumberPicker cardCount={cardCount} onDone={onSelectionDone} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic(8);
        onClick();
      }}
      className={cn(
        "rounded-[8px] px-3.5 py-1.5 text-[12px] font-medium tracking-[0.02em] transition-all",
        active
          ? "bg-[var(--ink)] text-[var(--surface)]"
          : "text-[var(--ink-soft)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Fan picker ---------------- */

function FanPicker({
  cardCount,
  onDone,
}: {
  cardCount: number;
  onDone: (indices: number[]) => void;
}) {
  const [picks, setPicks] = useState<number[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const fanRef = useRef<HTMLDivElement | null>(null);
  const [panX, setPanX] = useState(0);
  const [maxPanX, setMaxPanX] = useState(0);

  function togglePick(index: number) {
    const alreadyPicked = picks.includes(index);
    if (!alreadyPicked && picks.length >= cardCount) return;
    triggerHaptic(alreadyPicked ? 8 : [10, 25, 12]);
    setPicks((current) => {
      if (current.includes(index)) {
        return current.filter((value) => value !== index);
      }
      if (current.length >= cardCount) return current;
      return [...current, index];
    });
  }

  const cards = useMemo(() => Array.from({ length: TOTAL_CARDS }, (_, i) => i), []);
  const total = cards.length;
  const verticalCurve = 110;
  const totalArcDeg = 64;

  useEffect(() => {
    function measure() {
      const viewport = viewportRef.current;
      const fan = fanRef.current;
      if (!viewport || !fan) return;

      const nextMaxPan = Math.max(0, fan.scrollWidth - viewport.clientWidth);
      setMaxPanX(nextMaxPan);
      setPanX(nextMaxPan / 2);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || maxPanX <= 0) return;

    const rect = viewport.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const easedRatio = Math.min(1, Math.max(0, ratio));
    setPanX(easedRatio * maxPanX);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 px-6">
        <p className="max-w-xl text-center text-[15px] leading-7 text-[var(--ink-soft)]">
          78 张牌摊开成一道弧 — 凭直觉点击其中{" "}
          <span className="font-serif-display text-[18px] text-[var(--coral-deep)]">{cardCount}</span> 张。
        </p>
        <p className="text-[12.5px] text-[var(--ink-muted)]">被选中的牌会浮起并散发光芒。</p>
      </div>

      <div
        ref={viewportRef}
        className="relative w-full overflow-hidden pb-8 pt-4"
        onPointerMove={handlePointerMove}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-[var(--surface-raised)] via-[var(--surface-raised)]/60 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-[var(--surface-raised)] via-[var(--surface-raised)]/60 to-transparent"
        />
        <div
          ref={fanRef}
          className="relative flex h-[310px] w-max items-end justify-center px-32 pb-8 will-change-transform"
          style={{
            transform: `translateX(${-panX}px)`,
            transition: "transform 180ms ease-out",
          }}
        >
          {cards.map((cardIndex) => {
            const t = cardIndex / (total - 1) - 0.5;
            const angle = t * totalArcDeg;
            const lift = -Math.cos(t * Math.PI) * verticalCurve;
            const isPicked = picks.includes(cardIndex);
            const pickOrder = picks.indexOf(cardIndex);

            return (
              <button
                type="button"
                key={cardIndex}
                onClick={() => togglePick(cardIndex)}
                className="group relative shrink-0"
                style={{
                  marginLeft: cardIndex === 0 ? 0 : -68,
                  zIndex: isPicked ? 400 + pickOrder : cardIndex,
                  transform: `translateY(${lift}px) rotate(${angle}deg)`,
                  transformOrigin: "50% 110%",
                  transition: "transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                <motion.div
                  className="relative h-[160px] w-[96px] overflow-visible rounded-[12px]"
                  animate={{ 
                    y: isPicked ? -48 : 0, 
                    scale: isPicked ? 1.08 : 1,
                  }}
                  whileHover={{
                    y: isPicked ? -56 : -20,
                    scale: isPicked ? 1.12 : 1.05,
                    rotate: isPicked ? 0 : (angle * 0.1),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-[12px] border transition-all duration-300",
                      isPicked
                        ? "border-[var(--coral)] shadow-[0_12px_30px_rgba(200,90,60,0.3),0_0_15px_rgba(200,90,60,0.1)]"
                        : "border-[var(--line-strong)] group-hover:border-[var(--coral-edge)] group-hover:shadow-[0_4px_16px_rgba(74,59,50,0.12)]",
                    )}
                  >
                    <CardBack className="rounded-[12px]" />
                    {isPicked && (
                      <motion.div 
                        layoutId={`halo-${cardIndex}`}
                        className="absolute -inset-1.5 rounded-[14px] border border-[var(--coral-soft)] opacity-30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                      />
                    )}
                  </div>
                  {isPicked ? (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-4 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[var(--surface-tint)] bg-[var(--coral)] font-mono text-[11px] font-bold text-white shadow-lg"
                    >
                      {pickOrder + 1}
                    </motion.div>
                  ) : null}
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink-faint)]">
        <span className="w-8 h-px bg-[var(--line)]" />
        <span>左右移动移动鼠标浏览</span>
        <span className="w-8 h-px bg-[var(--line)]" />
      </div>

      <div className="mt-2 flex flex-col items-center gap-6">
        <PickProgress picks={picks.length} total={cardCount} />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-[13px]"
            onClick={() => {
              triggerHaptic(6);
              setPicks([]);
            }}
            disabled={picks.length === 0}
          >
            清空已选
          </Button>
          <Button
            className="px-10 py-6 text-[15px]"
            onClick={() => {
              triggerHaptic([10, 20, 14]);
              onDone(picks);
            }}
            disabled={picks.length !== cardCount}
          >
            翻开 {cardCount} 张牌
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Pile picker ---------------- */

function PilePicker({
  cardCount,
  onDone,
}: {
  cardCount: number;
  onDone: (indices: number[]) => void;
}) {
  const [chosenPile, setChosenPile] = useState<number | null>(null);
  const piles = [
    { label: "左 · 你", offset: -1, range: [0, 26] },
    { label: "中 · 情境", offset: 0, range: [26, 52] },
    { label: "右 · 对方／环境", offset: 1, range: [52, 78] },
  ];

  function confirm() {
    if (chosenPile === null) return;
    triggerHaptic([10, 20, 14]);
    const range = piles[chosenPile].range;
    const indices: number[] = [];
    for (let i = 0; i < cardCount; i += 1) {
      indices.push(range[0] + i);
    }
    onDone(indices);
  }

  return (
    <div className="flex flex-col items-center gap-9 py-4">
      <div className="flex flex-col items-center gap-2">
        <p className="max-w-xl text-center text-[15px] leading-7 text-[var(--ink-soft)]">
          牌堆已分作三叠 — 不要思考，凭第一感觉选一叠。
        </p>
        <p className="text-[12.5px] text-[var(--ink-muted)]">我会从那叠由上往下抽出 {cardCount} 张。</p>
      </div>

      <div className="flex items-center justify-center gap-12">
        {piles.map((pile, index) => {
          const isChosen = chosenPile === index;
          return (
            <motion.button
              type="button"
              key={pile.label}
              onClick={() => {
                triggerHaptic(12);
                setChosenPile(index);
              }}
              className="group relative flex flex-col items-center gap-4"
              whileHover={{ y: -6 }}
              animate={{ y: isChosen ? -12 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div
                className={cn(
                  "relative h-[190px] w-[126px] rounded-[14px] transition-all duration-300",
                  isChosen
                    ? "drop-shadow-[0_12px_32px_rgba(200,90,60,0.35)]"
                    : "drop-shadow-[0_6px_16px_rgba(74,59,50,0.12)]",
                )}
              >
                {[0, 1, 2, 3, 4].map((layer) => (
                  <div
                    key={layer}
                    className={cn(
                      "absolute h-full w-full rounded-[14px] border transition-colors duration-300",
                      isChosen
                        ? "border-[var(--coral)]"
                        : "border-[var(--line-strong)] group-hover:border-[var(--coral-edge)]",
                    )}
                    style={{
                      transform: `translate(${layer * 1.5}px, ${-layer * 1.5}px)`,
                      zIndex: layer,
                    }}
                  >
                    <CardBack className="rounded-[14px]" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "font-mono text-[11px] tracking-[0.2em] uppercase transition-colors duration-300",
                    isChosen ? "text-[var(--coral-deep)] font-bold" : "text-[var(--ink-soft)]",
                  )}
                >
                  {pile.label}
                </span>
                <span className="h-0.5 w-0 bg-[var(--coral)] transition-all duration-300" style={{ width: isChosen ? '100%' : '0%' }} />
              </div>
              
              {isChosen ? (
                <motion.span 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-[var(--coral-edge)] bg-[var(--surface-tint)] px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--coral-deep)] shadow-sm"
                >
                  Chosen
                </motion.span>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <Button 
        className="px-12 py-6 text-[15px]"
        onClick={confirm} 
        disabled={chosenPile === null}
      >
        从这叠抽 {cardCount} 张牌
      </Button>
    </div>
  );
}

/* ---------------- Number picker ---------------- */

function NumberPicker({
  cardCount,
  onDone,
}: {
  cardCount: number;
  onDone: (indices: number[]) => void;
}) {
  const [value, setValue] = useState<number>(Math.floor(TOTAL_CARDS / 2));

  function confirm() {
    triggerHaptic([10, 20, 14]);
    const indices: number[] = [];
    const start = Math.max(0, Math.min(TOTAL_CARDS - cardCount, value - 1));
    for (let i = 0; i < cardCount; i += 1) {
      indices.push((start + i) % TOTAL_CARDS);
    }
    onDone(indices);
  }

  return (
    <div className="flex flex-col items-center gap-10 py-6">
      <div className="flex flex-col items-center gap-2">
        <p className="max-w-xl text-center text-[15px] leading-7 text-[var(--ink-soft)]">
          在心里默念问题，捕获第一个浮现的数字。
        </p>
        <p className="text-[12.5px] text-[var(--ink-muted)]">1 到 78 之间，不需要任何解释。</p>
      </div>

      <div className="flex items-center gap-8">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic(8);
            setValue((v) => Math.max(1, v - 1));
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-soft)] transition-all hover:border-[var(--coral)] hover:bg-[var(--coral-wash)] hover:text-[var(--coral-deep)]"
        >
          <svg viewBox="0 0 16 16" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8 L13 8" strokeLinecap="round" />
          </svg>
        </motion.button>

        <div className="relative group">
          <div className="absolute -inset-4 rounded-[24px] bg-[var(--coral-wash)] opacity-50 blur-xl transition-opacity group-hover:opacity-100" />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-[24px] border-2 border-[var(--coral-edge)] bg-[var(--surface-tint)] shadow-[0_8px_24px_rgba(168,85,62,0.12)]">
            <span className="font-serif-display text-[72px] leading-none text-[var(--coral-deep)]">
              {value}
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic(8);
            setValue((v) => Math.min(TOTAL_CARDS, v + 1));
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-soft)] transition-all hover:border-[var(--coral)] hover:bg-[var(--coral-wash)] hover:text-[var(--coral-deep)]"
        >
          <svg viewBox="0 0 16 16" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3 L8 13 M3 8 L13 8" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>

      <div className="w-full max-w-md px-4">
        <input
          type="range"
          min={1}
          max={TOTAL_CARDS}
          value={value}
          onChange={(event) => {
            triggerHaptic(4);
            setValue(Number(event.target.value));
          }}
          className="w-full h-1.5 appearance-none rounded-full bg-[var(--line-strong)] accent-[var(--coral)] cursor-pointer"
        />
        <div className="mt-3 flex justify-between font-mono text-[10px] tracking-[0.2em] text-[var(--ink-faint)] uppercase">
          <span>01</span>
          <span>78</span>
        </div>
      </div>

      <Button 
        className="px-12 py-6 text-[15px]"
        onClick={confirm}
      >
        从第 {value} 张起，抽 {cardCount} 张牌
      </Button>
    </div>
  );
}


function PickProgress({ picks, total }: { picks: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 w-6 rounded-full transition-all",
            index < picks ? "bg-[var(--coral)]" : "bg-[var(--line-strong)]",
          )}
        />
      ))}
      <span className="ml-3 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-soft)]">
        {picks} / {total}
      </span>
    </div>
  );
}

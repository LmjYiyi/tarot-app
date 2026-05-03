"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";

import { CardBack } from "@/components/DeckShuffle";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const TOTAL_CARDS = 78;

function pickUniqueDeckIndices(count: number) {
  const indices = Array.from({ length: TOTAL_CARDS }, (_, index) => index);

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, Math.min(count, TOTAL_CARDS)).sort((a, b) => a - b);
}

function resolveUniqueNumberIndices(values: number[]) {
  const used = new Set<number>();

  return values.map((value) => {
    let index = Math.max(0, Math.min(TOTAL_CARDS - 1, value - 1));

    while (used.has(index)) {
      index = (index + 1) % TOTAL_CARDS;
    }

    used.add(index);
    return index;
  });
}

export type RitualPhase =
  | "idle"
  | "shuffling"
  | "cutting"
  | "selecting"
  | "revealing"
  | "revealed";

export type SelectMode = "focus" | "fan" | "piles" | "number";

type InteractiveDeckProps = {
  phase: RitualPhase;
  cardCount: number;
  selectMode: SelectMode;
  cutPosition?: number | null;
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
  cutPosition = null,
  shufflePreviewCards = [],
  onModeChange,
  onShuffleDone,
  onCutDone,
  onSelectionDone,
  shuffleDurationMs = 4200,
}: InteractiveDeckProps) {
  const phaseAnnouncement = getPhaseAnnouncement(phase, cardCount);

  return (
    <div className="relative w-full">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {phaseAnnouncement}
      </div>
      <AnimatePresence mode="wait">
        {phase === "idle" || phase === "shuffling" ? (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0, y: 10, rotateX: -8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, rotateX: 8, filter: "blur(5px)" }}
            transition={{ duration: 0.5, ease: [0.22, 0.65, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d" }}
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
            initial={{ opacity: 0, y: 14, rotateX: -7, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, rotateX: 7, filter: "blur(5px)" }}
            transition={{ duration: 0.5, ease: [0.22, 0.65, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <CutStage onCutDone={onCutDone} />
          </motion.div>
        ) : null}

        {phase === "selecting" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 14, scale: 0.985, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, scale: 0.99, filter: "blur(5px)" }}
            transition={{ duration: 0.5, ease: [0.22, 0.65, 0.2, 1] }}
          >
            <SelectStage
              cardCount={cardCount}
              mode={selectMode}
              cutPosition={cutPosition}
              onModeChange={onModeChange}
              onSelectionDone={onSelectionDone}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ShufflePile({
  side,
  active,
  closing,
  reduceMotion,
  cards,
  faceCards,
}: {
  side: "left" | "right";
  active: boolean;
  closing: boolean;
  reduceMotion: boolean;
  cards: ShufflePreviewCard[];
  faceCards: ShufflePreviewCard[];
}) {
  const direction = side === "left" ? -1 : 1;
  const restX = `calc(${direction} * clamp(76px, 22vw, 140px))`;
  const closeX = `calc(${direction} * clamp(10px, 3vw, 18px))`;
  const closeDuration = reduceMotion ? 0.2 : SHUFFLE_CLOSE_MS / 1000;
  const showFace = active && !closing && !reduceMotion;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        "--shuffle-card-w": "clamp(132px, 34vw, 180px)",
        width: "var(--shuffle-card-w)",
        height: "calc(var(--shuffle-card-w) * 1.6667)",
        marginLeft: "calc(var(--shuffle-card-w) * -0.5)",
        marginTop: "calc(var(--shuffle-card-w) * -0.83335)",
        transformStyle: "preserve-3d",
      } as CSSProperties}
      animate={
        closing
          ? { x: closeX, y: 0, rotate: direction * 1.5, opacity: 0 }
          : { x: restX, y: 0, rotate: direction * 3.5, opacity: 1 }
      }
      transition={{ duration: closing ? closeDuration : 0.7, ease: "easeInOut" }}
    >
      {cards.map((_, index) => {
        const lift = -index * 3;
        const offsetX = direction * index * 4;
        const offsetY = index * 2;

        return (
          <div
            key={`${side}-${index}`}
            className="absolute inset-0 will-change-transform"
            style={{
              transformStyle: "preserve-3d",
              transform: `translate(${offsetX}px, ${offsetY + lift}px) rotate(${direction * index * 0.7}deg)`,
              zIndex: SHUFFLE_PILE_SIZE - index,
            }}
          >
            <CardBack />
          </div>
        );
      })}

      {faceCards.map((faceCard, index) => {
        const depth = index / Math.max(1, faceCards.length - 1);

        return (
          <div
            key={`${side}-${faceCard.imageUrl}-${index}`}
            className="absolute inset-0 overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.62)] bg-[var(--surface)] shadow-[0_10px_26px_rgba(26,26,25,0.16)] transition-opacity duration-500"
            style={{
              opacity: showFace ? 1 - depth * 0.3 : 0,
              transform: `translate(${direction * (5 + index * 8)}px, ${-6 - index * 7}px) rotate(${direction * (0.8 + index * 1.4)}deg) scale(${1 - index * 0.035})`,
              zIndex: SHUFFLE_PILE_SIZE + 2 + (faceCards.length - index),
            }}
          >
            <Image
              src={faceCard.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 132px, 180px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,transparent_50%,rgba(26,26,25,0.18)_100%)]" />
          </div>
        );
      })}
    </motion.div>
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
    <div className="flex w-full min-h-[400px] flex-col items-center justify-between py-5 sm:min-h-[460px] lg:py-8">
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
        <div className="ritual-note min-h-[2.5rem]">
          {helper}
        </div>
      </div>

      <div className="flex flex-1 w-full items-center justify-center my-2">
        {children}
      </div>

      {action ? (
        <div className="bottom-action-safe flex w-full min-h-[48px] shrink-0 flex-col items-center justify-center px-4">
          {action}
        </div>
      ) : null}
    </div>
  );
}

/* ============================================================
   Shuffle stage — riffle shuffle on an etched compass dial
   ============================================================ */

const SHUFFLE_CYCLE_SEC = 2.8;
const SHUFFLE_CLOSE_MS = 560;
const SHUFFLE_PILE_SIZE = 5;
const SHUFFLE_FACE_COUNT = 3;
const SHUFFLE_FACE_INTERVAL_MS = 720;

function pickRandomPreviewCards(cards: ShufflePreviewCard[], count: number) {
  if (cards.length <= count) return cards;

  const picked = new Set<number>();
  while (picked.size < count) {
    picked.add(Math.floor(Math.random() * cards.length));
  }

  return Array.from(picked).map((index) => cards[index]);
}

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
  const [closing, setClosing] = useState(false);
  const [manualActive, setManualActive] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const finishTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
    };
  }, [active]);

  function startManualShuffle() {
    if (!active || closing) return;
    triggerHaptic(10);
    setManualActive(true);
    setCanFinish(false);
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = window.setTimeout(() => {
      setCanFinish(true);
      triggerHaptic([6, 14, 6]);
    }, Math.min(durationMs, 2200));
  }

  function finishManualShuffle() {
    if (!active || closing || !manualActive || !canFinish) return;
    triggerHaptic([10, 20, 14]);
    setClosing(true);
    window.setTimeout(() => {
      onDone();
    }, SHUFFLE_CLOSE_MS);
  }

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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
          />
        )
      }
    >
      <div className="flex w-full min-h-[340px] flex-col items-center justify-center sm:min-h-[520px]">
        <div className="mb-4 flex flex-col items-center gap-2 sm:mb-8">
          <p className={cn(
            "text-center text-[13px] font-medium tracking-wider transition-all duration-300",
            manualActive ? "text-[var(--coral)]" : "text-[var(--ink-muted)]"
          )}>
            {manualActive 
              ? (canFinish ? "✨ 差不多了，松开手！" : "🧘 能量交换中，再按一会儿...") 
              : "👉 长按牌堆，把念头揉进牌里"}
          </p>
          {manualActive && !canFinish && (
            <div className="h-0.5 w-12 overflow-hidden rounded-full bg-[var(--coral-wash)]">
              <motion.div 
                className="h-full bg-[var(--coral)]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: Math.min(durationMs, 2200) / 1000, ease: "linear" }}
              />
            </div>
          )}
        </div>
        
        <div
          className="w-full flex justify-center touch-none cursor-pointer active:scale-[0.99] transition-transform"
          onPointerDown={startManualShuffle}
          onPointerUp={finishManualShuffle}
          onPointerCancel={() => setManualActive(false)}
          onPointerLeave={() => {
            if (!canFinish) setManualActive(false);
          }}
        >
          <ShuffleAura
            active={active && manualActive}
            closing={closing}
            reduceMotion={reduceMotion}
            previewCards={previewCards}
          />
        </div>
      </div>
    </StageLayout>
  );
}

function ShuffleAura({
  active,
  closing,
  reduceMotion,
  previewCards,
}: {
  active: boolean;
  closing: boolean;
  reduceMotion: boolean;
  previewCards: ShufflePreviewCard[];
}) {
  const visiblePreviewCards = useMemo(
    () => (previewCards.length > 0 ? previewCards : FALLBACK_PREVIEW_CARDS),
    [previewCards],
  );
  const [faceCards, setFaceCards] = useState(() => ({
    left: pickRandomPreviewCards(FALLBACK_PREVIEW_CARDS, SHUFFLE_FACE_COUNT),
    right: pickRandomPreviewCards(FALLBACK_PREVIEW_CARDS, SHUFFLE_FACE_COUNT),
  }));

  useEffect(() => {
    if (!active || reduceMotion) return;

    const updateFaces = () => {
      setFaceCards({
        left: pickRandomPreviewCards(visiblePreviewCards, SHUFFLE_FACE_COUNT),
        right: pickRandomPreviewCards(visiblePreviewCards, SHUFFLE_FACE_COUNT),
      });
    };

    updateFaces();
    const interval = window.setInterval(() => {
      updateFaces();
    }, SHUFFLE_FACE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [active, reduceMotion, visiblePreviewCards]);

  function getPreviewCard(index: number) {
    return visiblePreviewCards[index % visiblePreviewCards.length];
  }

  return (
    <div
      aria-hidden="true"
      className="relative flex h-[310px] w-full max-w-[860px] items-center justify-center overflow-visible sm:h-[520px]"
      style={{ perspective: "1800px" }}
    >
      {/* compass dial — a slowly turning hairline ring with tick marks */}
      <motion.div
        className="absolute h-[270px] w-[270px] rounded-full sm:h-[440px] sm:w-[440px]"
        animate={active && !reduceMotion ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          duration: 90,
          ease: "linear",
          repeat: active && !reduceMotion ? Infinity : 0,
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
          active && !reduceMotion
            ? {
                opacity: [0.25, 0.7, 0.25],
                scaleX: [0.75, 1.05, 0.75],
              }
            : { opacity: 0.2, scaleX: 0.75 }
        }
        transition={{
          duration: SHUFFLE_CYCLE_SEC,
          repeat: active && !reduceMotion ? Infinity : 0,
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
          active && !reduceMotion
            ? { opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.1, 0.95] }
            : { opacity: 0.35, scale: 1 }
        }
        transition={{
          duration: SHUFFLE_CYCLE_SEC,
          repeat: active && !reduceMotion ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* card stack — riffle */}
      <div
        className="relative h-[290px] w-[min(92vw,680px)] sm:h-[460px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <ShufflePile
          side="left"
          active={active}
          closing={closing}
          reduceMotion={reduceMotion}
          cards={Array.from({ length: SHUFFLE_PILE_SIZE }).map((_, index) =>
            getPreviewCard(index * 5),
          )}
          faceCards={faceCards.left}
        />
        <ShufflePile
          side="right"
          active={active}
          closing={closing}
          reduceMotion={reduceMotion}
          cards={Array.from({ length: SHUFFLE_PILE_SIZE }).map((_, index) =>
            getPreviewCard(index * 5 + 2),
          )}
          faceCards={faceCards.right}
        />

        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            "--shuffle-card-w": "clamp(132px, 34vw, 180px)",
            width: "var(--shuffle-card-w)",
            height: "calc(var(--shuffle-card-w) * 1.6667)",
            marginLeft: "calc(var(--shuffle-card-w) * -0.5)",
            marginTop: "calc(var(--shuffle-card-w) * -0.83335)",
            transformStyle: "preserve-3d",
          } as CSSProperties}
          animate={
            closing
              ? { opacity: 1, scale: 1, y: 0, rotate: 0 }
              : { opacity: 0, scale: 0.94, y: 18, rotate: 0 }
          }
          transition={{
            duration: reduceMotion ? 0.2 : SHUFFLE_CLOSE_MS / 1000,
            ease: [0.22, 0.65, 0.2, 1],
          }}
        >
          {[0, 1, 2].map((layer) => (
            <div
              key={layer}
              className="absolute inset-0 rounded-[12px]"
              style={{
                transform: `translate(${layer * 1.5}px, ${-layer * 1.5}px)`,
                zIndex: layer,
              }}
            >
              <CardBack />
            </div>
          ))}
        </motion.div>
      </div>

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

/* ============================================================
   Cut stage
   ============================================================ */

function CutStage({ onCutDone }: { onCutDone: (cutPosition: number) => void }) {
  const [position, setPosition] = useState(0.5);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; moved: boolean } | null>(null);
  const lastHapticStepRef = useRef<number | null>(null);

  const resolvePositionFromClientX = useCallback((clientX: number) => {
    if (!trackRef.current) return position;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.min(0.92, Math.max(0.08, ratio));
  }, [position]);

  const commitCut = useCallback((nextPosition = position) => {
    triggerHaptic([10, 20, 14]);
    onCutDone(nextPosition);
  }, [onCutDone, position]);

  useEffect(() => {
    if (!dragging) return;

    function handleMove(event: MouseEvent | TouchEvent) {
      const clientX =
        "touches" in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
      if (
        dragStartRef.current &&
        Math.abs(clientX - dragStartRef.current.x) > 8
      ) {
        dragStartRef.current.moved = true;
      }
      const nextPosition = resolvePositionFromClientX(clientX);
      const hapticStep = Math.round(nextPosition * 12);
      if (hapticStep !== lastHapticStepRef.current) {
        lastHapticStepRef.current = hapticStep;
        triggerHaptic(4);
      }
      setPosition(nextPosition);
    }

    function handleUp(event: MouseEvent | TouchEvent) {
      const clientX =
        "changedTouches" in event ? event.changedTouches[0]?.clientX ?? 0 : event.clientX;
      const nextPosition = resolvePositionFromClientX(clientX);
      setDragging(false);
      lastHapticStepRef.current = null;
      if (dragStartRef.current && !dragStartRef.current.moved) {
        commitCut(nextPosition);
      }
      dragStartRef.current = null;
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
  }, [commitCut, dragging, resolvePositionFromClientX]);

  return (
    <StageLayout
      label="Cut · 切牌"
      helper={
        <>
          选择一个切口：系统会从这里把牌堆一分为二，并重新接回。
          <br />
          切口之后的牌会被移到最前面，再进入抽牌。
        </>
      }
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
            onClick={() => commitCut(position)}
          >
            确认切牌
          </Button>
        </div>
      }
    >
      <div
        ref={trackRef}
        className="relative h-48 w-full max-w-2xl select-none"
        onMouseDown={(event) => {
          triggerHaptic(8);
          const nextPosition = resolvePositionFromClientX(event.clientX);
          setPosition(nextPosition);
          dragStartRef.current = { x: event.clientX, moved: false };
          setDragging(true);
        }}
        onTouchStart={(event) => {
          triggerHaptic(8);
          const clientX = event.touches[0]?.clientX ?? 0;
          const nextPosition = resolvePositionFromClientX(clientX);
          setPosition(nextPosition);
          dragStartRef.current = { x: clientX, moved: false };
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
               style={{ "--x": `${position * 100}%` } as CSSProperties} />
          
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
  cutPosition,
  onModeChange,
  onSelectionDone,
}: {
  cardCount: number;
  mode: SelectMode;
  cutPosition: number | null;
  onModeChange: (mode: SelectMode) => void;
  onSelectionDone: (indices: number[]) => void;
}) {
  const isSingle = cardCount <= 1;
  const [showAlternates, setShowAlternates] = useState(false);

  // For single-card spreads, the spread itself decides the mode — no UI choice.
  const alternates: Array<{ value: SelectMode; label: string; helper: string }> = isSingle
    ? []
    : [
        { value: "fan", label: "扇形挑牌", helper: "把整副牌摊成弧形，凭直觉点中一张" },
        { value: "piles", label: "三叠选一", helper: "牌堆分作三叠，先选叠再翻牌" },
        { value: "number", label: "心象数字", helper: "默念问题，捕获浮现的数字" },
      ];

  return (
    <div className="flex flex-col gap-8 pb-2">
      <AnimatePresence mode="wait">
        {mode === "focus" ? (
          <motion.div
            key="focus"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <FocusPicker onDone={onSelectionDone} />
          </motion.div>
        ) : null}
        {mode === "fan" ? (
          <motion.div
            key="fan"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <FanPicker cardCount={cardCount} cutPosition={cutPosition} onDone={onSelectionDone} />
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
            <PilePicker cardCount={cardCount} cutPosition={cutPosition} onDone={onSelectionDone} />
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
            <NumberPicker cardCount={cardCount} cutPosition={cutPosition} onDone={onSelectionDone} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {alternates.length > 0 ? (
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowAlternates((value) => !value)}
            aria-expanded={showAlternates}
            className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-muted)] underline-offset-[6px] decoration-[var(--line-strong)] transition hover:text-[var(--coral-deep)] hover:decoration-[var(--coral)] hover:underline"
          >
            {showAlternates ? "收起" : "更多抽牌方式"}
          </button>
          {showAlternates ? (
            <ul className="grid w-full max-w-2xl gap-px overflow-hidden border-y border-[var(--line)] sm:grid-cols-3">
              {alternates.map((option) => {
                const active = option.value === mode;
                return (
                  <li key={option.value} className="bg-[var(--surface)]/40">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        onModeChange(option.value);
                      }}
                      className={cn(
                        "flex h-full w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors",
                        active
                          ? "bg-[var(--coral-wash)] text-[var(--coral-deep)]"
                          : "text-[var(--ink-soft)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]",
                      )}
                    >
                      <span className="text-[13.5px] font-medium tracking-[0.02em]">
                        {option.label}
                      </span>
                      <span className="text-[11.5px] leading-5 text-[var(--ink-muted)]">
                        {option.helper}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RitualPrompt({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="ritual-note mx-auto">
      <p className="ritual-note-main">{children}</p>
      {detail ? <p className="ritual-note-detail">{detail}</p> : null}
    </div>
  );
}

function getPhaseAnnouncement(phase: RitualPhase, cardCount: number) {
  switch (phase) {
    case "shuffling":
      return "洗牌开始。请长按牌堆，把问题放进牌里。";
    case "cutting":
      return "洗牌完成。现在进入切牌阶段。";
    case "selecting":
      return `切牌完成。现在请选择 ${cardCount} 张牌。`;
    case "revealing":
      return "选牌完成。正在翻开牌面。";
    case "revealed":
      return "牌面已经翻开，可以查看解读。";
    default:
      return "抽牌仪式尚未开始。";
  }
}

function syncPointerGlow(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  event.currentTarget.style.setProperty("--card-glow-x", `${Math.min(100, Math.max(0, x))}%`);
  event.currentTarget.style.setProperty("--card-glow-y", `${Math.min(100, Math.max(0, y))}%`);
}

function CutTrace({ cutPosition }: { cutPosition: number | null }) {
  if (cutPosition === null) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2 px-5">
      <div className="relative h-7 w-full">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--line-strong)] to-transparent" />
        <motion.div
          className="absolute top-1/2 h-7 w-px -translate-y-1/2 bg-[var(--coral)] shadow-[0_0_18px_rgba(200,90,60,0.36)]"
          style={{ left: `${cutPosition * 100}%` }}
          initial={{ scaleY: 0.4, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.36 }}
        >
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[var(--coral)] bg-[var(--surface-tint)]" />
        </motion.div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
        切口保留在第 {Math.round(cutPosition * TOTAL_CARDS)} 张附近
      </p>
    </div>
  );
}

/* ---------------- Focus picker (single-card draw) ---------------- */

const FOCUS_VISIBLE = 21;

function FocusPicker({ onDone }: { onDone: (indices: number[]) => void }) {
  const [offsets, setOffsets] = useState(() => pickUniqueDeckIndices(FOCUS_VISIBLE));
  const [refreshVersion, setRefreshVersion] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const [pickedSlot, setPickedSlot] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  function refreshOptions() {
    if (pickedSlot !== null) return;
    triggerHaptic(8);
    setOffsets(pickUniqueDeckIndices(FOCUS_VISIBLE));
    setRefreshVersion((version) => version + 1);
  }

  function handlePick(slotIndex: number) {
    if (pickedSlot !== null) return;
    triggerHaptic([12, 28, 18]);
    setPickedSlot(slotIndex);
    window.setTimeout(() => {
      onDone([offsets[slotIndex]]);
    }, 520);
  }

  return (
    <div className="flex flex-col items-center gap-9 py-4">
      <div className="px-6 text-center">
        <RitualPrompt detail="哪一张在召唤你，直接点它。">
          深呼吸三次。让目光在牌上停留。
        </RitualPrompt>
      </div>

      <div className="grid w-full max-w-[360px] grid-cols-7 gap-2 px-3 sm:hidden">
        {offsets.map((deckIndex, slotIndex) => {
          const isPicked = pickedSlot === slotIndex;
          const someoneElsePicked = pickedSlot !== null && !isPicked;
          const cardTilt = ((deckIndex % 7) - 3) * 0.8;
          const cardLift = (deckIndex % 5) * -1;

          return (
            <motion.button
              type="button"
              key={`mobile-${refreshVersion}-${deckIndex}`}
              onClick={() => handlePick(slotIndex)}
              className="group/card relative aspect-[2/3.5] min-h-[74px] rounded-[9px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
              initial={{ opacity: 0, y: 12, rotate: cardTilt * 1.8 }}
              animate={{
                opacity: someoneElsePicked ? 0.22 : 1,
                y: isPicked ? -12 : cardLift,
                rotate: cardTilt,
                scale: isPicked ? 1.08 : 1,
              }}
              transition={{
                delay: Math.min(slotIndex * 0.018, 0.22),
                type: "spring",
                stiffness: 240,
                damping: 24,
              }}
              whileTap={{ scale: 0.96 }}
              aria-label={`抽出第 ${slotIndex + 1} 张可选牌`}
            >
              <CardBack className="rounded-[9px]" compact />
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-[9px] border transition",
                  isPicked
                    ? "border-[var(--coral)] shadow-[0_10px_24px_rgba(200,90,60,0.24)]"
                    : "border-[var(--line-strong)] group-hover/card:border-[var(--coral-edge)]",
                )}
              />
            </motion.button>
          );
        })}
      </div>

      <div
        className="relative hidden h-[300px] w-full max-w-[820px] items-end justify-center sm:flex sm:h-[340px]"
        style={{ perspective: "1200px" }}
      >
        {offsets.map((deckIndex, slotIndex) => {
          const t = slotIndex / (FOCUS_VISIBLE - 1) - 0.5;
          const angle = t * 30 + ((deckIndex % 5) - 2) * 0.7;
          const lift = -Math.cos(t * Math.PI) * 34;
          const isPicked = pickedSlot === slotIndex;
          const someoneElsePicked = pickedSlot !== null && !isPicked;
          const isHovered = hovered === slotIndex;

          return (
            <motion.button
              type="button"
              key={`desktop-${refreshVersion}-${deckIndex}`}
              onClick={() => handlePick(slotIndex)}
              onPointerEnter={() => setHovered(slotIndex)}
              onPointerMove={syncPointerGlow}
              onPointerLeave={() => setHovered((current) => (current === slotIndex ? null : current))}
              onFocus={() => setHovered(slotIndex)}
              onBlur={() => setHovered((current) => (current === slotIndex ? null : current))}
              className="group/card absolute bottom-6 origin-bottom focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface)]"
              style={{
                "--card-glow-x": "50%",
                "--card-glow-y": "22%",
                left: `calc(50% + ${t * 620}px)`,
                transform: `translateX(-50%) rotate(${angle}deg)`,
                zIndex: isPicked ? 50 : isHovered ? 40 : 10 + slotIndex,
              } as CSSProperties}
              animate={{
                y: isPicked ? -90 : someoneElsePicked ? lift + 6 : lift,
                opacity: someoneElsePicked ? 0.16 : 1,
                scale: isPicked ? 1.1 : isHovered ? 1.04 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 26,
              }}
              whileTap={{ scale: 0.97 }}
              aria-label={`抽出第 ${slotIndex + 1} 张可选牌`}
            >
              <motion.div
                className="relative h-[142px] w-[86px] sm:h-[164px] sm:w-[98px]"
                animate={
                  reduceMotion || pickedSlot !== null
                    ? { y: 0 }
                    : {
                        y: [0, -3, 0],
                      }
                }
                transition={{
                  duration: 3.2 + slotIndex * 0.14,
                  repeat: reduceMotion || pickedSlot !== null ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: slotIndex * 0.18,
                }}
              >
                <div
                  className={cn(
                    "ritual-card-surface absolute inset-0 rounded-[14px] transition-shadow duration-300",
                    isPicked
                      ? "shadow-[0_24px_60px_rgba(200,90,60,0.32)]"
                      : isHovered
                        ? "shadow-[0_18px_40px_rgba(74,59,50,0.18)]"
                        : "shadow-[0_10px_28px_rgba(74,59,50,0.10)]",
                  )}
                >
                  <CardBack className="rounded-[14px]" />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-[1px] rounded-[13px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle at var(--card-glow-x,50%) var(--card-glow-y,22%), rgba(255,248,224,0.38), rgba(255,248,224,0.08) 28%, transparent 58%)",
                    }}
                  />
                </div>
                {isHovered && pickedSlot === null ? (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute -inset-3 rounded-[18px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(200,90,60,0.22), transparent)",
                    }}
                  />
                ) : null}
              </motion.div>
            </motion.button>
          );
        })}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 bottom-3 h-px bg-gradient-to-r from-transparent via-[var(--line-strong)] to-transparent"
        />
      </div>

      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <Button
          variant="secondary"
          className="px-5 py-2.5 text-[13px]"
          onClick={refreshOptions}
          disabled={pickedSlot !== null}
        >
          {"换一组"}
        </Button>
        <p className="max-w-[260px] font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          {pickedSlot !== null ? "正在翻开" : "相信目光反复回到的那一张"}
        </p>
      </div>
    </div>
  );
}

/* ---------------- Fan picker ---------------- */

function FanPicker({
  cardCount,
  cutPosition,
  onDone,
}: {
  cardCount: number;
  cutPosition: number | null;
  onDone: (indices: number[]) => void;
}) {
  const [picks, setPicks] = useState<number[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const fanRef = useRef<HTMLDivElement | null>(null);
  const [panX, setPanX] = useState(0);
  const [maxPanX, setMaxPanX] = useState(0);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ active: boolean; startX: number; startPan: number; moved: boolean }>({
    active: false,
    startX: 0,
    startPan: 0,
    moved: false,
  });

  function togglePick(index: number) {
    if (dragRef.current.moved) return;
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

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarsePointer(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  function clampPan(next: number) {
    if (maxPanX <= 0) return 0;
    return Math.min(maxPanX, Math.max(0, next));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    // On touch devices, only respond to drag gestures; ignore hover-style pan.
    if (isCoarsePointer) {
      if (!dragRef.current.active) return;
      const deltaX = event.clientX - dragRef.current.startX;
      if (Math.abs(deltaX) > 4) dragRef.current.moved = true;
      setPanX(clampPan(dragRef.current.startPan - deltaX));
      return;
    }

    if (dragRef.current.active) {
      const deltaX = event.clientX - dragRef.current.startX;
      if (Math.abs(deltaX) > 4) dragRef.current.moved = true;
      setPanX(clampPan(dragRef.current.startPan - deltaX));
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport || maxPanX <= 0) return;
    const rect = viewport.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const easedRatio = Math.min(1, Math.max(0, ratio));
    setPanX(easedRatio * maxPanX);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    setIsDragging(true);
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startPan: panX,
      moved: false,
    };
  }

  function handlePointerUp() {
    // Reset drag state, but keep `moved` flag briefly so click handler can read it.
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    setIsDragging(false);
    if (wasMoved) {
      window.setTimeout(() => {
        dragRef.current.moved = false;
      }, 60);
    } else {
      dragRef.current.moved = false;
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <CutTrace cutPosition={cutPosition} />

      <div className="px-6">
        <RitualPrompt
          detail={isCoarsePointer ? "横向滑动牌弧浏览，点击选定。" : "移动鼠标浏览，点击选定。"}
        >
          78 张牌摊开成一道弧 — 凭直觉点击其中{" "}
          <span className="font-serif-display text-[18px] text-[var(--coral-deep)]">{cardCount}</span> 张。
        </RitualPrompt>
      </div>

      <div
        ref={viewportRef}
        className="relative w-full touch-pan-y select-none overflow-hidden pb-8 pt-4"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          if (dragRef.current.active) handlePointerUp();
        }}
        style={{ cursor: isCoarsePointer ? "grab" : "default" }}
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
            transition: isDragging ? "none" : "transform 180ms ease-out",
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
                onPointerMove={syncPointerGlow}
                className="group/card relative shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface)]"
                style={{
                  "--card-glow-x": "50%",
                  "--card-glow-y": "24%",
                  marginLeft: cardIndex === 0 ? 0 : -68,
                  zIndex: isPicked ? 400 + pickOrder : cardIndex,
                  transform: `translateY(${lift}px) rotate(${angle}deg)`,
                  transformOrigin: "50% 110%",
                  transition: "transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                } as CSSProperties}
                aria-label={`选择牌弧中的第 ${cardIndex + 1} 张牌${isPicked ? `，已选为第 ${pickOrder + 1} 张` : ""}`}
                aria-pressed={isPicked}
              >
                <motion.div
                  className="ritual-card-surface relative h-[160px] w-[96px] overflow-visible rounded-[12px]"
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
                        : "border-[var(--line-strong)] group-hover/card:border-[var(--coral-edge)] group-hover/card:shadow-[0_4px_16px_rgba(74,59,50,0.12)]",
                    )}
                  >
                    <CardBack className="rounded-[12px]" />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-[1px] rounded-[11px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
                      style={{
                        background:
                          "radial-gradient(circle at var(--card-glow-x,50%) var(--card-glow-y,24%), rgba(255,248,224,0.38), rgba(255,248,224,0.08) 28%, transparent 58%)",
                      }}
                    />
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
        <span>{isCoarsePointer ? "Swipe to browse" : "Move to browse"}</span>
        <span className="w-8 h-px bg-[var(--line)]" />
      </div>

      <div className="bottom-action-safe mt-2 flex flex-col items-center gap-6">
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
  cutPosition,
  onDone,
}: {
  cardCount: number;
  cutPosition: number | null;
  onDone: (indices: number[]) => void;
}) {
  const [activePile, setActivePile] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const pileGroups = useMemo(
    () =>
      [
        { label: "\u5de6 / \u81ea\u6211" },
        { label: "\u4e2d / \u60c5\u5883" },
        { label: "\u53f3 / \u5916\u754c" },
      ].map((pile, index) => ({
        ...pile,
        cards: Array.from({ length: 26 }, (_, cardIndex) => index * 26 + cardIndex),
      })),
    [],
  );
  const selectedPile = pileGroups[activePile];

  function choosePile(index: number) {
    triggerHaptic(12);
    setActivePile(index);
  }

  function togglePick(index: number) {
    triggerHaptic(picks.includes(index) ? 8 : [10, 25, 12]);
    setPicks((current) => {
      if (current.includes(index)) {
        return current.filter((item) => item !== index);
      }
      if (current.length >= cardCount) return current;
      return [...current, index];
    });
  }

  function confirm() {
    if (picks.length !== cardCount) return;
    triggerHaptic([10, 20, 14]);
    onDone(picks);
  }

  return (
    <div className="flex flex-col items-center gap-9 py-4">
      <CutTrace cutPosition={cutPosition} />

      <div className="px-6 text-center">
        <RitualPrompt
          detail={
            <>
              当前展开：<span className="text-[var(--coral-deep)]">{selectedPile.label}</span>。
              点击顺序就是牌位顺序，已选的牌会保留。
            </>
          }
        >
          牌已分成三叠。你可以只从一叠里抽完，也可以在左、中、右之间切换，各取所感。
        </RitualPrompt>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        {pileGroups.map((pile, index) => {
          const isChosen = activePile === index;
          const selectedFromPile = pile.cards.filter((cardIndex) => picks.includes(cardIndex)).length;
          return (
            <motion.button
              type="button"
              key={pile.label}
              onClick={() => choosePile(index)}
              onPointerMove={syncPointerGlow}
              className="group/card relative flex flex-col items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface)]"
              style={{
                "--card-glow-x": "50%",
                "--card-glow-y": "24%",
              } as CSSProperties}
              aria-label={`选择${pile.label}牌叠`}
              aria-pressed={isChosen}
              whileHover={{ y: -6 }}
              animate={{
                y: isChosen ? -12 : 0,
                opacity: 1,
                scale: isChosen ? 1 : 0.96,
              }}
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
                        : "border-[var(--line-strong)] group-hover/card:border-[var(--coral-edge)]",
                    )}
                    style={{
                      transform: "translate(" + layer * 1.5 + "px, " + -layer * 1.5 + "px)",
                      zIndex: layer,
                    }}
                  >
                    <CardBack className="rounded-[14px]" />
                    {layer === 4 ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-[1px] rounded-[13px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
                        style={{
                          background:
                            "radial-gradient(circle at var(--card-glow-x,50%) var(--card-glow-y,24%), rgba(255,248,224,0.34), rgba(255,248,224,0.08) 30%, transparent 60%)",
                        }}
                      />
                    ) : null}
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
                <span
                  className="h-0.5 bg-[var(--coral)] transition-all duration-300"
                  style={{ width: isChosen ? "100%" : "0%" }}
                />
              </div>

              {isChosen ? (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-[var(--coral-edge)] bg-[var(--surface-tint)] px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--coral-deep)] shadow-sm"
                >
                  展开中
                </motion.span>
              ) : null}
              {selectedFromPile > 0 ? (
                <span className="absolute -right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-[var(--surface-tint)] bg-[var(--coral)] px-1.5 font-mono text-[10px] font-bold text-white shadow-lg">
                  {selectedFromPile}
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        <motion.div
          key={activePile}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="flex w-full max-w-4xl flex-col items-center gap-5"
        >
          <div className="grid w-full grid-cols-7 gap-2 px-2 sm:grid-cols-[repeat(13,minmax(0,1fr))] sm:gap-2.5">
            {selectedPile.cards.map((deckIndex, index) => {
              const pickOrder = picks.indexOf(deckIndex);
              const isPicked = pickOrder >= 0;
              const disabled = !isPicked && picks.length >= cardCount;

              return (
                <motion.button
                  type="button"
                  key={deckIndex}
                  onClick={() => togglePick(deckIndex)}
                  disabled={disabled}
                  aria-label={`从${selectedPile.label}牌叠中选择第 ${index + 1} 张牌${isPicked ? `，已选为第 ${pickOrder + 1} 张` : ""}`}
                  aria-pressed={isPicked}
                  className={cn(
                    "group/card relative aspect-[2/3.5] min-h-[68px] rounded-[8px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                    disabled ? "cursor-not-allowed opacity-35" : "cursor-pointer",
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: isPicked ? -10 : 0,
                    scale: isPicked ? 1.06 : 1,
                  }}
                  transition={{
                    delay: Math.min(index * 0.012, 0.18),
                    type: "spring",
                    stiffness: 240,
                    damping: 24,
                  }}
                >
                  <CardBack className="rounded-[8px]" compact />
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[8px] border transition",
                      isPicked
                        ? "border-[var(--coral)] shadow-[0_10px_24px_rgba(200,90,60,0.24)]"
                        : "border-[var(--line-strong)] group-hover/card:border-[var(--coral-edge)]",
                    )}
                  />
                  {isPicked ? (
                    <span className="absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[var(--surface-tint)] bg-[var(--coral)] font-mono text-[10px] font-bold text-white shadow-lg">
                      {pickOrder + 1}
                    </span>
                  ) : null}
                </motion.button>
              );
            })}
          </div>

          <PickProgress picks={picks.length} total={cardCount} />
        </motion.div>
      </AnimatePresence>

      <Button
        className="px-12 py-6 text-[15px]"
        onClick={confirm}
        disabled={picks.length !== cardCount}
      >
        {"\u7ffb\u5f00"} {cardCount} {"\u5f20\u724c"}
      </Button>
    </div>
  );
}

/* ---------------- Number picker ---------------- */

function NumberPicker({
  cardCount,
  cutPosition,
  onDone,
}: {
  cardCount: number;
  cutPosition: number | null;
  onDone: (indices: number[]) => void;
}) {
  const [activeSlot, setActiveSlot] = useState(0);
  const initialNumber = Math.floor(TOTAL_CARDS / 2);
  const [values, setValues] = useState<number[]>(() =>
    Array.from({ length: cardCount }, () => initialNumber),
  );
  const [draftValues, setDraftValues] = useState<string[]>(() =>
    Array.from({ length: cardCount }, () => String(initialNumber)),
  );
  const [inputTip, setInputTip] = useState("可以直接输入，也可以先删空再写下浮现的数字。");

  function normalizeDraftValue(rawValue: string, fallback: number) {
    const trimmed = rawValue.trim();
    const parsed = Number(trimmed);

    if (trimmed.length === 0 || !Number.isFinite(parsed)) {
      return {
        value: fallback,
        draft: String(fallback),
        valid: false,
        tip: "这里需要 1 到 78 之间的数字；如果还没想好，可以先停在原来的数字。",
      };
    }

    const rounded = Math.round(parsed);
    const clamped = Math.max(1, Math.min(TOTAL_CARDS, rounded));

    return {
      value: clamped,
      draft: String(clamped),
      valid: true,
      tip:
        clamped === rounded
          ? "已记下这个数字。"
          : `塔罗牌只有 78 张，已帮你收回到 ${clamped}。`,
    };
  }

  function updateActiveValue(updater: (value: number) => number) {
    setValues((current) => {
      const nextValues = current.map((value, index) =>
        index === activeSlot ? Math.max(1, Math.min(TOTAL_CARDS, updater(value))) : value,
      );
      setDraftValues((drafts) =>
        drafts.map((draft, index) => (index === activeSlot ? String(nextValues[index]) : draft)),
      );
      setInputTip("已调整当前数字。");
      return nextValues;
    });
  }

  function commitDraft(slotIndex = activeSlot) {
    const normalized = normalizeDraftValue(draftValues[slotIndex] ?? "", values[slotIndex]);
    setValues((current) =>
      current.map((value, index) => (index === slotIndex ? normalized.value : value)),
    );
    setDraftValues((current) =>
      current.map((draft, index) => (index === slotIndex ? normalized.draft : draft)),
    );
    setInputTip(normalized.tip);
    return normalized.valid;
  }

  function confirm() {
    const normalizedEntries = draftValues.map((draft, index) =>
      normalizeDraftValue(draft, values[index]),
    );

    setValues(normalizedEntries.map((entry) => entry.value));
    setDraftValues(normalizedEntries.map((entry) => entry.draft));

    const invalidEntry = normalizedEntries.find((entry) => !entry.valid);
    if (invalidEntry) {
      setInputTip(invalidEntry.tip);
      triggerHaptic(6);
      return;
    }

    triggerHaptic([10, 20, 14]);
    onDone(resolveUniqueNumberIndices(normalizedEntries.map((entry) => entry.value)));
  }

  return (
    <div className="flex flex-col items-center gap-10 py-6">
      <CutTrace cutPosition={cutPosition} />

      <div className="px-6">
        <RitualPrompt detail="1 到 78 之间，不需要任何解释。">
          在心里默念问题，捕获第一个浮现的数字。
        </RitualPrompt>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {values.map((number, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              commitDraft(activeSlot);
              setActiveSlot(index);
            }}
            className={cn(
              "h-9 min-w-12 border px-3 font-mono text-[12px] transition",
              activeSlot === index
                ? "border-[var(--coral)] bg-[var(--coral-wash)] text-[var(--coral-deep)]"
                : "border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--coral-edge)]",
            )}
          >
            {index + 1}: {number}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-8">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic(8);
            updateActiveValue((value) => value - 1);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-soft)] transition-all hover:border-[var(--coral)] hover:bg-[var(--coral-wash)] hover:text-[var(--coral-deep)]"
        >
          <svg viewBox="0 0 16 16" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8 L13 8" strokeLinecap="round" />
          </svg>
        </motion.button>

        <label className="relative group block">
          <div className="absolute -inset-4 rounded-[24px] bg-[var(--coral-wash)] opacity-50 blur-xl transition-opacity group-hover:opacity-100" />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-[24px] border-2 border-[var(--coral-edge)] bg-[var(--surface-tint)] shadow-[0_8px_24px_rgba(168,85,62,0.12)]">
            <span className="sr-only">输入第 {activeSlot + 1} 张牌的心象数字</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={TOTAL_CARDS}
              value={draftValues[activeSlot]}
              aria-describedby="number-picker-tip"
              onFocus={(event) => event.currentTarget.select()}
              onBlur={() => commitDraft(activeSlot)}
              onChange={(event) => {
                const rawValue = event.target.value.replace(/[^\d]/g, "");
                triggerHaptic(4);
                setDraftValues((current) =>
                  current.map((draft, index) => (index === activeSlot ? rawValue : draft)),
                );

                if (rawValue.length === 0) {
                  setInputTip("可以先留空，等那个数字浮上来再输入。");
                  return;
                }

                const parsed = Number(rawValue);
                if (parsed >= 1 && parsed <= TOTAL_CARDS) {
                  setValues((current) =>
                    current.map((value, index) => (index === activeSlot ? parsed : value)),
                  );
                  setInputTip("数字有效。");
                  return;
                }

                setInputTip("请写 1 到 78 之间的数字，确认时会帮你校正。");
              }}
              className="h-full w-full appearance-none rounded-[24px] bg-transparent text-center font-serif-display text-[64px] leading-none text-[var(--coral-deep)] outline-none [appearance:textfield] focus-visible:ring-2 focus-visible:ring-[var(--coral)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label={`第 ${activeSlot + 1} 张牌的数字，1 到 78`}
            />
          </div>
        </label>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic(8);
            updateActiveValue((value) => value + 1);
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
          value={values[activeSlot]}
          onChange={(event) => {
            triggerHaptic(4);
            updateActiveValue(() => Number(event.target.value));
          }}
          className="w-full h-1.5 appearance-none rounded-full bg-[var(--line-strong)] accent-[var(--coral)] cursor-pointer"
        />
        <div className="mt-3 flex justify-between font-mono text-[10px] tracking-[0.2em] text-[var(--ink-faint)] uppercase">
          <span>01</span>
          <span>78</span>
        </div>
      </div>

      <p
        id="number-picker-tip"
        className="ritual-note mx-auto max-w-md px-4 text-center text-[12.5px] leading-6 text-[var(--ink-muted)]"
        aria-live="polite"
      >
        {inputTip}
      </p>

      <Button 
        className="px-12 py-6 text-[15px]"
        onClick={confirm}
      >
        按这些数字翻开 {cardCount} 张牌
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

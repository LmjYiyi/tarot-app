"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  onModeChange: (mode: SelectMode) => void;
  onShuffleDone: () => void;
  onCutDone: (cutPosition: number) => void;
  onSelectionDone: (indices: number[]) => void;
  shuffleDurationMs?: number;
};

export function InteractiveDeck({
  phase,
  cardCount,
  selectMode,
  onModeChange,
  onShuffleDone,
  onCutDone,
  onSelectionDone,
  shuffleDurationMs = 2400,
}: InteractiveDeckProps) {
  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {phase === "idle" || phase === "shuffling" ? (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
          >
            <ShuffleStage
              active={phase === "shuffling"}
              durationMs={shuffleDurationMs}
              onDone={onShuffleDone}
            />
          </motion.div>
        ) : null}

        {phase === "cutting" ? (
          <motion.div
            key="cut"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
          >
            <CutStage onCutDone={onCutDone} />
          </motion.div>
        ) : null}

        {phase === "selecting" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
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
   Shuffle stage — auto-runs, then signals done
   ============================================================ */

function ShuffleStage({
  active,
  durationMs,
  onDone,
}: {
  active: boolean;
  durationMs: number;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timeout);
  }, [active, durationMs, onDone]);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <p className="font-occult text-[10px] tracking-[0.4em] uppercase text-[rgba(243,210,138,0.7)]">
        {active ? "Mensa I · Shuffling" : "Mensa I · Awaiting"}
      </p>
      <ShuffleAura active={active} />
      <p className="max-w-md text-center text-[14px] leading-7 italic text-[var(--text-primary)] font-serif-display">
        {active
          ? "牌面朝下，闭上眼，让你的问题从胸口升到指尖。"
          : "深呼吸三次，把问题在心里默念一遍，然后开始。"}
      </p>
    </div>
  );
}

function ShuffleAura({ active }: { active: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: "1400px", height: 280 }}
    >
      {/* outer rotating glyph */}
      <motion.div
        className="absolute h-72 w-72 rounded-full border border-[rgba(243,210,138,0.18)]"
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 28, ease: "linear", repeat: active ? Infinity : 0 }}
      />
      <motion.div
        className="absolute h-56 w-56 rounded-full border border-[rgba(243,210,138,0.28)]"
        animate={active ? { rotate: -360 } : { rotate: 0 }}
        transition={{ duration: 18, ease: "linear", repeat: active ? Infinity : 0 }}
      />
      <div className="absolute h-[2px] w-72 bg-gradient-to-r from-transparent via-[rgba(243,210,138,0.4)] to-transparent" />
      <div className="absolute h-72 w-[2px] bg-gradient-to-b from-transparent via-[rgba(243,210,138,0.4)] to-transparent" />

      {/* card stack with arcing motion */}
      <div className="relative h-56 w-40">
        {Array.from({ length: 11 }).map((_, index) => {
          const depth = index - 5;
          const restRotate = depth * 2.2;
          const restX = depth * 1.6;
          const restY = -Math.abs(depth) * 0.5;
          const arcX = depth * 22 + (index % 2 === 0 ? -10 : 12);
          const arcY = -34 - Math.abs(depth) * 5;
          const arcRotate = depth * 16 + (index % 2 === 0 ? -8 : 8);

          return (
            <motion.div
              key={index}
              className="absolute inset-0 mx-auto h-52 w-32"
              style={{
                zIndex: index,
                transformStyle: "preserve-3d",
              }}
              animate={
                active
                  ? {
                      x: [restX, arcX, -arcX * 0.7, restX],
                      y: [restY, arcY, arcY * 0.5, restY],
                      rotate: [restRotate, arcRotate, -arcRotate * 0.85, restRotate],
                      rotateY: [0, 16, -14, 0],
                    }
                  : { x: restX, y: restY, rotate: restRotate, rotateY: 0 }
              }
              transition={{
                duration: active ? 1.7 : 0.5,
                repeat: active ? Infinity : 0,
                ease: active ? [0.42, 0, 0.2, 1] : "easeOut",
                delay: active ? index * 0.07 : 0,
              }}
            >
              <CardBack />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Cut stage — user drags a glowing line to cut the deck
   ============================================================ */

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
    <div className="flex flex-col items-center gap-6 py-2">
      <p className="font-occult text-[10px] tracking-[0.4em] uppercase text-[rgba(243,210,138,0.75)]">
        Mensa II · Cut the Deck
      </p>
      <p className="max-w-lg text-center text-[14px] leading-7 italic text-[var(--text-primary)] font-serif-display">
        把一叠牌切开 —— 拖动金线，决定你的能量从哪里介入。
      </p>

      <div
        ref={trackRef}
        className="relative h-44 w-full max-w-2xl select-none group/track"
        onMouseDown={() => {
          triggerHaptic(8);
          setDragging(true);
        }}
        onTouchStart={() => {
          triggerHaptic(8);
          setDragging(true);
        }}
      >
        {/* deck visualization: long horizontal strip representing the deck edge */}
        <div className="absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 overflow-hidden rounded-[12px] border border-[rgba(243,210,138,0.35)] bg-[linear-gradient(155deg,#1a1f3a_0%,#241a44_50%,#3a1f3f_100%)] shadow-inner">
          {/* fake card edges */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(243,210,138,0.2) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0 1px, transparent 1px 8px)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,0.5)] via-transparent to-[rgba(0,0,0,0.5)]" />
        </div>

        {/* glow trail behind cut line */}
        <div
          className="absolute top-1/2 h-40 w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover/track:opacity-80"
          style={{
            left: `${position * 100}%`,
            background:
              "radial-gradient(closest-side, rgba(255,215,120,0.5), transparent)",
          }}
        />

        {/* cut line with enlarged hit area */}
        <motion.div
          className={cn(
            "absolute top-1/2 z-10 h-44 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center",
          )}
          style={{ left: `${position * 100}%` }}
          animate={{ scale: dragging ? 1.05 : 1 }}
        >
          <div className="relative flex h-full w-[2px] flex-col items-center">
            {/* The actual visible line */}
            <div className="h-full w-full bg-[linear-gradient(180deg,transparent_0%,rgba(243,210,138,0.8)_15%,rgba(255,235,180,1)_50%,rgba(243,210,138,0.8)_85%,transparent_100%)] shadow-[0_0_15px_rgba(243,210,138,0.7)]" />
            
            {/* The handle with pulse animation */}
            <motion.div 
              className="absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(243,210,138,0.8)] bg-[#0c1024] shadow-[0_0_20px_rgba(243,210,138,0.4)]"
              animate={dragging ? { scale: 1.1 } : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-full animate-pulse-slow bg-[rgba(243,210,138,0.15)]" />
              <svg viewBox="0 0 24 24" className="relative h-5 w-5 text-[rgba(255,235,180,1)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 12 L18 12" strokeLinecap="round" />
                <path d="M9 8 L6 12 L9 16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 8 L18 12 L15 16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* tick marks */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-1 text-[9px] tracking-[0.3em] uppercase text-[rgba(243,210,138,0.45)] font-occult">
          <span>顶</span>
          <span>1/3</span>
          <span>1/2</span>
          <span>2/3</span>
          <span>底</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-occult text-[11px] tracking-[0.3em] uppercase text-[rgba(243,210,138,0.7)]">
          切于第 {Math.round(position * TOTAL_CARDS)} 张
        </span>
        <Button
          variant="crest"
          onClick={() => {
            triggerHaptic([10, 20, 14]);
            onCutDone(position);
          }}
        >
          确认切牌
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   Selection stage — three modes
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
  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
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

      <AnimatePresence mode="wait">
        {mode === "fan" ? (
          <motion.div
            key="fan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <FanPicker cardCount={cardCount} onDone={onSelectionDone} />
          </motion.div>
        ) : null}
        {mode === "piles" ? (
          <motion.div
            key="piles"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <PilePicker cardCount={cardCount} onDone={onSelectionDone} />
          </motion.div>
        ) : null}
        {mode === "number" ? (
          <motion.div
            key="number"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
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
        "rounded-full border px-4 py-1.5 text-[11px] tracking-[0.32em] uppercase font-occult transition-all",
        active
          ? "border-[rgba(243,210,138,0.8)] bg-[rgba(243,210,138,0.12)] text-[#fce7b4] shadow-[0_0_18px_rgba(243,210,138,0.25)]"
          : "border-[rgba(243,210,138,0.25)] text-[rgba(243,210,138,0.6)] hover:border-[rgba(243,210,138,0.55)] hover:text-[#fce7b4]",
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
    triggerHaptic(alreadyPicked ? 8 : [8, 18, 8]);
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
  const verticalCurve = 90;
  const totalArcDeg = 56;

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
    <div className="flex flex-col items-center gap-5">
      <p className="max-w-xl text-center text-[13px] leading-7 italic text-[var(--text-primary)] font-serif-display">
        扇形铺开了 78 张牌，凭直觉点击其中 <span className="text-[#fce7b4]">{cardCount}</span> 张，
        被选中的会浮起、镶上金边。可以再次点击取消。
      </p>

      <div
        ref={viewportRef}
        className="relative w-full overflow-hidden pb-4"
        onPointerMove={handlePointerMove}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-[#0d1126] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-[#0d1126] to-transparent"
        />
        <div
          ref={fanRef}
          className="relative flex h-[290px] w-max items-end justify-center px-24 pb-6 will-change-transform"
          style={{
            transform: `translateX(${-panX}px)`,
            transition: "transform 140ms ease-out",
          }}
        >
          {cards.map((cardIndex) => {
            const t = cardIndex / (total - 1) - 0.5; // -0.5 .. 0.5
            const angle = t * totalArcDeg; // tilt
            const lift = -Math.cos(t * Math.PI) * verticalCurve; // peak in center
            const isPicked = picks.includes(cardIndex);
            const pickOrder = picks.indexOf(cardIndex);

            return (
              <button
                type="button"
                key={cardIndex}
                onClick={() => togglePick(cardIndex)}
                className="group relative shrink-0"
                style={{
                  marginLeft: cardIndex === 0 ? 0 : -64,
                  zIndex: isPicked ? 400 + pickOrder : cardIndex,
                  transform: `translateY(${lift}px) rotate(${angle}deg)`,
                  transformOrigin: "50% 100%",
                  transition: "transform 220ms ease",
                }}
              >
                <motion.div
                  className="relative h-[150px] w-[90px] overflow-visible rounded-[10px]"
                  animate={{ y: isPicked ? -36 : 0, scale: isPicked ? 1.06 : 1 }}
                  whileHover={{
                    y: isPicked ? -42 : -16,
                    scale: isPicked ? 1.1 : 1.05,
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-[10px] border transition-all",
                      isPicked
                        ? "border-[rgba(255,222,150,0.95)] shadow-[0_0_28px_rgba(255,210,140,0.55)]"
                        : "border-[rgba(243,210,138,0.45)] group-hover:border-[rgba(255,222,150,0.95)] group-hover:shadow-[0_0_18px_rgba(255,210,140,0.4)]",
                    )}
                  >
                    <CardBack className="rounded-[10px]" />
                  </div>
                  {isPicked ? (
                    <div className="absolute -top-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[rgba(255,222,150,0.95)] bg-[#0c1024] font-occult text-[10px] text-[#fce7b4]">
                      {pickOrder + 1}
                    </div>
                  ) : null}
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 font-occult text-[9px] uppercase tracking-[0.32em] text-[rgba(243,210,138,0.45)]">
        <span>左侧</span>
        <span className="h-px w-14 bg-[rgba(243,210,138,0.25)]" />
        <span>移动鼠标浏览牌面</span>
        <span className="h-px w-14 bg-[rgba(243,210,138,0.25)]" />
        <span>右侧</span>
      </div>

      <PickProgress picks={picks.length} total={cardCount} />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            triggerHaptic(6);
            setPicks([]);
          }}
          disabled={picks.length === 0}
        >
          重选
        </Button>
        <Button
          variant="crest"
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
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-xl text-center text-[13px] leading-7 italic text-[var(--text-primary)] font-serif-display">
        牌堆已分作三叠 —— 不要思考，凭第一感觉选一叠。我会从那叠由上往下抽出 {cardCount} 张。
      </p>

      <div className="flex items-center justify-center gap-10">
        {piles.map((pile, index) => {
          const isChosen = chosenPile === index;
          return (
            <motion.button
              type="button"
              key={pile.label}
              onClick={() => {
                triggerHaptic(10);
                setChosenPile(index);
              }}
              className="group relative flex flex-col items-center gap-3"
              whileHover={{ y: -4 }}
              animate={{ y: isChosen ? -10 : 0 }}
            >
              <div
                className={cn(
                  "relative h-[180px] w-[120px] rounded-[12px] transition-all",
                  isChosen ? "drop-shadow-[0_0_28px_rgba(255,210,140,0.55)]" : "drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]",
                )}
              >
                {[0, 1, 2, 3].map((layer) => (
                  <div
                    key={layer}
                    className={cn(
                      "absolute h-full w-full rounded-[12px] border",
                      isChosen
                        ? "border-[rgba(255,222,150,0.95)]"
                        : "border-[rgba(243,210,138,0.4)] group-hover:border-[rgba(255,222,150,0.95)]",
                    )}
                    style={{
                      transform: `translate(${layer * 1.5}px, ${-layer * 1.5}px)`,
                      zIndex: layer,
                    }}
                  >
                    <CardBack className="rounded-[12px]" />
                  </div>
                ))}
              </div>
              <span className={cn(
                "font-occult text-[11px] tracking-[0.3em] uppercase",
                isChosen ? "text-[#fce7b4]" : "text-[rgba(243,210,138,0.7)]",
              )}>
                {pile.label}
              </span>
              {isChosen ? (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-[rgba(255,222,150,0.95)] bg-[#0c1024] px-3 py-0.5 font-occult text-[9px] tracking-[0.3em] uppercase text-[#fce7b4]">
                  选中
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <Button variant="crest" onClick={confirm} disabled={chosenPile === null}>
        从这叠抽 {cardCount} 张
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
    // anchor at the chosen number, take cardCount sequential cards
    // wrap if near the end of the deck
    const indices: number[] = [];
    const start = Math.max(0, Math.min(TOTAL_CARDS - cardCount, value - 1));
    for (let i = 0; i < cardCount; i += 1) {
      indices.push((start + i) % TOTAL_CARDS);
    }
    onDone(indices);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-xl text-center text-[13px] leading-7 italic text-[var(--text-primary)] font-serif-display">
        在心里默念问题，浮现的第一个数字 —— 1 到 78 之间，不需要解释。
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(6);
            setValue((v) => Math.max(1, v - 1));
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(243,210,138,0.5)] text-[rgba(243,210,138,0.85)] transition hover:border-[rgba(255,222,150,0.95)] hover:text-[#fce7b4]"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 8 L13 8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex h-28 w-28 items-center justify-center rounded-[16px] border border-[rgba(243,210,138,0.55)] bg-[rgba(255,210,140,0.06)] shadow-[inset_0_0_24px_rgba(243,210,138,0.18)]">
          <span className="font-serif-display text-[64px] italic leading-none text-[#fce7b4]">
            {value}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(6);
            setValue((v) => Math.min(TOTAL_CARDS, v + 1));
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(243,210,138,0.5)] text-[rgba(243,210,138,0.85)] transition hover:border-[rgba(255,222,150,0.95)] hover:text-[#fce7b4]"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3 L8 13 M3 8 L13 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <input
        type="range"
        min={1}
        max={TOTAL_CARDS}
        value={value}
        onChange={(event) => {
          triggerHaptic(4);
          setValue(Number(event.target.value));
        }}
        className="w-full max-w-md accent-[#fce7b4]"
      />

      <Button variant="crest" onClick={confirm}>
        从第 {value} 张起，抽 {cardCount} 张
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
            index < picks ? "bg-[rgba(255,222,150,0.95)]" : "bg-[rgba(243,210,138,0.18)]",
          )}
        />
      ))}
      <span className="ml-3 font-occult text-[10px] tracking-[0.32em] uppercase text-[rgba(243,210,138,0.7)]">
        {picks} / {total}
      </span>
    </div>
  );
}

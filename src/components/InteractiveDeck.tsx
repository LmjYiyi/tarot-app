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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
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
   Shared label primitives
   ============================================================ */
function StageLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
      {children}
    </p>
  );
}

function StageHelper({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-md text-center text-[15px] leading-7 text-[var(--ink-soft)]">
      {children}
    </p>
  );
}

/* ============================================================
   Shuffle stage — quiet vertical card drift
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
    <div className="flex flex-col items-center gap-7 py-8">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full transition-colors",
            active ? "bg-[var(--coral)] animate-shimmer" : "bg-[var(--ink-faint)]",
          )}
        />
        <StageLabel>{active ? "Shuffling · 洗牌中" : "Awaiting · 待洗"}</StageLabel>
      </div>
      <ShuffleAura active={active} />
      <StageHelper>
        {active
          ? "把问题在心里默念一遍，让它从胸口落到指尖。"
          : "深呼吸三次，再开始。"}
      </StageHelper>
    </div>
  );
}

function ShuffleAura({ active }: { active: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: "1400px", height: 280 }}
    >
      {/* hairline framing circles — far quieter than before */}
      <motion.div
        className="absolute h-72 w-72 rounded-full border border-[var(--coral-edge)]"
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 40, ease: "linear", repeat: active ? Infinity : 0 }}
        style={{ opacity: 0.4 }}
      />
      <motion.div
        className="absolute h-56 w-56 rounded-full border border-[var(--line-strong)]"
        animate={active ? { rotate: -360 } : { rotate: 0 }}
        transition={{ duration: 28, ease: "linear", repeat: active ? Infinity : 0 }}
        style={{ opacity: 0.5 }}
      />

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
              style={{ zIndex: index, transformStyle: "preserve-3d" }}
              animate={
                active
                  ? {
                      x: [restX, arcX, -arcX * 0.7, restX],
                      y: [restY, arcY, arcY * 0.5, restY],
                      rotate: [restRotate, arcRotate, -arcRotate * 0.85, restRotate],
                      rotateY: [0, 14, -12, 0],
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
   Cut stage — drag a coral line on a calm cream rail
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
    <div className="flex flex-col items-center gap-7 py-3">
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />
        <StageLabel>Cut · 切牌</StageLabel>
      </div>
      <StageHelper>
        把一叠牌切开 — 拖动这条线，决定能量从哪里介入。
      </StageHelper>

      <div
        ref={trackRef}
        className="relative h-44 w-full max-w-2xl select-none"
        onMouseDown={() => {
          triggerHaptic(8);
          setDragging(true);
        }}
        onTouchStart={() => {
          triggerHaptic(8);
          setDragging(true);
        }}
      >
        {/* deck rail — cream with subtle paper striations */}
        <div className="absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 overflow-hidden rounded-[14px] border border-[var(--line-strong)] bg-[linear-gradient(170deg,#f6f1e3_0%,#e9dec4_100%)] shadow-[inset_0_1px_2px_rgba(26,26,25,0.05)]">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(168,85,62,0.18) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(26,26,25,0.06) 0 1px, transparent 1px 8px)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(26,26,25,0.06)] via-transparent to-[rgba(26,26,25,0.06)]" />
        </div>

        {/* coral wash behind cut line */}
        <div
          className="absolute top-1/2 h-40 w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl transition-opacity duration-500"
          style={{
            left: `${position * 100}%`,
            background:
              "radial-gradient(closest-side, rgba(204,120,92,0.35), transparent)",
          }}
        />

        {/* cut line */}
        <motion.div
          className="absolute top-1/2 z-10 h-44 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center"
          style={{ left: `${position * 100}%` }}
          animate={{ scale: dragging ? 1.05 : 1 }}
        >
          <div className="relative flex h-full w-[2px] flex-col items-center">
            <div className="h-full w-full bg-[linear-gradient(180deg,transparent_0%,rgba(204,120,92,0.7)_15%,rgba(168,85,62,1)_50%,rgba(204,120,92,0.7)_85%,transparent_100%)]" />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--coral)] bg-[var(--surface)] shadow-[0_2px_10px_rgba(168,85,62,0.18)]"
              animate={dragging ? { scale: 1.1 } : { scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-full animate-pulse-slow bg-[var(--coral-wash)]" />
              <svg viewBox="0 0 24 24" className="relative h-5 w-5 text-[var(--coral-deep)]" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 12 L18 12" strokeLinecap="round" />
                <path d="M9 8 L6 12 L9 16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 8 L18 12 L15 16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* tick marks */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-1 font-mono text-[9.5px] tracking-[0.22em] uppercase text-[var(--ink-faint)]">
          <span>顶</span>
          <span>1/3</span>
          <span>1/2</span>
          <span>2/3</span>
          <span>底</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-soft)]">
          切于第 {Math.round(position * TOTAL_CARDS)} 张
        </span>
        <Button
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
  return (
    <div className="flex flex-col gap-6 pb-2">
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
      <p className="max-w-xl text-center text-[14px] leading-7 text-[var(--ink-soft)]">
        78 张牌摊开成一道弧 — 凭直觉点击其中{" "}
        <span className="font-medium text-[var(--coral-deep)]">{cardCount}</span> 张。
        被选中的牌会浮起、镶上铜边，再次点击可以取消。
      </p>

      <div
        ref={viewportRef}
        className="relative w-full overflow-hidden pb-4"
        onPointerMove={handlePointerMove}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-[var(--surface-raised)] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-[var(--surface-raised)] to-transparent"
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
                        ? "border-[var(--coral)] shadow-[0_4px_16px_rgba(204,120,92,0.25)]"
                        : "border-[var(--line-strong)] group-hover:border-[var(--coral)] group-hover:shadow-[0_2px_10px_rgba(204,120,92,0.18)]",
                    )}
                  >
                    <CardBack className="rounded-[10px]" />
                  </div>
                  {isPicked ? (
                    <div className="absolute -top-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--coral)] bg-[var(--coral)] font-mono text-[10px] text-white">
                      {pickOrder + 1}
                    </div>
                  ) : null}
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
        <span>左</span>
        <span className="h-px w-12 bg-[var(--line-strong)]" />
        <span>左右移动鼠标浏览</span>
        <span className="h-px w-12 bg-[var(--line-strong)]" />
        <span>右</span>
      </div>

      <PickProgress picks={picks.length} total={cardCount} />
      <div className="flex items-center gap-2">
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
    <div className="flex flex-col items-center gap-7">
      <p className="max-w-xl text-center text-[14px] leading-7 text-[var(--ink-soft)]">
        牌堆已分作三叠 — 不要思考，凭第一感觉选一叠。
        我会从那叠由上往下抽出 {cardCount} 张。
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
                  isChosen
                    ? "drop-shadow-[0_8px_22px_rgba(204,120,92,0.28)]"
                    : "drop-shadow-[0_4px_12px_rgba(26,26,25,0.10)]",
                )}
              >
                {[0, 1, 2, 3].map((layer) => (
                  <div
                    key={layer}
                    className={cn(
                      "absolute h-full w-full rounded-[12px] border",
                      isChosen
                        ? "border-[var(--coral)]"
                        : "border-[var(--line-strong)] group-hover:border-[var(--coral)]",
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
              <span
                className={cn(
                  "font-mono text-[11px] tracking-[0.16em] uppercase",
                  isChosen ? "text-[var(--coral-deep)]" : "text-[var(--ink-soft)]",
                )}
              >
                {pile.label}
              </span>
              {isChosen ? (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--coral)] px-2.5 py-0.5 font-mono text-[9px] tracking-[0.2em] uppercase text-white">
                  选中
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <Button onClick={confirm} disabled={chosenPile === null}>
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
    const indices: number[] = [];
    const start = Math.max(0, Math.min(TOTAL_CARDS - cardCount, value - 1));
    for (let i = 0; i < cardCount; i += 1) {
      indices.push((start + i) % TOTAL_CARDS);
    }
    onDone(indices);
  }

  return (
    <div className="flex flex-col items-center gap-7">
      <p className="max-w-xl text-center text-[14px] leading-7 text-[var(--ink-soft)]">
        在心里默念问题，浮现的第一个数字 — 1 到 78 之间，不需要解释。
      </p>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(6);
            setValue((v) => Math.max(1, v - 1));
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-soft)] transition hover:border-[var(--coral)] hover:text-[var(--coral-deep)]"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 8 L13 8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex h-28 w-28 items-center justify-center rounded-[18px] border border-[var(--coral-edge)] bg-[var(--coral-wash)]">
          <span className="font-serif-display text-[60px] leading-none text-[var(--coral-deep)]">
            {value}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(6);
            setValue((v) => Math.min(TOTAL_CARDS, v + 1));
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--ink-soft)] transition hover:border-[var(--coral)] hover:text-[var(--coral-deep)]"
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
        className="w-full max-w-md accent-[var(--coral)]"
      />

      <Button onClick={confirm}>
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

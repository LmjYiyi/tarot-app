"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type DeckShuffleProps = {
  active: boolean;
  compact?: boolean;
};

const STACK_SIZE = 9;
const stack = Array.from({ length: STACK_SIZE }, (_, index) => index);

export function DeckShuffle({ active, compact = false }: DeckShuffleProps) {
  return (
    <div
      className={cn(
        "relative mx-auto flex items-center justify-center",
        compact ? "h-52 w-40" : "h-64 w-52",
      )}
      style={{ perspective: "1200px" }}
      aria-hidden="true"
    >
      {stack.map((index) => {
        const depth = index - (STACK_SIZE - 1) / 2;
        const restRotate = depth * 2.2;
        const restX = depth * 1.4;
        const restY = -Math.abs(depth) * 0.6;

        const arcX = depth * 18 + (index % 2 === 0 ? -8 : 10);
        const arcY = -26 - Math.abs(depth) * 4;
        const arcRotate = depth * 14 + (index % 2 === 0 ? -6 : 6);

        return (
          <motion.div
            key={index}
            animate={
              active
                ? {
                    x: [restX, arcX, -arcX * 0.6, restX],
                    y: [restY, arcY, arcY * 0.4, restY],
                    rotate: [restRotate, arcRotate, -arcRotate * 0.8, restRotate],
                    rotateY: [0, 14, -12, 0],
                  }
                : {
                    x: restX,
                    y: restY,
                    rotate: restRotate,
                    rotateY: 0,
                  }
            }
            transition={{
              duration: active ? 1.6 : 0.6,
              repeat: active ? Number.POSITIVE_INFINITY : 0,
              ease: active ? [0.45, 0, 0.2, 1] : "easeOut",
              delay: active ? index * 0.08 : 0,
            }}
            style={{
              zIndex: index,
              transformStyle: "preserve-3d",
            }}
            className={cn(
              "absolute rounded-[18px]",
              compact ? "h-44 w-28" : "h-56 w-36",
            )}
          >
            <CardBack compact={compact} />
          </motion.div>
        );
      })}
    </div>
  );
}

export function CardBack({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[18px] border border-white/30 shadow-[0_18px_40px_rgba(18,29,41,0.35)]",
        "bg-[linear-gradient(145deg,#1b2540_0%,#2c3a60_48%,#524076_100%)]",
      )}
    >
      <div
        className="absolute inset-[6px] rounded-[14px] border border-white/25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10px)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border border-white/60 text-white/80",
            compact ? "h-14 w-14" : "h-20 w-20",
          )}
        >
          <span className="absolute -inset-2 rounded-full border border-white/20" />
          <svg
            viewBox="0 0 40 40"
            className={cn(compact ? "h-8 w-8" : "h-10 w-10")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            <circle cx="20" cy="20" r="14" />
            <path d="M20 6 L23 20 L20 34 L17 20 Z" />
            <path d="M6 20 L20 17 L34 20 L20 23 Z" />
            <circle cx="20" cy="20" r="2.2" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}

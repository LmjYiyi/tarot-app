"use client";

import { cn } from "@/lib/utils";

export function CardBack({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[12px] border border-[var(--line-strong)]",
        "bg-[linear-gradient(160deg,#f6f1e3_0%,#efe7d2_55%,#e7dcc1_100%)]",
        "shadow-[0_2px_8px_rgba(26,26,25,0.08),0_8px_24px_rgba(26,26,25,0.06)]",
        className,
      )}
    >
      {/* inner hairline frame */}
      <div
        className="absolute inset-[5px] rounded-[8px] border border-[rgba(204,120,92,0.28)]"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, rgba(204,120,92,0.06) 0 1px, transparent 1px 9px)",
            "repeating-linear-gradient(-45deg, rgba(26,26,25,0.04) 0 1px, transparent 1px 9px)",
            "radial-gradient(circle at 50% 50%, rgba(204,120,92,0.12), transparent 70%)",
          ].join(", "),
        }}
      />
      {/* center sigil — minimal compass mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border border-[rgba(168,85,62,0.55)] text-[var(--coral-deep)]",
            compact ? "h-11 w-11" : "h-14 w-14",
          )}
        >
          <span className="absolute -inset-2 rounded-full border border-[rgba(168,85,62,0.22)]" />
          <span className="absolute -inset-4 rounded-full border border-[rgba(168,85,62,0.10)]" />
          <svg
            viewBox="0 0 40 40"
            className={cn(compact ? "h-6 w-6" : "h-8 w-8")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          >
            <circle cx="20" cy="20" r="13" />
            <path d="M20 5 L22.4 20 L20 35 L17.6 20 Z" />
            <path d="M5 20 L20 17.6 L35 20 L20 22.4 Z" />
            <circle cx="20" cy="20" r="2" fill="currentColor" />
          </svg>
        </div>
      </div>
      {/* top/bottom accent rules */}
      <div className="pointer-events-none absolute inset-x-3 top-3 h-px bg-gradient-to-r from-transparent via-[rgba(168,85,62,0.45)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-gradient-to-r from-transparent via-[rgba(168,85,62,0.45)] to-transparent" />
    </div>
  );
}

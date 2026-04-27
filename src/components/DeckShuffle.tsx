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
        "relative h-full w-full overflow-hidden rounded-[12px] border border-[rgba(227,196,133,0.55)] shadow-[0_18px_40px_rgba(8,12,28,0.55)]",
        "bg-[linear-gradient(155deg,#1a1f3a_0%,#241a44_45%,#3a1f3f_100%)]",
        "animate-[goldPulse_4s_ease-in-out_infinite]",
        className,
      )}
    >
      <div
        className="absolute inset-[5px] rounded-[8px] border border-[rgba(227,196,133,0.4)]"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, rgba(227,196,133,0.10) 0 1px, transparent 1px 9px)",
            "repeating-linear-gradient(-45deg, rgba(227,196,133,0.08) 0 1px, transparent 1px 9px)",
            "radial-gradient(circle at 50% 50%, rgba(227,196,133,0.18), transparent 70%)",
          ].join(", "),
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border border-[rgba(243,210,138,0.85)] text-[rgba(243,210,138,0.95)]",
            compact ? "h-12 w-12" : "h-16 w-16",
          )}
        >
          <span className="absolute -inset-2 rounded-full border border-[rgba(243,210,138,0.35)]" />
          <span className="absolute -inset-4 rounded-full border border-[rgba(243,210,138,0.15)]" />
          <svg
            viewBox="0 0 40 40"
            className={cn(compact ? "h-7 w-7" : "h-9 w-9")}
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
      <div className="pointer-events-none absolute inset-x-3 top-3 h-px bg-gradient-to-r from-transparent via-[rgba(243,210,138,0.6)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-gradient-to-r from-transparent via-[rgba(243,210,138,0.6)] to-transparent" />
    </div>
  );
}

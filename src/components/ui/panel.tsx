import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type PanelVariant = "default" | "dark" | "arched" | "ghost";

type PanelProps = PropsWithChildren<{
  className?: string;
  variant?: PanelVariant;
  as?: "div" | "section" | "article" | "aside";
}>;

const baseClasses: Record<PanelVariant, string> = {
  default:
    "relative rounded-[28px] border border-[var(--gilt)]/50 bg-[linear-gradient(180deg,rgba(255,249,233,0.92)_0%,rgba(244,227,193,0.78)_100%)] p-6 shadow-[0_30px_80px_rgba(60,36,12,0.10)] backdrop-blur-sm",
  dark:
    "relative overflow-hidden rounded-[28px] border border-[rgba(197,154,76,0.35)] bg-[linear-gradient(160deg,#121626_0%,#1d2540_55%,#2a2148_100%)] p-6 text-[rgba(246,232,206,0.88)] shadow-[0_30px_80px_rgba(10,12,24,0.45)]",
  arched:
    "relative overflow-hidden rounded-t-[220px] rounded-b-[28px] border border-[var(--gilt)]/55 bg-[linear-gradient(180deg,rgba(255,249,233,0.95)_0%,rgba(238,218,177,0.78)_100%)] p-8 shadow-[0_30px_70px_rgba(60,36,12,0.12)]",
  ghost:
    "relative rounded-[24px] border border-[var(--border)]/70 bg-transparent p-5",
};

export function Panel({
  children,
  className,
  variant = "default",
  as: Tag = "div",
}: PanelProps) {
  return (
    <Tag className={cn(baseClasses[variant], className)}>
      {variant === "default" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[var(--gilt)]/30"
        />
      ) : null}
      {variant === "dark" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[rgba(197,154,76,0.22)]"
        />
      ) : null}
      {variant === "arched" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[8px] rounded-t-[200px] rounded-b-[22px] border border-[var(--gilt)]/35"
        />
      ) : null}
      <div className="relative">{children}</div>
    </Tag>
  );
}

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
    "relative rounded-[28px] border border-[var(--border-strong)] bg-[var(--parchment-deep)]/80 p-6 shadow-[0_12px_44px_rgba(50,30,12,0.06)] backdrop-blur-sm",
  dark:
    "relative overflow-hidden rounded-[28px] border border-[var(--brass)] bg-[linear-gradient(160deg,#2a241e_0%,#3d342d_55%,#1a1612_100%)] p-6 text-[rgba(244,241,234,0.92)] shadow-[0_22px_60px_rgba(30,12,4,0.22)]",
  arched:
    "relative overflow-hidden rounded-t-[220px] rounded-b-[28px] border border-[var(--border-strong)] bg-[var(--parchment-deep)]/80 p-8 shadow-[0_14px_48px_rgba(50,30,12,0.06)] backdrop-blur-sm",
  ghost:
    "relative rounded-[24px] border border-[var(--border)] bg-transparent p-5",
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
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[var(--gilt-dim)]"
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
          className="pointer-events-none absolute inset-[8px] rounded-t-[200px] rounded-b-[22px] border border-[var(--gilt-dim)]"
        />
      ) : null}
      <div className="relative">{children}</div>
    </Tag>
  );
}

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
    "relative rounded-[18px] border border-[var(--line)] bg-[var(--surface-tint)] p-6",
  dark:
    "relative overflow-hidden rounded-[18px] border border-[var(--line-strong)] bg-[var(--surface-raised)] p-6 text-[var(--ink)]",
  arched:
    "relative overflow-hidden rounded-t-[200px] rounded-b-[18px] border border-[var(--line)] bg-[var(--surface-tint)] p-8",
  ghost:
    "relative rounded-[14px] border border-[var(--line)] bg-transparent p-5",
};

export function Panel({
  children,
  className,
  variant = "default",
  as: Tag = "div",
}: PanelProps) {
  return (
    <Tag className={cn(baseClasses[variant], className)}>
      <div className="relative">{children}</div>
    </Tag>
  );
}

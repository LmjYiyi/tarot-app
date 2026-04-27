import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "crest";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function buttonStyles({
  variant = "primary",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-semibold tracking-[0.18em] uppercase font-occult transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" &&
      [
        "relative overflow-hidden text-[var(--parchment-base)]",
        "bg-[var(--ink-rich)] shadow-[0_8px_24px_rgba(42,36,30,0.15)]",
        "hover:bg-[var(--oxblood)] hover:shadow-[0_12px_28px_rgba(140,58,43,0.2)]",
        "hover:-translate-y-[1.5px]",
        "active:translate-y-[0px] active:shadow-inner",
      ].join(" "),
    variant === "secondary" &&
      [
        "border border-[var(--border-strong)] bg-transparent text-[var(--ink-rich)]",
        "hover:border-[var(--brass)] hover:bg-[var(--parchment-deep)] hover:text-[var(--brass)]",
      ].join(" "),
    variant === "ghost" &&
      "text-[var(--ink-muted)] hover:text-[var(--brass)]",
    variant === "crest" &&
      [
        "border-2 border-[var(--brass)] bg-[var(--parchment-base)] text-[var(--brass)]",
        "shadow-[0_4px_12px_rgba(166,124,82,0.12)]",
        "hover:bg-[var(--brass)] hover:text-[var(--parchment-base)]",
      ].join(" "),
    className,
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, className })}
      {...props}
    />
  ),
);

Button.displayName = "Button";

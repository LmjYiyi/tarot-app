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
    "inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-[13.5px] font-medium tracking-[0] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-edge)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
    variant === "primary" &&
      [
        "bg-[var(--coral)] text-white",
        "shadow-[0_1px_2px_rgba(168,85,62,0.18)]",
        "hover:bg-[var(--coral-deep)]",
        "active:translate-y-[0.5px]",
      ].join(" "),
    variant === "secondary" &&
      [
        "border border-[var(--line-strong)] bg-transparent text-[var(--ink)]",
        "hover:bg-[var(--surface-raised)] hover:border-[var(--ink-soft)]",
      ].join(" "),
    variant === "ghost" &&
      "px-3 py-2 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)]",
    variant === "crest" &&
      [
        "border border-[var(--coral)] bg-transparent text-[var(--coral-deep)]",
        "hover:bg-[var(--coral)] hover:text-white",
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

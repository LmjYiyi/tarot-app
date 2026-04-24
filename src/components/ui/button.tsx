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
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium tracking-[0.18em] uppercase font-occult transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" &&
      [
        "relative overflow-hidden text-[#fff6e6]",
        "bg-[linear-gradient(135deg,#b35b30_0%,#923e19_55%,#c49646_100%)]",
        "shadow-[0_14px_30px_rgba(142,64,24,0.34),inset_0_0_0_1px_rgba(255,221,169,0.55)]",
        "hover:shadow-[0_18px_38px_rgba(142,64,24,0.42),inset_0_0_0_1px_rgba(255,230,186,0.75)]",
        "hover:-translate-y-[1px]",
      ].join(" "),
    variant === "secondary" &&
      [
        "border border-[var(--border-strong)] bg-[rgba(255,249,232,0.7)] text-[var(--ink)]",
        "shadow-[inset_0_0_0_1px_rgba(197,154,76,0.22)]",
        "hover:border-[var(--copper)] hover:text-[var(--copper)] hover:bg-white",
      ].join(" "),
    variant === "ghost" &&
      "text-[var(--ink-muted)] hover:text-[var(--copper)]",
    variant === "crest" &&
      [
        "border border-[rgba(197,154,76,0.5)] bg-[rgba(18,22,38,0.92)] text-[var(--gold-soft)]",
        "shadow-[inset_0_0_0_1px_rgba(197,154,76,0.18)]",
        "hover:text-[#f1e1c1] hover:bg-[#1a2040]",
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

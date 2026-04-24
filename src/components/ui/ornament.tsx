import { cn } from "@/lib/utils";

type OrnamentProps = {
  variant?: "rose" | "sun" | "quatrefoil" | "rule";
  className?: string;
  tone?: "gold" | "ink";
};

const strokes = {
  gold: "stroke-[var(--gold)]",
  ink: "stroke-[var(--ink-soft)]",
};

export function Ornament({
  variant = "rose",
  className,
  tone = "gold",
}: OrnamentProps) {
  if (variant === "rule") {
    return (
      <div
        aria-hidden="true"
        className={cn("flex items-center gap-3 text-[var(--gold)]", className)}
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gilt)] to-[var(--gilt)]" />
        <OrnamentSymbol variant="rose" tone={tone} />
        <span className="h-px flex-1 bg-gradient-to-r from-[var(--gilt)] via-[var(--gilt)] to-transparent" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={cn("flex justify-center", className)}>
      <OrnamentSymbol variant={variant} tone={tone} />
    </div>
  );
}

function OrnamentSymbol({
  variant,
  tone,
}: {
  variant: Exclude<OrnamentProps["variant"], "rule">;
  tone: NonNullable<OrnamentProps["tone"]>;
}) {
  if (variant === "sun") {
    return (
      <svg
        viewBox="0 0 48 48"
        className={cn("h-6 w-6", strokes[tone])}
        fill="none"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <circle cx="24" cy="24" r="6" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 24 + Math.cos(angle) * 10;
          const y1 = 24 + Math.sin(angle) * 10;
          const x2 = 24 + Math.cos(angle) * (i % 2 === 0 ? 20 : 16);
          const y2 = 24 + Math.sin(angle) * (i % 2 === 0 ? 20 : 16);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </svg>
    );
  }

  if (variant === "quatrefoil") {
    return (
      <svg
        viewBox="0 0 48 48"
        className={cn("h-5 w-5", strokes[tone])}
        fill="none"
        strokeWidth="1"
      >
        <path d="M24 4 C30 12, 36 12, 44 24 C36 36, 30 36, 24 44 C18 36, 12 36, 4 24 C12 12, 18 12, 24 4 Z" />
        <circle cx="24" cy="24" r="2" fill="currentColor" className={tone === "gold" ? "fill-[var(--gold)]" : "fill-[var(--ink-soft)]"} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-5 w-5", strokes[tone])}
      fill="none"
      strokeWidth="1"
      strokeLinecap="round"
    >
      <path d="M24 6 L30 18 L42 18 L32 26 L36 40 L24 32 L12 40 L16 26 L6 18 L18 18 Z" />
      <circle cx="24" cy="24" r="1.5" fill="currentColor" className={tone === "gold" ? "fill-[var(--gold)]" : "fill-[var(--ink-soft)]"} />
    </svg>
  );
}

export function RomanNumeral({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={cn("roman gilt-text", className)}>{toRoman(value)}</span>
  );
}

export function toRoman(num: number) {
  if (num <= 0) return "O";
  const map: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let remaining = num;
  for (const [v, s] of map) {
    while (remaining >= v) {
      out += s;
      remaining -= v;
    }
  }
  return out;
}

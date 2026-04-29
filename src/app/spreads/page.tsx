import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ScrollReveal } from "@/components/ScrollReveal";
import { SpreadRecommender } from "@/components/SpreadRecommender";
import { buttonStyles } from "@/components/ui/button";
import { Ornament, toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
import { getAllSpreads } from "@/lib/tarot/catalog";

const spreadThumbnails: Record<string, string> = {
  "career-five": "/spreads/career-five-thumbnail-v2.png",
  "three-card": "/spreads/three-card-thumbnail-v2.png",
  "single-guidance": "/spreads/single-guidance-thumbnail-v2.png",
  "cross-five": "/spreads/cross-five-thumbnail-v2.png",
  "relationship-six": "/spreads/relationship-six-thumbnail-v2.png",
  "lovers-pyramid": "/spreads/lovers-pyramid-thumbnail-v2.png",
  "path-of-choice": "/spreads/path-of-choice-thumbnail-v2.png",
  "self-state": "/spreads/self-state-thumbnail-v2.png",
  "celtic-cross": "/spreads/celtic-cross-thumbnail-v2.png",
};

export const metadata: Metadata = {
  title: "选择牌阵 | Arcana Flow",
  description: "从单张建议牌、三张牌到凯尔特十字，选择适合当前问题复杂度的塔罗牌阵。",
};

export default function SpreadsPage() {
  const spreads = getAllSpreads();

  return (
    <div className="relative isolate mx-auto w-full max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <Image
          src="/visuals/spread-selection-background-clean.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="scale-[1.01] object-cover opacity-[0.58] blur-[0.5px]"
        />
        <div className="absolute inset-0 bg-[rgba(251,240,200,0.34)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,240,200,0.18)_0%,rgba(251,240,200,0.44)_48%,rgba(251,240,200,0.72)_100%)]" />
      </div>
      <header className="mx-auto max-w-3xl space-y-6 text-center">
        <Ornament variant="quatrefoil" />
        <p className="eyebrow">Spread Index · 牌阵索引</p>
        <h1 className="font-serif-display text-[clamp(2.5rem,4.5vw,4rem)] leading-[1.04] tracking-[-0.018em] text-[var(--ink)]">
          选择今天要使用的牌阵
        </h1>
        <p className="text-[16px] leading-8 text-[var(--ink-soft)]">
          先问问自己“我现在想看什么”。轻一点的问题，用少量牌照见方向；关系、选择和长期课题，再交给更完整的牌阵慢慢摊开。
        </p>
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="h-px flex-1 bg-[var(--line)]" />
          <Ornament variant="quatrefoil" />
          <div className="h-px flex-1 bg-[var(--line)]" />
        </div>
      </header>

      <SpreadRecommender spreads={spreads} />

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {spreads.map((spread, index) => (
          <ScrollReveal key={spread.slug} delay={index * 0.06}>
            <Panel className="group relative flex h-full flex-col gap-5 overflow-hidden border-[var(--line)] bg-[rgba(253,248,225,0.84)] backdrop-blur-[1.5px] transition-all hover:border-[var(--coral-edge)]">
              {/* Decorative Background Roman Numeral */}
              <span className="pointer-events-none absolute -right-4 -top-6 select-none font-serif-display text-[120px] italic text-[var(--coral)] opacity-[0.06] transition-opacity group-hover:opacity-[0.10]">
                {toRoman(index + 1)}
              </span>

              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-muted)]">
                  {toRoman(index + 1)}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)] font-mono">
                  {spread.cardCount} 张牌
                </span>
              </div>

              <div className="relative aspect-[16/9] overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_4px_12px_rgba(26,26,25,0.08)]">
                <Image
                  src={spreadThumbnails[spread.slug] ?? "/spreads/astrology-chart-background-v2.png"}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) calc(100vw - 48px), 360px"
                  className="object-cover transition duration-1000 group-hover:scale-[1.05]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,16,0.1)_0%,rgba(8,8,16,0.4)_100%)]"
                />
              </div>

              <div className="space-y-2">
                <h2 className="font-serif-display text-[26px] text-[var(--ink)]">
                  {spread.nameZh}
                </h2>
                <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                  {spread.hero}
                </p>
              </div>

              <p className="text-[14px] leading-7 text-[var(--ink-soft)] line-clamp-3">
                {spread.summary}
              </p>

              <div className="flex flex-wrap gap-2">
                {spread.suitableFor.slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--coral-edge)] bg-[var(--coral-wash)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--coral-deep)]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 text-[12.5px] text-[var(--ink-muted)]">
                <span>{Math.max(2, Math.ceil(spread.cardCount * 1.2))} 分钟左右</span>
                <span>{spread.positions.length} 个牌位</span>
              </div>

              <div className="mt-auto flex items-center justify-between gap-4 pt-2">
                <div className="h-px flex-1 bg-[var(--line)]" />
                <Link
                  className={buttonStyles({})}
                  href={`/spreads/${spread.slug}`}
                >
                  开始这局
                </Link>
              </div>
            </Panel>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

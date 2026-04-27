import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ScrollReveal } from "@/components/ScrollReveal";
import { buttonStyles } from "@/components/ui/button";
import { Ornament, toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
import { getAllSpreads } from "@/lib/tarot/catalog";

const spreadThumbnails: Record<string, string> = {
  "career-five": "/spreads/career-five-thumbnail.png",
  "three-card": "/spreads/three-card-thumbnail.png",
  "single-guidance": "/spreads/single-guidance-thumbnail.png",
  "cross-five": "/spreads/cross-five-thumbnail.png",
  "relationship-six": "/spreads/relationship-six-thumbnail.png",
  "lovers-pyramid": "/spreads/lovers-pyramid-thumbnail.png",
  "path-of-choice": "/spreads/path-of-choice-thumbnail.png",
  "self-state": "/spreads/self-state-thumbnail.png",
  "celtic-cross": "/spreads/celtic-cross-thumbnail.png",
};

export const metadata: Metadata = {
  title: "选择牌阵 | Arcana Flow",
  description: "从单张建议牌、三张牌到凯尔特十字，选择适合当前问题复杂度的塔罗牌阵。",
};

export default function SpreadsPage() {
  const spreads = getAllSpreads();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
      <div
        aria-hidden
        className="relative mx-auto mb-10 h-[180px] w-full max-w-5xl overflow-hidden sm:h-[220px] lg:h-[260px]"
      >
        <Image
          src="/visuals/parchment-star-map-band.png"
          alt=""
          fill
          sizes="(max-width: 1280px) 100vw, 1024px"
          priority
          className="object-cover"
          style={{
            maskImage:
              "linear-gradient(180deg, transparent 0%, black 18%, black 78%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, black 18%, black 78%, transparent 100%)",
          }}
        />
      </div>
      <header className="mx-auto max-w-3xl space-y-6 text-center">
        <Ornament variant="quatrefoil" />
        <p className="eyebrow">Spread Index</p>
        <h1 className="font-serif-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.02] text-[var(--text-primary)]">
          选择今天要使用的牌阵
        </h1>
        <p className="text-[17px] leading-8 text-[var(--text-muted)]">
          问题越复杂，越适合用更多牌位拆开结构、关系张力和短期趋势。先选牌阵，再进入固定 seed 抽牌和直觉反馈流程。
        </p>
        <Ornament variant="rule" className="mx-auto max-w-md" />
      </header>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {spreads.map((spread, index) => (
          <ScrollReveal key={spread.slug} delay={index * 0.06}>
            <Panel className="group relative flex h-full flex-col gap-6 overflow-hidden border-[var(--gilt-dim)] bg-[var(--nebula)]/80 transition-all hover:border-[var(--glow-gold)]">
              {/* Decorative Background Roman Numeral */}
              <span className="pointer-events-none absolute -right-4 -top-6 select-none font-serif-display text-[120px] italic text-[var(--glow-gold-bright)] opacity-[0.04] transition-opacity group-hover:opacity-[0.08]">
                {toRoman(index + 1)}
              </span>

              <div className="flex items-start justify-between gap-4">
                <span className="font-occult text-[11px] tracking-[0.3em] uppercase text-[var(--glow-gold-dim)]">
                  Locus {toRoman(index + 1)}
                </span>
                <span className="rounded-full border border-[var(--gilt-dim)] bg-[var(--cosmic)]/50 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)] font-occult backdrop-blur-sm">
                  {spread.cardCount} Cards
                </span>
              </div>

              <div className="relative aspect-[16/9] overflow-hidden rounded-[12px] border border-[var(--gilt-dim)] bg-[var(--cosmic)] shadow-[0_12px_24px_rgba(8,8,16,0.3)]">
                <Image
                  src={spreadThumbnails[spread.slug] ?? "/spreads/astrology-chart-background.png"}
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
                <p className="eyebrow-gold text-[11px] tracking-[0.2em]">{spread.hero}</p>
                <h2 className="font-serif-display text-3xl text-[var(--text-primary)]">
                  {spread.nameZh}
                </h2>
              </div>

              <p className="text-[14px] leading-7 text-[var(--text-muted)] line-clamp-3">
                {spread.summary}
              </p>

              <div className="flex flex-wrap gap-2">
                {spread.suitableFor.slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--glow-gold-dim)]/30 bg-[var(--glow-gold-dim)]/5 px-2.5 py-0.5 text-[11px] font-medium text-[var(--glow-gold-bright)]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <ul className="grid gap-2 border-t border-[var(--gilt-dim)] pt-4 text-[13px] text-[var(--text-muted)]">
                {spread.positions.slice(0, 3).map((position) => (
                  <li
                    key={position.order}
                    className="flex items-center gap-3"
                  >
                    <span className="font-mono text-[13px] text-[var(--glow-gold-bright)] opacity-70">
                      {toRoman(position.order)}
                    </span>
                    <span className="truncate">
                      <span className="font-semibold text-[var(--text-primary)]">{position.name}</span>
                    </span>
                  </li>
                ))}
                {spread.positions.length > 3 && (
                  <li className="text-[11px] italic opacity-50">及另外 {spread.positions.length - 3} 个牌位...</li>
                )}
              </ul>

              <div className="mt-auto flex items-center justify-between gap-4 pt-2">
                <Ornament variant="rule" tone="gold" className="flex-1 opacity-40" />
                <Link
                  className={buttonStyles({})}
                  href={`/spreads/${spread.slug}`}
                >
                  进入牌阵
                </Link>
              </div>
            </Panel>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

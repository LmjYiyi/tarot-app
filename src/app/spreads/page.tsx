import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Ornament, toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
import { getAllSpreads } from "@/lib/tarot/catalog";

export const metadata: Metadata = {
  title: "选择牌阵 | Arcana Flow",
  description: "从单张建议牌、三张牌到凯尔特十字，选择适合当前问题复杂度的塔罗牌阵。",
};

export default function SpreadsPage() {
  const spreads = getAllSpreads();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
      <header className="mx-auto max-w-3xl space-y-6 text-center">
        <Ornament variant="quatrefoil" />
        <p className="eyebrow">Spread Index</p>
        <h1 className="font-serif-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.02] text-[var(--ink)]">
          选择今天要使用的牌阵
        </h1>
        <p className="text-[17px] leading-8 text-[var(--ink-soft)]">
          问题越复杂，越适合用更多牌位拆开结构、关系张力和短期趋势。先选牌阵，再进入固定 seed 抽牌和直觉反馈流程。
        </p>
        <Ornament variant="rule" className="mx-auto max-w-md" />
      </header>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {spreads.map((spread, index) => (
          <Panel key={spread.slug} className="flex h-full flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <span className="font-serif-display text-5xl italic text-[var(--gold-deep)]">
                {toRoman(index + 1)}
              </span>
              <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--ink-soft)] font-occult">
                {spread.cardCount} Cards
              </span>
            </div>

            <div className="space-y-2">
              <p className="eyebrow-ink">{spread.hero}</p>
              <h2 className="font-serif-display text-4xl text-[var(--ink)]">
                {spread.nameZh}
              </h2>
            </div>

            <p className="text-[14px] leading-7 text-[var(--ink-soft)]">
              {spread.summary}
            </p>

            <div className="flex flex-wrap gap-2">
              {spread.suitableFor.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--gilt)]/40 bg-[rgba(255,249,232,0.6)] px-3 py-1 text-[12px] text-[var(--ink-soft)]"
                >
                  {item}
                </span>
              ))}
            </div>

            <ul className="grid gap-2 text-[13px] text-[var(--ink-soft)]">
              {spread.positions.slice(0, 5).map((position) => (
                <li
                  key={position.order}
                  className="flex items-start gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--mist)] px-3 py-2"
                >
                  <span className="mt-0.5 roman text-[15px] text-[var(--gold-deep)]">
                    {toRoman(position.order)}
                  </span>
                  <span>
                    <span className="font-semibold text-[var(--ink)]">{position.name}</span>
                    <span className="ml-1 text-[var(--ink-muted)]">{position.focus}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-center justify-between gap-4 pt-2">
              <Ornament variant="rule" className="flex-1 max-w-[180px]" />
              <Link className={buttonStyles({})} href={`/spreads/${spread.slug}`}>
                进入牌阵
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

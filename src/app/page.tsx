import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Ornament, toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
import { getAllCards, getAllSpreads } from "@/lib/tarot/catalog";

export const metadata: Metadata = {
  title: "Arcana Flow | 在线塔罗解读",
  description: "固定规则抽牌、牌面展示、用户直觉反馈与 AI 证据链塔罗解读。",
};

export default function HomePage() {
  const spreads = getAllSpreads().slice(0, 6);
  const heroCards = ["the-star", "the-emperor", "four-of-swords", "king-of-wands"]
    .map((slug) => getAllCards().find((card) => card.slug === slug))
    .filter((card): card is NonNullable<typeof card> => Boolean(card));

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
      <section className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-px w-16 bg-[var(--gilt)]" />
              <span className="eyebrow">Evidence-based Tarot</span>
            </div>
            <h1 className="font-serif-display text-[clamp(2.8rem,6vw,5.25rem)] leading-[0.96] text-[var(--ink)]">
              用牌面和反馈，
              <br />
              看清当下的结构。
            </h1>
            <p className="max-w-2xl text-[17px] leading-8 text-[var(--ink-soft)]">
              Arcana Flow 不让模型随机编牌。系统先用固定 seed 洗牌和抽牌，再展示牌面、收集你的直觉反馈，最后把牌义、牌位、正逆位和反馈整合成结构化解读。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link className={buttonStyles({})} href="/spreads/career-five">
              开始五张事业牌阵
            </Link>
            <Link className={buttonStyles({ variant: "secondary" })} href="/spreads">
              选择其他牌阵
            </Link>
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-4">
            {["明确问题", "固定抽牌", "直觉反馈", "证据链解读"].map((item, index) => (
              <div
                key={item}
                className="rounded-[8px] border border-[var(--gilt)]/45 bg-[rgba(255,249,232,0.62)] px-4 py-3"
              >
                <p className="roman text-xl text-[var(--gold-deep)]">{toRoman(index + 1)}</p>
                <p className="mt-1 text-[12px] tracking-[0.08em] text-[var(--ink-soft)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[430px]">
          <div className="absolute inset-0 rounded-[8px] border border-[var(--gilt)]/40 bg-[linear-gradient(160deg,#121626_0%,#1d2540_100%)] shadow-[0_28px_80px_rgba(50,31,12,0.22)]" />
          <div className="absolute inset-[10px] rounded-[6px] border border-[rgba(197,154,76,0.22)]" />
          <div className="relative flex h-full min-h-[430px] items-center justify-center overflow-hidden p-8">
            {heroCards.map((card, index) => {
              const offset = index - (heroCards.length - 1) / 2;
              return (
                <div
                  key={card.id}
                  className="absolute"
                  style={{
                    transform: `translate(${offset * 56}px, ${Math.abs(offset) * 10}px) rotate(${offset * 8}deg)`,
                    zIndex: 10 + index,
                  }}
                >
                  <div className="relative aspect-[300/524] w-[150px] overflow-hidden rounded-[12px] border border-[rgba(197,154,76,0.65)] bg-white shadow-[0_24px_44px_rgba(0,0,0,0.32)] sm:w-[172px]">
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.nameZh}
                        fill
                        sizes="180px"
                        className="object-cover"
                        priority={index < 2}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.28em] text-[var(--gold-soft)] font-occult">
              <span>Seeded Draw</span>
              <span>78 Cards</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Ornament variant="rule" className="mb-6 max-w-[260px]" />
            <p className="eyebrow">Spreads</p>
            <h2 className="mt-3 font-serif-display text-5xl italic text-[var(--ink)]">
              从一个清楚的问题开始
            </h2>
          </div>
          <Link
            className="text-[11px] uppercase tracking-[0.32em] text-[var(--ink-soft)] hover:text-[var(--copper)] font-occult"
            href="/spreads"
          >
            查看全部牌阵
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {spreads.map((spread, index) => (
            <Panel key={spread.slug} className="flex h-full flex-col gap-5">
              <div className="flex items-start justify-between">
                <span className="font-serif-display text-5xl italic text-[var(--gold-deep)]">
                  {toRoman(index + 1)}
                </span>
                <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--ink-soft)] font-occult">
                  {spread.cardCount} Cards
                </span>
              </div>
              <div className="space-y-2">
                <p className="eyebrow-ink">{spread.hero}</p>
                <h3 className="font-serif-display text-4xl text-[var(--ink)]">
                  {spread.nameZh}
                </h3>
              </div>
              <p className="flex-1 text-[14px] leading-7 text-[var(--ink-soft)]">
                {spread.summary}
              </p>
              <Ornament variant="rule" tone="gold" />
              <Link
                className={buttonStyles({ variant: "secondary", className: "self-start" })}
                href={`/spreads/${spread.slug}`}
              >
                进入牌阵
              </Link>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}

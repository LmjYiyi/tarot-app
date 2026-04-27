import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { CardSlider } from "@/components/CardSlider";
import { getAllCards } from "@/lib/tarot/catalog";

export const metadata: Metadata = {
  title: "Arcana Flow | 免费在线塔罗占卜",
  description: "固定规则洗牌、抽牌、牌面展示与 AI 证据链塔罗解读。",
};

const heroCardSlugs = ["the-star", "the-moon", "the-sun", "the-world"];

export default function HomePage() {
  const allCards = getAllCards();
  const heroCards = heroCardSlugs
    .map((slug) => allCards.find((card) => card.slug === slug))
    .filter((card): card is NonNullable<typeof card> => Boolean(card));
  const majorCards = allCards
    .filter((card) => card.arcana === "major")
    .sort((a, b) => a.number - b.number);

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-10 px-5 pb-12 pt-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-12 lg:pb-20 lg:pt-24">
        <div className="relative z-10 flex flex-col justify-center">
          <p className="eyebrow mb-5">Tarot · 中文塔罗</p>
          <h1 className="font-serif-display text-[clamp(2.8rem,5.6vw,4.6rem)] leading-[1.04] tracking-[-0.018em] text-[var(--ink)]">
            为你翻开<br />
            <span className="text-[var(--coral)]">今天的牌。</span>
          </h1>

          <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.75] text-[var(--ink-soft)]">
            Arcana Flow 是一本能自己翻页的塔罗手札。
            你提问、洗牌、翻牌，AI 以中文把整局牌面读给你听 ——
            不占卜命运，只帮你把问题看得更清。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link className={buttonStyles({ className: "px-5 py-3 text-[14px]" })} href="/spreads/career-five">
              开始今日抽牌 →
            </Link>
            <Link className={buttonStyles({ variant: "secondary", className: "px-5 py-3 text-[14px]" })} href="/spreads">
              翻阅牌义图册
            </Link>
          </div>

          <div className="mt-12 grid max-w-[540px] grid-cols-3 gap-6 border-t border-[var(--line)] pt-6">
            <Stat figure="78" caption="Rider-Waite 牌面" />
            <Stat figure="9" caption="高频牌阵" />
            <Stat figure="∞" caption="匿名翻牌" />
          </div>
        </div>

        <div className="relative min-h-[440px] lg:min-h-[580px]">
          {/* stronger, more visible compass background */}
          <div className="home-compass absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-[0.70] sm:h-[620px] sm:w-[620px]" />
          {/* warm radial wash to give depth behind the cards */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 480,
              height: 480,
              background: "radial-gradient(ellipse at center, rgba(204,120,92,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-[320px] w-[340px] -translate-x-1/2 -translate-y-1/2 sm:h-[380px] sm:w-[420px]">
            {heroCards.map((card, index) => {
              const offset = index - (heroCards.length - 1) / 2;
              return (
                <div
                  key={card.id}
                  className="absolute left-1/2 top-1/2 aspect-[300/524] overflow-hidden rounded-[14px] border border-[var(--line-strong)] bg-[var(--surface)] shadow-[0_16px_48px_rgba(26,26,25,0.14),0_4px_12px_rgba(26,26,25,0.08)]"
                  style={{
                    width: 158,
                    transform: `translate(calc(-50% + ${offset * 52}px), calc(-50% + ${Math.abs(offset) * 14}px)) rotate(${offset * 9}deg)`,
                    zIndex: index + 1,
                  }}
                >
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={`${card.nameZh} ${card.nameEn}`}
                      fill
                      sizes="180px"
                      className="object-cover"
                      priority
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAJORS */}
      <section className="mx-auto w-full max-w-[1320px] pb-24">
        <div className="px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-t border-[var(--line)] pt-10">
            <div className="max-w-2xl">
              <p className="eyebrow">Arcana Majora · 大阿卡那</p>
              <h2 className="mt-3 font-serif-display text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.05] tracking-[-0.018em] text-[var(--ink)]">
                二十二张大阿卡那，<br />
                一条课题地图。
              </h2>
            </div>
            <Link
              className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--line-strong)] px-4 py-2 text-[13px] text-[var(--ink-soft)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
              href="/cards/the-fool"
            >
              读全部 22 张 →
            </Link>
          </div>
        </div>

        <CardSlider cards={majorCards} />
      </section>
    </div>
  );
}

function Stat({ figure, caption }: { figure: string; caption: string }) {
  return (
    <div>
      <p className="font-serif-display text-[34px] leading-none tracking-[-0.02em] text-[var(--ink)]">
        {figure}
      </p>
      <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {caption}
      </p>
    </div>
  );
}

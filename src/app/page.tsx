import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { toRoman } from "@/components/ui/ornament";
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
      <section className="relative mx-auto grid min-h-[500px] w-full max-w-[1320px] grid-cols-1 px-5 pb-4 pt-12 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:pb-0 lg:pt-10">
        <div className="relative z-10 flex flex-col justify-center lg:justify-start">
          <h1 className="font-serif-display text-[clamp(4rem,7.2vw,5.8rem)] leading-[0.9] tracking-normal text-[var(--ink-rich)] lg:w-[660px]">
            为你翻开
            <br />
            <span className="text-[var(--brass-soft)]">今天的牌。</span>
          </h1>

          <p className="mt-6 max-w-[610px] text-[15px] leading-8 text-[var(--ink-soft)] sm:text-[16px]">
            Arcana Flow 是一本能自己翻页的塔罗手札。你提问、洗牌、翻牌，AI 以中文把整局牌面读给你听。不占卜命运，只帮你把问题看得更清。
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link className={buttonStyles({ className: "bg-[#a65b2c] px-7 shadow-[0_14px_28px_rgba(112,61,28,0.18)] hover:bg-[#8f4923]" })} href="/spreads/career-five">
              ★ 开始今日抽牌
            </Link>
            <Link className={buttonStyles({ variant: "secondary", className: "bg-[rgba(255,252,244,0.58)] px-7" })} href="/spreads">
              翻阅牌义图册
            </Link>
            <span className="eyebrow-ink text-[10px]">
              · 免费 · 中文 · 流式解读
            </span>
          </div>

          <div className="mt-7 grid max-w-[575px] grid-cols-3 border-t border-[var(--border)] pt-5">
            <div>
              <p className="font-serif-display text-3xl italic leading-none text-[var(--ink-rich)]">LXXVIII</p>
              <p className="mt-2 text-[11px] tracking-[0.2em] text-[var(--ink-muted)]">张 Rider-Waite 真实牌面</p>
            </div>
            <div>
              <p className="font-serif-display text-3xl italic leading-none text-[var(--ink-rich)]">V</p>
              <p className="mt-2 text-[11px] tracking-[0.2em] text-[var(--ink-muted)]">种高频牌阵</p>
            </div>
            <div>
              <p className="font-serif-display text-3xl italic leading-none text-[var(--ink-rich)]">∞</p>
              <p className="mt-2 text-[11px] tracking-[0.2em] text-[var(--ink-muted)]">次匿名翻牌</p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[390px] lg:min-h-[480px]">
          <div className="home-compass absolute left-1/2 top-[42%] h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 opacity-70 sm:h-[520px] sm:w-[520px]" />
          <div className="absolute left-1/2 top-[40%] h-[290px] w-[300px] -translate-x-1/2 -translate-y-1/2 sm:h-[330px] sm:w-[360px]">
            {heroCards.map((card, index) => {
              const offset = index - (heroCards.length - 1) / 2;
              return (
                <div
                  key={card.id}
                  className="absolute left-1/2 top-1/2 aspect-[300/524] w-[128px] overflow-hidden rounded-[11px] border border-[#d9c98f] bg-[var(--parchment-base)] shadow-[0_20px_35px_rgba(78,55,29,0.22)] sm:w-[150px]"
                  style={{
                    transform: `translate(calc(-50% + ${offset * 42}px), calc(-50% + ${Math.abs(offset) * 12}px)) rotate(${offset * 8}deg)`,
                    zIndex: index + 1,
                  }}
                >
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={`${card.nameZh} ${card.nameEn}`}
                      fill
                      sizes="160px"
                      className="object-cover"
                      priority
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-[24%] left-[16%] hidden text-[10px] uppercase tracking-[0.28em] text-[var(--brass)] lg:block">
            W
          </div>
          <div className="absolute bottom-[24%] right-[12%] hidden text-[10px] uppercase tracking-[0.28em] text-[var(--brass)] lg:block">
            S
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] pb-20">
        <div className="px-5 sm:px-8 lg:px-12">
          <div className="mb-8 flex items-center gap-4 text-[var(--brass)]">
            <span className="h-px w-28 bg-[var(--border-strong)]" />
            <span className="text-xl leading-none">☆</span>
            <span className="h-px w-28 bg-[var(--border-strong)]" />
          </div>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow-gold">Arcana Majora · 愚者的旅程</p>
              <h2 className="mt-3 font-serif-display text-[clamp(3rem,4.6vw,4.4rem)] italic leading-[0.98] text-[var(--ink-rich)] lg:whitespace-nowrap">
                二十二张大阿卡那，
                <span className="whitespace-nowrap">一条课题地图。</span>
              </h2>
            </div>
            <Link className="font-occult text-[11px] uppercase tracking-[0.3em] text-[var(--ink-soft)] hover:text-[var(--brass)]" href="/cards/the-fool">
              读全部 22 张 →
            </Link>
          </div>
        </div>

        <CardSlider cards={majorCards} />
      </section>
    </div>
  );
}

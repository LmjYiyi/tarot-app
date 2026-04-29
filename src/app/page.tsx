import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { CardSlider } from "@/components/CardSlider";
import { Ornament } from "@/components/ui/ornament";
import { getAllCards } from "@/lib/tarot/catalog";

export const metadata: Metadata = {
  title: "Arcana Flow | 免费在线塔罗占卜",
  description: "在线洗牌、抽牌与中文塔罗解读，把当下的问题照得更清楚。",
};

const heroCardSlugs = ["the-star", "the-moon", "the-sun", "the-world"];
const minorSuitShowcase = [
  {
    suit: "cups",
    title: "圣杯",
    latin: "Cups",
    cardSlug: "cups-ace",
    tone: "情感、直觉、关系的潮汐",
  },
  {
    suit: "wands",
    title: "权杖",
    latin: "Wands",
    cardSlug: "wands-ace",
    tone: "行动、热情、意志的火光",
  },
  {
    suit: "swords",
    title: "宝剑",
    latin: "Swords",
    cardSlug: "swords-ace",
    tone: "思辨、边界、真相的锋面",
  },
  {
    suit: "pentacles",
    title: "钱币",
    latin: "Pentacles",
    cardSlug: "pentacles-ace",
    tone: "现实、身体、资源的土壤",
  },
];

export default function HomePage() {
  const allCards = getAllCards();
  const heroCards = heroCardSlugs
    .map((slug) => allCards.find((card) => card.slug === slug))
    .filter((card): card is NonNullable<typeof card> => Boolean(card));
  const majorCards = allCards
    .filter((card) => card.arcana === "major")
    .sort((a, b) => a.number - b.number);
  const minorSuitCards = minorSuitShowcase.map((suit) => ({
    ...suit,
    card: allCards.find((card) => card.slug === suit.cardSlug),
  }));

  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <Image
          src="/spreads/site-edge-background-v1.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="scale-[1.01] object-cover opacity-[0.68] blur-[0.7px]"
        />
        <div className="absolute inset-0 bg-[rgba(251,240,200,0.22)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,240,200,0.06)_0%,rgba(251,240,200,0.16)_56%,rgba(251,240,200,0.44)_100%)]" />
      </div>
      {/* HERO */}
      <section className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-10 px-5 pb-14 pt-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-12 lg:pb-24 lg:pt-24">
        <div className="relative z-10 flex flex-col justify-center">
          <p className="eyebrow mb-5">Tarot · 中文塔罗</p>
          <h1 className="font-serif-display text-[clamp(2.8rem,5.6vw,4.6rem)] leading-[1.04] tracking-[-0.018em] text-[var(--ink)]">
            为你翻开<br />
            <span className="text-[var(--coral)]">今天的牌。</span>
          </h1>

          <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.75] text-[var(--ink-soft)]">
            像翻开一册安静的塔罗手札。你把问题放下，洗牌、抽牌，
            让图像和文字慢慢浮起来。它不替你决定命运，只陪你把此刻看得更清。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link className={buttonStyles({ className: "px-5 py-3 text-[14px]" })} href="/spreads/single-guidance">
              开始今日抽牌 →
            </Link>
            <Link className={buttonStyles({ variant: "secondary", className: "px-5 py-3 text-[14px]" })} href="/spreads">
              选择牌阵
            </Link>
            <Link className={buttonStyles({ variant: "ghost", className: "px-4 py-3 text-[14px]" })} href="/cards/the-fool">
              翻阅牌义图册
            </Link>
          </div>

          <div className="mt-12 grid max-w-[540px] grid-cols-3 gap-6 border-t border-[var(--line)] pt-6">
            <Stat figure="78" caption="Rider-Waite 牌面" />
            <Stat figure="9" caption="高频牌阵" />
            <Stat figure="∞" caption="匿名翻牌" />
          </div>
        </div>

        <div className="relative min-h-[460px] lg:min-h-[620px]">
          <div
            className="absolute left-1/2 top-1/2 h-[600px] w-[min(98vw,820px)] -translate-x-1/2 -translate-y-1/2 sm:h-[660px] lg:h-[720px]"
            style={{
              maskImage:
                "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.76) 36%, rgba(0,0,0,0.24) 64%, transparent 82%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.76) 36%, rgba(0,0,0,0.24) 64%, transparent 82%)",
            }}
          >
            <Image
              src="/spreads/hero-compass-background-v1.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 92vw, 680px"
              priority
              className="scale-[1.03] object-contain object-center opacity-[0.44] mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,240,200,0.08)_0%,rgba(251,240,200,0.22)_54%,rgba(251,240,200,0.72)_100%)]" />
          </div>
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(204,120,92,0.12) 0%, transparent 68%)",
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
                    width: 148,
                    transform: `translate(calc(-50% + ${offset * 68}px), calc(-50% + ${Math.abs(offset) * 16}px)) rotate(${offset * 10}deg)`,
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
      <section className="mx-auto w-full max-w-[1320px] pb-20">
        <div className="px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-t border-[var(--line)] pt-12">
            <div className="max-w-2xl">
              <p className="eyebrow">Arcana Majora · 大阿卡那</p>
              <h2 className="mt-3 font-serif-display text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.05] tracking-[-0.018em] text-[var(--ink)]">
                二十二张大阿卡那，<br />
                一条课题地图。
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--ink-soft)]">
                它们像旅途上的门与章节，映出转折、召唤、试炼和完成。
              </p>
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

      <section className="relative isolate mx-auto w-full max-w-[1320px] px-5 pb-28 pt-6 sm:px-8 lg:px-12">
        <div className="mb-14 grid gap-6 border-t border-[rgba(74,59,50,0.18)] pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="eyebrow">Arcana Minora · 小阿卡那</p>
            <h2 className="mt-3 font-serif-display text-[clamp(2.3rem,4vw,3.5rem)] leading-[1.06] tracking-[-0.018em] text-[var(--ink)]">
              四种元素，<br />
              日常生活的细小回声。
            </h2>
          </div>
          <p className="max-w-2xl text-[15.5px] leading-8 text-[var(--ink-soft)]">
            如果大阿卡那像命运转折，小阿卡那更像每天会遇见的风、火、水、土：
            一次对话、一点犹豫、一股行动的冲动，或一件必须落地的现实小事。
          </p>
        </div>

        <div className="relative grid gap-x-7 gap-y-16 sm:grid-cols-2 lg:gap-x-10 xl:grid-cols-4 xl:items-start">
          {minorSuitCards.map(({ suit, title, latin, tone, card }, index) => (
            <Link
              key={suit}
              href={card ? `/cards/${card.slug}` : "/cards/the-fool"}
              className={`group relative min-h-[380px] overflow-visible px-2 transition duration-300 hover:-translate-y-1 ${
                index === 1 ? "xl:mt-12" : index === 2 ? "xl:mt-3" : index === 3 ? "xl:mt-16" : ""
              }`}
            >
              {index > 0 ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-5 top-6 hidden h-[78%] w-px bg-[linear-gradient(180deg,transparent,rgba(74,59,50,0.34)_16%,rgba(200,90,60,0.42)_50%,rgba(74,59,50,0.28)_84%,transparent)] xl:block"
                >
                  <span className="absolute left-1/2 top-[44%] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(200,90,60,0.34)] bg-[rgba(251,240,200,0.58)]" />
                  <span className="absolute left-1/2 top-[44%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[rgba(200,90,60,0.72)]" />
                </div>
              ) : null}
              <div className="pointer-events-none absolute left-1/2 top-[42%] h-px w-[92%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(74,59,50,0.34),transparent)]" />
              <div className="pointer-events-none absolute -right-2 top-4 font-serif-display text-[86px] leading-none text-[rgba(200,90,60,0.07)] transition duration-500 group-hover:text-[rgba(200,90,60,0.11)]">
                {suit === "cups" ? "C" : suit === "wands" ? "W" : suit === "swords" ? "S" : "P"}
              </div>
              <div className="relative flex h-full flex-col">
                <div className="mb-6 flex items-center justify-between gap-3 border-b border-[rgba(74,59,50,0.18)] pb-3">
                  <p className="eyebrow">{latin}</p>
                  <span className="font-serif-display text-[30px] text-[rgba(200,90,60,0.82)]">
                    {suit === "cups" ? "☽" : suit === "wands" ? "✦" : suit === "swords" ? "♢" : "⊙"}
                  </span>
                </div>

                {card?.imageUrl ? (
                  <div className="relative mx-auto mb-7 aspect-[300/524] w-[min(46vw,154px)] overflow-hidden rounded-[12px] border border-[rgba(74,59,50,0.20)] bg-[rgba(251,240,200,0.30)] shadow-[0_18px_34px_rgba(74,59,50,0.11)]">
                    <Image
                      src={card.imageUrl}
                      alt={`${card.nameZh} ${card.nameEn}`}
                      fill
                      sizes="140px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : null}

                <div className="mt-auto">
                  <Ornament
                    variant="rule"
                    className="mb-4 max-w-[140px] opacity-90 [--gilt:rgba(200,90,60,0.42)]"
                  />
                  <h3 className="font-serif-display text-[30px] leading-tight text-[var(--ink)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-7 text-[var(--ink-soft)]">
                    {tone}
                  </p>
                  <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    14 张 · 从王牌到国王
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
